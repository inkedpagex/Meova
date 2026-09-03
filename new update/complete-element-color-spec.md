# Complete Element-Level Color Spec — "M" Campus App

**Chosen approach:** Deep Plum (flat, no gradient) + warm off-white base — avoids the "AI-generated purple gradient" look.
**Alt option noted at the end:** Terracotta/Rust, if you want to fully sidestep any purple association.

---

## Final Palette (Locked)

| Token | Hex | Notes |
|---|---|---|
| `accent` | `#6D28D9` | Deep plum — flat fill ONLY, never gradient |
| `accent-hover` | `#5B21B6` | Pressed/hover state |
| `accent-tint-10` | `#F3EEFC` | Chip/tag backgrounds |
| `accent-tint-20` | `#E4D9F7` | Hover on chips, active nav bg |
| `bg-base` | `#FAFAF8` | Warm off-white — NOT pure white (avoids sterile AI-app look) |
| `bg-surface` | `#FFFFFF` | Cards only, to contrast against warm base |
| `border-hairline` | `#E7E5E4` | Warm gray border, not cold `#E5E7EB` |
| `text-primary` | `#1C1917` | Warm near-black |
| `text-secondary` | `#78716C` | Warm gray |
| `text-tertiary` | `#A8A29E` | Placeholder-level |
| `status-online` | `#10B981` | Dot only |
| `status-error` | `#DC2626` | Errors/delete only |
| **ALT accent (if avoiding purple entirely)** | `#C2410C` (terracotta) | Swap `accent` token everywhere, rest of palette stays same |

**Typography note (also de-risks "AI look"):** Use a slightly distinctive font pairing instead of default Inter-everywhere — e.g., headings in **Sora** or **General Sans** (bold, has personality), body text in **Inter** or **DM Sans**. Pure Inter-for-everything is the other big "AI demo" tell.

---

## SCREEN 1: Chat List (Mobile)

| # | Element | Color/Style |
|---|---|---|
| 1.1 | Top bar background | `bg-surface` white |
| 1.2 | "M" logo mark | `text-primary` dark, flat monochrome (no orange-red gradient) |
| 1.3 | Coin/points pill background | `accent-tint-10` |
| 1.4 | Coin/points pill text + lightning icon | `accent` |
| 1.5 | Notification bell icon (default) | `text-secondary` |
| 1.6 | Notification bell — unread dot | `accent` (small dot, top-right of bell) |
| 1.7 | Chat/message icon (default) | `text-secondary` |
| 1.8 | Chat icon — unread dot | `accent` |
| 1.9 | Search bar background | `bg-surface`, `border-hairline` 1px |
| 1.10 | Search bar placeholder text | `text-tertiary` |
| 1.11 | Search icon inside bar | `text-tertiary` |
| 1.12 | Contact avatar — no photo (initial letter bg) | `accent-tint-20` bg, `accent` letter text |
| 1.13 | Contact avatar — online status ring/dot | `status-online` green, white 2px border around dot |
| 1.14 | Contact name (unread/bold) | `text-primary`, font-weight 700 |
| 1.15 | Contact name (read) | `text-primary`, font-weight 500 |
| 1.16 | "You:" prefix in last message | `text-tertiary` |
| 1.17 | Last message preview text | `text-secondary` |
| 1.18 | Unread message preview (if unread) | `text-primary`, font-weight 600 |
| 1.19 | Timestamp | `text-tertiary`, smaller size (12px) |
| 1.20 | Unread count badge (if shown) | `accent` solid circle, white number |
| 1.21 | List item divider | `border-hairline`, 1px, only between rows |
| 1.22 | List item hover/pressed state | `bg-base` (subtle warm tint on tap) |
| 1.23 | Bottom nav bar background | `bg-surface`, top border `border-hairline` |
| 1.24 | Bottom nav — inactive icon | `text-tertiary` |
| 1.25 | Bottom nav — inactive label | `text-tertiary`, 11px |
| 1.26 | Bottom nav — active icon | `accent` |
| 1.27 | Bottom nav — active label | `accent`, font-weight 600 |
| 1.28 | Bottom nav — center "+" FAB button | `accent` solid circle, white icon, subtle shadow `0 4px 12px rgba(109,40,217,0.25)` |

---

## SCREEN 2: Home Feed (Mobile)

| # | Element | Color/Style |
|---|---|---|
| 2.1 | Page background | `bg-base` |
| 2.2 | "Host Workspace" banner background | `accent` solid flat fill |
| 2.3 | "Host Workspace" banner icon (shield) | White, 80% opacity |
| 2.4 | "Host Workspace" title text | White, font-weight 700 |
| 2.5 | "Host Workspace" subtitle text | White, 80% opacity |
| 2.6 | "HOST" tag inside banner | White bg, `accent` text (inverted chip) |
| 2.7 | "OPEN HUB" button | White solid bg, `accent` text, pill shape |
| 2.8 | Stories section label ("Stories") | `text-primary`, font-weight 600 |
| 2.9 | Stories — online indicator dot (left of label) | `status-online` green |
| 2.10 | "Explore →" link | `accent` text |
| 2.11 | Story ring — your own story (no upload yet) | `border-hairline` gray dashed or solid ring |
| 2.12 | Story ring — "+" add button | `accent` solid circle, white plus icon, positioned bottom-right of avatar |
| 2.13 | Story ring — unseen story (others) | `accent` solid ring, 2px |
| 2.14 | Story ring — seen story | `border-hairline` gray ring, 2px |
| 2.15 | Story — online status dot on avatar | `status-online` green |
| 2.16 | Story name label | `text-secondary`, 12px |
| 2.17 | "Moments" tab (active) | `accent` solid fill, white text, pill |
| 2.18 | "Active Peers" tab (inactive) | `bg-surface` white, `border-hairline` border, `text-secondary` text |
| 2.19 | Post card background | `bg-surface` white |
| 2.20 | Post card border | `border-hairline` 1px |
| 2.21 | Post card shadow | `0 2px 8px rgba(28,25,23,0.06)` |
| 2.22 | Post author avatar | Photo or `accent-tint-20` initial bg |
| 2.23 | Post author avatar — online dot | `status-online` green |
| 2.24 | Post author name | `text-primary`, font-weight 600 |
| 2.25 | Post meta ("Student · Campus · Sep 2") | `text-secondary`, 13px |
| 2.26 | "⋮" more-options icon | `text-tertiary` |
| 2.27 | Post image frame | Fixed aspect ratio container, `border-hairline` inner border, `bg-base` letterbox if image doesn't fill |
| 2.28 | "Showcase" tag on image | Black 60% opacity overlay bg, white text (keep neutral — don't tint this with accent, it's a content-type label not brand) |
| 2.29 | Like icon (unliked) | `text-secondary` outline heart |
| 2.30 | Like icon (liked) | `accent` filled heart |
| 2.31 | Like count | `text-secondary`, 13px |
| 2.32 | Share icon | `text-secondary` outline |
| 2.33 | Caption author name (bold, inline) | `text-primary`, font-weight 700 |
| 2.34 | Caption text | `text-primary`, font-weight 400 |
| 2.35 | "You've seen all Campus Moments" end text | `text-tertiary`, centered, 13px |
| 2.36 | Bottom nav | Same as Screen 1 (1.23–1.28) |

---

## SCREEN 3: Profile

| # | Element | Color/Style |
|---|---|---|
| 3.1 | "MY PROFILE" header text | `text-primary`, font-weight 700, uppercase, letter-spacing 0.02em |
| 3.2 | Settings gear icon | `text-secondary` |
| 3.3 | Settings icon — background circle | `bg-base` |
| 3.4 | "Campus Host Workspace" card background | `accent-tint-10` (lighter than full banner — this is a secondary entry point, not primary banner) |
| 3.5 | Host Workspace card icon (shield) | `accent` |
| 3.6 | Host Workspace card title | `text-primary`, font-weight 600 |
| 3.7 | Host Workspace card subtitle | `text-secondary` |
| 3.8 | "HOST" tag | `accent-tint-20` bg, `accent` text |
| 3.9 | Chevron arrow (→) | `text-tertiary` |
| 3.10 | Profile header card background | `bg-surface` white, `border-hairline` |
| 3.11 | Profile picture ring | `accent` solid ring, 3px |
| 3.12 | Profile picture (image itself) | Unchanged (user photo, grayscale or color as uploaded) |
| 3.13 | Name ("Chirag") | `text-primary`, font-weight 700, 22px |
| 3.14 | "@SAMPLE12" handle pill | `bg-base` bg, `text-secondary` text |
| 3.15 | "VERIFIED HOST" badge | `accent-tint-10` bg, `accent` text + checkmark icon |
| 3.16 | "2nd Year · General" subtext | `text-secondary` |
| 3.17 | "GLA University, Mathura" subtext | `text-secondary` |
| 3.18 | "No bio yet..." placeholder text | `text-tertiary`, italic |
| 3.19 | "EDIT PROFILE" button | `accent` solid fill, white text, pill — **was black, now accent** |
| 3.20 | "PUBLIC VIEW" button | `bg-surface` white, `border-hairline` border, `text-primary` text |
| 3.21 | Public view icon (external link) | `text-secondary` |
| 3.22 | QR code icon button | `bg-base` bg, `text-secondary` icon, circular |
| 3.23 | Share icon button | `bg-base` bg, `text-secondary` icon, circular |
| 3.24 | "SIGNAL LIVE" section icon | `status-online` green (this IS a live-status feature, keep green — consistent meaning) |
| 3.25 | "SIGNAL LIVE" label text | `text-primary`, font-weight 600 |
| 3.26 | "Classmates can discover you" subtext | `text-secondary` |
| 3.27 | Toggle switch — ON state | `status-online` green fill (matches 3.24 meaning) |
| 3.28 | Toggle switch — OFF state | `border-hairline` gray fill |
| 3.29 | Toggle switch knob | White circle |
| 3.30 | "INTERESTS" section label | `text-secondary`, uppercase, letter-spacing |
| 3.31 | "EDIT" link (top right of Interests) | `accent` text |
| 3.32 | Interest tag — pill background | `accent-tint-10` |
| 3.33 | Interest tag — text | `accent`, font-weight 500 |
| 3.34 | Interest tags shown | Max 4–5 visible, then "+N more" in `text-tertiary` |

---

## SCREEN 4: Discover (Desktop)

| # | Element | Color/Style |
|---|---|---|
| 4.1 | Left sidebar background | `bg-surface` white |
| 4.2 | Sidebar right border | `border-hairline` 1px |
| 4.3 | Logo | `text-primary` flat monochrome |
| 4.4 | Sidebar collapse icon | `text-tertiary` |
| 4.5 | Nav item — inactive icon | `text-secondary` |
| 4.6 | Nav item — inactive text | `text-secondary` |
| 4.7 | Nav item — active background | `accent-tint-10`, rounded-xl container |
| 4.8 | Nav item — active icon + text | `accent` |
| 4.9 | Bottom user card (Chirag gla) — avatar ring | `accent` ring if online |
| 4.10 | Bottom user card — name | `text-primary`, font-weight 600 |
| 4.11 | Bottom user card — subtext | `text-secondary` |
| 4.12 | Main search bar | `bg-surface`, `border-hairline`, pill shape |
| 4.13 | Search placeholder | `text-tertiary` |
| 4.14 | Filter pill — "ALL" (active) | `accent` solid fill, white text |
| 4.15 | Filter pills — inactive (LIVE ON CAMPUS, etc.) | `bg-surface` white, `border-hairline`, `text-secondary` |
| 4.16 | Filter pills — hover state | `bg-base` background |
| 4.17 | "People nearby" heading | `text-primary`, font-weight 700, 18px |
| 4.18 | "33 online" count | `text-secondary`, with small `status-online` dot before it |
| 4.19 | Person card — background | `bg-surface` white |
| 4.20 | Person card — border | `border-hairline` |
| 4.21 | Person card — hover shadow | `0 4px 16px rgba(28,25,23,0.08)`, slight lift |
| 4.22 | Person avatar — ring | `accent-tint-20` default ring (not full accent — reserve solid accent ring for verified/host only) |
| 4.23 | Person avatar — online dot | `status-online` green, white border |
| 4.24 | Person name | `text-primary`, font-weight 700 |
| 4.25 | Match/interest tag (max 2 only) | `accent-tint-10` bg, `accent` text, single short label (NOT full sentence) |
| 4.26 | "MEET" button | `accent` solid fill, white text, pill — primary CTA |
| 4.27 | Chat icon next to Meet | **Removed from card** (moved to profile detail view per audit) |
| 4.28 | Right sidebar — "Campus Spotlight" banner | `accent` solid fill (same token as Host Workspace — visual consistency across app) |
| 4.29 | Spotlight banner icon (sparkle) | White |
| 4.30 | Spotlight banner title | White, font-weight 700 |
| 4.31 | Spotlight banner subtext | White, 85% opacity |
| 4.32 | "CLASSMATES" section label | `text-secondary`, uppercase |
| 4.33 | "See all" link | `accent` |
| 4.34 | Classmate row — avatar | Photo or `accent-tint-20` initial |
| 4.35 | Classmate row — name | `text-primary`, font-weight 600 |
| 4.36 | Classmate row — subtext (year/branch) | `text-secondary`, 12px |
| 4.37 | "Meet 50 ⚡" button (sidebar, secondary context) | `bg-surface` white, `accent` border + text (outline style — NOT solid, to differentiate from primary feed CTA at 4.26) |
| 4.38 | "UPCOMING EVENTS" label | `text-secondary`, uppercase |
| 4.39 | "Explore" link | `accent` |
| 4.40 | Empty state card (no events) | `bg-base` bg, `border-hairline` dashed border |
| 4.41 | Empty state icon (calendar) | `text-tertiary` |
| 4.42 | Empty state text | `text-secondary` |

---

## SCREEN 5: Home (Desktop) — Deltas from Screen 4 (same sidebar/right panel rules apply)

| # | Element | Color/Style |
|---|---|---|
| 5.1 | "Host Workspace" top card | Same as 2.2–2.7 (banner style), full width in main column |
| 5.2 | Stories row | Same rules as 2.11–2.16, horizontal scroll |
| 5.3 | "Moments"/"Active Peers" tabs | Same as 2.17–2.18 |
| 5.4 | Post feed cards | Same as 2.19–2.35, single column in center panel |

---

## Global "Never Do This" List

- ❌ Never use a gradient on the accent color (biggest AI-generic tell)
- ❌ Never use pure `#FFFFFF` as the outer page background (use warm `bg-base`)
- ❌ Never let accent color exceed ~8–10% of total screen surface area
- ❌ Never show 2 solid-accent banners on the same visible screen at once
- ❌ Never mix green/red into decorative UI — reserve strictly for status/error
- ❌ Never use more than 2 tags per card
- ❌ Never use a sentence-length tag/pill

---

*This spec is exhaustive enough to hand directly to a developer or Figma file — every dot, icon state, and text color is defined. Next logical step: I can mock up Screen 1 or Screen 3 as an actual rendered artifact so you see it real before rolling out to all 5 screens.*
