---
name: campus-app-architecture
description: Use this skill whenever writing, adding, refactoring, or reviewing code for the campus community app (Next.js App Router + Tailwind + Supabase). Trigger this for ANY new feature (auth, profiles, circles, events, sparks/badges, gigs, gaming, etc.), any bug fix, or any file creation in this project. It defines the mandatory folder structure, Server/Client Component boundaries, file-naming rules, and separation-of-concerns rules so that every feature stays independent and debugging never requires reading unrelated code. Always check this skill before creating or editing any file in this project.
---

# Campus App Architecture Rules (Next.js App Router)

This skill defines how code MUST be organized in this project. The goal: if
something breaks in one feature, only that feature's folder needs to be
opened to debug it — never any other feature's code.

Apply these rules to every new feature (Sparks, Badges, Gigs, Gaming, etc.)
and refactor existing code into this shape if it doesn't already match.

## Folder structure

```
app/
  (routes)/
    page.jsx             → Home feed route. Imports from features/, 
                            arranges layout only. No business logic.
    circles/
      page.jsx            → Circles list route
      [id]/page.jsx        → Circle detail route
    events/[id]/page.jsx
    profile/page.jsx
    login/page.jsx
    signup/page.jsx
  api/
    sparks/route.js        → Route Handlers only for logic that must run 
                              server-side (e.g. awarding points, badge 
                              checks). One route file per action.
    rsvp/route.js
  layout.jsx                → Root layout + bottom nav only

features/
  auth/
    auth.api.js             → Supabase calls for auth (server + client safe)
    AuthForm.jsx             → Client Component, UI only
    useAuth.js                → hook connecting Client UI to auth.api.js
    constants.js              → table/column name constants for this feature
  profile/
    profile.api.js
    ProfilePage.jsx
    useProfile.js
    constants.js
  circles/
    circles.api.js
    CirclesList.jsx           → Server Component (data display)
    CircleJoinButton.jsx       → Client Component (interactive only)
    useCircles.js
    constants.js
  events/
    events.api.js
    EventCard.jsx              → Server Component
    RsvpButton.jsx              → Client Component
    useEvents.js
    constants.js
  sparks/                    → every new feature gets its own folder, 
                                same shape
    sparks.api.js
    useSparks.js
    constants.js

lib/
  supabaseServerClient.js    → the ONLY file that creates the Supabase 
                                client for Server Components/Route Handlers
  supabaseBrowserClient.js   → the ONLY file that creates the Supabase 
                                client for Client Components
                                (both use @supabase/ssr — never create 
                                a client anywhere else)

components/                 → only reusable, generic UI pieces (Button, 
                               Card, Avatar, Badge, Modal). No business 
                               logic, no API/Supabase calls here.

utils/                      → pure helper functions only (date formatting, 
                               validation). No API calls, no React, no state.
```

## Hard rules

1. **One feature = one folder** inside `features/`. A feature's code never
   directly imports another feature's internal files. If Circles needs data
   owned by Sparks, it calls a clearly named exported function from
   `features/sparks/sparks.api.js` — never reaches into its internals.

2. **Server vs Client boundary is explicit and minimal.**
   - Default to **Server Components** for anything that only reads/displays
     data (lists, cards, profile view).
   - Mark a component `"use client"` ONLY when it needs interactivity
     (buttons, forms, local state) — and keep that Client Component as
     small as possible (e.g. just `RsvpButton.jsx`, not the whole
     `EventCard.jsx`).
   - Any Supabase write that has side effects other systems depend on
     (awarding sparks, badge checks) goes through an `app/api/.../route.js`
     Route Handler, not directly from a Client Component.

3. **Strict layering inside every feature folder:**
   - `*.api.js` → only talks to Supabase. No UI, no React.
   - `*.jsx` (Server) → only renders UI from server-fetched data.
   - `*.jsx` (Client, `"use client"`) → only handles interactivity, calls
     the matching `use[Feature].js` hook or a Route Handler — never calls
     Supabase directly for writes that other features depend on.
   - `use[Feature].js` → the only bridge between Client UI and API layer.

4. **One job per function.** If a function does more than one thing (e.g.
   "join circle AND award sparks AND check badge"), split it into separate
   functions called in sequence — never one blob function.

5. **Descriptive file names only.** No `utils.js`, `helpers.js`, `main.js`
   for logic files (Next.js requires `page.jsx`/`route.js` for routing —
   that's the one exception). The filename alone should tell you what's
   inside without opening it.

6. **Self-documenting file headers.** Every file starts with a one-line
   comment stating its single purpose, e.g.:
   ```js
   // Handles all Supabase read/write calls for the Circles feature.
   // No UI or state logic here.
   ```

7. **Keep files under ~150 lines.** If a file grows past that, split it
   (e.g. `circles.api.js` → `circles.api.js` + `circles.queries.js`).

8. **No duplicated table/column names.** Define Supabase table and column
   names once as constants in each feature's `constants.js` and import them
   everywhere — never hardcode the same string in multiple files.

9. **Pluggable features.** A new feature (Sparks, Badges, Gigs, Gaming)
   must be addable or removable by touching only its own `features/` folder
   plus one small edit in `app/` routing or the shared nav — no other
   feature folder should need to change.

## Before writing any new feature

- Confirm the feature's folder follows this exact shape
  (`*.api.js`, Server `.jsx`, Client `.jsx` where needed, `use[Feature].js`,
  `constants.js`).
- Decide up front which parts are Server Components vs Client Components
  before writing any code — state this explicitly.
- If refactoring existing code into this structure, do that first, in a
  separate step, before adding new logic.

## Goal check

Before considering a feature "done," verify: could a bug in this feature
be fully debugged by only opening its own `features/` folder (plus its
one `app/` route file) — without reading `auth/`, `events/`, or any other
feature's code? If not, the layering has leaked and needs to be fixed
before moving on.