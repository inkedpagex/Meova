# UI Rules — "Pulse" Social Media App

Design philosophy: **Neo-minimalist, functional elegance.** Inspired by Stripe / Linear / Notion — explicitly avoiding the visual language of Instagram, Facebook, or Twitter/X.

---

## 1. Core Principles

- **Whitespace over decoration.** Never fill empty space with unnecessary elements. Let content breathe.
- **One accent color only.** Never mix multiple bright colors in the same view.
- **Flat, no gradients/glossy effects.** No skeuomorphism, no glassmorphism unless explicitly used for a modal overlay.
- **Consistency > novelty.** Every card, button, and input follows the same radius, spacing, and shadow rules.
- **Avoid Instagram/Facebook patterns explicitly:**
  - No dense photo-grid profile layout.
  - No blue-dominant palette (#1877F2 style).
  - No infinite single-column vertical feed as the *only* layout — prefer masonry/card-grid or tabbed views.

---

## 2. Color Palette

| Token | Hex | Usage |
|---|---|---|
| `bg-base` | `#FAFAFA` | App background |
| `bg-surface` | `#FFFFFF` | Cards, modals, navbar |
| `border-hairline` | `#E5E5E5` | 1px card/input borders |
| `text-primary` | `#111111` | Headings, primary text |
| `text-secondary` | `#6B7280` | Subtext, meta info |
| `accent` | `#7657D9` (Meova Brand Purple) | CTAs, active states, links |
| `accent-tint` | `#F1EEFB` | Soft tint, tag backgrounds |
| `danger` | `#DC2626` | Errors, destructive actions |
| `success` | `#16A34A` | Confirmations |

**Rule:** Accent color must cover approximately 10–12% of any given screen's surface area. The majority remains clean neutral and white.

---

## 3. Typography

- **Font family:** Inter, Satoshi, or DM Sans (geometric sans-serif only)
- **Headings:** Bold (700), tight letter-spacing (-0.02em)
- **Body text:** Regular (400), line-height 1.6
- **Scale:**
  - H1: 32px / Bold
  - H2: 24px / Bold
  - H3: 18px / Semibold
  - Body: 15px / Regular
  - Caption/meta: 13px / Regular, `text-secondary`

---

## 4. Spacing & Layout Grid

- Base spacing unit: **4px** (use multiples: 4, 8, 12, 16, 24, 32, 48, 64)
- Page max-width: **1280px**, centered
- Navbar height: **64px**, fixed top
- Left sidebar width: **240px**
- Right sidebar width: **280px**
- Card padding: **20px**
- Gap between grid cards: **16px**

---

## 5. Components

### Buttons
- Shape: pill (`border-radius: 9999px`)
- Padding: `10px 20px`
- Primary: solid `accent` fill, white text
- Secondary: `bg-surface` with `border-hairline`, `text-primary`
- No gradients, no drop shadows on buttons
- Hover: darken fill by 8% or apply `accent-tint` background for secondary

### Cards
- `border-radius: 16px`
- `border: 1px solid border-hairline`
- `box-shadow: 0 2px 8px rgba(0,0,0,0.06)`
- Hover state: shadow increases to `0 4px 16px rgba(0,0,0,0.08)`, subtle translateY(-2px)

### Inputs / Search Bar
- Pill-shaped (`border-radius: 9999px`) for search bars
- Rounded rect (`border-radius: 12px`) for form fields
- Inner subtle shadow, no heavy borders
- Placeholder text uses `text-secondary`

### Icons
- Outline/thin-line style only, **1.5px stroke weight**
- No filled or glossy icons
- Consistent icon set (e.g., Lucide, Phosphor, Feather — pick one, never mix)

### Navigation (Sidebar)
- Icon + label, left-aligned
- Active item: `accent-tint` background, `accent` text/icon color, rounded-xl container
- Inactive item: `text-secondary`, transparent background

---

## 6. Content Layout Rules

- Main feed: **masonry/staggered grid**, NOT a single infinite vertical column
- Avoid dense uniform photo grids (explicitly different from Instagram profile grids)
- Right sidebar: modular cards (e.g., "Trending", "Suggested Circles") — never a raw list without card containers
- Empty states must include an icon + short message + one CTA, never blank space alone

---

## 7. Motion & Interaction

- Transitions: `150–200ms ease-out` only
- Hover: shadow elevation + slight scale/translate, never color-flash
- No bounce, no elastic easing — keep it calm and professional
- Loading states: skeleton screens (rounded rectangles matching card shape), not spinners where avoidable

---

## 8. What to Avoid (Explicit Anti-Patterns)

- ❌ Blue-heavy Facebook-style palettes
- ❌ Instagram-style square photo grids as primary profile layout
- ❌ Gradient buttons or neumorphic shadows
- ❌ Overcrowded single-column infinite feeds with no visual hierarchy
- ❌ Multiple accent colors competing in one view
- ❌ Rounded avatar-heavy UI with no supporting text hierarchy
- ❌ Drop shadows heavier than `0 4px 16px rgba(0,0,0,0.1)` anywhere

---

*Use this file as a reference brief for designers, AI image generation prompts, or as a Tailwind config guide when building the actual product.*
