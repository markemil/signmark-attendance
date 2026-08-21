# In-Out — DESIGN.md

**Direction:** Blue Clarity (default)
**Status:** Draft — token system approved for use; screen-level prototypes still need sign-off (see `IMPLEMENTATION_PLAN.md` §3)
**Applies to:** the In-Out product UI (employee clock app + admin dashboard) — not the PRD/planning documents themselves

---

## 1. Direction

**Blue Clarity** — bold, airy, product-led. Blue / light blue / navy on generous whitespace. Manrope for everything humans read as prose or UI copy; DM Mono for anything that is _data_ — timestamps, IDs, status codes, exported filenames.

In-Out is an operational tool, not a marketing site, so "business outcomes before technology" translates to: dashboard copy leads with what the admin _gets_ ("payroll-ready in under 5 minutes," "42 punches reviewed this week") rather than how the system works. No feature is described by its implementation.

Two alternates were considered and rejected for now — not because they're worse, only more specific to conditions Signmark hasn't confirmed:

- **Field Neutral** (graphite/amber, high-contrast, mono-heavy) — built for outdoor glare and gloved thumbs. Worth revisiting if employees clock in outdoors or in bright warehouse light, where a light-blue UI can wash out.
- **Quiet Ledger** (off-white/ink, serif accents, spreadsheet density) — leans into "system of record" rather than "product." Worth revisiting if the admin side ends up used more like a ledger than a dashboard.

Default stands: **Blue Clarity**, revisit only if real usage conditions argue otherwise.

---

## 2. Color

Values are picked, not defaulted — a slight blue bias runs through the neutrals so grey never reads as an afterthought.

### Light (root)

| Token        | Value                        | Use                                                                                                                                                   |
| ------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--navy-900` | `#0B1E39`                    | Highest-emphasis text, dark surfaces, admin nav rail                                                                                                  |
| `--blue-700` | `#154FC0`                    | Hover/active states, links                                                                                                                            |
| `--blue-500` | `#2F6FED`                    | Primary actions, focus ring, brand accent                                                                                                             |
| `--blue-100` | `#E3ECFF`                    | Soft fills — selected states, info chips                                                                                                              |
| `--sky-050`  | `#F5F8FF`                    | Page background — airy, not stark white                                                                                                               |
| `--surface`  | `#FFFFFF`                    | Cards, modals, inputs                                                                                                                                 |
| `--ink-900`  | `#101828`                    | Body text                                                                                                                                             |
| `--ink-600`  | `#4A5568`                    | Secondary text, captions                                                                                                                              |
| `--ink-300`  | `#D6DEEB`                    | Borders, dividers (blue-tinted, not flat grey)                                                                                                        |
| `--success`  | `#15825B` on `#E3F6ED`       | On-time, present                                                                                                                                      |
| `--warning`  | `#B4740E` on `#FBEDD3`       | Late, flagged, admin-entered                                                                                                                          |
| `--critical` | `#C13A34` on `#FBE6E4`       | Absent, error, rejected upload                                                                                                                        |
| `--holiday`  | `--blue-500` on `--blue-100` | Distinct from success/warning/critical — a holiday isn't good or bad, so it stays on the brand-neutral blue chip rather than borrowing semantic color |

### Dark

| Token        | Value                                              |
| ------------ | -------------------------------------------------- |
| `--navy-900` | `#EAF1FF` (inverted role: near-white for headings) |
| `--blue-700` | `#8FB4FF`                                          |
| `--blue-500` | `#5B8DF6`                                          |
| `--blue-100` | `rgba(91,141,246,0.16)`                            |
| `--sky-050`  | `#0A0F1A` (page background)                        |
| `--surface`  | `#111826`                                          |
| `--ink-900`  | `#EEF2F8`                                          |
| `--ink-600`  | `#9AA7BD`                                          |
| `--ink-300`  | `#243044`                                          |
| `--success`  | `#4FD3A0` on `rgba(79,211,160,0.14)`               |
| `--warning`  | `#E3A94A` on `rgba(227,169,74,0.14)`               |
| `--critical` | `#E8746E` on `rgba(232,116,110,0.14)`              |
| `--holiday`  | `--blue-500` on `--blue-100` (dark values above)   |

Structure per the standard three-state pattern: `:root` holds light values; `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])` redefines them; `:root[data-theme="dark"]` redefines them again so an explicit toggle wins either direction. Every component reads tokens — never a literal hex — so it resolves correctly in all three states.

---

## 3. Typography

- **Display / headings:** Manrope 700/800. Tight tracking (-0.01em to -0.02em at large sizes), `text-wrap: balance`.
- **Body / UI copy:** Manrope 400/500/600.
- **System labels / data:** DM Mono 400/500 — timestamps, employee codes, `shift_date`, export filenames, status codes. Always `font-variant-numeric: tabular-nums` where digits stack in a column (calendar, export tables).

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap"
/>
```

Fallback stacks: `"Manrope", ui-sans-serif, system-ui, sans-serif` / `"DM Mono", ui-monospace, "SFMono-Regular", Menlo, monospace`.

| Role      | Size / weight                             | Example                 |
| --------- | ----------------------------------------- | ----------------------- |
| Display   | 2.25rem / 800                             | Dashboard page title    |
| H2        | 1.375rem / 700                            | Section headers         |
| H3        | 1.05rem / 700                             | Card titles             |
| Body      | 0.95rem / 400–500                         | Paragraphs, form labels |
| Caption   | 0.8rem / 500, uppercase, +0.04em tracking | Eyebrows, table headers |
| Mono data | 0.85rem / 500                             | Timestamps, codes       |

Body copy max-width ~65ch on any prose (admin help text, empty states).

---

## 4. Spacing & Layout

- 8px base unit. Component padding in multiples of 4/8; section gaps in multiples of 16/24/32.
- Layout via flex/grid + `gap` — never stacked margins.
- Breakpoints: **390px** (employee's real phone, primary target for the clock in/out flow), **768px** (tablet / small admin window), **1280px** (admin desktop, primary target for the dashboard).
- Employee flow is mobile-first and single-column at every breakpoint — it never needs to "become" desktop, since it's used on a phone.
- Admin flow is desktop-first but must never horizontally scroll at 390px: tables and calendars get `overflow-x: auto` in their own container; the page shell does not scroll sideways.
- Minimum touch target 44×44px on any control in the employee flow (camera shutter button, confirm, login fields).

---

## 5. Components

**Buttons** — Primary: `--blue-500` fill, white text, `--blue-700` on hover/active. Secondary: `--navy-900` 1px outline, transparent fill. Ghost: text-only, `--blue-700`. Destructive (e.g., remove holiday): `--critical` outline, fills solid only on confirm step.

**Status pills** — used for ClockEvent/DailySummary status everywhere they appear (calendar cells, day detail, export preview):

| State             | Token pairing                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------- |
| On-time / Present | `--success`                                                                                 |
| Late              | `--warning`                                                                                 |
| Absent            | `--critical`                                                                                |
| Flagged           | `--critical`, filled (vs. absent's outline)                                                 |
| Admin-entered     | `--warning` outline + a small "A" glyph, so it reads as "needs a second look," not an error |
| Holiday           | `--holiday` (blue chip, semantically neutral)                                               |
| Holiday · Worked  | split chip — holiday blue on the left half, success green on the right                      |

**Calendar day cell** — five states per `PRD.md` §6.3: Worked (thumbnail + time badges), Holiday, Holiday·Worked, Absent, blank (future date, no styling at all — it should visually disappear, not compete for attention).

**Camera capture** — full-bleed viewfinder on mobile, circular capture button (min 64px touch target) bottom-center, live camera feed only — no gallery-picker affordance anywhere in this flow, reinforcing the product's own integrity rule. Confirmation screen shows the captured photo large, with time and IN/OUT tag below in mono.

**Photo thumbnails** — 4px radius, 1px `--ink-300` border, object-fit cover. Full-size view on click.

**Forms/inputs** — `--surface` fill, `--ink-300` border, `--blue-500` 2px focus ring (visible, never removed). Errors use `--critical` text directly under the field, plain language, no icon-only errors.

**Modals/drawers** — used for admin proxy punch, holiday add/edit, export config. Drawer on mobile widths, centered modal from 768px up.

**Data tables** (export preview, employee list) — mono for numeric/date columns, tabular-nums, zebra-free (rely on `--ink-300` row dividers, not background banding).

---

## 6. Motion

Subtle and purposeful only: 150–250ms ease-out on state transitions (modal open, pill status change, calendar month swipe). No bounce, no decorative animation. Respect `prefers-reduced-motion: reduce` — transitions collapse to instant/opacity-only; the camera capture flow especially must stay fully usable with motion off, since it's the highest-frequency interaction in the product.

---

## 7. Accessibility

- WCAG AA minimum: 4.5:1 body text, 3:1 large text/UI elements — validate every token pairing above against its background, in both themes.
- Every interactive element has a visible focus state (the `--blue-500` ring, not a browser default outline reset to nothing).
- Status is never color-only: pills carry text/label, not just a colored dot.
- Camera capture flow must remain operable via keyboard/assistive tech where the platform allows (fallback file input hidden behind an accessible "can't use camera" path is out of MVP scope per the PRD's live-capture-only rule — flag this as a known accessibility gap if it becomes an issue).

---

## 8. Content Rules

- No fabricated data: dashboard/report copy only ever displays real counts, real timestamps, real employee data. No placeholder testimonials, sample metrics, or invented numbers — ever, including in empty/demo states (use genuine empty-state copy instead, e.g., "No punches yet today").
- Errors explain what happened and what to do next — no blame, no vague "something went wrong."
- Admin-facing copy leads with outcome ("Export ready — 2.1 hours saved vs. manual entry" is fine _if the number is real and computed_; never invent it for effect).
