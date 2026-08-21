export type DayRollupEvent = {
  type: "IN" | "OUT";
  timestamp: number;
  status: "on_time" | "late" | "early" | "flagged";
  source: "employee_self" | "admin_manual";
};

export type DayState = "worked" | "holiday" | "holiday_worked" | "absent" | "blank";

export type DayRollup = {
  date: string;
  state: DayState;
  holidayName?: string;
  events: DayRollupEvent[];
};

/**
 * The single source of truth for PRD.md §6.3's five day-cell states.
 * Both the calendar view (convex/calendar.ts) and the export (convex/export.ts)
 * call this — sharing it is what guarantees exported hours match the
 * calendar exactly, rather than two similar-but-separately-maintained
 * implementations drifting apart.
 */
export function rollupDays(
  dates: string[],
  eventsByDate: Map<string, DayRollupEvent[]>,
  holidayByDate: Map<string, string>,
  today: string,
): DayRollup[] {
  return dates.map((date) => {
    const events = (eventsByDate.get(date) ?? []).slice().sort((a, b) => a.timestamp - b.timestamp);
    const holidayName = holidayByDate.get(date);
    const worked = events.length > 0;

    let state: DayState;
    if (worked && holidayName) state = "holiday_worked";
    else if (worked) state = "worked";
    else if (holidayName) state = "holiday";
    else if (date > today) state = "blank";
    else state = "absent";

    return { date, state, holidayName, events };
  });
}

/** Every "YYYY-MM-DD" date from start to end, inclusive. */
export function enumerateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}
