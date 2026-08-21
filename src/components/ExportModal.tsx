import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useAuth } from "../hooks/useAuth";
import { errorMessage } from "../lib/errorMessage";

type Preset = "first-half" | "second-half" | "custom";
type Format = "xlsx" | "csv" | "pdf";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function ExportModal({
  employeeId,
  employeeName,
  year,
  month,
  onClose,
}: {
  employeeId: Id<"employees">;
  employeeName: string;
  year: number;
  month: number;
  onClose: () => void;
}) {
  const { token } = useAuth();
  const generateExport = useAction(api.export.generate);

  const [preset, setPreset] = useState<Preset>("first-half");
  const [customStart, setCustomStart] = useState(`${year}-${pad2(month)}-01`);
  const [customEnd, setCustomEnd] = useState(
    `${year}-${pad2(month)}-${pad2(daysInMonth(year, month))}`,
  );
  const [format, setFormat] = useState<Format>("xlsx");
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const lastDay = daysInMonth(year, month);
  const monthLabel = `${year}-${pad2(month)}`;

  function periodFor(p: Preset): { start: string; end: string } {
    if (p === "first-half") return { start: `${monthLabel}-01`, end: `${monthLabel}-15` };
    if (p === "second-half")
      return { start: `${monthLabel}-16`, end: `${monthLabel}-${pad2(lastDay)}` };
    return { start: customStart, end: customEnd };
  }

  async function handleExport() {
    if (!token) return;
    const { start, end } = periodFor(preset);
    if (start > end) {
      setError("The start date must be before the end date.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const { url, filename } = await generateExport({
        token,
        employeeId,
        periodStart: start,
        periodEnd: end,
        format,
      });
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      link.remove();
      onClose();
    } catch (err) {
      setError(errorMessage(err, "Couldn't generate that export."));
    } finally {
      setGenerating(false);
    }
  }

  const { start, end } = periodFor(preset);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(11,30,57,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: "100%",
          maxWidth: 460,
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
          padding: 26,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          boxShadow: "0 20px 60px rgba(11,30,57,0.35)",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.05rem", color: "var(--navy-900)" }}>Export attendance</h2>
          <p style={{ fontSize: "0.82rem", color: "var(--ink-600)", marginTop: 2 }}>
            For <strong>{employeeName}</strong> — covers one employee at a time.
          </p>
        </div>

        <div>
          <label className="label" style={{ marginBottom: 8, display: "block" }}>
            Cutoff period
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {(
              [
                ["first-half", `${monthLabel.slice(5)} 1–15`],
                ["second-half", `${monthLabel.slice(5)} 16–${lastDay}`],
                ["custom", "Custom range"],
              ] as [Preset, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className="btn"
                style={{
                  background: preset === value ? "var(--blue-100)" : "var(--surface)",
                  color: preset === value ? "var(--blue-700)" : "var(--ink-600)",
                  border:
                    preset === value ? "1.5px solid var(--blue-500)" : "1.5px solid var(--ink-300)",
                  fontSize: "0.82rem",
                  padding: "10px 8px",
                }}
                onClick={() => setPreset(value)}
              >
                {label}
              </button>
            ))}
          </div>
          {preset === "custom" && (
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <input
                type="date"
                className="input mono"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
              <input
                type="date"
                className="input mono"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
          )}
        </div>

        <div>
          <label className="label" style={{ marginBottom: 8, display: "block" }}>
            Format
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {(["xlsx", "csv", "pdf"] as Format[]).map((f) => (
              <button
                key={f}
                type="button"
                className="btn"
                style={{
                  flexDirection: "column",
                  gap: 4,
                  background: format === f ? "var(--blue-100)" : "var(--surface)",
                  border:
                    format === f ? "1.5px solid var(--blue-500)" : "1.5px solid var(--ink-300)",
                  color: format === f ? "var(--blue-700)" : "var(--ink-600)",
                }}
                onClick={() => setFormat(f)}
              >
                {f === "xlsx" ? "Excel" : f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "var(--sky-050)",
            borderRadius: "var(--radius-md)",
            padding: "10px 14px",
            fontSize: "0.78rem",
            color: "var(--ink-600)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Period</span>
          <span className="mono" style={{ color: "var(--navy-900)" }}>
            {start} → {end}
          </span>
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
            type="button"
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={handleExport}
            disabled={generating}
          >
            {generating
              ? "Generating…"
              : `Export ${format === "xlsx" ? "Excel" : format.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}
