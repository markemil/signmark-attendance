// Single-business-timezone assumption per PRD.md §10 — MVP is one location.
// Signmark operates in the Philippines, so shift_date is computed in
// Asia/Manila (UTC+8) regardless of where the server or employee's device
// clock thinks it is. This is exactly why the boundary is computed here
// server-side from the server-set timestamp, never trusted from the client.
const BUSINESS_UTC_OFFSET_MS = 8 * 60 * 60 * 1000;

/** "YYYY-MM-DD" business date (Asia/Manila) that a server timestamp falls on. */
export function businessDateOf(timestampMs: number): string {
  const shifted = new Date(timestampMs + BUSINESS_UTC_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Converts a business-local "YYYY-MM-DD" + "HH:MM" wall-clock time (what an
 * admin picks in a date/time field) to a server epoch ms — the admin
 * proxy-punch equivalent of businessDateOf's reverse direction. Unlike
 * employee_self events, an admin_manual timestamp is legitimately
 * client-chosen: the admin is recording when a punch actually happened,
 * not asserting their own device clock (PRD.md §8's server-authoritative
 * rule is specifically about not trusting an employee's own device).
 */
export function businessTimestamp(dateStr: string, timeStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  return Date.UTC(y, m - 1, d, h, min) - BUSINESS_UTC_OFFSET_MS;
}

/**
 * Sums the duration of every IN→OUT pair, pairing events in timestamp
 * order. An unmatched trailing IN (still open) contributes nothing yet —
 * hours land only once its OUT exists. Returns hours as a decimal.
 */
export function computeTotalHours(events: { type: "IN" | "OUT"; timestamp: number }[]): number {
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);
  let totalMs = 0;
  let openInTs: number | null = null;
  for (const e of sorted) {
    if (e.type === "IN") {
      openInTs = e.timestamp;
    } else if (e.type === "OUT" && openInTs !== null) {
      totalMs += e.timestamp - openInTs;
      openInTs = null;
    }
  }
  return totalMs / (1000 * 60 * 60);
}
