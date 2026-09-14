# Graph Report - Meova  (2026-09-15)

## Corpus Check
- 328 files · ~277,336 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1381 nodes · 3620 edges · 102 communities (71 shown, 25 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7a70aa5b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- getUserAdmin
- getAdminUser.js
- Sidebar.jsx
- admin.js
- requireAuth
- getUserWithRole
- app/layout.js
- getCollegeBySlug
- icons.jsx
- Loader2
- sendPush
- messages/page.jsx
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
- approve-withdrawal/route.js
- react
- CirclesList.jsx
- UI Rules — "Pulse" Social Media App
- useUserContext
- ambassador/page.jsx
- admin/feature-flags/route.js
- circles/[id]/page.js
- calculateMeetupRate
- users/route.js
- devDependencies
- Meova UI / UX Master Design System & Rules (`UI_RULES.md`)
- audit-colors.mjs
- test-middleware.mjs
- admin/page.js
- next.config.mjs
- scripts
- update-sw-version.js
- logout/route.js
- profile.actions.js
- audit-prompt-purple.mjs
- AdminPaymentsPage
- AdminUsersPage
- blog/page.jsx
- help/page.jsx
- events/constants.js
- check-icons.mjs
- verify-remixicon-classes.mjs
- index.ts
- bookings/page.js
- sync/route.js
- bookings/layout.js
- circles/page.js
- gigs/layout.js
- gla-university/page.js
- test-message-notifications.js
- BuyPage
- middleware.js
- verify-theme-default.mjs
- ThemeSelectorModal.jsx
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
- AdminCampaignsPage
- Campus App Architecture Rules (Next.js App Router)
- notifications/page.js
- README.md
- AGENTS.md
- rules/graphify.md
- workflows/graphify.md
- WithdrawPage
- useNativePush.js
- @supabase/supabase-js
- cancel_old_bookings.js
- test-posts-comments.js
- test-mobile-pwa-push-pipeline.mjs

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
- `AdminPage()` --calls--> `requireAdmin()`  [EXTRACTED]
  app/admin/page.js → lib/getAdminUser.js
- `POST()` --calls--> `requireAuth()`  [EXTRACTED]
  app/api/admin/circles/approve/route.js → lib/getAdminUser.js
- `GET()` --calls--> `requireAuth()`  [EXTRACTED]
  app/api/admin/circles/list/route.js → lib/getAdminUser.js
- `GET()` --calls--> `requireAdmin()`  [EXTRACTED]
  app/api/admin/verifications/route.js → lib/getAdminUser.js
- `GET()` --calls--> `requireAuth()`  [EXTRACTED]
  app/api/bookings/route.js → lib/getAdminUser.js

## Import Cycles
- None detected.

## Communities (102 total, 25 thin omitted)

### Community 0 - "getUserAdmin"
Cohesion: 0.18
Nodes (13): SinglePostPage(), PostCardClient(), dynamic, metadata, ProfilePage(), CircleJoinButton(), joinCircleAction(), leaveCircleAction() (+5 more)

### Community 1 - "getAdminUser.js"
Cohesion: 0.07
Nodes (34): AdminHeaderClient(), AdminCommunitiesPage(), metadata, PendingCommunitiesClient(), AdminLayout(), dynamic, generateReferralCode(), GET() (+26 more)

### Community 2 - "Sidebar.jsx"
Cohesion: 0.20
Nodes (9): CreateMenuModal(), Logo(), PWAInstallBanner(), AUTH_PATHS, Compass, LogIn, PanelLeft, PanelLeftClose (+1 more)

### Community 3 - "admin.js"
Cohesion: 0.04
Nodes (31): POST(), GET(), DEFAULT_GIGS, DEFAULT_MOCK_POSTS, POST(), GET(), POST(), GET() (+23 more)

### Community 4 - "requireAuth"
Cohesion: 0.08
Nodes (47): GET(), POST(), dynamic, GET(), POST(), GET(), POST(), DELETE() (+39 more)

### Community 5 - "getUserWithRole"
Cohesion: 0.05
Nodes (38): checkRateLimit(), GET(), loginAttempts, POST(), dynamic, LoginPage(), metadata, INITIAL (+30 more)

### Community 6 - "app/layout.js"
Cohesion: 0.13
Nodes (13): BlockedPage(), metadata, inter, metadata, viewport, GenderPromptModal(), GoogleAuthProviderWrapper(), MainContentWrapper() (+5 more)

### Community 7 - "getCollegeBySlug"
Cohesion: 0.23
Nodes (9): CollegePage(), generateMetadata(), COLLEGE_ALIASES, getCollegeBySlug(), slugifyCollege(), runVerification(), supabase, runTests() (+1 more)

### Community 8 - "icons.jsx"
Cohesion: 0.06
Nodes (39): ADMIN_TABS, metadata, Activity, AlertOctagon, ArrowDown, ArrowUpRight, BarChart2, Bookmark (+31 more)

### Community 9 - "Loader2"
Cohesion: 0.10
Nodes (25): STATUS_STYLE, STATUS_STYLE, REJECTION_REASONS, PACKS, formatDate(), PACKS, WalletPage(), getCachedClaimData() (+17 more)

### Community 10 - "sendPush"
Cohesion: 0.18
Nodes (11): POST(), GET(), PATCH(), isCircularPair(), POST(), POST(), POST(), getGoogleOAuth2AccessToken() (+3 more)

### Community 11 - "messages/page.jsx"
Cohesion: 0.12
Nodes (25): FeedClient(), fetcher(), getPostsKey(), avatarUrl(), ChatListItem(), fetcher(), formatTime(), mergeMessageIntoList() (+17 more)

### Community 12 - "wallet.js"
Cohesion: 0.16
Nodes (24): GET(), POST(), GET(), GET(), GET(), defaultWallet(), getOrCreateWallet(), getTransactions() (+16 more)

### Community 13 - "ProfileClient.jsx"
Cohesion: 0.10
Nodes (21): PREMIUM_FEATURES, CampusMomentsGallery(), HostBadge(), PostOptionsMenu(), PWAInstallModal(), VerificationModal(), Apple, Camera (+13 more)

### Community 14 - "creditSparks"
Cohesion: 0.13
Nodes (17): dynamic, POST(), GET(), PATCH(), POST(), GET(), POST(), POST() (+9 more)

### Community 15 - "paymentReservations.js"
Cohesion: 0.32
Nodes (10): GET(), POST(), ADMIN_UPI_ID, approvePaymentReservation(), autoExpireStaleReservations(), checkReservationTable(), checkUserReservationLimits(), getActiveUserReservation() (+2 more)

### Community 16 - "ProfileEditForm.jsx"
Cohesion: 0.12
Nodes (19): INTEREST_TAGS, YEARS, BRANCHES, INTEREST_TAGS, YEARS, UniversitySelector(), updateProfileAdmin(), INTEREST_TAGS (+11 more)

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
Cohesion: 0.13
Nodes (20): ApplicantsDrawer(), fetcher(), fetcher(), MyGigsActivity(), STATUS_STYLE, CATEGORIES, QUICK_TAGS_GIG, QUICK_TAGS_MEETING (+12 more)

### Community 21 - "compilerOptions"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, incremental, isolatedModules, jsx, lib (+11 more)

### Community 22 - "DiscoverClient.jsx"
Cohesion: 0.21
Nodes (10): DiscoverClient(), fetcher(), FILTERS, useAlgoliaSearch(), metadata, DEFAULT_CAMPUS, haversineDistance(), useCampusPresence() (+2 more)

### Community 23 - "slide-button.tsx"
Cohesion: 0.16
Nodes (15): Button, ButtonProps, buttonVariants, ANIMATION_CONFIG, BUTTON_STATES, DRAG_CONSTRAINTS, SlideButton, SlideButtonProps (+7 more)

### Community 24 - "package.json"
Cohesion: 0.10
Nodes (20): jose, name, overrides, jwks-rsa, private, version, canvas-confetti, eslint (+12 more)

### Community 25 - "VoiceCallModal.jsx"
Cohesion: 0.19
Nodes (17): AUDIO_CONSTRAINTS, ICE_SERVERS, VoiceCallModal(), Maximize2, MicOff, Minimize2, PhoneHangup(), PhoneOff() (+9 more)

### Community 26 - "users/[id]/page.js"
Cohesion: 0.12
Nodes (19): avatarUrl(), UserProfilePage(), AvatarZoomModal(), INTEREST_META, Github(), Instagram(), Linkedin(), ZoomableProfileAvatar() (+11 more)

### Community 27 - "manifest.json"
Cohesion: 0.12
Nodes (15): background_color, categories, description, display, icons, id, lang, name (+7 more)

### Community 28 - "approve-withdrawal/route.js"
Cohesion: 0.24
Nodes (6): POST(), sanitizeText(), approveWithdrawal(), rejectWithdrawal(), sendAdminAlert(), logger

### Community 29 - "react"
Cohesion: 0.12
Nodes (19): ROLES, INQUIRY_CATEGORIES, LIMITS, HostDashboardClient(), metadata, CustomSelect(), MessagePillButton(), ArrowUp (+11 more)

### Community 30 - "CirclesList.jsx"
Cohesion: 0.11
Nodes (26): GallerySlide(), PostMediaGallery(), PostGridThumbnail(), CATEGORY_COLORS, CATEGORY_ICONS, CirclesList(), EMPTY_SET, FILTERS (+18 more)

### Community 31 - "UI Rules — "Pulse" Social Media App"
Cohesion: 0.13
Nodes (14): 1. Core Principles, 2. Color Palette, 3. Typography, 4. Spacing & Layout Grid, 5. Components, 6. Content Layout Rules, 7. Motion & Interaction, 8. What to Avoid (Explicit Anti-Patterns) (+6 more)

### Community 32 - "useUserContext"
Cohesion: 0.15
Nodes (13): CampusGigsPage(), fetcher(), ProfileClient(), FCMInitializer(), InAppNotificationBanner(), LiveUserStatusBadge(), UserContext, UserProvider() (+5 more)

### Community 33 - "ambassador/page.jsx"
Cohesion: 0.07
Nodes (33): metadata, FAQS, FIELD_LIMITS, PERKS, STEPS, POSTS, dynamic, metadata (+25 more)

### Community 34 - "admin/feature-flags/route.js"
Cohesion: 0.26
Nodes (10): dynamic, GET(), POST(), dynamic, GET(), GET(), cache, getAllFeatureFlags() (+2 more)

### Community 35 - "circles/[id]/page.js"
Cohesion: 0.39
Nodes (7): CircleDetailPage(), generateMetadata(), CircleAvatar(), fetchCircleDetailAdmin(), fetchCircleEventsAdmin(), fetchCircleMembersAdmin(), formatEventDate()

### Community 36 - "calculateMeetupRate"
Cohesion: 0.24
Nodes (5): GET(), POST(), BookCoffeeButton(), calculateMeetupRate(), PRICING_TIERS

### Community 37 - "users/route.js"
Cohesion: 0.27
Nodes (9): GET(), RootLayout(), generateMetadata(), calculateActivityScore(), calculateAffinityScore(), normalizeInterests(), rankPeersForUser(), fetchProfileAdmin() (+1 more)

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

### Community 42 - "admin/page.js"
Cohesion: 0.33
Nodes (5): AdminClient(), fmt(), fmtDate(), AdminPage(), metadata

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

### Community 53 - "events/constants.js"
Cohesion: 0.50
Nodes (3): TABLE_CIRCLES, TABLE_EVENTS, TABLE_RSVPS

### Community 55 - "verify-remixicon-classes.mjs"
Cohesion: 0.50
Nodes (3): css, iconsJs, invalid

### Community 57 - "bookings/page.js"
Cohesion: 0.17
Nodes (7): BookingsPage(), fetcher(), normalizeBooking(), ProfileCallButton(), useVoiceCall(), RatingReviewModal(), lucide-react

### Community 63 - "test-message-notifications.js"
Cohesion: 0.40
Nodes (3): admin, anon, { createClient }

### Community 72 - "ThemeSelectorModal.jsx"
Cohesion: 0.23
Nodes (9): ACCENTS, MODES, ThemeContext, ThemeProvider(), useTheme(), ThemeSelectorModal(), Moon, Palette (+1 more)

### Community 80 - "test-pwa-standalone-routing.mjs"
Cohesion: 0.29
Nodes (5): ./_temp_pwa_test.mjs, code, middlewarePath, tempTestPath, tests

### Community 81 - "Page Layout Spec — Mobile + Desktop (All Screens)"
Cohesion: 0.14
Nodes (13): Breakpoint System, 🖥️ DESKTOP LAYOUTS, Desktop Screen 4: Discover, Desktop Screen 5: Home, Global Desktop Shell (applies to Discover, Home, and all desktop screens), Global Mobile Shell (applies to every mobile screen), 📱 MOBILE LAYOUTS, Mobile Screen 1: Chat List (+5 more)

### Community 82 - "supabaseQueries.js"
Cohesion: 0.17
Nodes (8): GET(), dynamic, GET(), dynamic, GET(), fetchCirclesAdmin(), fetchPendingCirclesAdmin(), fetchUpcomingEventsAdmin()

### Community 83 - "Card Layout + Structure Spec — "M" Campus App"
Cohesion: 0.17
Nodes (11): Border Radius Scale, Card Layout + Structure Spec — "M" Campus App, Card Type 1: Chat List Item, Card Type 2: Post / "Moment" Card, Card Type 3: Profile Header Card, Card Type 4: Discover — Person Card, Card Type 5: Sidebar Nav Item (Desktop), Card Type 6: Promotional Banner (Host Workspace / Campus Spotlight) (+3 more)

### Community 84 - "💡 Isse Kya Hoga? (Key Benefits & Solutions)"
Cohesion: 0.18
Nodes (10): 1. 🤝 Instant 1-on-1 Campus Meetups, 2. 📍 Real-Time Presence ("Free Now" Mode), 3. ⚡ Campus Micro-Gigs & Earning ("Earn Sparks"), 4. 👥 Campus Circles & Communities, 5. 🛡️ High-Trust & Safe Environment, 💡 Isse Kya Hoga? (Key Benefits & Solutions), 🚀 Main Problem Solved (Kaunsi Problem Solve Hoti Hai?), Meetify (Meetuply) — Campus Community & Networking Platform (+2 more)

### Community 85 - "events/page.js"
Cohesion: 0.25
Nodes (8): CATEGORY_THEMES, dynamic, EventCard(), EventsPage(), getTheme(), metadata, Mic, Trophy

### Community 86 - "Complete Element-Level Color Spec — "M" Campus App"
Cohesion: 0.22
Nodes (8): Complete Element-Level Color Spec — "M" Campus App, Final Palette (Locked), Global "Never Do This" List, SCREEN 1: Chat List (Mobile), SCREEN 2: Home Feed (Mobile), SCREEN 3: Profile, SCREEN 4: Discover (Desktop), SCREEN 5: Home (Desktop) — Deltas from Screen 4 (same sidebar/right panel rules apply)

### Community 87 - "UI/UX Design Rules"
Cohesion: 0.22
Nodes (8): 1. No Emojis, 2. Minimal Design, 3. Short, Context-Aware Text (Max 3-4 Words for Headings/Labels), 4. Single-Line Descriptions on Mobile (Max 1 Line), 5. Fully Mobile Responsive, 6. CRITICAL RULE — No Unwanted Line Breaks in Short UI Text, 7. Moderate Border Radius (No Excessive Rounding) & Clean Alignment, UI/UX Design Rules

### Community 88 - "test-notification-test-feature.js"
Cohesion: 0.25
Nodes (6): admin, anon, { createClient }, envPath, fs, path

### Community 91 - "Campus App Architecture Rules (Next.js App Router)"
Cohesion: 0.33
Nodes (5): Before writing any new feature, Campus App Architecture Rules (Next.js App Router), Folder structure, Goal check, Hard rules

### Community 92 - "notifications/page.js"
Cohesion: 0.16
Nodes (9): FILTERS, NotificationsPage(), NotifIcon(), timeAgo(), NOTIF_CONFIG, Skeleton(), Bell, Briefcase (+1 more)

### Community 93 - "README.md"
Cohesion: 0.40
Nodes (4): AI review test, Deploy on Vercel, Getting Started, Learn More

### Community 99 - "useNativePush.js"
Cohesion: 0.42
Nodes (7): registerDeviceTokenOnServer(), registerWebPushSubscription(), requestNativePushPermission(), urlBase64ToUint8Array(), useNativePush(), @capacitor/core, @capacitor/push-notifications

### Community 100 - "@supabase/supabase-js"
Cohesion: 0.25
Nodes (4): @supabase/supabase-js, sb, PUBLIC_PAGES, supabase

### Community 101 - "cancel_old_bookings.js"
Cohesion: 0.29
Nodes (5): { createClient }, env, envVars, fs, supabase

### Community 102 - "test-posts-comments.js"
Cohesion: 0.29
Nodes (5): { createClient }, env, envVars, fs, supabaseAdmin

### Community 106 - "test-mobile-pwa-push-pipeline.mjs"
Cohesion: 0.40
Nodes (4): web-push, __dirname, __filename, rootDir

## Knowledge Gaps
- **386 isolated node(s):** `metadata`, `ADMIN_TABS`, `STATUS_STYLE`, `metadata`, `dynamic` (+381 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 525 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `getUserAdmin`, `Sidebar.jsx`, `getUserWithRole`, `app/layout.js`, `icons.jsx`, `Loader2`, `messages/page.jsx`, `ProfileClient.jsx`, `ProfileEditForm.jsx`, `InstagramEmbed.jsx`, `gigs/page.js`, `DiscoverClient.jsx`, `slide-button.tsx`, `package.json`, `VoiceCallModal.jsx`, `users/[id]/page.js`, `CirclesList.jsx`, `useUserContext`, `ambassador/page.jsx`, `bookings/page.js`, `ThemeSelectorModal.jsx`, `notifications/page.js`, `useNativePush.js`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **Why does `supabaseAdmin` connect `admin.js` to `getUserAdmin`, `getAdminUser.js`, `admin/feature-flags/route.js`, `ambassador/page.jsx`, `calculateMeetupRate`, `requireAuth`, `users/route.js`, `getUserWithRole`, `sendPush`, `wallet.js`, `creditSparks`, `paymentReservations.js`, `profile.actions.js`, `supabaseQueries.js`, `users/[id]/page.js`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `@supabase/supabase-js` connect `@supabase/supabase-js` to `admin.js`, `cancel_old_bookings.js`, `test-posts-comments.js`, `getCollegeBySlug`, `test-mobile-pwa-push-pipeline.mjs`, `package.json`, `test-notification-test-feature.js`, `test-message-notifications.js`?**
  _High betweenness centrality (0.054) - this node is a cross-community bridge._
- **What connects `metadata`, `ADMIN_TABS`, `STATUS_STYLE` to the rest of the system?**
  _386 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `getAdminUser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06734006734006734 - nodes in this community are weakly interconnected._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.04491228070175438 - nodes in this community are weakly interconnected._
- **Should `requireAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.075990675990676 - nodes in this community are weakly interconnected._