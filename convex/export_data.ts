import { internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authz";
import { businessDateOf, computeTotalHours } from "./lib/shiftDate";
import { enumerateDates, rollupDays } from "./lib/dayRollup";

const exportRow = v.object({
  date: v.string(),
  status: v.string(),
  holidayName: v.optional(v.string()),
  firstIn: v.union(v.number(), v.null()),
  lastOut: v.union(v.number(), v.null()),
  totalHours: v.number(),
  adminEntered: v.boolean(),
  inPhotoUrl: v.union(v.string(), v.null()),
  outPhotoUrl: v.union(v.string(), v.null()),
});

/** Reused by export.ts's action (called via ctx.runQuery — actions have no
 * direct ctx.db access). Does the admin check itself since the action has
 * no other way to reach it; requireAdmin's ctx param is QueryCtx-compatible
 * so it works unchanged here. */
export const getExportRows = internalQuery({
  args: {
    token: v.string(),
    employeeId: v.id("employees"),
    periodStart: v.string(),
    periodEnd: v.string(),
  },
  returns: v.object({
    adminId: v.id("users"),
    employee: v.object({ fullName: v.string(), employeeCode: v.string() }),
    rows: v.array(exportRow),
  }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    const employee = await ctx.db.get(args.employeeId);
    if (!employee) throw new Error("Employee not found.");

    const events = await ctx.db
      .query("clockEvents")
      .withIndex("by_employee_shiftDate", (q) =>
        q
          .eq("employeeId", args.employeeId)
          .gte("shiftDate", args.periodStart)
          .lte("shiftDate", args.periodEnd),
      )
      .collect();

    const eventsByDate = new Map<string, typeof events>();
    for (const e of events) {
      const list = eventsByDate.get(e.shiftDate) ?? [];
      list.push(e);
      eventsByDate.set(e.shiftDate, list);
    }

    const holidays = await ctx.db
      .query("holidays")
      .withIndex("by_date", (q) => q.gte("date", args.periodStart).lte("date", args.periodEnd))
      .collect();
    const holidayByDate = new Map(holidays.map((h) => [h.date, h.name]));

    const dates = enumerateDates(args.periodStart, args.periodEnd);
    const today = businessDateOf(Date.now());
    const rollup = rollupDays(dates, eventsByDate, holidayByDate, today);

    const rows = await Promise.all(
      rollup.map(async (day) => {
        const dayEvents = eventsByDate.get(day.date) ?? [];
        const ins = dayEvents
          .filter((e) => e.type === "IN")
          .sort((a, b) => a.timestamp - b.timestamp);
        const outs = dayEvents
          .filter((e) => e.type === "OUT")
          .sort((a, b) => a.timestamp - b.timestamp);
        const firstIn = ins[0] ?? null;
        const lastOut = outs[outs.length - 1] ?? null;

        const totalHours = computeTotalHours(dayEvents);

        async function photoUrl(event: (typeof dayEvents)[number] | null) {
          if (!event?.photoId) return null;
          const photo = await ctx.db.get(event.photoId);
          return photo ? ctx.storage.getUrl(photo.storageId) : null;
        }

        return {
          date: day.date,
          status: day.state,
          holidayName: day.holidayName,
          firstIn: firstIn?.timestamp ?? null,
          lastOut: lastOut?.timestamp ?? null,
          totalHours,
          adminEntered: dayEvents.some((e) => e.source === "admin_manual"),
          inPhotoUrl: await photoUrl(firstIn),
          outPhotoUrl: await photoUrl(lastOut),
        };
      }),
    );

    return {
      adminId: admin._id,
      employee: { fullName: employee.fullName, employeeCode: employee.employeeCode },
      rows,
    };
  },
});

export const recordExportBatch = internalMutation({
  args: {
    employeeId: v.id("employees"),
    periodStart: v.string(),
    periodEnd: v.string(),
    generatedBy: v.id("users"),
    format: v.union(v.literal("csv"), v.literal("xlsx"), v.literal("pdf")),
    fileStorageId: v.id("_storage"),
  },
  returns: v.id("exportBatches"),
  handler: async (ctx, args) => {
    return ctx.db.insert("exportBatches", args);
  },
});
