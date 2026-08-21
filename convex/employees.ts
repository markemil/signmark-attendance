import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/authz";
import { hashPassword } from "./lib/password";

// Minimal upload plumbing Epic 1.2 needs to satisfy the required
// profilePhotoStorageId field — Epic 2.1 covers the fuller upload UI.
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    return ctx.storage.generateUploadUrl();
  },
});

export const createEmployee = mutation({
  args: {
    token: v.string(),
    fullName: v.string(),
    employeeCode: v.string(),
    department: v.string(),
    position: v.string(),
    email: v.string(),
    dateHired: v.string(),
    profilePhotoStorageId: v.id("_storage"),
    username: v.string(),
    password: v.string(),
  },
  returns: v.object({ employeeId: v.id("employees"), userId: v.id("users") }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);

    const existingUsername = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .unique();
    if (existingUsername) {
      throw new Error(`Username "${args.username}" is already taken.`);
    }
    if (args.password.length < 8) {
      throw new Error("Password must be at least 8 characters.");
    }

    const employeeId = await ctx.db.insert("employees", {
      fullName: args.fullName,
      employeeCode: args.employeeCode,
      department: args.department,
      position: args.position,
      email: args.email,
      profilePhotoStorageId: args.profilePhotoStorageId,
      status: "active",
      dateHired: args.dateHired,
    });

    const passwordHash = await hashPassword(args.password);
    const userId = await ctx.db.insert("users", {
      name: args.fullName,
      username: args.username,
      email: args.email,
      role: "employee",
      linkedEmployeeId: employeeId,
      passwordHash,
    });

    return { employeeId, userId };
  },
});

export const listEmployees = query({
  args: { token: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("employees"),
      fullName: v.string(),
      employeeCode: v.string(),
      department: v.string(),
      position: v.string(),
      status: v.union(v.literal("active"), v.literal("inactive")),
      profilePhotoUrl: v.union(v.string(), v.null()),
    }),
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.token);
    const employees = await ctx.db.query("employees").take(200);
    return Promise.all(
      employees.map(async (e) => ({
        _id: e._id,
        fullName: e.fullName,
        employeeCode: e.employeeCode,
        department: e.department,
        position: e.position,
        status: e.status,
        profilePhotoUrl: await ctx.storage.getUrl(e.profilePhotoStorageId),
      })),
    );
  },
});
