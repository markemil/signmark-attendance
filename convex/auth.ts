import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword, verifyPassword, generateSessionToken } from "./lib/password";
import { getSessionUser, SESSION_TTL_MS } from "./lib/authz";

// True until the very first account exists — gates the one-time admin
// bootstrap screen. PRD.md §10: exactly one initial Admin account, created
// at setup, no hardcoded password.
export const needsBootstrap = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    const existing = await ctx.db.query("users").take(1);
    return existing.length === 0;
  },
});

export const bootstrapAdmin = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    password: v.string(),
  },
  returns: v.object({ token: v.string() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").take(1);
    if (existing.length > 0) {
      throw new Error("Setup has already run — an account already exists.");
    }
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const passwordHash = await hashPassword(args.password);
    const userId = await ctx.db.insert("users", {
      name: args.name,
      username: args.username,
      email: "",
      role: "admin",
      passwordHash,
    });

    const token = generateSessionToken();
    const now = Date.now();
    await ctx.db.insert("sessions", {
      userId,
      token,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    return { token };
  },
});

export const login = mutation({
  args: { username: v.string(), password: v.string() },
  returns: v.object({ token: v.union(v.string(), v.null()), error: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (!user) return { token: null, error: "Incorrect username or password." };

    const ok = await verifyPassword(args.password, user.passwordHash);
    if (!ok) return { token: null, error: "Incorrect username or password." };

    const token = generateSessionToken();
    const now = Date.now();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });
    return { token, error: null };
  },
});

export const me = query({
  args: { token: v.string() },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      name: v.string(),
      username: v.string(),
      role: v.union(v.literal("admin"), v.literal("employee")),
      linkedEmployeeId: v.optional(v.id("employees")),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    const user = await getSessionUser(ctx, args.token);
    if (!user) return null;
    return {
      userId: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      linkedEmployeeId: user.linkedEmployeeId,
    };
  },
});

export const logout = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .unique();
    if (session) await ctx.db.delete(session._id);
    return null;
  },
});
