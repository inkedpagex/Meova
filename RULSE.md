# UI/UX Design Rules

## 1. No Emojis
Do not use emojis anywhere in the UI — not in headings, subheadings, buttons,
labels, tooltips, notifications, badges, or any text content. Use plain text
or proper icon components (SVG icons) instead, never emoji characters.

## 2. Minimal Design
Keep every page visually minimal and clean:
- No unnecessary decorative elements, extra shadows, gradients, or borders.
- No component crammed with more information than needed.
- Prioritize whitespace and simplicity over dense visuals.
- Use a consistent 4px (or 8px) spacing scale — no arbitrary margin/padding values.
- Example: instead of a card with icon + title + subtitle + badge + 3 metadata
  lines + 2 buttons, show title + one primary action; move the rest behind
  a details view.

## 3. Short, Context-Aware Text (Max 3-4 Words)
Headings, labels, button text, and card titles must be at most 3-4 words.
- Example: "Enter Binary Sequence" → "Binary Sequence"
- Example: "Select a scheme to simulate" → "Pick a scheme"
- Exception: technical identifiers (error codes, units, IDs) that cannot be
  shortened without losing meaning are exempt — but must still not wrap
  (see Rule 6).

## 4. Single-Line Descriptions on Mobile (Max 1 Line)
Any helper/description text (subtext, empty-state message, tooltip, card
description) must fit in one line on 320px–400px width.
- Example: "Converts binary data into voltage signals"
- Example: "Returns to 0V mid-bit for 1, stays 0V for 0"

## 5. Fully Mobile Responsive
- All boxes, cards, containers, and text must resize using responsive units
  (%, rem, clamp(), media queries) — not fixed pixel values.
- Defined breakpoints: Mobile ≤ 480px, Tablet 481–1024px, Desktop ≥ 1025px.
- Every screen must be tested at 320px (smallest supported width).

## 6. No Unwanted Line Breaks in Short UI Text
No label, heading, badge, counter, chip, or button text may wrap to a second
line on a 375px-wide screen.
- Fix order: (1) shorten the text, (2) reduce font-size, (3) if still too
  long, truncate with ellipsis (`...`) and show full text on tap/hover.
- Font-size floor: never go below 11px for body/label text or 10px for
  badges/chips — truncate instead of shrinking further.
- Use `whitespace-nowrap` (with `text-overflow: ellipsis` as fallback) on
  labels, chips, buttons, and status indicators.

## 7. Accessibility
- Text contrast ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text, icons, UI borders).
- Every interactive element has a visible focus state (not color-only).
- Never use color alone to convey meaning/status — pair with icon or text.
- Minimum tappable area: 44x44px (iOS) / 48x48dp (Android), even if the
  visible icon is smaller.

## 8. Typography Scale
Use a fixed type scale only — no arbitrary font sizes:
- Heading, Subheading, Body, Caption/Label (4 sizes, 2 weights max).
- Line-height and letter-spacing defined per size, not per component.

## 9. Component States
Every interactive element must define: default, hover, active/pressed,
disabled, loading, and error states. No component ships with only a
default look.

## 10. Motion
- Transitions: 150–300ms max, consistent easing curve across the app.
- Respect `prefers-reduced-motion` — disable non-essential animation for
  users who opt out.

## 11. Icon Consistency
- One icon set, one stroke weight, one consistent sizing scale (16/20/24px).
- No mixing of icon styles (outline + filled) in the same view.

## 12. Empty, Loading, and Error States
Every list, table, or data view must define:
- Empty state (with short label + 1-line description, per Rules 3–4).
- Loading state (skeleton or spinner, not blank screen).
- Error state (short message + retry action).

## 13. Truncation for Dynamic Content
User-generated or variable-length content (names, filenames, titles) must
truncate with ellipsis at a defined character/width limit — separate from
the fixed-label rule in Rule 6.

## 14. Internationalization Buffer
Translated text (German, French, etc.) can run 20–35% longer than English.
Labels and containers must not break when text length increases — verify
short-label rules hold under translation, not just in English.

## 15. Action Hierarchy
- One primary action (CTA) per screen/section, visually distinct.
- Secondary and tertiary actions use lower visual weight (outline/ghost/text).
- Never show two equally-weighted primary buttons side by side.

---

# Site-Wide Audit Instructions

Before marking this task complete, check the **entire website/app** — every
page, screen, modal, dropdown, tooltip, notification, and component state
(default, hover, empty, loading, error) — against every rule above.

For each violation found, report:
1. **Page/component name** (and file path if known).
2. **Which rule** is violated (rule number).
3. **What's wrong** — current text/element (screenshot or exact copy if possible).
4. **Suggested fix** — corrected text/value per the rule.

Do not skip rarely-visited screens (settings, error pages, empty states,
onboarding, modals) — these are the most common places rules get missed.
Summarize findings in a table at the end, grouped by rule number, so
recurring issues (e.g. every card title is too long) are easy to spot and
fix in  one-by-one.rather than  pass pass.