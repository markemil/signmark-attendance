import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { AdminNav } from "../components/AdminNav";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function AdminDayDetail() {
  const { employeeId, date } = useParams<{ employeeId: string; date: string }>();
  const { token } = useAuth();

  const employee = useQuery(
    api.employees.getEmployee,
    token && employeeId ? { token, employeeId: employeeId as Id<"employees"> } : "skip",
  );
  const detail = useQuery(
    api.calendar.getDayDetail,
    token && employeeId && date
      ? { token, employeeId: employeeId as Id<"employees">, date }
      : "skip",
  );
  const setAuditNote = useMutation(api.calendar.setAuditNote);

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  async function handleSaveNote(eventId: Id<"clockEvents">, e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    const note = noteDrafts[eventId] ?? "";
    setSavingId(eventId);
    try {
      await setAuditNote({ token, eventId, note });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="page-desktop" style={{ flexDirection: "column" }}>
      <AdminNav />

      <div style={{ padding: "28px 36px", maxWidth: 900 }}>
        <div style={{ marginBottom: 16 }}>
          <Link
            to={`/admin/employees/${employeeId}/calendar`}
            style={{ fontSize: "0.85rem", color: "var(--ink-600)" }}
          >
            ← Back to {employee?.fullName ?? "employee"}'s calendar
          </Link>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: "1.3rem", color: "var(--navy-900)" }}>
            <span className="mono">{date}</span>
          </h1>
          {detail?.holidayName && <span className="pill pill-holiday">{detail.holidayName}</span>}
        </div>
        <p style={{ color: "var(--ink-600)", marginBottom: 20 }}>{employee?.fullName}</p>

        {detail === undefined && <p style={{ color: "var(--ink-600)" }}>Loading…</p>}

        {detail && detail.events.length === 0 && (
          <div className="card" style={{ padding: "24px 20px", color: "var(--ink-600)" }}>
            No punches recorded for this date.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {detail?.events.map((event) => (
            <div key={event._id} className="card" style={{ padding: 20 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    className="pill"
                    style={{ background: "var(--blue-100)", color: "var(--blue-700)" }}
                  >
                    {event.type}
                  </span>
                  {event.source === "admin_manual" && (
                    <span className="pill pill-admin">Admin-entered</span>
                  )}
                </div>
                <span
                  className={
                    event.status === "on_time"
                      ? "pill pill-success"
                      : event.status === "late"
                        ? "pill pill-warning"
                        : "pill pill-critical-filled"
                  }
                >
                  {event.status === "on_time" ? "On time" : event.status}
                </span>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                {event.photoUrl ? (
                  <img
                    src={event.photoUrl}
                    alt=""
                    style={{
                      width: 140,
                      height: 175,
                      borderRadius: 12,
                      objectFit: "cover",
                      border: "1px solid var(--ink-300)",
                      flex: "none",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 140,
                      height: 175,
                      borderRadius: 12,
                      background: "var(--sky-050)",
                      border: "1px dashed var(--ink-300)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--ink-600)",
                      fontSize: "0.8rem",
                      flex: "none",
                      textAlign: "center",
                    }}
                  >
                    No photo (admin-entered)
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="mono"
                    style={{ fontSize: "1.4rem", fontWeight: 500, color: "var(--navy-900)" }}
                  >
                    {formatTime(event.timestamp)}
                  </div>
                  {event.deviceId && (
                    <div style={{ fontSize: "0.78rem", color: "var(--ink-600)" }}>
                      Device: {event.deviceId}
                    </div>
                  )}
                  <div style={{ fontSize: "0.78rem", color: "var(--ink-600)" }}>
                    Source:{" "}
                    {event.source === "employee_self"
                      ? "Employee (photo-verified)"
                      : "Admin-entered"}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--ink-300)", marginTop: 16, paddingTop: 14 }}>
                {event.auditNote && (
                  <p style={{ fontSize: "0.85rem", color: "var(--ink-600)", marginBottom: 10 }}>
                    <strong style={{ color: "var(--navy-900)" }}>Audit note:</strong>{" "}
                    {event.auditNote}
                  </p>
                )}
                <form
                  onSubmit={(e) => handleSaveNote(event._id, e)}
                  style={{ display: "flex", gap: 10 }}
                >
                  <input
                    className="input"
                    placeholder="Add an audit note…"
                    defaultValue={event.auditNote ?? ""}
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({ ...prev, [event._id]: e.target.value }))
                    }
                    style={{ flex: 1 }}
                  />
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={savingId === event._id}
                  >
                    {savingId === event._id ? "Saving…" : "Save note"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
