# Card Layout + Structure Spec — "M" Campus App

Combines **structure (where things sit)** with the color tokens from `complete-element-color-spec.md`. This is the level of detail you'd hand to a developer to build pixel-accurate.

---

## Card Type 1: Chat List Item

```
┌─────────────────────────────────────────────────┐
│  ┌────┐                                          │
│  │ 🟢 │   Contact Name              5h            │  ← Row height: 72px
│  │Ava │   Last message preview...                 │
│  └────┘                                          │
└─────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Row height | 72px fixed |
| Padding | 16px horizontal, 12px vertical |
| Layout direction | Horizontal flex: [Avatar] → [Name+Message block] → [Time] |
| Avatar size | 48×48px, `border-radius: 50%` |
| Avatar → text gap | 12px |
| Online dot | 12px circle, positioned bottom-right of avatar, `2px white border`, color `status-online` |
| Name + message block | `flex-direction: column`, gap 4px, takes remaining width |
| Name | Top line, `text-primary`, 15px, weight per read/unread (see color spec 1.14–1.15) |
| Last message | Bottom line, `text-secondary`, 14px, `text-overflow: ellipsis` (single line, truncate) |
| Time | Top-right corner, `text-tertiary`, 12px, `align-self: flex-start` |
| Unread badge (if any) | Bottom-right corner, 20×20px circle, `accent` bg, white 11px number, positioned below timestamp |
| Row divider | Bottom border, `border-hairline`, 1px, inset 16px from left (starts after avatar column, not full-bleed) |
| Tap target | Entire row is tappable, `bg-base` flash on press |

---

## Card Type 2: Post / "Moment" Card

```
┌─────────────────────────────────────────────────┐
│  ┌──┐  Author Name              ⋮                │  ← Header: 56px
│  │🟢│  Student · Campus · Sep 2                   │
│  └──┘                                            │
├─────────────────────────────────────────────────┤
│                                                   │
│              [ IMAGE — 4:5 ratio ]                │  ← Media block
│         (Showcase tag, bottom-left overlay)       │
│                                                   │
├─────────────────────────────────────────────────┤
│  ♡ 1        ↗                                    │  ← Actions: 44px
├─────────────────────────────────────────────────┤
│  Author Name  Caption text goes here...           │  ← Caption: auto height
└─────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Card outer | `bg-surface`, `border: 1px solid border-hairline`, `border-radius: 16px`, `box-shadow: 0 2px 8px rgba(28,25,23,0.06)` |
| Card margin (between cards) | 16px vertical gap in feed |
| Header padding | 16px all sides, height 56px |
| Header layout | Horizontal flex: [Avatar 36px] → 10px gap → [Name+meta column] → auto-margin → [⋮ icon] |
| Avatar | 36×36px circle, online dot 10px bottom-right |
| Name | `text-primary`, 14px, weight 600 |
| Meta line (Student·Campus·date) | `text-secondary`, 12px, directly below name, 2px gap |
| "⋮" icon | 20×20px tap target, `text-tertiary` |
| Media block | Full card width, **fixed 4:5 aspect ratio** (portrait, consistent across all posts — this is the fix for "raw uploaded image" inconsistency), `object-fit: cover`, no border-radius (flush edge to edge inside card, header/footer have the radius) |
| "Showcase" tag overlay | Positioned 12px from bottom-left of image, black 55% opacity pill bg, white text 12px |
| Actions row | Padding 12px 16px, horizontal flex, gap 16px between icons |
| Like icon + count | Icon 22px + 4px gap + count text 13px `text-secondary` |
| Share icon | 22px, standalone |
| Caption row | Padding 4px 16px 16px, `line-height: 1.5` |
| Caption author (inline bold) | `text-primary` weight 700, 14px |
| Caption text (inline regular) | `text-primary` weight 400, 14px, 6px gap after author name before text starts |

---

## Card Type 3: Profile Header Card

```
┌─────────────────────────────────────────────────┐
│                                                   │
│                  ┌───────┐                       │
│                  │ 🟣ring │  ← 96px avatar        │
│                  └───────┘                       │
│                                                   │
│                Chirag                            │
│           @SAMPLE12   ✓ VERIFIED HOST             │
│                                                   │
│         2nd Year · General                       │
│         GLA University, Mathura                  │
│                                                   │
│      No bio yet — tap Edit Profile to add one.   │
│                                                   │
│  ┌───────────────────────────────────────────┐  │
│  │            EDIT PROFILE                    │  │  ← 48px button
│  └───────────────────────────────────────────┘  │
│  ┌──────────────────────┐ ┌────┐ ┌────┐          │
│  │   PUBLIC VIEW         │ │ QR │ │ ↗  │          │  ← 44px row
│  └──────────────────────┘ └────┘ └────┘          │
└─────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Card outer | `bg-surface`, `border-hairline`, `border-radius: 20px`, padding 24px |
| Layout | Vertical flex, `align-items: center`, all text centered |
| Avatar | 96×96px circle, `accent` ring 3px with 4px offset (ring doesn't touch photo directly — small gap for breathing room) |
| Avatar → Name gap | 16px |
| Name | `text-primary`, 22px, weight 700 |
| Name → handle row gap | 8px |
| Handle + badge row | Horizontal flex, gap 8px, centered, `flex-wrap: wrap` if needed on small screens |
| Handle pill | `bg-base`, `text-secondary`, 12px, padding 4px 10px, `border-radius: 999px` |
| Verified badge | `accent-tint-10` bg, `accent` text, checkmark icon 12px + 4px gap + text 12px, padding 4px 10px |
| Badge row → meta gap | 12px |
| Year/branch text | `text-secondary`, 14px |
| University text | `text-secondary`, 14px, directly below, 2px gap |
| Meta → bio gap | 16px |
| Bio/placeholder text | `text-tertiary`, 14px, italic if placeholder, max-width 90% of card for line wrapping |
| Bio → button gap | 20px |
| Edit Profile button | Full card width, height 48px, `accent` solid, `border-radius: 999px`, white 15px weight 600 text |
| Button → secondary row gap | 12px |
| Secondary action row | Horizontal flex, gap 8px, height 44px |
| Public View button | `flex: 1` (takes most width), outline style, icon + text, gap 6px |
| QR icon button | Fixed 44×44px square, `border-radius: 12px`, `bg-base`, centered icon |
| Share icon button | Fixed 44×44px square, same style as QR button |

### Sub-card: Signal Live Toggle Row
| Property | Value |
|---|---|
| Container | `bg-surface`, `border-hairline`, `border-radius: 14px`, padding 14px 16px, margin-top 16px from profile card |
| Layout | Horizontal flex: [icon] → 10px gap → [text column, flex:1] → [toggle] |
| Icon | 20px, `status-online` green, inside 32px circle `accent-tint-10`... *(note: keep icon bg neutral gray tint, not accent — this a status feature not brand feature)* → use `bg-base` circle instead |
| Label | `text-primary`, 14px weight 600 |
| Sublabel | `text-secondary`, 12px, 2px gap below label |
| Toggle switch | 44×24px, thumb 20px circle with 2px inset |

### Sub-card: Interests
| Property | Value |
|---|---|
| Container | `bg-surface`, `border-hairline`, `border-radius: 14px`, padding 16px, margin-top 12px |
| Header row | Horizontal flex, `justify-content: space-between`: [label "INTERESTS"] ↔ ["EDIT" link] |
| Tags container | `flex-wrap: wrap`, gap 8px, margin-top 12px |
| Individual tag | `accent-tint-10` bg, `accent` text, padding 6px 12px, `border-radius: 999px`, 13px weight 500 |

---

## Card Type 4: Discover — Person Card

```
┌───────────────────────────┐
│         ┌────┐             │
│         │ 🟣 │  ← 64px      │
│         └────┘             │
│      Ashutosh Pandey_09    │
│    [ Coding & Tech ]       │  ← max 2 tags
│                             │
│  ┌───────────────┐ ┌────┐  │
│  │     MEET      │ │ 💬 │  │  ← removed per spec, see note
│  └───────────────┘ └────┘  │
└───────────────────────────┘
```

| Property | Value |
|---|---|
| Card outer | `bg-surface`, `border-hairline`, `border-radius: 16px`, padding 20px |
| Grid | 2 columns desktop, 16px gap both axes |
| Layout | Vertical flex, `align-items: center`, centered text |
| Avatar | 64×64px circle, `accent-tint-20` ring 2px (lighter ring — reserve full `accent` ring for verified users only) |
| Avatar → name gap | 12px |
| Name | `text-primary`, 16px weight 700, centered, single line with ellipsis if long |
| Name → tags gap | 8px |
| Tags row | Horizontal flex, centered, `flex-wrap: wrap`, gap 6px, **max 2 tags** |
| Individual tag | `accent-tint-10` bg, `accent` text, 12px, padding 4px 10px |
| Tags → button gap | 16px |
| Button row | Full width, horizontal flex, gap 8px |
| MEET button | `flex: 1`, height 44px, `accent` solid, `border-radius: 999px`, white text 14px weight 600 |
| Chat icon button | *(Removed from card per audit — chat access moves to full profile view when card is tapped, reducing this to single clear action)* |

---

## Card Type 5: Sidebar Nav Item (Desktop)

```
 ┌─────────────────────────┐
 │  🏠   Home                │  ← 44px height
 └─────────────────────────┘
```

| Property | Value |
|---|---|
| Item height | 44px |
| Padding | 10px 12px |
| Layout | Horizontal flex, `align-items: center`, gap 12px |
| Icon | 20×20px |
| Label | 14px weight 500 |
| Active state bg | `accent-tint-10`, `border-radius: 10px` |
| Active state icon+text | `accent` |
| Inactive state | transparent bg, `text-secondary` icon+text |
| Hover (inactive) | `bg-base` background |
| Item → item vertical gap | 4px |

---

## Card Type 6: Promotional Banner (Host Workspace / Campus Spotlight)

```
┌─────────────────────────────────────────────────┐
│  🛡  Host Workspace  [HOST]      ┌───────────┐   │
│      Community & moderation      │ OPEN HUB  │   │
│      tools                       └───────────┘   │
└─────────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Container | `accent` solid fill, `border-radius: 16px`, padding 16px 20px |
| Layout | Horizontal flex, `justify-content: space-between`, `align-items: center` |
| Left group | Horizontal flex: [icon 32px in white 15%-opacity circle] → 12px gap → [text column] |
| Title row | Horizontal flex, gap 8px: [title text] + [inline "HOST" tag] |
| Title | White, 15px weight 700 |
| Inline tag | White bg, `accent` text, 10px, padding 2px 8px, `border-radius: 999px` |
| Subtitle | White 80% opacity, 13px, margin-top 2px |
| CTA button | White solid bg, `accent` text, height 36px, padding 0 16px, `border-radius: 999px`, weight 600 13px |
| **Rule** | Only 1 of these banners visible per screen at any time (see audit report) |

---

## Spacing Scale Reference (Use Everywhere, No Custom Values)

| Token | Value | Use for |
|---|---|---|
| `space-1` | 4px | Icon-to-text micro gaps |
| `space-2` | 8px | Tag gaps, tight groupings |
| `space-3` | 12px | Avatar-to-text, small card padding |
| `space-4` | 16px | Standard card padding, section gaps |
| `space-5` | 20px | Card internal padding (larger cards) |
| `space-6` | 24px | Profile card padding, major section breaks |
| `space-8` | 32px | Page-level section separation |

## Border Radius Scale

| Token | Value | Use for |
|---|---|---|
| `radius-sm` | 10px | Nav items, small buttons |
| `radius-md` | 14px | Sub-cards (toggle row, interests box) |
| `radius-lg` | 16px | Standard cards (post, person card, banner) |
| `radius-xl` | 20px | Profile header card |
| `radius-full` | 999px | Pills, tags, primary buttons, avatars |

---

*Har card ka structure ab color spec ke saath fully locked hai. Agar chaho to next step: mai in dono specs (color + layout) ko combine karke ek actual rendered artifact (Chat List ya Profile card) bana sakta hoon — real visual proof ke liye, code apply karne se pehle.*
