import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Source of truth: PRD.md §7 (Data Model). Field names are camelCase here —
// PRD field names are snake_case, same fields, JS convention.
export default defineSchema({
  employees: defineTable({
    fullName: v.string(),
    employeeCode: v.string(),
    department: v.string(),
    position: v.string(),
    email: v.string(),
    profilePhotoStorageId: v.id("_storage"),
    status: v.union(v.literal("active"), v.literal("inactive")),
    dateHired: v.string(), // "YYYY-MM-DD"
  }).index("by_employeeCode", ["employeeCode"]),

  users: defineTable({
    name: v.string(),
    username: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("employee")),
    linkedEmployeeId: v.optional(v.id("employees")),
    passwordHash: v.string(),
  }).index("by_username", ["username"]),

  clockEvents: defineTable({
    employeeId: v.id("employees"),
    type: v.union(v.literal("IN"), v.literal("OUT")),
    timestamp: v.number(), // server-set, ms epoch — PRD §7/§8: never client-supplied
    shiftDate: v.string(), // "YYYY-MM-DD" — see PRD §6.1/§8 shift logic
    source: v.union(v.literal("employee_self"), v.literal("admin_manual")),
    photoId: v.optional(v.id("photos")), // required if source = employee_self, enforced in mutation
    deviceId: v.optional(v.string()),
    createdBy: v.optional(v.id("users")), // admin's user id, set only if source = admin_manual
    status: v.union(
      v.literal("on_time"),
      v.literal("late"),
      v.literal("early"),
      v.literal("flagged"),
    ),
    auditNote: v.optional(v.string()), // required if source = admin_manual, enforced in mutation
    editedBy: v.optional(v.id("users")),
    editedAt: v.optional(v.number()),
  })
    .index("by_employee_shiftDate", ["employeeId", "shiftDate"])
    .index("by_employee_timestamp", ["employeeId", "timestamp"]),

  photos: defineTable({
    eventId: v.id("clockEvents"),
    storageId: v.id("_storage"),
    capturedAt: v.number(),
    checksum: v.string(),
  }).index("by_event", ["eventId"]),

  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),

  holidays: defineTable({
    date: v.string(), // "YYYY-MM-DD", unique — org-wide, not per-employee (PRD §7/§10)
    name: v.string(),
    createdBy: v.id("users"),
  }).index("by_date", ["date"]),

  exportBatches: defineTable({
    employeeId: v.id("employees"), // MVP export is single-employee only (PRD §6.4/§9)
    periodStart: v.string(),
    periodEnd: v.string(),
    generatedBy: v.id("users"),
    format: v.union(v.literal("csv"), v.literal("xlsx"), v.literal("pdf")),
    fileStorageId: v.id("_storage"),
  }).index("by_employee", ["employeeId"]),
});
