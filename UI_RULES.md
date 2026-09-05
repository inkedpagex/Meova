# Meova UI / UX Master Design System & Rules (`UI_RULES.md`)

> **CRITICAL RULE**: Every developer and AI assistant working on the Meova codebase MUST strictly follow these rules for every UI component, page, modal, button, and API integration. No exceptions.

---

## 1. 🚫 THE STRICT ZERO-GREY POLICY (NEVER USE GREY)

Dull, washed-out, or faded grey makes interfaces look unfinished, cloudy, and low-contrast. 

### ❌ FORBIDDEN:
- **NO GREY TEXT**: Do NOT use `text-zinc-400`, `text-zinc-500`, `text-neutral-400`, `text-gray-400`, `text-gray-500`, `#666`, `#888`, `#999`, `#aaa`.
- **NO GREY BACKGROUNDS**: Do NOT use `bg-zinc-100`, `bg-zinc-200`, `bg-neutral-100`, `bg-neutral-200`, `bg-gray-100`, `#f0f0f0`, `#eaeaea`.
- **NO MURKY GREY BORDERS**: Do NOT use `border-zinc-200`, `border-neutral-200`, `border-gray-200`, `#e5e5e5`.

### ✅ APPROVED HIGH-CONTRAST PALETTE:
| Element | Class / Color Code | Purpose |
| :--- | :--- | :--- |
| **Card & Canvas Background** | `bg-white` (`#ffffff`) | Clean, crisp, high-contrast surface. |
| **Primary Headings & Text** | `text-black` (`#000000`) with `font-black` or `font-bold` | Strong readability, bold streetwear hierarchy. |
| **Secondary & Metadata Text** | `text-black/70` or `text-black/65` with `font-bold` | Clear, legible dark text — never faded grey. |
| **Meova Signature Accent** | `#7C3AED` (`bg-[#7C3AED]`, `text-[#7C3AED]`, `bg-[var(--accent)]`) | Primary CTAs, active highlights, Sparks balances. |
| **Hairline Subtle Borders** | `border border-black/10` or `border border-black/5` | Clean micro-hairline separation without heavy frames. |
| **Brand Tinted Surfaces** | `bg-orange-50` with `border-orange-200` | Secondary buttons, subtle info chips, active states. |
| **High-Contrast Buttons** | `bg-black text-white hover:bg-black/90` or `bg-[#7C3AED] text-white` | Tactile, confident action buttons. |

---

## 2. 🔗 MANDATORY BACKEND CONNECTIVITY & AUTOMATED SCRIPT VERIFICATION (NEVER BUILD "JUST UI")

Never build frontend buttons, modals, or forms that only have superficial UI without real backend connectivity. Every interactive feature MUST be backed by real database tables and verified with live test scripts.

### 📋 The 5 Verification Laws:
1. **Trace to Real Supabase Table**:
   - Every action (booking, blocking, deleting, joining, payments, wallets, review) MUST map to a real Supabase database table (`profiles`, `posts`, `audit_logs`, `circles`, `bookings`, `wallets`, `payment_requests`, `transactions`, `chats`).
   - Never use fake mock arrays or hardcoded success toasts when modifying real state.
2. **End-to-End API Route Wiring**:
   - The UI action must trigger a real Next.js API route (`/api/...`).
   - The API route must use `supabaseAdmin` or authenticated supabase client with proper RLS and session authentication checks (`requireHostOrAdmin`, `requireUser`).
3. **Mandatory Automated Test Script Execution**:
   - **MANDATORY SCRIPT RULE**: Whenever ANY new function, database query, API route, or backend logic is created or modified:
     - You MUST proactively create and run an automated Node.js test script using the terminal.
     - The script MUST connect directly to live Supabase, execute the function/query, and check:
       1. Do the queried table columns actually exist in the database? (e.g. verify `photo_url` vs `avatar_url`, verify column names before writing queries).
       2. Does the function actually insert, update, or return the expected live data?
       3. Does it catch errors properly without breaking runtime?
     - Never assume code works just because TypeScript or Next.js builds. Live script output with Exit Code 0 and real Supabase row data is mandatory proof of completion.
4. **Test Both Success and Failure States**:
   - Verify success payloads (`status: 200/201`) as well as edge cases (unauthorized 401/403, invalid payload 400).
5. **Zero Silent Failures**:
   - Always wrap API calls with try/catch.
   - Show meaningful, user-facing error feedback using `toast.error(err.message)` instead of silent failures or empty loading states.

---

## 3. 🚫 GIGS EXCLUSION POLICY

- **Gigs are completely disabled and removed** from the user-facing app.
- **NEVER** add "Gigs", "Post a Gig", or gigs cards/tabs to:
  - Feed tabs (`app/FeedClient.jsx`)
  - Bottom `+` Create Modal (`components/CreateMenuModal.jsx`)
  - User profile page (`app/profile/ProfileClient.jsx`)
  - Main navigation bars or drawers.
- The platform is strictly focused on **Campus Moments**, **1-on-1 Student Meetups (Sparks)**, and **Student Circles**.

---

## 4. 🚫 NO INFORMAL EMOJIS IN THE UI

- **Do NOT use unicode emojis** (e.g. 🚀, ⚡, 🎟️, 🔥, 📅, 📍) in system UI, cards, status badges, buttons, or headers.
- **ALWAYS use clean vector SVGs** from `lucide-react` or `@/lib/icons` (e.g. `<Zap size={14} />`, `<Calendar size={14} />`, `<MapPin size={14} />`, `<ArrowUpRight size={14} />`).

---

## 5. 📐 GEOMETRY, SIZING & BORDER RADIUS

Meova uses a signature rounded streetwear aesthetic:

| Component Type | Approved Radii | Example Tailwind Classes |
| :--- | :--- | :--- |
| **Standard Cards** | `26px` to `28px` | `bg-white border border-black/10 rounded-[28px] p-4 sm:p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)]` |
| **Modals & Drawers** | `32px` | `bg-white rounded-t-[32px] md:rounded-[32px] border border-black/10 shadow-2xl` |
| **Primary Buttons (Pills)** | `rounded-full` | `px-4 py-2.5 rounded-full text-xs font-black bg-black text-white active:scale-95 transition-all` |
| **Tactile Buttons / Inputs** | `rounded-xl` to `rounded-2xl` | `rounded-2xl border border-black/10 text-xs font-bold` |
| **Avatars & Category Squircles** | `rounded-[14px]` or `rounded-full` | `w-10 h-10 rounded-[14px] overflow-hidden border border-black/10` |
| **Custom Dropdowns** | `rounded-2xl` | Use `components/CustomSelect.jsx` — never native browser `<select>` |

---

## 6. 🔤 TYPOGRAPHY (MANDATORY INTER 100%)
- **Inter** is the exclusive, platform-wide font family across all 77+ pages, headings, cards, buttons, badges, and modals.
- Never use or import other fonts like Roboto, Arial, Outfit, or Poppins.
- Micro-numbers and timestamps should use `tabular-nums` for rock-solid visual stability.
- Tracking: Use `tracking-tight` or `-0.025em` on bold titles and buttons for a crisp, compact streetwear aesthetic.

---

## 7. 📱 MOBILE-FIRST RESPONSIVENESS RULES

1. **NO 2-LINE TEXT WRAPPING ON BUTTONS**:
   - Header action buttons and chips must ALWAYS include `whitespace-nowrap`, `flex-shrink-0`, and `cursor-pointer`.
   - Never let a button wrap text onto two lines (e.g. `"My"` on line 1 and `"Profile"` on line 2).
2. **CLEAN CONTAINER OVERFLOW**:
   - Always use `truncate` or `line-clamp-1` on names, locations, and descriptions.
   - Use `min-w-0` on flex children to prevent horizontal scroll blowouts.
3. **IMAGE FALLBACKS**:
   - Every `<img>` tag must include an `onError` handler falling back to `getCartoonAvatar`:
     ```jsx
     onError={(e) => {
       e.currentTarget.onerror = null;
       e.currentTarget.src = getCartoonAvatar(userName || 'Student');
     }}
     ```

---

## 7. ✨ SHADOWS & MICRO-INTERACTIONS

- **Hover & Active States**:
  - All interactive buttons must have tactile feedback: `active:scale-95` or `active:scale-[0.98]`.
  - Transitions should be snappy: `transition-all duration-200`.
- **Shadows**:
  - Murky dark drop shadows (`rgba(0,0,0,0.15)`) are forbidden.
  - Use soft diffuse ambient elevation: `shadow-[0_4px_25px_rgba(0,0,0,0.03)]` or `shadow-2xs` / `shadow-xs`.

---

## 8. 🧪 QUALITY & VERIFICATION CHECKLIST (MANDATORY BEFORE SIGN-OFF)
- [ ] **Zero Grey:** No `zinc-400`, `zinc-500`, `neutral-400`, `gray-400`, `bg-zinc-100`, `#f0f0f0`.
- [ ] **Real Backend Connected:** Action connects to a verified API route and Supabase database table.
- [ ] **Runtime Tested:** Tested the live route / database schema to confirm 100% correct execution with zero errors.
- [ ] **No Raw `<select>`:** Custom dropdowns use `components/CustomSelect.jsx`.
- [ ] **No Emojis:** Only clean vector SVGs used in UI.
- [ ] **Gigs Permanently Excluded:** Zero gigs references in feed, modal, or profile.
- [ ] **Zero Text Wrapping on Mobile:** `whitespace-nowrap` on all interactive buttons.
- [ ] **Build Verification:** `npm run build` compiles 100% clean with 0 errors.
