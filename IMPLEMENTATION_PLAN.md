# In-Out — Implementation Plan

Business requirements → PRD → design directions → approved prototype → `DESIGN.md` → Linear issues → Claude Code implementation → independent testing → GitHub → Cloudflare deployment → live verification.

This plan walks that pipeline for **In-Out** specifically, using [`PRD.md`](./PRD.md) as the source of truth for scope and [`DESIGN.md`](./DESIGN.md) for the visual system. Decide and document first (steps 1–5), implement second (step 6), verify last (steps 7–10) — nothing skips a gate.

## Status

| #   | Phase                   | Deliverable                                                                              | Status                                                          |
| --- | ----------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | PRD                     | `PRD.md`                                                                                 | ✅ Done                                                         |
| 2   | Visual direction        | 3 concepts below                                                                         | ✅ Confirmed — Blue Clarity                                     |
| 3   | Prototype               | [Prototype canvas](https://claude.ai/code/artifact/43f76b14-6520-4c5c-90e2-21f8d7ecf208) | ✅ Approved                                                     |
| 4   | DESIGN.md               | `DESIGN.md`                                                                              | ✅ Drafted (Blue Clarity, no external reference)                |
| 5   | Linear issues           | Backlog below                                                                            | ✅ Drafted, ready to import                                     |
| 6   | Implementation          | React/TS/Vite/Convex app                                                                 | ⬜ In progress — Epic 0 done, Epic 1 (Auth) done and verified |
| 7   | Review & test           | —                                                                                        | ⬜                                                              |
| 8   | Design verification     | —                                                                                        | ⬜                                                              |
| 9   | Version & deploy        | GitHub + Cloudflare Pages + Convex                                                       | ⬜ Live at [signmark-attendance.pages.dev](https://signmark-attendance.pages.dev), auto-deploying from [GitHub](https://github.com/markemil/signmark-attendance) on push to `main` — still points at Convex **dev** deployment, not a separate prod one |
| 10  | Production verification | —                                                                                        | ⬜                                                              |

**Note on tooling access:** this session has no direct Linear, GitHub, Cloudflare, or Convex integration. Steps 5 and 9 below produce ready-to-use content (an import-ready issue list, deploy config) that you or a connected session executes — I'm not silently skipping those actions, they just need a hand-off point.

---

## 2. Visual Direction

Three concepts, evaluated against In-Out's actual context: an operational tool used by two very different audiences (an employee glancing at a phone for 3 seconds, an admin working a dashboard for 20 minutes).

### A — Blue Clarity _(default, recommended)_

Bold, airy, product-led. Blue / light blue / navy, generous whitespace, Manrope + DM Mono. Full token system already specified in `DESIGN.md`. Leads with outcomes ("payroll-ready in 5 minutes") over mechanism. This is your standing default for a reason — go with it unless one of the conditions below applies.

### B — Field Neutral

Graphite/amber, high-contrast, mono-heavy. Built for outdoor glare, gloved thumbs, low-light warehouse floors — a light-blue UI can wash out badly in direct sun, which matters a lot for a camera-capture flow employees use standing outside. **Pick this instead if** employees clock in outdoors, in a garage/warehouse, or anywhere screen glare is a real problem.

### C — Quiet Ledger

Off-white/ink, restrained serif accents on the admin side, spreadsheet-dense tables. Positions the product as a system of record rather than a consumer-grade app — calmer, less "designed," more "trusted ledger." **Pick this instead if** the admin/HR side is used more like a spreadsheet replacement than a dashboard, and the polish of Blue Clarity would feel mismatched to that workflow.

**Decision needed:** confirm Blue Clarity, or flag if B/C fits your actual deployment conditions better. Phase 3 prototypes are built against whichever is chosen.

---

## 3. Prototype Scope

Screens to mock and get sign-off on _before_ implementation starts. Each needs page structure, content hierarchy, CTA placement, and — critically — its mobile composition, since the employee flow lives entirely on a phone.

### Employee flow — mobile-first, 390px is the primary and near-only target

- **Login** — username/password, error state
- **Home / Clock** — single screen that shows either "Clock In" or "Clock Out" depending on whether the employee has an open shift; shows today's punches so far
- **Camera capture** — live viewfinder, capture button, retake option
- **Confirmation** — captured photo, recorded time, (on clock-out) total hours for the shift
- **Error states** — camera permission denied, upload failure, network offline

### Admin flow — desktop-first (1280px), must remain usable and non-overflowing at 390px/768px

- **Login**
- **Dashboard** — employee list, search/filter, at-a-glance status
- **Employee calendar** (month grid) — all five day-cell states from `PRD.md` §6.3
- **Day detail** — full photos, timestamps, audit note, edit action
- **Admin manual punch** modal — date/time picker + required reason note
- **Holiday management** — list, add/edit/remove, org-wide scope made obvious
- **Export** modal — employee picker, cutoff preset vs. custom range, format choice
- **Employee management** — create/edit employee, upload profile photo, set username/password

### Responsive states to check per screen

390px (phone), 768px (tablet), 1280px (desktop). Employee screens are only meaningfully tested at 390px; admin screens need all three, with 390px specifically checked for zero horizontal overflow.

### Definition of "approved"

Sign-off means: page structure confirmed, content hierarchy confirmed, every CTA and its destination confirmed, the core product demonstration (a full clock-in-to-export walkthrough) makes sense end to end, and mobile composition at 390px has been actually looked at, not assumed. Implementation (Phase 6) doesn't start until this is signed off.

---

## 4. DESIGN.md

Done — see [`DESIGN.md`](./DESIGN.md). Built on Blue Clarity by your choice, with no external site referenced. Covers color (light/dark), type, spacing/breakpoints, every recurring component (status pills, calendar day cell, camera capture, tables), motion, accessibility floor, and content rules (no fabricated data — this matters more than usual here, since the whole product's value proposition is trustworthy records).

---

## 5. Linear Issues (import-ready)

Organized as epics matching the MVP feature list in `PRD.md` §5/§9. Each issue lists acceptance criteria, dependencies, and definition of done. Copy into Linear as-is, or ask a Linear-connected session to create them from this file.

### Epic 0 — Project Foundation

**0.1 Repo & tooling scaffold**

- AC: Vite + React + TypeScript project boots; ESLint + Prettier configured; `DESIGN.md` tokens wired into a base CSS/theme file (light+dark); Manrope/DM Mono loaded.
- Depends on: none
- DoD: `npm run dev` and `npm run build` both succeed on a blank scaffold; lint passes.

**0.2 Convex project setup**

- AC: Convex project created and linked; `npx convex dev` runs locally; schema file exists (empty tables scaffolded per §6 data model below).
- Depends on: 0.1
- DoD: local Convex dashboard reachable; schema deploys without error.

**0.3 CI pipeline**

- AC: CI runs build, lint, typecheck on every push/PR.
- Depends on: 0.1
- DoD: a deliberately broken PR fails CI; a clean PR passes.

### Epic 1 — Accounts & Auth

**1.1 Initial admin bootstrap**

- AC: first run creates exactly one Admin `User` (username/password set at setup, not hardcoded); no self-registration path exists anywhere.
- Depends on: 0.2
- DoD: a fresh deploy has one working admin login and no other accounts.

**1.2 Admin creates employee + linked User account**

- AC: admin form creates an `Employee` and its linked `User` (username/password) in one step; profile photo upload required at creation (see 2.1).
- Depends on: 1.1
- DoD: new employee can log in with the credentials just created.

**1.3 Login (employee + admin), session handling**

- AC: role-based redirect after login (employee → Clock screen, admin → Dashboard); session persists across reload; logout works.
- Depends on: 1.1
- DoD: both roles can log in/out on mobile and desktop.

### Epic 2 — Employee Profile

**2.1 Profile photo upload (admin-side)**

- AC: admin uploads a reference photo when creating/editing an employee; stored in object storage; shown on employee list and day detail views.
- Depends on: 1.2
- DoD: uploaded photo renders correctly across dashboard, calendar, day detail.

### Epic 3 — Clock In / Clock Out Core

**3.1 Camera capture flow**

- AC: live camera only, no file/gallery picker anywhere in this flow; capture → preview → confirm/retake.
- Depends on: 1.3
- DoD: works on a real phone browser (not just desktop webcam) at 390px.

**3.2 Server-authoritative clock-in**

- AC: POST creates `ClockEvent(type=IN, source=employee_self)` with a server-set timestamp (client-supplied time never trusted); photo is required — event rejected without one.
- Depends on: 3.1, 0.2
- DoD: manually tampering with client clock has zero effect on the recorded timestamp (verified in testing, §7).

**3.3 Shift/overnight logic (shift_date, open-shift detection)**

- AC: an IN with no open shift starts a new `shift_date`; an OUT closes the most recent open IN regardless of calendar day; a 10PM–6AM shift stays on one shift_date; repeated in/out same day opens additional pairs under the same shift_date.
- Depends on: 3.2
- DoD: unit tests cover same-day multi-punch and midnight-crossing cases explicitly (see §7 test list).

**3.4 Clock-out + hours confirmation**

- AC: clock-out confirmation shows total hours for that shift (sum of all IN→OUT pairs on the shift_date).
- Depends on: 3.3

### Epic 4 — Calendar & Day Detail

**4.1 Month-grid calendar per employee**

- AC: renders all five day-cell states from `PRD.md` §6.3 (Worked, Holiday, Holiday·Worked, Absent, blank/future); overnight shifts appear on their start date.
- Depends on: 3.3, 6.1 (holidays)
- DoD: a month containing at least one of each state renders correctly, verified against `DESIGN.md` §5 pill styling.

**4.2 Day detail view**

- AC: full-size photos, exact timestamps, device info, status; admin can add an audit note or correct a record without deleting the original.
- Depends on: 4.1
- DoD: an edited record still shows its original values in an audit trail.

### Epic 5 — Admin Proxy Punch

**5.1 Admin manual time in/out**

- AC: admin picks date/time and enters a **required** reason note; creates `ClockEvent(source=admin_manual, created_by=<admin>)` with no photo; visually flagged everywhere it appears (calendar, day detail, export) per `DESIGN.md`'s "admin-entered" pill.
- Depends on: 4.2
- DoD: attempting to save without a reason note is blocked client- and server-side.

### Epic 6 — Holidays

**6.1 Holiday CRUD (admin)**

- AC: admin adds/edits/removes a `Holiday` (date + label); applies org-wide, no per-employee setup.
- Depends on: 1.1
- DoD: marking a date holiday immediately reflects on every employee's calendar without per-employee action.

### Epic 7 — Monthly Export

**7.1 Single-employee export**

- AC: admin picks one employee + a cutoff (semi-monthly preset 1st–15th/16th–end, or custom range) + format (Excel/CSV/PDF); generated file has date, time in, time out, total hours, status, photo reference per event.
- Depends on: 4.1
- DoD: exported hours match the calendar/day-detail values exactly for a test employee spanning a holiday and an overnight shift.

### Epic 8 — Deployment & Ops

**8.1 GitHub repo + branch protection**

- AC: repo created, main branch protected, PRs required.
- Depends on: 0.1

**8.2 Cloudflare Pages deploy**

- AC: frontend builds and deploys from the repo; production env vars (Convex deployment URL, etc.) configured, not hardcoded.
- Depends on: 8.1, 0.2

**8.3 Convex production deployment**

- AC: production Convex deployment separate from dev; schema/functions deployed; secrets stored in Convex/Cloudflare env config, never committed.
- Depends on: 8.2

---

## 6. Implementation (Claude Code session brief)

**Stack:** React + TypeScript + Vite (frontend), Convex (backend/data/storage), deployed via Cloudflare Pages.

**Convex schema** (derived from `PRD.md` §7):

```ts
// convex/schema.ts (sketch)
employees: defineTable({
  fullName: v.string(),
  employeeCode: v.string(),
  department: v.string(),
  position: v.string(),
  email: v.string(),
  profilePhotoUrl: v.string(),
  status: v.union(v.literal("active"), v.literal("inactive")),
  dateHired: v.string(),
}),

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
  timestamp: v.number(), // server-set, ms epoch
  shiftDate: v.string(), // "YYYY-MM-DD"
  source: v.union(v.literal("employee_self"), v.literal("admin_manual")),
  photoId: v.optional(v.id("photos")), // required if employee_self, enforced in mutation
  deviceId: v.optional(v.string()),
  createdBy: v.optional(v.id("users")), // admin id if admin_manual
  status: v.union(v.literal("on_time"), v.literal("late"), v.literal("early"), v.literal("flagged")),
  auditNote: v.optional(v.string()),
  editedBy: v.optional(v.id("users")),
  editedAt: v.optional(v.number()),
}).index("by_employee_shiftDate", ["employeeId", "shiftDate"]),

photos: defineTable({
  eventId: v.id("clockEvents"),
  storageId: v.id("_storage"),
  capturedAt: v.number(),
  checksum: v.string(),
}),

holidays: defineTable({
  date: v.string(), // "YYYY-MM-DD", unique
  name: v.string(),
  createdBy: v.id("users"),
}).index("by_date", ["date"]),

exportBatches: defineTable({
  employeeId: v.id("employees"),
  periodStart: v.string(),
  periodEnd: v.string(),
  generatedBy: v.id("users"),
  format: v.union(v.literal("csv"), v.literal("xlsx"), v.literal("pdf")),
  fileStorageId: v.id("_storage"),
}),
```

**Key mutations/queries:** `clockIn`, `clockOut` (both server-stamp time, enforce photo presence, compute `shiftDate`), `adminManualPunch` (enforces `auditNote` required), `markHoliday` / `removeHoliday`, `getEmployeeCalendar(employeeId, month)` (joins clockEvents + holidays into the five day-cell states), `generateExport(employeeId, periodStart, periodEnd, format)`.

**Session brief template** for each Claude Code implementation session:

> Scope: [Linear issue ID/title]. Context: `PRD.md`, `DESIGN.md`, this file's §6 schema sketch, and the current repo state. Build only what the issue's acceptance criteria require — no speculative extras. Stop and flag if the issue depends on something not yet merged.

Environment variables needed: `CONVEX_DEPLOYMENT`, `CONVEX_URL`, admin bootstrap secret (used once, not stored in code).

---

## 7. Review & Test

- Automated: `npm run build`, lint, typecheck, unit tests (shift/overnight logic from 3.3 gets explicit test cases: same-day double punch, exact-midnight boundary, forgotten clock-out).
- Manual exploratory pass, independent of what Claude Code reports: every nav path, every form (including validation/error states), every CTA, every modal/drawer (admin manual punch, holiday, export), and the full state machine of the clock screen (no open shift → clocked in → clocked out → clocked in again same day).
- Don't trust a "done" report — open the app and click through it yourself.

## 8. Design Verification

- Diff against `DESIGN.md` and the approved Phase 3 prototype.
- Desktop (1280px) and a **true 390px viewport** (not just a narrowed browser window) for both employee and admin flows.
- Confirm: no horizontal overflow anywhere, type is readable at every size, contrast meets `DESIGN.md` §7, every interactive element works (including camera permission-denied and offline states), `prefers-reduced-motion` actually disables motion, and — specifically for this product — **no fabricated data**: dashboard numbers, export previews, and empty states all reflect real records, never sample/placeholder content.

## 9. Version & Deploy

1. GitHub repo (Epic 8.1), branch-protected main.
2. Cloudflare Pages project pointed at the repo; build command `npm run build`, output `dist`.
3. Convex production deployment, separate from dev; env vars set in Cloudflare Pages + Convex dashboards, never committed to the repo.
4. Confirm `.env`/secrets are git-ignored before the first push.

## 10. Production Verification

Open the live URL and repeat the critical checks for real: login (both roles), a full clock-in → clock-out cycle with a real phone camera, calendar rendering (including a holiday and an overnight-shift case), admin manual punch, export download opens correctly in Excel, mobile at 390px on the actual deployed site. Only mark the corresponding Linear issues Done after this passes — not after deploy succeeds, after it's _verified working_.

---

## Open Items

- **Phase 2 decision:** confirm Blue Clarity or flag Field Neutral/Quiet Ledger.
- **Linear access:** this session can't create issues directly — hand this file to a Linear-connected session, or import manually.
- **Cloudflare/Convex/GitHub access:** actual account creation, deploy execution, and secret configuration in Phase 9 need you in the loop — I'll pause for confirmation at each irreversible or credentialed step rather than assume authorization.
