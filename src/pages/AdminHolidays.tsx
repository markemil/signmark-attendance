import { useState, type FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { errorMessage } from "../lib/errorMessage";
import { AdminNav } from "../components/AdminNav";

export function AdminHolidays() {
  const { token } = useAuth();
  const holidays = useQuery(api.holidays.listHolidays, token ? { token } : "skip");
  const addHoliday = useMutation(api.holidays.addHoliday);
  const updateHoliday = useMutation(api.holidays.updateHoliday);
  const removeHoliday = useMutation(api.holidays.removeHoliday);

  const [editingId, setEditingId] = useState<Id<"holidays"> | "new" | null>(null);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function startAdd() {
    setEditingId("new");
    setDate("");
    setName("");
    setError(null);
  }

  function startEdit(h: { _id: Id<"holidays">; date: string; name: string }) {
    setEditingId(h._id);
    setDate(h.date);
    setName(h.name);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token || !editingId) return;
    setError(null);
    setSubmitting(true);
    try {
      if (editingId === "new") {
        await addHoliday({ token, date, name });
      } else {
        await updateHoliday({ token, holidayId: editingId, date, name });
      }
      setEditingId(null);
    } catch (err) {
      setError(errorMessage(err, "Couldn't save that holiday."));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(holidayId: Id<"holidays">) {
    if (!token) return;
    await removeHoliday({ token, holidayId });
  }

  return (
    <main className="page-desktop" style={{ flexDirection: "column" }}>
      <AdminNav />

      <div style={{ padding: "28px 36px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.4rem", color: "var(--navy-900)" }}>Holidays</h1>
            <p style={{ color: "var(--ink-600)", marginTop: 4, maxWidth: 520 }}>
              Org-wide — marking a date here applies to every employee's calendar. There's no
              per-employee setup.
            </p>
          </div>
          <button className="btn btn-primary" onClick={startAdd} disabled={editingId !== null}>
            + Add holiday
          </button>
        </div>

        {editingId && (
          <form
            onSubmit={handleSubmit}
            className="card"
            style={{
              marginTop: 20,
              maxWidth: 480,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <h2 style={{ fontSize: "0.95rem" }}>
              {editingId === "new" ? "Add holiday" : "Edit holiday"}
            </h2>
            <div style={{ display: "flex", gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label className="label" htmlFor="holiday-date">
                  Date
                </label>
                <input
                  id="holiday-date"
                  type="date"
                  className="input"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="field" style={{ flex: 2 }}>
                <label className="label" htmlFor="holiday-name">
                  Label
                </label>
                <input
                  id="holiday-name"
                  className="input"
                  placeholder="e.g. New Year's Day"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            {error && (
              <div className="field-error">
                <p className="error-text">{error}</p>
              </div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        )}

        <div className="card" style={{ marginTop: 20, maxWidth: 760, overflow: "hidden" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr 90px",
              padding: "10px 20px",
              fontSize: "0.72rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--ink-600)",
              background: "var(--sky-050)",
            }}
          >
            <div>Date</div>
            <div>Label</div>
            <div></div>
          </div>

          {holidays === undefined && (
            <div style={{ padding: "24px 20px", color: "var(--ink-600)" }}>Loading…</div>
          )}
          {holidays && holidays.length === 0 && (
            <div style={{ padding: "24px 20px", color: "var(--ink-600)" }}>
              No holidays added yet.
            </div>
          )}

          {holidays?.map((h) => (
            <div
              key={h._id}
              style={{
                display: "grid",
                gridTemplateColumns: "140px 1fr 90px",
                alignItems: "center",
                padding: "13px 20px",
                borderTop: "1px solid var(--ink-300)",
              }}
            >
              <div className="mono" style={{ color: "var(--ink-600)" }}>
                {h.date}
              </div>
              <div style={{ fontWeight: 600 }}>{h.name}</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button className="btn btn-ghost" onClick={() => startEdit(h)}>
                  Edit
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ color: "var(--critical)" }}
                  onClick={() => handleRemove(h._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
