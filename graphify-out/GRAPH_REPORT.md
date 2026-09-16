# Graph Report - Meova  (2026-09-15)

## Corpus Check
- 328 files · ~278,160 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1383 nodes · 3628 edges · 102 communities (74 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f78a3240`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getUserAdmin
- getAdminUser.js
- requireAuth
- admin.js
- rateLimit
- getUserWithRole
- app/layout.js
- MarketingHome.jsx
- icons.jsx
- Loader2
- sendPush
- getCartoonAvatar
- wallet.js
- ProfileClient.jsx
- creditSparks
- paymentReservations.js
- ProfileEditForm.jsx
- dependencies
- 🏛️ Meova Platform Features & System Registry
- InstagramEmbed.jsx
- gigs/page.js
- compilerOptions
- DiscoverClient.jsx
- slide-button.tsx
- package.json
- VoiceCallModal.jsx
- users/[id]/page.js
- manifest.json
- ambassador/page.jsx
- FeedClient.jsx
- PostMediaGallery.jsx
- UI Rules — "Pulse" Social Media App
- messages/page.jsx
- BlogClient.jsx
- gigs/route.js
- circles/[id]/page.js
- ShieldCheck
- recommendationEngine.js
- devDependencies
- Meova UI / UX Master Design System & Rules (`UI_RULES.md`)
- audit-colors.mjs
- test-middleware.mjs
- AdminClient.jsx
- next.config.mjs
- scripts
- update-sw-version.js
- logout/route.js
- profile.actions.js
- audit-prompt-purple.mjs
- Clock
- AdminUsersPage
- ArrowLeft
- wallet/page.js
- events/constants.js
- check-icons.mjs
- verify-remixicon-classes.mjs
- index.ts
- CustomSelect.jsx
- sync/route.js
- bookings/layout.js
- circles/page.js
- gigs/layout.js
- gla-university/page.js
- useAuth
- RefreshCw
- middleware.js
- verify-theme-default.mjs
- session/route.js
- eslint.config.mjs
- lib/constants.js
- postcss.config.mjs
- sw.js
- inspect-file.mjs
- vercel.json
- test-pwa-standalone-routing.mjs
- Page Layout Spec — Mobile + Desktop (All Screens)
- supabaseQueries.js
- Card Layout + Structure Spec — "M" Campus App
- 💡 Isse Kya Hoga? (Key Benefits & Solutions)
- events/page.js
- Complete Element-Level Color Spec — "M" Campus App
- UI/UX Design Rules
- test-notification-test-feature.js
- events.actions.js
- campaigns/page.js
- Campus App Architecture Rules (Next.js App Router)
- react
- README.md
- AGENTS.md
- @supabase/ssr
- rules/graphify.md
- workflows/graphify.md
- utils.ts
- overrides
- @supabase/supabase-js
- test-posts-comments.js

## God Nodes (most connected - your core abstractions)
1. `requireAuth()` - 124 edges
2. `react` - 104 edges
3. `supabaseAdmin` - 102 edges
4. `requireAdmin()` - 58 edges
5. `Loader2` - 40 edges
6. `rateLimit()` - 37 edges
7. `X` - 36 edges
8. `getCartoonAvatar()` - 35 edges
9. `useUserContext()` - 32 edges
10. `Sparkles` - 31 edges

## Surprising Connections (you probably didn't know these)
- `GET()` --calls--> `requireAdmin()`  [EXTRACTED]
  app/api/admin/verifications/route.js → lib/getAdminUser.js
- `GET()` --calls--> `getUserWithRole()`  [EXTRACTED]
  app/api/auth/session/route.js → lib/getAdminUser.js
- `GET()` --calls--> `requireAuth()`  [EXTRACTED]
  app/api/bookings/route.js → lib/getAdminUser.js
- `GET()` --calls--> `requireAuth()`  [EXTRACTED]
  app/api/chats/[id]/messages/route.js → lib/getAdminUser.js
- `GET()` --calls--> `requireAuth()`  [EXTRACTED]
  app/api/chats/route.js → lib/getAdminUser.js

## Import Cycles
- None detected.

## Communities (102 total, 22 thin omitted)

### Community 0 - "getUserAdmin"
Cohesion: 0.24
Nodes (9): SinglePostPage(), dynamic, metadata, ProfilePage(), CircleJoinButton(), joinCircleAction(), leaveCircleAction(), getUserAdmin() (+1 more)

### Community 1 - "getAdminUser.js"
Cohesion: 0.06
Nodes (37): AdminHeaderClient(), AdminCommunitiesPage(), metadata, PendingCommunitiesClient(), AdminLayout(), dynamic, AdminPage(), metadata (+29 more)

### Community 2 - "requireAuth"
Cohesion: 0.05
Nodes (32): POST(), GET(), GET(), POST(), dynamic, GET(), POST(), PATCH() (+24 more)

### Community 3 - "admin.js"
Cohesion: 0.09
Nodes (14): DEFAULT_GIGS, DEFAULT_MOCK_POSTS, POST(), GET(), POST(), GET(), requireAmbassador(), POST() (+6 more)

### Community 4 - "rateLimit"
Cohesion: 0.10
Nodes (31): dynamic, POST(), POST(), dynamic, GET(), PATCH(), POST(), dynamic (+23 more)

### Community 5 - "getUserWithRole"
Cohesion: 0.12
Nodes (16): dynamic, LoginPage(), metadata, dynamic, metadata, OnboardingPage(), dynamic, HomePage() (+8 more)

### Community 6 - "app/layout.js"
Cohesion: 0.08
Nodes (29): BlockedPage(), metadata, inter, metadata, viewport, FCMInitializer(), GenderPromptModal(), GoogleAuthProviderWrapper() (+21 more)

### Community 7 - "MarketingHome.jsx"
Cohesion: 0.19
Nodes (12): CollegePage(), dynamic, generateMetadata(), MarketingHome(), createProfileAdmin(), COLLEGE_ALIASES, getCollegeBySlug(), slugifyCollege() (+4 more)

### Community 8 - "icons.jsx"
Cohesion: 0.05
Nodes (40): PWAInstallBanner(), PWAInstallModal(), Activity, Apple, ArrowDown, ArrowUp, BarChart2, Bookmark (+32 more)

### Community 9 - "Loader2"
Cohesion: 0.11
Nodes (14): REJECTION_REASONS, INQUIRY_CATEGORIES, LIMITS, BuyPage(), PACKS, WithdrawPage(), AlertCircle, ArrowUpRight (+6 more)

### Community 10 - "sendPush"
Cohesion: 0.13
Nodes (16): POST(), GET(), POST(), GET(), PATCH(), isCircularPair(), POST(), POST() (+8 more)

### Community 11 - "getCartoonAvatar"
Cohesion: 0.17
Nodes (15): NotifIcon(), PostDetailView(), timeAgo(), getAvatar(), INTEREST_META, ProfileHighlightsSection(), Sidebar(), HostCircleDashboardModal() (+7 more)

### Community 12 - "wallet.js"
Cohesion: 0.10
Nodes (30): POST(), GET(), POST(), GET(), GET(), GET(), sanitizeText(), approveWithdrawal() (+22 more)

### Community 13 - "ProfileClient.jsx"
Cohesion: 0.16
Nodes (11): ProfileClient(), AvatarZoomModal(), CampusMomentsGallery(), VerificationModal(), ZoomableProfileAvatar(), Camera, ChevronLeft, ChevronRight (+3 more)

### Community 14 - "creditSparks"
Cohesion: 0.13
Nodes (17): GET(), POST(), GET(), PATCH(), POST(), GET(), POST(), POST() (+9 more)

### Community 15 - "paymentReservations.js"
Cohesion: 0.29
Nodes (11): GET(), POST(), GET(), ADMIN_UPI_ID, approvePaymentReservation(), autoExpireStaleReservations(), checkReservationTable(), checkUserReservationLimits() (+3 more)

### Community 16 - "ProfileEditForm.jsx"
Cohesion: 0.08
Nodes (29): INITIAL, OnboardingClient(), slideVariants, INTEREST_TAGS, Step1(), StepBar(), YEARS, BRANCHES (+21 more)

### Community 17 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, browser-image-compression, canvas-confetti, @capacitor/core, @capacitor/push-notifications, class-variance-authority, clsx, @ducanh2912/next-pwa (+17 more)

### Community 18 - "🏛️ Meova Platform Features & System Registry"
Cohesion: 0.11
Nodes (18): 1. Architecture & Engineering Philosophy, How AI & Developers Maintain This Registry, 🏛️ Meova Platform Features & System Registry, Module 10: Campus Ambassador System, Module 11: Host Workspace & Moderation, Module 12: Admin Dashboard & Control Room, Module 13: Progressive Web App (PWA), Web Push & Offline Mode, Module 14: Legal, Compliance & Universal Branding (+10 more)

### Community 19 - "InstagramEmbed.jsx"
Cohesion: 0.50
Nodes (3): DUMMY_WORDS, InstagramEmbed(), isValidInstagram()

### Community 20 - "gigs/page.js"
Cohesion: 0.11
Nodes (20): ApplicantsDrawer(), fetcher(), fetcher(), MyGigsActivity(), STATUS_STYLE, CampusGigsPage(), CATEGORIES, fetcher() (+12 more)

### Community 21 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+11 more)

### Community 22 - "DiscoverClient.jsx"
Cohesion: 0.15
Nodes (12): DiscoverClient(), fetcher(), FILTERS, useAlgoliaSearch(), metadata, BookCoffeeButton(), Layers, ShakeHands (+4 more)

### Community 23 - "slide-button.tsx"
Cohesion: 0.19
Nodes (13): Button, ButtonProps, buttonVariants, ANIMATION_CONFIG, BUTTON_STATES, DRAG_CONSTRAINTS, SlideButton, SlideButtonProps (+5 more)

### Community 24 - "package.json"
Cohesion: 0.11
Nodes (17): name, private, version, canvas-confetti, eslint, eslint-config-next, next, pg (+9 more)

### Community 25 - "VoiceCallModal.jsx"
Cohesion: 0.19
Nodes (17): AUDIO_CONSTRAINTS, ICE_SERVERS, VoiceCallModal(), Maximize2, MicOff, Minimize2, PhoneHangup(), PhoneOff() (+9 more)

### Community 26 - "users/[id]/page.js"
Cohesion: 0.21
Nodes (12): GET(), avatarUrl(), generateMetadata(), UserProfilePage(), AcceptBookingButton(), BlockUserButton(), Dumbbell, fetchJoinedCirclesAdmin() (+4 more)

### Community 27 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, icons, id, lang, name (+7 more)

### Community 28 - "ambassador/page.jsx"
Cohesion: 0.13
Nodes (13): ADMIN_TABS, FAQS, FIELD_LIMITS, PERKS, STEPS, Building2, CreditCard, Instagram (+5 more)

### Community 29 - "FeedClient.jsx"
Cohesion: 0.12
Nodes (27): ROLES, FeedClient(), fetcher(), getPostsKey(), HostDashboardClient(), PostCardClient(), HostBadge(), MessagePillButton() (+19 more)

### Community 30 - "PostMediaGallery.jsx"
Cohesion: 0.32
Nodes (12): GallerySlide(), PostMediaGallery(), PostGridThumbnail(), Image, Play, VolumeX, getCloudinaryLqipUrl(), getCloudinaryVideoThumbnail() (+4 more)

### Community 31 - "UI Rules — "Pulse" Social Media App"
Cohesion: 0.13
Nodes (14): 1. Core Principles, 2. Color Palette, 3. Typography, 4. Spacing & Layout Grid, 5. Components, 6. Content Layout Rules, 7. Motion & Interaction, 8. What to Avoid (Explicit Anti-Patterns) (+6 more)

### Community 32 - "messages/page.jsx"
Cohesion: 0.09
Nodes (29): BookingsPage(), fetcher(), normalizeBooking(), avatarUrl(), ChatListItem(), fetcher(), formatTime(), mergeMessageIntoList() (+21 more)

### Community 33 - "BlogClient.jsx"
Cohesion: 0.12
Nodes (14): metadata, BlogClient(), POSTS, metadata, metadata, metadata, LegalFooter(), ArrowRight (+6 more)

### Community 34 - "gigs/route.js"
Cohesion: 0.22
Nodes (12): dynamic, GET(), POST(), dynamic, GET(), dynamic, GET(), POST() (+4 more)

### Community 35 - "circles/[id]/page.js"
Cohesion: 0.39
Nodes (7): CircleDetailPage(), generateMetadata(), CircleAvatar(), fetchCircleDetailAdmin(), fetchCircleEventsAdmin(), fetchCircleMembersAdmin(), formatEventDate()

### Community 36 - "ShieldCheck"
Cohesion: 0.13
Nodes (14): CATEGORY_COLORS, CATEGORY_ICONS, CirclesList(), EMPTY_SET, FILTERS, OFFICIAL_CAMPUS_CIRCLES, Code2, Gamepad2 (+6 more)

### Community 37 - "recommendationEngine.js"
Cohesion: 0.53
Nodes (4): calculateActivityScore(), calculateAffinityScore(), normalizeInterests(), rankPeersForUser()

### Community 38 - "devDependencies"
Cohesion: 0.22
Nodes (9): devDependencies, eslint, eslint-config-next, pg, tailwindcss, @tailwindcss/postcss, @types/node, @types/react (+1 more)

### Community 39 - "Meova UI / UX Master Design System & Rules (`UI_RULES.md`)"
Cohesion: 0.13
Nodes (14): 1. 🚫 THE STRICT ZERO-GREY POLICY (NEVER USE GREY), 2. 🔗 MANDATORY BACKEND CONNECTIVITY & AUTOMATED SCRIPT VERIFICATION (NEVER BUILD "JUST UI"), 3. 🚫 GIGS EXCLUSION POLICY, 4. 🚫 NO INFORMAL EMOJIS IN THE UI, 5. 📐 GEOMETRY, SIZING & BORDER RADIUS, 6. 🔤 TYPOGRAPHY (MANDATORY INTER 100%), 7. 📱 MOBILE-FIRST RESPONSIVENESS RULES, 7. ✨ SHADOWS & MICRO-INTERACTIONS (+6 more)

### Community 40 - "audit-colors.mjs"
Cohesion: 0.29
Nodes (5): bwPercent, exts, perFilePurple, purplePercent, searchDirs

### Community 41 - "test-middleware.mjs"
Cohesion: 0.29
Nodes (5): ./_temp_middleware_test.mjs, code, middlewarePath, tempTestPath, tests

### Community 42 - "AdminClient.jsx"
Cohesion: 0.47
Nodes (5): AdminClient(), fmt(), fmtDate(), AlertOctagon, Inbox

### Community 43 - "next.config.mjs"
Cohesion: 0.33
Nodes (4): nextConfig, securityHeaders, withPWA, @ducanh2912/next-pwa

### Community 44 - "scripts"
Cohesion: 0.33
Nodes (6): scripts, build, dev, lint, prebuild, start

### Community 45 - "update-sw-version.js"
Cohesion: 0.33
Nodes (5): content, fs, path, swPath, timestamp

### Community 46 - "logout/route.js"
Cohesion: 0.60
Nodes (4): applyClearCookies(), COOKIES_TO_CLEAR, GET(), POST()

### Community 47 - "profile.actions.js"
Cohesion: 0.40
Nodes (4): INTEREST_TAGS, TABLE_CIRCLE_MEMBERS, TABLE_CIRCLES, TABLE_PROFILES

### Community 48 - "audit-prompt-purple.mjs"
Cohesion: 0.40
Nodes (3): exts, fileCounts, searchDirs

### Community 49 - "Clock"
Cohesion: 0.18
Nodes (6): AdminPaymentsPage(), fmtDate(), STATUS_STYLE, metadata, Clock, Wallet

### Community 51 - "ArrowLeft"
Cohesion: 0.16
Nodes (8): ContactForm(), metadata, metadata, metadata, ArrowLeft, Mail, MapPin, Scale

### Community 52 - "wallet/page.js"
Cohesion: 0.18
Nodes (9): FAQS, HelpCenterClient(), metadata, formatDate(), PACKS, WalletPage(), ChevronDown, ChevronUp (+1 more)

### Community 53 - "events/constants.js"
Cohesion: 0.50
Nodes (3): TABLE_CIRCLES, TABLE_EVENTS, TABLE_RSVPS

### Community 55 - "verify-remixicon-classes.mjs"
Cohesion: 0.50
Nodes (3): css, iconsJs, invalid

### Community 63 - "useAuth"
Cohesion: 0.30
Nodes (10): AdminAuthForm(), createSessionCookie(), logInUser(), logInWithGoogle(), logOutUser(), signUpUser(), LogoutButton(), useAuth() (+2 more)

### Community 64 - "RefreshCw"
Cohesion: 0.33
Nodes (4): NetworkWrapper(), Radio, RefreshCw, WifiOff

### Community 72 - "session/route.js"
Cohesion: 0.40
Nodes (4): checkRateLimit(), GET(), loginAttempts, POST()

### Community 80 - "test-pwa-standalone-routing.mjs"
Cohesion: 0.29
Nodes (5): ./_temp_pwa_test.mjs, code, middlewarePath, tempTestPath, tests

### Community 81 - "Page Layout Spec — Mobile + Desktop (All Screens)"
Cohesion: 0.14
Nodes (13): Breakpoint System, 🖥️ DESKTOP LAYOUTS, Desktop Screen 4: Discover, Desktop Screen 5: Home, Global Desktop Shell (applies to Discover, Home, and all desktop screens), Global Mobile Shell (applies to every mobile screen), 📱 MOBILE LAYOUTS, Mobile Screen 1: Chat List (+5 more)

### Community 82 - "supabaseQueries.js"
Cohesion: 0.23
Nodes (5): GET(), dynamic, GET(), fetchCirclesAdmin(), fetchPendingCirclesAdmin()

### Community 83 - "Card Layout + Structure Spec — "M" Campus App"
Cohesion: 0.17
Nodes (11): Border Radius Scale, Card Layout + Structure Spec — "M" Campus App, Card Type 1: Chat List Item, Card Type 2: Post / "Moment" Card, Card Type 3: Profile Header Card, Card Type 4: Discover — Person Card, Card Type 5: Sidebar Nav Item (Desktop), Card Type 6: Promotional Banner (Host Workspace / Campus Spotlight) (+3 more)

### Community 84 - "💡 Isse Kya Hoga? (Key Benefits & Solutions)"
Cohesion: 0.18
Nodes (10): 1. 🤝 Instant 1-on-1 Campus Meetups, 2. 📍 Real-Time Presence ("Free Now" Mode), 3. ⚡ Campus Micro-Gigs & Earning ("Earn Sparks"), 4. 👥 Campus Circles & Communities, 5. 🛡️ High-Trust & Safe Environment, 💡 Isse Kya Hoga? (Key Benefits & Solutions), 🚀 Main Problem Solved (Kaunsi Problem Solve Hoti Hai?), Meetify (Meetuply) — Campus Community & Networking Platform (+2 more)

### Community 85 - "events/page.js"
Cohesion: 0.15
Nodes (14): dynamic, GET(), CATEGORY_THEMES, dynamic, EventCard(), EventsPage(), getTheme(), metadata (+6 more)

### Community 86 - "Complete Element-Level Color Spec — "M" Campus App"
Cohesion: 0.22
Nodes (8): Complete Element-Level Color Spec — "M" Campus App, Final Palette (Locked), Global "Never Do This" List, SCREEN 1: Chat List (Mobile), SCREEN 2: Home Feed (Mobile), SCREEN 3: Profile, SCREEN 4: Discover (Desktop), SCREEN 5: Home (Desktop) — Deltas from Screen 4 (same sidebar/right panel rules apply)

### Community 87 - "UI/UX Design Rules"
Cohesion: 0.22
Nodes (8): 1. No Emojis, 2. Minimal Design, 3. Short, Context-Aware Text (Max 3-4 Words for Headings/Labels), 4. Single-Line Descriptions on Mobile (Max 1 Line), 5. Fully Mobile Responsive, 6. CRITICAL RULE — No Unwanted Line Breaks in Short UI Text, 7. Moderate Border Radius (No Excessive Rounding) & Clean Alignment, UI/UX Design Rules

### Community 88 - "test-notification-test-feature.js"
Cohesion: 0.25
Nodes (6): admin, anon, { createClient }, envPath, fs, path

### Community 89 - "events.actions.js"
Cohesion: 0.80
Nodes (3): cancelRsvpAction(), rsvpToEventAction(), RsvpButton()

### Community 90 - "campaigns/page.js"
Cohesion: 0.33
Nodes (4): AdminCampaignsPage(), fmtDate(), STATUS_STYLE, ExternalLink

### Community 91 - "Campus App Architecture Rules (Next.js App Router)"
Cohesion: 0.33
Nodes (5): Before writing any new feature, Campus App Architecture Rules (Next.js App Router), Folder structure, Goal check, Hard rules

### Community 92 - "react"
Cohesion: 0.13
Nodes (16): FILTERS, NotificationsPage(), timeAgo(), CreateMenuModal(), InAppNotificationBanner(), NOTIF_CONFIG, Logo(), AUTH_PATHS (+8 more)

### Community 93 - "README.md"
Cohesion: 0.40
Nodes (4): AI review test, Deploy on Vercel, Getting Started, Learn More

### Community 99 - "overrides"
Cohesion: 0.67
Nodes (3): jose, overrides, jwks-rsa

### Community 100 - "@supabase/supabase-js"
Cohesion: 0.10
Nodes (12): @supabase/supabase-js, { createClient }, env, envVars, fs, supabase, admin, anon (+4 more)

### Community 102 - "test-posts-comments.js"
Cohesion: 0.29
Nodes (5): { createClient }, env, envVars, fs, supabaseAdmin

## Knowledge Gaps
- **387 isolated node(s):** `metadata`, `ADMIN_TABS`, `STATUS_STYLE`, `metadata`, `dynamic` (+382 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 526 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `getUserAdmin`, `getAdminUser.js`, `getUserWithRole`, `app/layout.js`, `MarketingHome.jsx`, `icons.jsx`, `Loader2`, `getCartoonAvatar`, `ProfileClient.jsx`, `ProfileEditForm.jsx`, `InstagramEmbed.jsx`, `gigs/page.js`, `DiscoverClient.jsx`, `slide-button.tsx`, `package.json`, `VoiceCallModal.jsx`, `ambassador/page.jsx`, `FeedClient.jsx`, `PostMediaGallery.jsx`, `messages/page.jsx`, `BlogClient.jsx`, `ShieldCheck`, `AdminClient.jsx`, `Clock`, `wallet/page.js`, `CustomSelect.jsx`, `useAuth`, `RefreshCw`, `events.actions.js`, `campaigns/page.js`?**
  _High betweenness centrality (0.125) - this node is a cross-community bridge._
- **Why does `supabaseAdmin` connect `admin.js` to `getUserAdmin`, `getAdminUser.js`, `requireAuth`, `gigs/route.js`, `rateLimit`, `getUserWithRole`, `MarketingHome.jsx`, `sendPush`, `wallet.js`, `creditSparks`, `paymentReservations.js`, `profile.actions.js`, `supabaseQueries.js`, `events.actions.js`, `users/[id]/page.js`?**
  _High betweenness centrality (0.086) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `admin.js`, `test-posts-comments.js`, `MarketingHome.jsx`, `sendPush`, `package.json`, `test-notification-test-feature.js`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `metadata`, `ADMIN_TABS`, `STATUS_STYLE` to the rest of the system?**
  _387 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `getAdminUser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.061581920903954805 - nodes in this community are weakly interconnected._
- **Should `requireAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05454545454545454 - nodes in this community are weakly interconnected._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09230769230769231 - nodes in this community are weakly interconnected._