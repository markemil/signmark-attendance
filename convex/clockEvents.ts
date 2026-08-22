import { mutation, query } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { requireAdmin, requireEmployee } from "./lib/authz";
import { businessDateOf, businessTimestamp, computeTotalHours } from "./lib/shiftDate";
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

// Voided events (see calendar.ts voidEvent) are skipped here — a voided
// punch is treated as if it never happened for open/closed-shift purposes,
// e.g. voiding a duplicate accidental IN lets the employee clock in again
// correctly. Bounded take(): voiding is expected to be a rare correction,
// not the common case, so scanning the last 20 is more than enough in
// practice without an unbounded collect().
async function mostRecentEvent(ctx: QueryCtx | MutationCtx, employeeId: Id<"employees">) {
  const recent = await ctx.db
    .query("clockEvents")
    .withIndex("by_employee_timestamp", (q) => q.eq("employeeId", employeeId))
    .order("desc")
    .take(20);
  return recent.find((e) => !e.voidedAt) ?? null;
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

    const shiftEvents = (
      await ctx.db
        .query("clockEvents")
        .withIndex("by_employee_shiftDate", (q) =>
          q.eq("employeeId", employeeId).eq("shiftDate", shiftDate),
        )
        .collect()
    ).filter((e) => !e.voidedAt);
    const totalHours = computeTotalHours(shiftEvents);

    return { eventId, timestamp, shiftDate, totalHours };
  },
});

/** Epic 5 / PRD.md §6.5: admin records a punch on an employee's behalf —
 * a forgotten clock-out, a broken phone, etc. Unlike the self-service
 * flow, this deliberately skips the open/closed shift guard (it's a
 * correction tool, not a live punch) and has no photo. The required
 * reason note is stored in `auditNote`, the same field the day-detail
 * audit trail already reads. */
export const adminAddPunch = mutation({
  args: {
    token: v.string(),
    employeeId: v.id("employees"),
    type: v.union(v.literal("IN"), v.literal("OUT")),
    date: v.string(), // "YYYY-MM-DD", business-local
    time: v.string(), // "HH:MM", business-local
    reason: v.string(),
  },
  returns: v.object({ eventId: v.id("clockEvents") }),
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx, args.token);

    const reason = args.reason.trim();
    if (!reason) userError("A reason is required for a manual punch.");

    const timestamp = businessTimestamp(args.date, args.time);

    let shiftDate: string;
    if (args.type === "IN") {
      shiftDate = businessDateOf(timestamp);
    } else {
      // Inherit the shift_date of whatever IN preceded this timestamp, the
      // same rule employee_self OUTs follow — this is what correctly closes
      // an overnight or previously-forgotten shift instead of starting a new
      // one. Falls back to this OUT's own date if there's no prior IN at all.
      const priorEvents = await ctx.db
        .query("clockEvents")
        .withIndex("by_employee_timestamp", (q) =>
          q.eq("employeeId", args.employeeId).lt("timestamp", timestamp),
        )
        .order("desc")
        .take(20);
      const priorIn = priorEvents.find((e) => !e.voidedAt) ?? null;
      shiftDate = priorIn && priorIn.type === "IN" ? priorIn.shiftDate : businessDateOf(timestamp);
    }

    const eventId = await ctx.db.insert("clockEvents", {
      employeeId: args.employeeId,
      type: args.type,
      timestamp,
      shiftDate,
      source: "admin_manual",
      createdBy: admin._id,
      status: "on_time",
      auditNote: reason,
    });

    return { eventId };
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
        photoUrl: v.union(v.string(), v.null()),
      }),
    ),
  }),
  handler: async (ctx, args) => {
    const { employeeId } = await requireEmployee(ctx, args.token);

    const last = await mostRecentEvent(ctx, employeeId);
    const openIn = last && last.type === "IN" ? last : null;
    const shiftDate = openIn ? openIn.shiftDate : businessDateOf(Date.now());

    const events = (
      await ctx.db
        .query("clockEvents")
        .withIndex("by_employee_shiftDate", (q) =>
          q.eq("employeeId", employeeId).eq("shiftDate", shiftDate),
        )
        .collect()
    ).filter((e) => !e.voidedAt);
    events.sort((a, b) => a.timestamp - b.timestamp);

    const eventsWithPhotos = await Promise.all(
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
          photoUrl,
        };
      }),
    );

    return {
      openSince: openIn ? openIn.timestamp : null,
      shiftDate,
      totalHoursSoFar: computeTotalHours(events),
      events: eventsWithPhotos,
    };
  },
});
