# In-Out — Product Requirements Document

**Product:** In-Out — Photo-Verified Employee Attendance System
**Owner:** Signmark
**Status:** Draft v1.0
**Date:** 2026-08-20

---

## 1. Overview

In-Out is an employee time-and-attendance system where every clock-in and clock-out event is verified with a live photo and a server-authoritative timestamp. Records are organized on a calendar so admins can review, at a glance, who was in and out and when, with the corresponding photo evidence. At the end of every semi-monthly cutoff (1st–15th, 16th–end), admins export each employee's attendance for payroll processing.

---

## 2. Target Users

| User                     | Role                          | Needs                                                                                                                            |
| ------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Employee**             | Clocks in/out daily           | Fast, simple way to log attendance from their own phone (mobile-responsive), including multiple times a day and overnight shifts |
| **HR / Payroll Admin**   | Manages records, runs exports | Trustworthy records, easy monthly export, ability to review/annotate disputes                                                    |
| **Manager / Supervisor** | Oversees a team               | Visibility into their team's attendance, ability to spot lateness/absences                                                       |

---

## 3. Problem Statement

Manual time sheets and unverified digital clock-ins are easy to falsify (buddy punching), hard to audit, and slow to reconcile at payroll time. There is no visual proof that the person clocking in is actually the employee, no simple way to review a month of attendance at once, and no fast path from raw punches to a payroll-ready export. This causes payroll disputes, wasted admin hours, and low confidence in the data.

---

## 4. Goals & Success Metrics

| Goal                                  | Metric                                                                                                                                                                                       |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eliminate buddy punching              | 100% of employee-submitted clock events carry a live-captured photo; 0% accept gallery/uploaded images. Admin-entered punches are the sole exception, and are always visibly flagged as such |
| Make attendance auditable at a glance | Admin can review a full month for any employee in under 60 seconds via calendar view                                                                                                         |
| Cut payroll processing time           | Monthly export generated in under 5 minutes, zero manual re-typing of hours                                                                                                                  |
| Guarantee timestamp integrity         | Clock event timestamp is always server-recorded, never client-supplied                                                                                                                       |
| Fast clock-in experience              | Clock in/out flow (open camera → capture → confirmation) completes in under 3 seconds                                                                                                        |

---

## 5. Features

Legend: 🟢 MVP · 🔵 Phase 2

| Feature                                  | Priority   | Description                                                                                                                                                                                                                                    |
| ---------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Photo-verified Clock In / Out            | 🟢 MVP     | Employee opens camera, captures a live photo, system tags it IN or OUT                                                                                                                                                                         |
| Server-authoritative timestamp           | 🟢 MVP     | Time is recorded when the server receives the event, never trusts device clock                                                                                                                                                                 |
| Attendance calendar                      | 🟢 MVP     | Month-grid view per employee; each day cell shows IN/OUT thumbnails + times                                                                                                                                                                    |
| Day detail view                          | 🟢 MVP     | Click a day to see full-size photos, exact timestamps, and status                                                                                                                                                                              |
| Monthly export                           | 🟢 MVP     | Export a single employee's attendance (CSV/Excel/PDF) for a selected cutoff period                                                                                                                                                             |
| Admin dashboard                          | 🟢 MVP     | Search/filter employees, view records by date range or status                                                                                                                                                                                  |
| Roles & authentication                   | 🟢 MVP     | Employee, Admin/HR, Manager roles with scoped access                                                                                                                                                                                           |
| Manual edit with audit trail             | 🟢 MVP     | Admin can annotate/correct a record; original entry is preserved, edit is logged                                                                                                                                                               |
| Mobile-responsive web app                | 🟢 MVP     | Employees use their own phones — no dedicated kiosk hardware required                                                                                                                                                                          |
| Employee login (username & password)     | 🟢 MVP     | Admin creates each employee's account/credentials; employee logs in to clock in/out                                                                                                                                                            |
| Employee profile photo                   | 🟢 MVP     | Admin uploads a reference photo per employee at setup, used for manual comparison during disputes                                                                                                                                              |
| Multiple clock in/out + overnight shifts | 🟢 MVP     | Employees can clock in/out more than once a day; a shift that starts at night and ends the next morning is grouped under one shift date so hours calculate correctly                                                                           |
| Admin proxy clock in/out                 | 🟢 MVP     | Admin can manually clock an employee in or out on their behalf (e.g., forgotten punch, lost/broken phone). Logged as an admin-entered event with a required reason note — clearly distinguished from the employee's own photo-verified punches |
| Holiday calendar                         | 🟢 MVP     | Admin marks a date as a company holiday with a label; every employee's calendar shows that day as **Holiday** instead of blank or **Absent**, whether or not they clocked in                                                                   |
| Late/absence alerts                      | 🔵 Phase 2 | Notify manager when an employee is late or hasn't clocked in                                                                                                                                                                                   |
| Face-match auto-verification             | 🔵 Phase 2 | Compare captured photo against employee profile photo automatically                                                                                                                                                                            |
| Geolocation tagging                      | 🔵 Phase 2 | Attach GPS coordinates to each clock event                                                                                                                                                                                                     |
| Offline kiosk mode                       | 🔵 Phase 2 | Queue clock events locally when network is down, sync on reconnect                                                                                                                                                                             |
| Overtime rules engine                    | 🔵 Phase 2 | Auto-calculate overtime/holiday pay based on configurable rules                                                                                                                                                                                |
| Multi-branch support                     | 🔵 Phase 2 | Separate locations, each with its own kiosk and timezone                                                                                                                                                                                       |
| Native mobile app                        | 🔵 Phase 2 | Dedicated iOS/Android app instead of browser-based capture                                                                                                                                                                                     |
| Leave management integration             | 🔵 Phase 2 | Reconcile approved leave against attendance gaps                                                                                                                                                                                               |
| Bulk export (multiple/all employees)     | 🔵 Phase 2 | Generate one export file covering a group or the entire roster, instead of one employee at a time                                                                                                                                              |

---

## 6. User Flows

### 6.1 Employee — Clock In

1. Employee opens the app on their own phone (or any browser) and logs in with their username and password.
2. App opens the device camera (live capture only — no gallery upload allowed).
3. Employee captures a photo.
4. System sends the photo to the server, which stamps the event with the current server time and tags it **IN**. If the employee's last event was an OUT more than a few hours ago (or there is no open event), this starts a new shift; the event's _shift date_ is set to today.
5. Confirmation screen shows the photo thumbnail and recorded time.
6. Record is saved to the employee's log under that shift date.

### 6.2 Employee — Clock Out

Same capture flow as above, tagged **OUT**, closing the employee's currently open shift. Confirmation shows total hours worked for that shift (computed from the shift's IN to this OUT). If the employee clocks in again later the same day, it opens a new IN/OUT pair under the same shift date; if a shift runs past midnight (e.g., 10 PM–6 AM), both the IN and OUT stay attributed to the day the shift started.

### 6.3 Admin — Review Calendar

1. Admin logs into the dashboard.
2. Selects an employee (or views the team/all-employee overview).
3. Opens the calendar. Each day cell shows one of these states:
   - **Worked** — all IN/OUT pairs for that shift date, with time badges and photo thumbnails, color-coded by status (on-time, late, flagged). Overnight shifts appear under the day the shift started.
   - **Holiday** — no punches, date is marked as a company holiday (see §6.6). Not counted as an absence.
   - **Holiday · Worked** — date is a holiday _and_ the employee has punches — both are shown together.
   - **Absent** — a past date with no punches and not a holiday.
   - _(blank)_ — a future date that hasn't occurred yet.
4. Clicks a day to open the detail view: full photos, exact timestamps, device used.
5. Admin can add an audit note or correct a record; the original entry remains visible in the audit trail.
6. Admin can **void** a wrong or duplicate punch, with a required reason. Voiding never deletes it — the record stays visible (marked "Voided," with the reason), it just stops counting toward hours, the calendar's day-state, and exports, and can be reversed with "Unvoid." This keeps the same trust guarantee as the audit trail: a punch that happened is never silently erasable.

### 6.4 Admin — Monthly Export (Single Employee)

1. Admin opens an employee's profile or calendar view.
2. Selects a cutoff period (a saved preset, e.g. 1st–15th / 16th–end, or a custom range).
3. Clicks **Export** and picks a format (Excel, CSV, or PDF).
4. System generates a file scoped to that one employee, containing: date, time in, time out, total hours, status flags, and a link/reference to each event's photo.
5. File downloads immediately.

> MVP export is single-employee only. Exporting a group or the entire roster in one file is a Phase 2 feature (see §5).

### 6.5 Admin — Time In/Out for an Employee

1. Admin opens the employee's day detail view (e.g., a punch is missing, or the employee couldn't clock in themselves).
2. Selects **Add Time In** or **Add Time Out**, picks the date/time, and enters a required reason note (e.g., "forgot to clock out," "phone broken").
3. System creates the ClockEvent tagged with `source = admin_manual` and `created_by = <admin's user id>` — no employee photo is attached.
4. The record appears in the employee's calendar and day detail view, visually flagged as **admin-entered** (distinct from the employee's own photo-verified punches) so reviewers can immediately tell it wasn't self-verified.
5. Action is written to the audit trail like any other manual edit.

### 6.6 Admin — Mark a Holiday

1. Admin opens Holiday management (part of the calendar/admin settings).
2. Selects a date and enters a label (e.g., "New Year's Day").
3. Saves. The date is now marked **Holiday** on every employee's calendar and day detail view — this is a single, org-wide setting; there's no per-employee setup.
4. Admin can edit the label or remove the holiday the same way. Marking a date as a holiday only changes how it's _labeled and displayed_ — it does not, on its own, change how hours are calculated or paid (see §10, holiday pay).

---

## 7. Data Model

**Employee**

| Field             | Type   | Notes                                                                     |
| ----------------- | ------ | ------------------------------------------------------------------------- |
| employee_id       | PK     |                                                                           |
| full_name         | string |                                                                           |
| employee_code     | string | badge/ID number                                                           |
| department        | string |                                                                           |
| position          | string |                                                                           |
| email             | string |                                                                           |
| profile_photo_url | string | uploaded by admin at setup; reference photo for manual dispute comparison |
| status            | enum   | active / inactive                                                         |
| date_hired        | date   |                                                                           |

Login credentials (username/password) live on the linked **User** record below, created by the admin when the employee is set up.

**ClockEvent**

| Field       | Type                 | Notes                                                                                                                                                    |
| ----------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| event_id    | PK                   |                                                                                                                                                          |
| employee_id | FK → Employee        |                                                                                                                                                          |
| type        | enum                 | IN / OUT                                                                                                                                                 |
| timestamp   | datetime (UTC)       | server-recorded, authoritative                                                                                                                           |
| shift_date  | date                 | the day this event is grouped under; for an overnight shift, both IN and OUT keep the shift's start date                                                 |
| source      | enum                 | employee_self / admin_manual                                                                                                                             |
| photo_id    | FK → Photo, nullable | **required** (NOT NULL) when source = employee_self, enforced by the backend — the event is rejected without one; always null when source = admin_manual |
| device_id   | string, nullable     | employee's own phone/browser; null for admin_manual                                                                                                      |
| created_by  | FK → User, nullable  | set to the admin's user id when source = admin_manual                                                                                                    |
| status      | enum                 | on_time / late / early / flagged                                                                                                                         |
| audit_note  | string, nullable     | required when source = admin_manual (reason for the manual entry)                                                                                        |
| edited_by   | FK → User, nullable  | set only if manually corrected after creation                                                                                                            |
| edited_at   | datetime, nullable   |                                                                                                                                                          |

**Photo**

| Field       | Type            | Notes                                         |
| ----------- | --------------- | --------------------------------------------- |
| photo_id    | PK              |                                               |
| event_id    | FK → ClockEvent |                                               |
| file_url    | string          | object storage reference                      |
| captured_at | datetime        | client-side capture time (informational only) |
| checksum    | string          | integrity check, tamper detection             |

**DailySummary** (derived, computed — not necessarily its own table)

| Field       | Type     | Notes                                                                         |
| ----------- | -------- | ----------------------------------------------------------------------------- |
| employee_id | FK       |                                                                               |
| shift_date  | date     | matches ClockEvent.shift_date, not calendar day of the OUT event              |
| first_in    | datetime | earliest IN for the shift date                                                |
| last_out    | datetime | latest OUT for the shift date                                                 |
| pair_count  | integer  | number of IN/OUT pairs that day, e.g. clocking out and back in for a break    |
| total_hours | decimal  | sum of the duration of each IN→OUT pair for the shift date                    |
| is_holiday  | boolean  | looked up from **Holiday** by shift_date, not stored redundantly per employee |
| status      | enum     | present / absent / late / half-day / holiday / holiday_worked                 |

**ExportBatch**

| Field        | Type          | Notes                                |
| ------------ | ------------- | ------------------------------------ |
| export_id    | PK            |                                      |
| employee_id  | FK → Employee | MVP export is scoped to one employee |
| period_start | date          |                                      |
| period_end   | date          |                                      |
| generated_by | FK → User     |                                      |
| generated_at | datetime      |                                      |
| file_url     | string        |                                      |
| format       | enum          | csv / xlsx / pdf                     |

**User** (system accounts)

| Field              | Type                    | Notes                           |
| ------------------ | ----------------------- | ------------------------------- |
| user_id            | PK                      |                                 |
| name               | string                  |                                 |
| username           | string                  | unique, assigned by admin       |
| email              | string                  |                                 |
| role               | enum                    | admin / hr / manager / employee |
| linked_employee_id | FK → Employee, nullable |                                 |
| password_hash      | string                  |                                 |

**Holiday**

| Field      | Type         | Notes                       |
| ---------- | ------------ | --------------------------- |
| holiday_id | PK           |                             |
| date       | date, unique | one entry per calendar date |
| name       | string       | e.g. "New Year's Day"       |
| created_by | FK → User    | which admin marked it       |
| created_at | datetime     |                             |

**Relationships:** One Employee has many ClockEvents. One ClockEvent has exactly one Photo if it is employee_self, and none if it is admin_manual — this is a hard rule, not a default: the backend must refuse to save an employee_self event without a photo. DailySummary is derived per employee per shift_date from that date's ClockEvents, cross-referenced against Holiday by date. Holiday is not scoped to an employee — one entry marks that date as a holiday for every employee's calendar (consistent with the single-location assumption in §10). One Employee has many ExportBatches; each ExportBatch is scoped to a single employee and a date range, not individual records directly.

---

## 8. Technical Requirements

- **Client:** Mobile-first responsive web app — the primary device is each employee's own phone, so layout, tap targets, and camera flow must work well on small screens. No dedicated kiosk hardware required for MVP. Camera capture via `getUserMedia`/native camera API.
- **Capture integrity:** Camera capture only — no upload-from-gallery path, to prevent submitting an old or stolen photo. A photo is mandatory for every employee-submitted IN and OUT; the backend rejects the event if none is attached. The only way a clock event can exist without a photo is if an admin creates it directly (see below).
- **Backend:** REST API, server-authoritative clock — the timestamp is set the moment the server receives the event, never taken from the client device.
- **Database:** Relational DB (PostgreSQL/MySQL) for records; object storage (S3-compatible) for photos.
- **Auth:** Role-based access control; the system is bootstrapped with one initial Admin account (username/password) created at setup, which the admin then uses to create every employee account (no self-registration in MVP) and any additional admin accounts. Same login mechanism for the admin dashboard, scoped by role; session/JWT-based.
- **Admin proxy punches:** Admin dashboard can create a ClockEvent directly for any employee (`source = admin_manual`) without going through the camera-capture flow. These events skip photo verification by design, so a reason note is mandatory and the UI/exports must visually distinguish them from employee-submitted, photo-verified events to preserve audit integrity.
- **Shift logic:** Each ClockEvent is stamped with a `shift_date`. A new IN starts a new shift (and shift_date) unless the employee already has an open IN; an OUT closes the most recent open IN regardless of calendar day. This lets a 10 PM–6 AM shift, and repeated in/out during a single day, both compute correctly instead of splitting at midnight.
- **Time handling:** NTP-synced server clock; single timezone for MVP (see §10), applied consistently to shift_date calculation and exports.
- **Photo handling:** Client-side compression before upload; defined retention policy (e.g., 1–2 years); encrypted at rest.
- **Export:** Synchronous generation for small batches; async job + notification/email for large batches. Formats: CSV, XLSX, PDF.
- **Security & privacy:** HTTPS everywhere, encryption at rest for photos and PII, full audit log for manual edits, data retention/deletion policy for employee photos in line with local privacy regulations.
- **Performance:** End-to-end clock in/out flow (camera open → capture → upload → confirmation) under 3 seconds on a stable connection.
- **Scalability:** Must handle concurrent clock-ins during shift-start peaks (e.g., dozens of employees within a 5-minute window) without queuing delays.

---

## 9. MVP Scope

**In scope**

- Mobile-responsive web app — employees use their own phones, no kiosk hardware
- Employee authentication via admin-issued username & password
- Employee profile photo, uploaded by admin at setup
- Camera-based clock in/out with server-side timestamping
- Multiple clock in/out events per day, including overnight shifts that cross midnight
- Admin can manually clock an employee in/out on their behalf, with a required reason note and a visible "admin-entered" flag
- Admin can mark a calendar date as a holiday (with a label); it shows on every employee's calendar as Holiday, distinct from Absent
- Per-employee calendar view (month grid) with IN/OUT photo thumbnails
- Day detail view showing full photos and exact times
- Admin dashboard: employee list, search, filter by date range/status
- Manual monthly export (Excel/CSV/PDF) for a single employee, using a semi-monthly cutoff preset (1st–15th, 16th–end) or custom range
- Two roles: Employee, Admin
- Manual record correction with audit trail

**Out of scope (Phase 2+)**

- Automated face-match verification
- Geolocation/geofencing
- Native mobile apps
- Offline kiosk queueing
- Overtime rules engine / payroll system integration
- Leave management integration
- Multi-branch/location support
- Automated late/absence notifications
- Bulk export covering multiple employees or the full roster in one file

---

## 10. Confirmed Decisions & Open Questions

**Confirmed**

- **Cutoff period:** Semi-monthly — 1st–15th and 16th–end of month.
- **Device model:** Employee-owned devices (phones), not a shared kiosk. The web app must be mobile-responsive.
- **Employee accounts:** Admin creates each employee's username/password and uploads their profile photo at setup — no employee self-registration or self-service photo upload in MVP.
- **Fraud handling:** No automated face-match in MVP; admin visually compares the clock-in photo against the profile photo during disputes.
- **Locations:** Single location and timezone for MVP; multi-branch is Phase 2.
- **Shifts:** Employees may clock in/out more than once per day. Overnight shifts (e.g., start at night, end the next morning) are grouped under the shift's start date so hours compute correctly instead of splitting at midnight.
- **Admin overrides:** Admin can time in/out on behalf of any employee. Because this bypasses the employee's own photo capture, it's stored as a distinct event type (`admin_manual`), requires a reason note, and is visually flagged everywhere the record appears (calendar, day detail, export) so it's never mistaken for a self-verified punch.
- **Admin provisioning:** The system starts with one initial Admin account (username & password) created during setup; that account is used to create all subsequent employee and admin accounts. There is no default/shared password — it's set during setup and should be changed on first login.
- **Holidays:** Admin-managed and org-wide — one holiday entry applies to every employee (no per-employee or per-branch holidays in MVP, consistent with the single-location assumption). Marking a date as a holiday is purely a labeling/display feature for MVP: it changes what the calendar shows (Holiday vs. blank/Absent), but does not itself change how hours are calculated or trigger holiday pay — that's part of the overtime/pay rules engine in Phase 2.

**Still open**

- **Break tracking:** Should a mid-shift OUT/IN (e.g., a lunch break) be excluded from total hours, or counted as a separate paid pair? Current model sums every IN→OUT pair in the shift date, which treats breaks as unpaid gaps by default — confirm this matches policy.
- **Idle/forgotten clock-out:** If an employee never clocks out (e.g., forgets after an overnight shift), how long should the shift stay "open" before it's flagged for admin review?
