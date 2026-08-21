import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { errorMessage } from "../lib/errorMessage";

export function ManualPunchModal({
  employeeId,
  employeeName,
  date,
  onClose,
  onSaved,
}: {
  employeeId: Id<"employees">;
  employeeName: string;
  date: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const adminAddPunch = useMutation(api.clockEvents.adminAddPunch);

  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [time, setTime] = useState("09:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!reason.trim()) {
      setError(
        "A reason is required — this record will be flagged “Admin-entered” everywhere it appears.",
      );
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await adminAddPunch({ token, employeeId, type, date, time, reason });
      onSaved();
    } catch (err) {
      setError(errorMessage(err, "Couldn't save that punch."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,30,57,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: "100%",
          maxWidth: 440,
          padding: 26,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 20px 60px rgba(11,30,57,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: "1.05rem", color: "var(--navy-900)" }}>Add time in/out</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--ink-600)",
            }}
          >
            ✕
          </button>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-600)" }}>
          For {employeeName} — <span className="mono">{date}</span>. This creates a punch on their
          behalf; it won't have their photo.
        </p>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: type === "IN" ? "var(--blue-100)" : "var(--surface)",
              color: type === "IN" ? "var(--blue-700)" : "var(--ink-600)",
              border: type === "IN" ? "none" : "1.5px solid var(--ink-300)",
            }}
            onClick={() => setType("IN")}
          >
            Time In
          </button>
          <button
            type="button"
            className="btn"
            style={{
              flex: 1,
              background: type === "OUT" ? "var(--blue-100)" : "var(--surface)",
              color: type === "OUT" ? "var(--blue-700)" : "var(--ink-600)",
              border: type === "OUT" ? "none" : "1.5px solid var(--ink-300)",
            }}
            onClick={() => setType("OUT")}
          >
            Time Out
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <div className="field" style={{ flex: 1 }}>
            <label className="label">Date</label>
            <input className="input mono" value={date} disabled />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label className="label" htmlFor="punch-time">
              Time
            </label>
            <input
              id="punch-time"
              type="time"
              className="input mono"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="punch-reason">
            Reason for manual entry <span style={{ color: "var(--critical)" }}>*</span>
          </label>
          <textarea
            id="punch-reason"
            className="input"
            rows={3}
            style={{ resize: "none" }}
            placeholder='e.g. "Phone broken — confirmed shift with supervisor."'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <p style={{ fontSize: "0.74rem", color: "var(--warning)" }}>
            Required — this record will be flagged “Admin-entered” everywhere it appears.
          </p>
        </div>

        {error && (
          <div className="field-error">
            <p className="error-text">{error}</p>
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ flex: 1 }}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Save punch"}
          </button>
        </div>
      </form>
    </div>
  );
}
