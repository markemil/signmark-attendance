import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import type { Doc } from "../_generated/dataModel";

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/** Resolves a session token to its user, or null if missing/expired. */
export async function getSessionUser(
  ctx: QueryCtx | MutationCtx,
  token: string,
): Promise<Doc<"users"> | null> {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!session || session.expiresAt < Date.now()) return null;
  return ctx.db.get(session.userId);
}

/** Same as getSessionUser, but throws if there's no valid admin session. */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  token: string,
): Promise<Doc<"users">> {
  const user = await getSessionUser(ctx, token);
  if (!user || user.role !== "admin") {
    throw new ConvexError("This action requires an admin session.");
  }
  return user;
}

/** Same as getSessionUser, but throws if there's no valid employee session
 * with a linked Employee record — the only kind of account that clocks in/out. */
export async function requireEmployee(
  ctx: QueryCtx | MutationCtx,
  token: string,
): Promise<{ user: Doc<"users">; employeeId: Doc<"employees">["_id"] }> {
  const user = await getSessionUser(ctx, token);
  if (!user || user.role !== "employee" || !user.linkedEmployeeId) {
    throw new ConvexError("This action requires an employee session.");
  }
  return { user, employeeId: user.linkedEmployeeId };
}
