# Page Layout Spec — Mobile + Desktop (All Screens)

This defines the **page skeleton** — where the header, nav, main content, and side panels sit — for every screen, at both breakpoints. Pairs with `card-layout-spec.md` (what's inside each card) and `complete-element-color-spec.md` (colors).

---

## Breakpoint System

| Breakpoint | Width | Behavior |
|---|---|---|
| `mobile` | < 768px | Single column, bottom tab nav, no sidebars |
| `tablet` | 768px – 1024px | Same as desktop but sidebar collapses to icons-only (no labels), right panel hidden |
| `desktop` | > 1024px | Full 3-column layout: left sidebar + main + right panel |

**Rule:** Don't design "tablet" as a separate layout from scratch — it's just desktop with sidebar collapsed and right panel dropped. Saves you rebuilding logic twice.

---

## 📱 MOBILE LAYOUTS

### Global Mobile Shell (applies to every mobile screen)

```
┌─────────────────────────────┐
│  TOP BAR — 56px fixed        │  ← sticky, bg-surface, bottom border-hairline
├─────────────────────────────┤
│                               │
│                               │
│      SCROLLABLE CONTENT      │  ← flex:1, overflow-y auto
│         AREA                 │
│                               │
│                               │
├─────────────────────────────┤
│  BOTTOM NAV — 64px fixed     │  ← sticky, bg-surface, top border-hairline
└─────────────────────────────┘
```

| Property | Value |
|---|---|
| Top bar height | 56px, fixed/sticky top |
| Bottom nav height | 64px + safe-area-inset-bottom (for iPhone notch devices) |
| Content area | `calc(100vh - 56px - 64px)`, scrollable |
| Content horizontal padding | 16px both sides |
| Max content width | 100% (mobile is always full-bleed, no max-width constraint) |

---

### Mobile Screen 1: Chat List

```
┌─────────────────────────────┐
│ [M]        [180⚡] [🔔] [💬] │  Top bar: logo left, actions right
├─────────────────────────────┤
│  🔍 Search people or chats   │  Search: 44px height, 16px margin-top
├─────────────────────────────┤
│  Chat Item 1  (72px)         │
│  Chat Item 2  (72px)         │  ← Card Type 1 from layout spec,
│  Chat Item 3  (72px)         │     stacked, full-bleed dividers
│  Chat Item 4  (72px)         │
│  ...                          │
├─────────────────────────────┤
│  🏠   🧭   [+]   📅   👤     │  Bottom nav (5 items, center FAB)
└─────────────────────────────┘
```

| Section | Spec |
|---|---|
| Top bar layout | Horizontal flex, `justify-content: space-between`, padding 12px 16px |
| Top bar right group | Horizontal flex, gap 16px between icons |
| Search bar | Margin 16px (all sides), separate from list below by 8px |
| Chat list | No card wrapper — rows are full-width, divider-separated (per Card Type 1) |
| Empty state (no chats) | Centered vertically in content area: icon + "No conversations yet" + CTA button |

---

### Mobile Screen 2: Home Feed

```
┌─────────────────────────────┐
│ [M]        [180⚡] [🔔] [💬] │  Same top bar as Chat List
├─────────────────────────────┤
│  [ Host Workspace Banner ]   │  Full-width banner, 16px margin
├─────────────────────────────┤
│  Stories  ●          Explore→│
│  ○ ○ ○ ○ ○ (horizontal scroll)│  72px avatar row, scrollable
├─────────────────────────────┤
│ [Moments] [Active Peers]     │  Tab switcher, 44px height
├─────────────────────────────┤
│                               │
│     Post Card (Type 2)       │  Full width minus 16px margin,
│                               │  stacked vertically, 16px gap
│     Post Card (Type 2)       │  between cards
│                               │
├─────────────────────────────┤
│  🏠   🧭   [+]   📅   👤     │  Bottom nav
└─────────────────────────────┘
```

| Section | Spec |
|---|---|
| Content vertical order | Banner → Stories → Tabs → Feed cards |
| Banner margin | 16px top, 16px sides, 16px bottom before Stories |
| Stories section | Full-bleed horizontal scroll (padding 16px left, no right padding so last avatar peeks/scrolls naturally) |
| Tab switcher | 16px margin, sticky optional (can stick below top bar on scroll if feed is long) |
| Feed cards | 16px horizontal margin, 16px gap between cards, last card has 24px bottom margin before nav |
| Pull-to-refresh | Standard native pattern, `accent` color spinner |

---

### Mobile Screen 3: Profile

```
┌─────────────────────────────┐
│  MY PROFILE            ⚙    │  Top bar: title left, settings right
├─────────────────────────────┤
│  [ Host Workspace card ]     │  Full-width, 16px margin
├─────────────────────────────┤
│                               │
│   [ Profile Header Card ]    │  Card Type 3, 16px margin
│                               │
├─────────────────────────────┤
│  [ Signal Live toggle row ]  │  16px margin, 12px gap from above
├─────────────────────────────┤
│  [ Interests sub-card ]      │  16px margin, 12px gap
├─────────────────────────────┤
│  (future sections scroll     │  Extendable: Bookings history,
│   here — Bookings, Reviews)  │  Reviews, etc. same card pattern
├─────────────────────────────┤
│  🏠   🧭   [+]   📅   👤     │  Bottom nav (Profile tab active)
└─────────────────────────────┘
```

| Section | Spec |
|---|---|
| Top bar | Title left-aligned (not centered — matches app's left-aligned convention elsewhere), gear icon right |
| Vertical stack order | Host Workspace → Profile Header → Signal Live → Interests → (extendable sections) |
| Section-to-section gap | 12px consistently |
| Scroll behavior | Entire page scrolls as one column; top bar stays fixed |

---

## 🖥️ DESKTOP LAYOUTS

### Global Desktop Shell (applies to Discover, Home, and all desktop screens)

```
┌────────┬──────────────────────────────┬────────────┐
│        │                              │            │
│ SIDE-  │       MAIN CONTENT           │   RIGHT    │
│  BAR   │        (scrollable)          │   PANEL    │
│        │                              │            │
│ 240px  │         flex: 1              │   320px    │
│ fixed  │      max-width 720px         │   fixed    │
│        │       (centered in           │            │
│        │        available space)      │            │
│        │                              │            │
└────────┴──────────────────────────────┴────────────┘
   1024px+ viewport total
```

| Property | Value |
|---|---|
| Left sidebar width | 240px fixed, `position: sticky`, full viewport height |
| Right panel width | 320px fixed, `position: sticky`, independent scroll from main |
| Main content | `flex: 1`, but internally capped at `max-width: 720px` and centered — prevents feed/cards from stretching too wide on ultra-wide monitors |
| Gutter between columns | 24px on each side of main content |
| Page background | `bg-base` for the whole shell; sidebar and right panel can sit on `bg-base` too (not necessarily white) — only cards are `bg-surface` white |
| Top padding (main content) | 24px before first element |
| Bottom padding (main content) | 48px after last element (breathing room, not cut off abruptly) |

---

### Desktop Screen 4: Discover

```
┌────────┬──────────────────────────────┬────────────┐
│ [M]    │  🔍 Search students...        │ [Spotlight │
│        │                              │  Banner]   │
│ Home   │  [ALL][LIVE][ENG][MGMT][DES] │            │
│▶Discov │                              │ CLASSMATES │
│ Msgs   │  People nearby      33 online│ • Rishika  │
│ Bookng │                              │ • Aadrika  │
│ Notif  │  ┌────┐ ┌────┐               │ • Nico     │
│ Comm   │  │Card│ │Card│  ← 2-col grid │            │
│ Wallet │  └────┘ └────┘               │ UPCOMING   │
│ Prof   │  ┌────┐ ┌────┐               │ EVENTS     │
│        │  │Card│ │Card│               │ [empty]    │
│────────│  └────┘ └────┘               │            │
│ [You]  │  ...scroll for more...       │            │
└────────┴──────────────────────────────┴────────────┘
```

| Section | Spec |
|---|---|
| Search bar | Top of main content, full width of main column, 48px height |
| Filter pills row | Horizontal scroll if overflow, 12px margin-top from search, gap 8px between pills |
| "People nearby" heading + count | 24px margin-top from filters, `justify-content: space-between` |
| Card grid | **2 columns** at 1024–1440px, **3 columns** at 1440px+, gap 16px both axes |
| Right panel — Spotlight banner | Top of right panel, no top margin (flush with main content's search bar top edge, for visual alignment) |
| Right panel — Classmates section | 24px margin-top from banner |
| Right panel — Upcoming Events | 24px margin-top from Classmates |
| Right panel internal padding | 20px left/right (panel itself has no border, just padding — content floats on `bg-base`) |

---

### Desktop Screen 5: Home

```
┌────────┬──────────────────────────────┬────────────┐
│ [M]    │  [ Host Workspace Banner ]   │ [Spotlight │
│        │                              │  Banner]   │
│ ▶Home  │  Stories: ○○○○○○○○  Explore→ │            │
│ Discov │                              │ CLASSMATES │
│ Msgs   │  [Moments][Active Peers]     │ (same as   │
│ Bookng │                              │  Discover) │
│ Notif  │  ┌──────────────────────┐    │            │
│ Comm   │  │   Post Card (full     │    │ UPCOMING   │
│ Wallet │  │   main-column width)  │    │ EVENTS     │
│ Prof   │  └──────────────────────┘    │            │
│        │  ...more posts, single col.. │            │
│────────│                              │            │
│ [You]  │                              │            │
└────────┴──────────────────────────────┴────────────┘
```

| Section | Spec |
|---|---|
| Feed column | **Single column** (not grid) — post cards are full main-column width (720px max), stacked with 16px gap |
| Banner → Stories gap | 24px |
| Stories → Tabs gap | 20px |
| Tabs → Feed gap | 20px |
| Right panel | **Identical component instances** as Discover screen (Spotlight, Classmates, Events) — reused, not redesigned per page, for consistency |

---

## Responsive Transition Rules (Desktop → Tablet → Mobile)

| Element | Desktop (1024px+) | Tablet (768–1024px) | Mobile (<768px) |
|---|---|---|---|
| Left sidebar | 240px, icons+labels | 72px, icons only, tooltips on hover | Hidden — replaced by bottom nav |
| Right panel | 320px visible | Hidden entirely | Hidden entirely |
| Main content max-width | 720px centered | Fluid, fills remaining space | Full width, 16px padding |
| Discover grid columns | 2–3 columns | 2 columns | 1 column (stacked) |
| Filter pills | Inline row | Inline row, horizontal scroll | Horizontal scroll, edge-to-edge |
| Top search bar | Inside main column | Inside main column | Own row below top bar |

---

## Z-Index Layering Reference (Applies Globally)

| Layer | z-index | Elements |
|---|---|---|
| Base content | 0 | Cards, feed, page content |
| Sticky sidebar/nav | 10 | Left sidebar, bottom mobile nav |
| Sticky top bar | 20 | Mobile top bar, desktop search (if made sticky) |
| Dropdowns/tooltips | 30 | Filter dropdowns, hover tooltips |
| Modals/overlays | 40 | Edit Profile modal, image viewer |
| Toasts/notifications | 50 | Success/error toast messages |

---

*Ab teeno cheezein complete hain: (1) `uirules.md` — philosophy, (2) `complete-element-color-spec.md` — colors, (3) `card-layout-spec.md` — card internals, (4) ye file — page skeletons mobile+desktop. Ye 4 files milke ek developer-ready design system bante hain. Agla natural step: inme se kisi ek screen ka actual rendered artifact banau (real Chat List ya real Discover page) taaki visually confirm ho jaye final look?*
