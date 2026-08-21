import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authz";
import { businessDateOf } from "./lib/shiftDate";

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

const eventSummary = v.object({
  type: v.union(v.literal("IN"), v.literal("OUT")),
  timestamp: v.number(),
  status: v.union(
    v.literal("on_time"),
    v.literal("late"),
    v.literal("early"),
    v.literal("flagged"),
  ),
  source: v.union(v.literal("employee_self"), v.literal("admin_manual")),
});

const dayState = v.union(
  v.literal("worked"),
  v.literal("holiday"),
  v.literal("holiday_worked"),
  v.literal("absent"),
  v.literal("blank"),
);

/** Month-grid data for one employee — the five day-cell states from
 * PRD.md §6.3, computed from clockEvents grouped by shift_date and
 * cross-referenced against the org-wide Holiday list. */
export const getEmployeeCalendar = query({
  args: { token: v.string(), employeeId: v.id("employees"), year: v.number(), month: v.number() },
  returns: v.array(
    v.object({
      date: v.string(),
      state: dayState,
      holidayName: v.optional(v.string()),
      events: v.array(eventSummary),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const lastDay = daysInMonth(args.year, args.month);
    const monthStart = `${args.year}-${pad2(args.month)}-01`;
    const monthEnd = `${args.year}-${pad2(args.month)}-${pad2(lastDay)}`;
    const today = businessDateOf(Date.now());

    const events = await ctx.db
      .query("clockEvents")
      .withIndex("by_employee_shiftDate", (q) =>
        q.eq("employeeId", args.employeeId).gte("shiftDate", monthStart).lte("shiftDate", monthEnd),
      )
      .collect();

    const eventsByDate = new Map<string, typeof events>();
    for (const e of events) {
      const list = eventsByDate.get(e.shiftDate) ?? [];
      list.push(e);
      eventsByDate.set(e.shiftDate, list);
    }

    // Bounded, org-wide list — see holidays.ts for why collect() is fine here.
    const holidays = await ctx.db
      .query("holidays")
      .withIndex("by_date", (q) => q.gte("date", monthStart).lte("date", monthEnd))
      .collect();
    const holidayByDate = new Map(holidays.map((h) => [h.date, h.name]));

    const days = [];
    for (let d = 1; d <= lastDay; d++) {
      const date = `${args.year}-${pad2(args.month)}-${pad2(d)}`;
      const dayEvents = (eventsByDate.get(date) ?? []).sort((a, b) => a.timestamp - b.timestamp);
      const holidayName = holidayByDate.get(date);
      const worked = dayEvents.length > 0;

      let state: "worked" | "holiday" | "holiday_worked" | "absent" | "blank";
      if (worked && holidayName) state = "holiday_worked";
      else if (worked) state = "worked";
      else if (holidayName) state = "holiday";
      else if (date > today) state = "blank";
      else state = "absent";

      days.push({
        date,
        state,
        holidayName,
        events: dayEvents.map((e) => ({
          type: e.type,
          timestamp: e.timestamp,
          status: e.status,
          source: e.source,
        })),
      });
    }

    return days;
  },
});

export const getDayDetail = query({
  args: { token: v.string(), employeeId: v.id("employees"), date: v.string() },
  returns: v.object({
    date: v.string(),
    holidayName: v.optional(v.string()),
    events: v.array(
      v.object({
        _id: v.id("clockEvents"),
        type: v.union(v.literal("IN"), v.literal("OUT")),
        timestamp: v.number(),
        status: v.union(
          v.literal("on_time"),
          v.literal("late"),
          v.literal("early"),
          v.literal("flagged"),
        ),
        source: v.union(v.literal("employee_self"), v.literal("admin_manual")),
        deviceId: v.optional(v.string()),
        auditNote: v.optional(v.string()),
        editedAt: v.optional(v.number()),
        photoUrl: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const events = await ctx.db
      .query("clockEvents")
      .withIndex("by_employee_shiftDate", (q) =>
        q.eq("employeeId", args.employeeId).eq("shiftDate", args.date),
      )
      .collect();
    events.sort((a, b) => a.timestamp - b.timestamp);

    const holiday = await ctx.db
      .query("holidays")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();

    const withPhotos = await Promise.all(
      events.map(async (e) => {
        let photoUrl: string | null = null;
        if (e.photoId) {
          const photo = await ctx.db.get(e.photoId);
          if (photo) photoUrl = await ctx.storage.getUrl(photo.storageId);
        }
        return {
          _id: e._id,
          type: e.type,
          timestamp: e.timestamp,
          status: e.status,
          source: e.source,
          deviceId: e.deviceId,
          auditNote: e.auditNote,
          editedAt: e.editedAt,
          photoUrl,
        };
      }),
    );

    return { date: args.date, holidayName: holiday?.name, events: withPhotos };
  },
});

/** Adds/updates an audit note without touching the original event fields —
 * PRD.md §6.3/Epic 4.2: a correction is layered on top, never overwrites
 * what was originally recorded. */
export const setAuditNote = mutation({
  args: { token: v.string(), eventId: v.id("clockEvents"), note: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);
    await ctx.db.patch(args.eventId, {
      auditNote: args.note,
      editedBy: admin._id,
      editedAt: Date.now(),
    });
    return null;
  },
});
