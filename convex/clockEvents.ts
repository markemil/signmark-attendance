import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireEmployee } from "./lib/authz";
import { businessDateOf, computeTotalHours } from "./lib/shiftDate";
import { userError } from "./lib/errors";

/** Every employee-submitted event needs a live-captured photo already sitting
 * in storage before clockIn/clockOut is called — this hands out the URL to
 * upload it to. Employee-gated: this is not the admin upload path. */
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireEmployee(ctx, args.token);
    return ctx.storage.generateUploadUrl();
  },
});

async function attachPhoto(
  ctx: MutationCtx,
  storageId: Id<"_storage">,
  eventId: Id<"clockEvents">,
) {
  // Convex hashes every upload server-side; read that rather than
  // re-hashing — reading a Blob's bytes back out is action-only, not
  // available from a mutation.
  const meta = await ctx.db.system.get("_storage", storageId);
  if (!meta) userError("Photo upload not found — try capturing again.");
  return ctx.db.insert("photos", {
    eventId,
    storageId,
    capturedAt: Date.now(),
    checksum: meta.sha256,
  });
}

async function mostRecentEvent(ctx: QueryCtx | MutationCtx, employeeId: Id<"employees">) {
  return ctx.db
    .query("clockEvents")
    .withIndex("by_employee_timestamp", (q) => q.eq("employeeId", employeeId))
    .order("desc")
    .first();
}

export const clockIn = mutation({
  args: { token: v.string(), photoStorageId: v.id("_storage"), deviceId: v.optional(v.string()) },
  returns: v.object({
    eventId: v.id("clockEvents"),
    timestamp: v.number(),
    shiftDate: v.string(),
  }),
  handler: async (ctx, args) => {
    const { employeeId } = await requireEmployee(ctx, args.token);

    const last = await mostRecentEvent(ctx, employeeId);
    if (last && last.type === "IN") {
      userError("You're already clocked in — clock out first.");
    }

    const timestamp = Date.now();
    const shiftDate = businessDateOf(timestamp);

    const eventId = await ctx.db.insert("clockEvents", {
      employeeId,
      type: "IN",
      timestamp,
      shiftDate,
      source: "employee_self",
      deviceId: args.deviceId,
      status: "on_time",
    });

    const photoId = await attachPhoto(ctx, args.photoStorageId, eventId);
    await ctx.db.patch(eventId, { photoId });

    return { eventId, timestamp, shiftDate };
  },
});

export const clockOut = mutation({
  args: { token: v.string(), photoStorageId: v.id("_storage"), deviceId: v.optional(v.string()) },
  returns: v.object({
    eventId: v.id("clockEvents"),
    timestamp: v.number(),
    shiftDate: v.string(),
    totalHours: v.number(),
  }),
  handler: async (ctx, args) => {
    const { employeeId } = await requireEmployee(ctx, args.token);

    const openIn = await mostRecentEvent(ctx, employeeId);
    if (!openIn || openIn.type !== "IN") {
      userError("You're not clocked in.");
    }

    const timestamp = Date.now();
    // Inherited, not recomputed — this is what keeps an overnight shift's
    // OUT on the same shift_date as its IN even after midnight.
    const shiftDate = openIn.shiftDate;

    const eventId = await ctx.db.insert("clockEvents", {
      employeeId,
      type: "OUT",
      timestamp,
      shiftDate,
      source: "employee_self",
      deviceId: args.deviceId,
      status: "on_time",
    });

    const photoId = await attachPhoto(ctx, args.photoStorageId, eventId);
    await ctx.db.patch(eventId, { photoId });

    const shiftEvents = await ctx.db
      .query("clockEvents")
      .withIndex("by_employee_shiftDate", (q) =>
        q.eq("employeeId", employeeId).eq("shiftDate", shiftDate),
      )
      .collect();
    const totalHours = computeTotalHours(shiftEvents);

    return { eventId, timestamp, shiftDate, totalHours };
  },
});

export const myStatus = query({
  args: { token: v.string() },
  returns: v.object({
    openSince: v.union(v.number(), v.null()),
    shiftDate: v.string(),
    totalHoursSoFar: v.number(),
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
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { employeeId } = await requireEmployee(ctx, args.token);

    const last = await mostRecentEvent(ctx, employeeId);
    const openIn = last && last.type === "IN" ? last : null;
    const shiftDate = openIn ? openIn.shiftDate : businessDateOf(Date.now());

    const events = await ctx.db
      .query("clockEvents")
      .withIndex("by_employee_shiftDate", (q) =>
        q.eq("employeeId", employeeId).eq("shiftDate", shiftDate),
      )
      .collect();
    events.sort((a, b) => a.timestamp - b.timestamp);

    return {
      openSince: openIn ? openIn.timestamp : null,
      shiftDate,
      totalHoursSoFar: computeTotalHours(events),
      events: events.map((e) => ({
        _id: e._id,
        type: e.type,
        timestamp: e.timestamp,
        status: e.status,
      })),
    };
  },
});
