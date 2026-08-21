import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authz";
import { userError } from "./lib/errors";

// Holidays are org-wide (PRD.md §7/§10) — one list, no per-employee scoping.
// The table stays small by nature (a few dozen dates a year), so a full
// collect() here is fine, not the unbounded-growth case the no-collect()
// rule guards against.
export const listHolidays = query({
  args: { token: v.string() },
  returns: v.array(v.object({ _id: v.id("holidays"), date: v.string(), name: v.string() })),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const holidays = await ctx.db.query("holidays").collect();
    holidays.sort((a, b) => a.date.localeCompare(b.date));
    return holidays.map((h) => ({ _id: h._id, date: h.date, name: h.name }));
  },
});

export const addHoliday = mutation({
  args: { token: v.string(), date: v.string(), name: v.string() },
  returns: v.id("holidays"),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    const existing = await ctx.db
      .query("holidays")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();
    if (existing) {
      userError(`${args.date} is already marked as a holiday ("${existing.name}").`);
    }

    return ctx.db.insert("holidays", { date: args.date, name: args.name, createdBy: admin._id });
  },
});

export const updateHoliday = mutation({
  args: { token: v.string(), holidayId: v.id("holidays"), date: v.string(), name: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const existing = await ctx.db
      .query("holidays")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .unique();
    if (existing && existing._id !== args.holidayId) {
      userError(`${args.date} is already marked as a holiday ("${existing.name}").`);
    }

    await ctx.db.patch(args.holidayId, { date: args.date, name: args.name });
    return null;
  },
});

export const removeHoliday = mutation({
  args: { token: v.string(), holidayId: v.id("holidays") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    await ctx.db.delete(args.holidayId);
    return null;
  },
});
