import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { AdminNav } from "../components/AdminNav";
import { ExportModal } from "../components/ExportModal";

const WEEKDAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

// Monday-first weekday index (0 = Mon ... 6 = Sun) for a "YYYY-MM-DD" date.
function mondayIndex(dateStr: string): number {
  const d = new Date(`${dateStr}T00:00:00Z`);
  return (d.getUTCDay() + 6) % 7;
}

type DayState = "worked" | "holiday" | "holiday_worked" | "absent" | "blank";

function pillFor(state: DayState) {
  switch (state) {
    case "worked":
      return { className: "pill pill-success", label: "On time" };
    case "holiday":
      return { className: "pill pill-holiday", label: "Holiday" };
    case "holiday_worked":
      return { className: "pill pill-holiday-worked", label: "Holiday · Worked" };
    case "absent":
      return { className: "pill pill-critical-filled", label: "Absent" };
    case "blank":
      return null;
  }
}

export function AdminCalendar() {
  const { employeeId } = useParams<{ employeeId: string }>();
  const { token } = useAuth();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-12
  const [showExport, setShowExport] = useState(false);

  const employee = useQuery(
    api.employees.getEmployee,
    token && employeeId ? { token, employeeId: employeeId as Id<"employees"> } : "skip",
  );
  const calendar = useQuery(
    api.calendar.getEmployeeCalendar,
    token && employeeId
      ? { token, employeeId: employeeId as Id<"employees">, year, month }
      : "skip",
  );

  const leadingBlanks = useMemo(() => {
    if (!calendar || calendar.length === 0) return 0;
    return mondayIndex(calendar[0].date);
  }, [calendar]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <main className="page-desktop" style={{ flexDirection: "column" }}>
      <AdminNav />

      <div className="admin-content">
        <div style={{ marginBottom: 8 }}>
          <Link to="/admin" style={{ fontSize: "0.85rem", color: "var(--ink-600)" }}>
            ← Back to Dashboard
          </Link>
        </div>

        <div className="header-row" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {employee?.profilePhotoUrl ? (
              <img
                src={employee.profilePhotoUrl}
                alt=""
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "1px solid var(--ink-300)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "var(--blue-100)",
                }}
              />
            )}
            <div>
              <h1 style={{ fontSize: "1.25rem", color: "var(--navy-900)" }}>
                {employee?.fullName ?? "…"}
              </h1>
              <p style={{ color: "var(--ink-600)", fontSize: "0.85rem" }}>
                {employee?.employeeCode} · {employee?.department}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <button className="btn btn-ghost" onClick={prevMonth} aria-label="Previous month">
                ←
              </button>
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--navy-900)",
                  minWidth: 130,
                  textAlign: "center",
                }}
              >
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button className="btn btn-ghost" onClick={nextMonth} aria-label="Next month">
                →
              </button>
            </div>
            <button className="btn btn-primary" onClick={() => setShowExport(true)}>
              Export
            </button>
          </div>
        </div>

        {showExport && employeeId && (
          <ExportModal
            employeeId={employeeId as Id<"employees">}
            employeeName={employee?.fullName ?? "this employee"}
            year={year}
            month={month}
            onClose={() => setShowExport(false)}
          />
        )}

        {/* DESIGN.md §4: the calendar scrolls horizontally in its own
            container on narrow screens rather than squishing 7 columns
            into unreadable cells — the page body itself never scrolls
            sideways (see body { overflow-x: hidden } in theme.css). */}
        <div className="scroll-x">
          <div style={{ minWidth: 700 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 10,
                marginBottom: 8,
              }}
            >
              {WEEKDAYS.map((w) => (
                <div
                  key={w}
                  className="mono"
                  style={{ fontSize: "0.7rem", color: "var(--ink-600)", textAlign: "center" }}
                >
                  {w}
                </div>
              ))}
            </div>

            {calendar === undefined ? (
              <p style={{ color: "var(--ink-600)" }}>Loading…</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`lead-${i}`} />
                ))}

                {calendar.map((day) => {
                  const pill = pillFor(day.state);
                  const dayNum = Number(day.date.slice(-2));
                  const isTransparent = day.state === "blank";
                  const hasAdminEntry = day.events.some((e) => e.source === "admin_manual");
                  const cell = (
                    <div
                      className={isTransparent ? undefined : "card"}
                      style={{
                        minHeight: 92,
                        padding: 8,
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        background: isTransparent
                          ? "transparent"
                          : day.state === "holiday" || day.state === "holiday_worked"
                            ? "var(--blue-100)"
                            : day.state === "absent"
                              ? "var(--critical-bg)"
                              : undefined,
                        border: isTransparent ? "none" : undefined,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <span
                          className="mono"
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            color: isTransparent ? "var(--ink-300)" : "var(--ink-600)",
                          }}
                        >
                          {dayNum}
                        </span>
                        {hasAdminEntry && (
                          <span
                            className="pill pill-admin"
                            style={{ padding: "1px 6px", fontSize: "0.6rem" }}
                          >
                            A
                          </span>
                        )}
                      </div>
                      {day.events.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 5,
                              background: "var(--blue-100)",
                            }}
                          />
                          <span className="mono" style={{ fontSize: "0.65rem" }}>
                            {formatTime(day.events[0].timestamp)}
                          </span>
                        </div>
                      )}
                      {pill && (
                        <span className={pill.className} style={{ marginTop: "auto" }}>
                          {pill.label}
                        </span>
                      )}
                    </div>
                  );

                  if (isTransparent) return <div key={day.date}>{cell}</div>;

                  return (
                    <Link
                      key={day.date}
                      to={`/admin/employees/${employeeId}/calendar/${day.date}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {cell}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div
          className="card"
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "14px 18px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              color: "var(--ink-600)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Legend
          </span>
          <span className="pill pill-success">On time</span>
          <span className="pill pill-holiday">Holiday</span>
          <span className="pill pill-holiday-worked">Holiday · Worked</span>
          <span className="pill pill-critical-filled">Absent</span>
          <span style={{ fontSize: "0.72rem", color: "var(--ink-600)" }}>
            Blank = not yet occurred
          </span>
        </div>
      </div>
    </main>
  );
}
