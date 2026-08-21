---
name: manggabs-website-design-preferences
description: Use Mark's Blue Clarity website design preferences.
version: 0.1.0
author: Mark Emil Gabor, Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [Design, Website, UI, Brand, MangGabs]
    related_skills: [claude-design, design-md, sketch]
---

# MangGabs Website Design Preferences

Use this skill whenever designing, reviewing or implementing a website or web interface for Mark Emil Gabor (MangGabs). It defines the default visual direction; project-specific brand requirements may extend it but should not silently replace it.

## When to Use

- Designing Mark's personal portfolio or service website.
- Creating design variants for one of Mark's business applications.
- Writing `DESIGN.md`, design tokens or frontend implementation instructions.
- Reviewing Claude Code output for visual fidelity.
- Adding motion or responsive behavior to an approved MangGabs design.

Do not use this identity unchanged for a client with its own established brand. Preserve the process and quality bar, then apply that client's design system.

## Core Direction

Start from **Blue Clarity**: bold, airy, product-led and technically credible.

Reference posture:

- Granular-like confidence, generous whitespace, oversized typography and product storytelling.
- Original composition, copy, product demonstrations and motion; never clone branded screens or exact animation choreography.
- Blue and light blue dominate, with deep navy for grounded product windows.

Mark's role should read as **Full-Stack Business Application Developer** and thoughtful technical partner. Lead with the business outcome, not the tools.

## Default Palette

- Primary blue: `#0867D8`
- Primary hover: `#0759BB`
- Light blue: `#5AC8FA`
- Ink: `#071A2F`
- Navy: `#071B31`
- Paper: `#FBFDFF`
- Pale-blue surface: `#EAF7FF`
- Muted text: `#58728B`
- Border: `#CFE6F7`
- Verified/success accent: `#67E0BD`
- Restrained attention accent: `#FFD166`

Avoid full-page gradients, glassmorphism, rainbow palettes and decorative blur. Complementary colors are allowed only when they have a functional role and remain subordinate to blue.

## Typography

- Display/body: **Manrope**.
- System labels and statuses: **DM Mono**.
- Headlines: oversized, concise, tightly tracked and compositionally strong.
- Body: calm, readable and generally no wider than 70 characters.
- Mobile: reduce headline size aggressively enough to avoid overflow.

## Composition

1. Identify the screen's primary surface before designing.
2. For Mark's portfolio, use **Decide / Learn** as the primary surface and believable **Operate/Monitor** product demonstrations as support.
3. Give each section one dominant idea.
4. Use whitespace, type and alignment before adding containers.
5. Hero: one promise, one supporting paragraph, no more than two actions and one meaningful demonstration.
6. Use dark navy interface windows to show real workflow: requirements, design, Linear issues, approvals and verified deployment.
7. Avoid repetitive equal-card grids and generic icon-tile sections.

## Motion Language

Use calm, purposeful motion:

1. Navigation fades in.
2. Hero label, headline lines, copy and actions reveal in a short stagger.
3. Product UI assembles only after the main message is readable.
4. Scroll reveals use small vertical movement plus opacity.
5. Process steps may activate sequentially.
6. Hover movement is subtle (`2–4px`) and fast.
7. No essential information depends on animation.
8. Implement `prefers-reduced-motion` with transforms, parallax and sequencing removed.

## Content Rules

- Lead with client outcomes: less friction, clearer operations and dependable systems.
- Appropriate examples: operations systems, POS/inventory, costing/quotation and workflow automation.
- Show the visible process: requirements, PRD, prototype, `DESIGN.md`, Linear, implementation, GitHub, Convex, Cloudflare and verification.
- Do not invent testimonials, client logos, metrics, awards or unsupported claims.
- Keep Claude Code and the technology stack secondary to the value delivered.

## Procedure

1. Inspect the project's PRD, existing brand materials, screenshots and frontend source.
2. State the primary surface archetype before choosing tokens or components.
3. Create two or three genuinely different design directions when the visual direction is not approved.
4. Treat Blue Clarity as the default strong-fit direction.
5. Record the approved system in a project-level `DESIGN.md`.
6. Convert the approved design into scoped Linear issues.
7. Instruct Claude Code to implement the approved design rather than inventing a new one.
8. Verify desktop and true `390px` mobile layouts, interactions, contrast and reduced-motion behavior.

Completion criterion: the implementation matches the approved MangGabs direction, contains no horizontal overflow at tested viewports, and every key interaction has been exercised.

## Pitfalls

- Inspiration is not permission to clone a reference site's distinctive screens or motion.
- Hiding overflow is not a mobile fix; inspect computed page width and the offending element.
- Large desktop headlines must be re-composed for mobile, not merely scaled slightly.
- Product mockups must communicate real workflow rather than decorative fake dashboards.
- Blue should dominate, but excessive blue everywhere destroys hierarchy; paper, pale-blue and navy create the rhythm.

## Verification

- Compare the implementation against the approved prototype and project `DESIGN.md`.
- Capture and inspect desktop and true mobile screenshots.
- Exercise CTAs, dialogs, drawers, navigation and state changes.
- Confirm no fake claims or copied branded content were introduced.
- Confirm `prefers-reduced-motion` produces a complete, usable experience.
