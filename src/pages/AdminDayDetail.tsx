import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { AdminNav } from "../components/AdminNav";
import { ManualPunchModal } from "../components/ManualPunchModal";

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
  const voidEvent = useMutation(api.calendar.voidEvent);
  const unvoidEvent = useMutation(api.calendar.unvoidEvent);

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [voidingId, setVoidingId] = useState<string | null>(null);
  const [voidReasonDrafts, setVoidReasonDrafts] = useState<Record<string, string>>({});
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voidBusyId, setVoidBusyId] = useState<string | null>(null);

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

  async function handleConfirmVoid(eventId: Id<"clockEvents">) {
    if (!token) return;
    const reason = (voidReasonDrafts[eventId] ?? "").trim();
    if (!reason) {
      setVoidError("A reason is required to void a punch.");
      return;
    }
    setVoidError(null);
    setVoidBusyId(eventId);
    try {
      await voidEvent({ token, eventId, reason });
      setVoidingId(null);
    } finally {
      setVoidBusyId(null);
    }
  }

  async function handleUnvoid(eventId: Id<"clockEvents">) {
    if (!token) return;
    setVoidBusyId(eventId);
    try {
      await unvoidEvent({ token, eventId });
    } finally {
      setVoidBusyId(null);
    }
  }

  return (
    <main className="page-desktop" style={{ flexDirection: "column" }}>
      <AdminNav />

      <div className="admin-content" style={{ maxWidth: 900 }}>
        <div style={{ marginBottom: 16 }}>
          <Link
            to={`/admin/employees/${employeeId}/calendar`}
            style={{ fontSize: "0.85rem", color: "var(--ink-600)" }}
          >
            ← Back to {employee?.fullName ?? "employee"}'s calendar
          </Link>
        </div>

        <div className="header-row" style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.3rem", color: "var(--navy-900)" }}>
              <span className="mono">{date}</span>
            </h1>
            {detail?.holidayName && <span className="pill pill-holiday">{detail.holidayName}</span>}
          </div>
          <button className="btn btn-secondary" onClick={() => setShowPunchModal(true)}>
            + Add time in/out
          </button>
        </div>
        <p style={{ color: "var(--ink-600)", marginBottom: 20 }}>{employee?.fullName}</p>

        {showPunchModal && employeeId && date && (
          <ManualPunchModal
            employeeId={employeeId as Id<"employees">}
            employeeName={employee?.fullName ?? "this employee"}
            date={date}
            onClose={() => setShowPunchModal(false)}
            onSaved={() => setShowPunchModal(false)}
          />
        )}

        {detail === undefined && <p style={{ color: "var(--ink-600)" }}>Loading…</p>}

        {detail && detail.events.length === 0 && (
          <div className="card" style={{ padding: "24px 20px", color: "var(--ink-600)" }}>
            No punches recorded for this date.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {detail?.events.map((event) => (
            <div
              key={event._id}
              className="card"
              style={{ padding: 20, opacity: event.voided ? 0.6 : 1 }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 14,
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    className="pill"
                    style={{ background: "var(--blue-100)", color: "var(--blue-700)" }}
                  >
                    {event.type}
                  </span>
                  {event.source === "admin_manual" && (
                    <span className="pill pill-admin">Admin-entered</span>
                  )}
                  {event.voided && <span className="pill pill-critical-filled">Voided</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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
                  {event.voided ? (
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleUnvoid(event._id)}
                      disabled={voidBusyId === event._id}
                    >
                      {voidBusyId === event._id ? "Restoring…" : "Unvoid"}
                    </button>
                  ) : (
                    <button
                      className="btn btn-ghost"
                      style={{ color: "var(--critical)" }}
                      onClick={() => {
                        setVoidingId(event._id);
                        setVoidError(null);
                      }}
                    >
                      Void
                    </button>
                  )}
                </div>
              </div>

              {event.voided && event.voidReason && (
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--critical)",
                    background: "var(--critical-bg)",
                    padding: "8px 12px",
                    borderRadius: "var(--radius-md)",
                    marginBottom: 14,
                  }}
                >
                  <strong>Voided:</strong> {event.voidReason}
                </p>
              )}

              {voidingId === event._id && (
                <div
                  className="card"
                  style={{
                    padding: 14,
                    marginBottom: 14,
                    background: "var(--sky-050)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <label className="label" htmlFor={`void-reason-${event._id}`}>
                    Reason for voiding <span style={{ color: "var(--critical)" }}>*</span>
                  </label>
                  <textarea
                    id={`void-reason-${event._id}`}
                    className="input"
                    rows={2}
                    style={{ resize: "none" }}
                    placeholder='e.g. "Accidental duplicate clock-in."'
                    onChange={(e) =>
                      setVoidReasonDrafts((prev) => ({ ...prev, [event._id]: e.target.value }))
                    }
                  />
                  {voidError && <p className="error-text">{voidError}</p>}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setVoidingId(null);
                        setVoidError(null);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ background: "var(--critical)" }}
                      onClick={() => handleConfirmVoid(event._id)}
                      disabled={voidBusyId === event._id}
                    >
                      {voidBusyId === event._id ? "Voiding…" : "Confirm void"}
                    </button>
                  </div>
                </div>
              )}

              <div className="stack-on-narrow">
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
                    style={{
                      fontSize: "1.4rem",
                      fontWeight: 500,
                      color: "var(--navy-900)",
                      textDecoration: event.voided ? "line-through" : undefined,
                    }}
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
