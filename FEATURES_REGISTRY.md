# 🏛️ Meova Platform Features & System Registry

> **Single Source of Truth for Human Engineers & AI Agents**  
> **Last Updated**: 2026-09-15  
> **Tech Stack**: Next.js 16 (Turbopack, App Router) · Supabase (PostgreSQL, Realtime WebSockets, Storage, Auth) · Tailwind CSS · PWA Service Worker

---

## 📋 Table of Contents
1. [Architecture & Engineering Philosophy](#1-architecture--engineering-philosophy)
2. [Module 1: Authentication & Onboarding](#module-1-authentication--onboarding)
3. [Module 2: Profile & Identity Management](#module-2-profile--identity-management)
4. [Module 3: Realtime Chat & Direct Messaging](#module-3-realtime-chat--direct-messaging)
5. [Module 4: Notification Pipeline (Web Push + In-App)](#module-4-notification-pipeline-web-push--in-app)
6. [Module 5: Campus Moments & Social Feed](#module-5-campus-moments--social-feed)
7. [Module 6: Peer Discovery & Proximity ("Free Now")](#module-6-peer-discovery--proximity-free-now)
8. [Module 7: Campus 1-on-1 Bookings & Meetups](#module-7-campus-1-on-1-bookings--meetups)
9. [Module 8: Sparks Wallet & UPI Economy](#module-8-sparks-wallet--upi-economy)
10. [Module 9: Campus Trust & ID Verification](#module-9-campus-trust--id-verification)
11. [Module 10: Campus Ambassador System](#module-10-campus-ambassador-system)
12. [Module 11: Host Workspace & Moderation](#module-11-host-workspace--moderation)
13. [Module 12: Admin Dashboard & Control Room](#module-12-admin-dashboard--control-room)
14. [Module 13: Progressive Web App (PWA) & Offline Mode](#module-13-progressive-web-app-pwa--offline-mode)
15. [Module 14: Legal, Compliance & Universal Branding](#module-14-legal-compliance--universal-branding)
16. [How AI & Developers Maintain This Registry](#how-ai--developers-maintain-this-registry)

---

## 1. Architecture & Engineering Philosophy

- **Colors & Branding**: Strictly follows `UI_RULES.md` — Pure White (`#FFFFFF`), Deep Pitch Black (`#0D0D0D` / `#1C1917`), MEOVA Brand Purple (`#7657D9`, hover `#6848C9`, active `#5B3FB3`). Grey tones (`zinc-400`, `gray-400`, washed out backgrounds) are strictly forbidden.
- **Universal Campus Platform**: No hardcoded college branding in global titles or metadata. Universal to all university students across India.
- **Zero Mock Logic**: All functionality is backed by real Supabase tables, REST APIs, or Server Actions, verified via automated test scripts.
- **Optimistic UI Perception**: Message sending, likes, and profile updates reflect at 0ms with instant feedback and background reconciliation.
- **Strict Anti-Wrapping**: Action buttons, tabs, and labels use `whitespace-nowrap flex-shrink-0` to avoid broken lines on mobile screens.
- **Universal Modal UX & Background Scroll Lock**: All modals and popup dialogs (`FeedClient` Post creation, `CreateMenuModal`, `bookings` QR/Scan/Cancel/Dispute/Rating, etc.) strictly freeze background scrolling (`document.body.style.overflow = 'hidden'`) upon opening and restore it cleanly upon closing or unmounting. Every modal supports outside backdrop tap-to-dismiss (`if (e.target === e.currentTarget) close()`) with `e.stopPropagation()` on the dialog content, plus standard Escape key dismissal.
- **Search Engine & AI Overview Entity Optimization (White Hat GEO)**: `app/layout.js` injects rich JSON-LD Schema (`Organization`, `SoftwareApplication`, and `FAQPage` with official entity definitions and sameAs social graph) ensuring Google's AI Overview (Gemini) recognizes Meova as India's campus social platform. PWA manifest and install prompts strictly preserve the clean app name `"Meova"`.

---

## Module 1: Authentication & Onboarding
- **Status**: 🟢 Production Ready
- **Primary Pages**:
  - `app/login/page.js` (Google One-Tap & Sign-in CTA)
  - `app/onboarding/page.jsx` & `app/onboarding/OnboardingClient.jsx` (Multi-step student onboarding)
- **Backend APIs & Actions**:
  - `GET /api/auth/google` (OAuth exchange & redirection)
  - `GET /api/auth/session` (Reads encrypted HTTP-only session cookies)
  - `POST /api/auth/logout` (Invalidates session & clears cookies)
  - `POST /api/onboarding` (Saves username, branch, year, college, avatar)
  - `GET /api/users/check-username` (Realtime uniqueness validation)
- **Database Tables**:
  - `auth.users` (Supabase Auth identity)
  - `public.profiles` (Extended student profile: `username`, `full_name`, `college_id`, `tier`, `role`)
- **Key Capabilities**:
  - Auto-checks college email domain or allows universal college selection via `UniversitySelector.jsx`.
  - Automatic Sparks welcome gift (50 Sparks) credited on first login.
  - Safe hydration fallback with seamless redirect to `/` or `/onboarding`.

---

## Module 2: Profile & Identity Management
- **Status**: 🟢 Production Ready
- **Primary Pages & Components**:
  - `app/profile/page.js` (Server Component preloading wallet + moments)
  - `app/profile/ProfileClient.jsx` (Client UI with tabs: Moments, Campus Hub, Settings)
  - `features/profile/ProfileEditForm.jsx` (In-place edit for bio, year, branch, social links)
  - `components/ZoomableProfileAvatar.jsx` (Pinch/tap avatar zoom with high-res modal)
  - `app/users/[id]/page.js` (Public profile view for classmates)
- **Backend APIs & Actions**:
  - `features/profile/profile.actions.js` (`updateProfileAdmin` Server Action)
  - `POST /api/users/verify-phone/send` (Sends phone OTP for withdrawals)
  - `POST /api/users/verify-phone/confirm` (Validates OTP & sets `phone_verified: true`)
- **Database Tables**:
  - `public.profiles` (`bio`, `branch`, `year`, `university`, `photo_url`, `instagram`, `linkedin`, `github`, `isIdOn`)
- **Key Capabilities**:
  - QR Code Profile Sharing (`QRCodeCanvas`) for easy on-campus student adding.
  - Instant toggle for Campus ID visibility (`isIdOn`).
  - Mobile app permissions manager (Geolocation, Notifications, Camera, PWA Install).
  - High-Contrast Dark Mode Engine: Active tabs feature glowing brand purple indicators, legible badges, and elevated white tints in Refined Midnight mode.

---

## Module 3: Realtime Chat & Direct Messaging
- **Status**: 🟢 Production Ready (0ms Instant Sending & Multi-Tier Deduplication)
- **Primary Pages & Components**:
  - `app/messages/page.jsx` (Full chat client, threads list, message bubbles)
- **Backend APIs**:
  - `GET /api/chats` (List all active user conversation threads)
  - `POST /api/chats` (Initialize 1-on-1 thread; verifies 5 Sparks unlock if mock)
  - `GET /api/chats/[id]/messages` (Fetch message history, default limit 25)
  - `POST /api/chats/[id]/messages` (Inserts message, broadcasts via WebSocket, fires push notification)
  - `PATCH /api/chats/[id]` (Resets unread count for current user)
- **Database Tables & Realtime**:
  - `public.chats` (`id`, `participants`, `last_message`, `last_message_at`, `unread_count`)
  - `public.chat_messages` (`id`, `chat_id`, `sender_id`, `text`, `status`, `created_at`)
  - Realtime Channel: `chat-messages-{chatId}` (Broadcasts `new-message`)
- **Key Capabilities**:
  - **Instant 0ms UI Feedback**: Clear input immediately, scroll smoothly, and render optimistic bubble with `tempId`.
  - **Zero Duplicate Engine (`mergeMessageIntoList`)**: Deduplicates incoming messages by UUID, `clientMsgId`, `tempId`, optimistic preview, or fuzzy match (same sender + text within 7s).
  - Unread badge counter synced with sidebar and bottom navigation bar in realtime.

---

## Module 4: Notification Pipeline (Web Push + In-App)
- **Status**: 🟢 Production Ready
- **Primary Pages & Components**:
  - `app/notifications/page.js` (In-app notifications feed with timestamps & deep links)
  - `components/NotificationPermissionPrompt.jsx` (Soft banner prompt for Web Push)
  - `public/sw.js` (Service Worker handling push payload and background click)
- **Backend APIs & Utilities**:
  - `GET /api/notifications` (Fetch user alerts)
  - `POST /api/notifications/test` (Live end-to-end push test button in Profile)
  - `POST /api/fcm/register` (Registers browser push subscription endpoint)
  - `lib/sendPushNotification.js` (`sendPush` via Web Push API & FCM)
- **Database Tables**:
  - `public.notifications` (`id`, `user_id`, `title`, `body`, `type`, `url`, `is_read`, `created_at`)
  - `public.device_tokens` (`user_id`, `token`, `endpoint`, `p256dh`, `auth`)
- **Key Capabilities**:
  - Automatic push alerts on new chat messages, booking requests, and moments likes.
  - Profile "Test Notification" button sends immediate live test push to confirm device connectivity.

---

## Module 5: Campus Moments & Social Feed
- **Status**: 🟢 Production Ready
- **Primary Pages & Components**:
  - `app/page.js` & `app/FeedClient.jsx` (Campus moments feed)
  - `components/CampusMomentsGallery.jsx` (Instagram-style 3/4-column thumbnail grid)
  - `components/profile/PostDetailView.jsx` (Full-screen lightbox gallery with comments)
  - `components/CreatePostModal.jsx` (Client-side compressed photo & caption upload)
- **Backend APIs**:
  - `GET /api/posts` (Fetch campus moments with pagination)
  - `POST /api/posts` (Upload new moment with auto image compression)
  - `DELETE /api/posts` (Author delete post)
  - `POST /api/posts/[id]/like` (Toggle like with instant count)
  - `GET /api/posts/[id]/comments` & `POST /api/posts/[id]/comments` (Realtime comments)
- **Database Tables**:
  - `public.posts` (`id`, `user_id`, `content`, `media_urls`, `likes_count`, `comments_count`)
  - `public.post_likes` (`post_id`, `user_id`)
  - `public.post_comments` (`id`, `post_id`, `user_id`, `content`, `created_at`)
- **Key Capabilities**:
  - Unified Post Card Layout: Single prominent `MessagePillButton` in the post action bar alongside Like and Share (header duplicate button removed for zero clutter).
  - Crystal Clear Dark Theme: High-contrast author names, branch, location, and separator dots with zero black-on-black text bleeding.
  - Dedicated "Post" Action in Active Students Tray: The first slot in the active students stories tray features a standalone, clean circular Plus button (`border-2 border-dashed border-[var(--accent)]`) labeled "Post" that triggers post creation, without any overlapping avatar badges.

---

## Module 6: Peer Discovery & Proximity ("Free Now")
- **Status**: 🟢 Production Ready
- **Primary Pages & Components**:
  - `app/discover/page.js` & `app/discover/DiscoverClient.jsx`
- **Backend APIs**:
  - `GET /api/users` (Directory search by branch, year, college, and interests)
  - `POST /api/users/free-now` (Broadcast 2-hour "Free Now" availability for campus coffee/study)
  - `POST /api/users/location` (Saves coarse campus location for proximity sorting)
- **Database Tables**:
  - `public.profiles` (`is_free_now`, `free_until`, `last_active_at`)

---

## Module 7: Campus 1-on-1 Bookings & Meetups
- **Status**: 🟢 Production Ready
- **Primary Pages & Components**:
  - `app/bookings/page.js` (Meetup requests, accepted sessions, completed history)
  - `components/BookingModal.jsx` (Date, slot, and purpose selector)
- **Backend APIs**:
  - `GET /api/bookings` (Fetch user's bookings as host or guest)
  - `POST /api/bookings` (Request meetup with Sparks escrow hold)
  - `PATCH /api/bookings` (Accept, decline, cancel, or complete meetup)
  - `POST /api/calls/invite` (Peer WebRTC audio calling for verified students)
- **Database Tables**:
  - `public.bookings` (`id`, `host_id`, `guest_id`, `date`, `slot`, `status`, `sparks_held`)
  - `public.wallet_reservations` (Escrow hold on Sparks until meetup completion)
- **Key Capabilities & Entry Points**:
  - Primary Mobile Navigation Tab: 5-tab mobile bottom bar (`[Home]`, `[Discover]`, `[Messages]` (center), `[Meetups]` (clean `ri-shake-hands-line` handshake icon), `[Profile]`). Real-time pending requests and unread message indicators attached.
  - Top Mobile Header: Streamlined to `[Logo]`, `[⚡ Sparks Pill]`, and `[🔔 Notifications Bell]` (profile avatar removed from top header to eliminate duplication with bottom tab).
  - Desktop Left Sidebar: Prominent "Meetups" item with `ri-shake-hands-line` icon and pending bookings counter badge.
  - 20-minute live meeting timer, QR scan verification, and post-session rating modal.
  - **Mutual Active Meetup Mutual Lock**: Strictly enforces a single active meeting session between any two peers at any time. If User A has requested or scheduled a meetup with User B, neither user can request or schedule another meetup until the existing session is completed, rejected, or cancelled. Outgoing senders see "Meetup Pending" with direct view links, while incoming recipients see "Accept Meeting" / "Incoming Request", and backend returns HTTP 409 Conflict with `PENDING_REQUEST_EXISTS`, `INCOMING_REQUEST_EXISTS`, or `ACTIVE_MEETUP_EXISTS`.


---

## Module 8: Sparks Wallet & UPI Economy
- **Status**: 🟢 Production Ready
- **Primary Pages & Components**:
  - Top Mobile Header: Premium glowing amber Sparks pill (`Zap` glowing icon + bold tabular balance) linking directly to `/wallet`.
  - `app/wallet/page.jsx` & `app/wallet/WalletClient.jsx` (Balance breakdown & history)
  - `app/wallet/buy/page.jsx` (Sparks purchase packs with UPI intent)
  - `app/wallet/withdraw/page.jsx` (Creator earnings withdrawal to UPI VPA)
- **Backend APIs**:
  - `GET /api/wallet` (Live balance: Purchased + Bonus + Creator)
  - `POST /api/wallet/intent` (Generate unique decimal payment reservation)
  - `POST /api/wallet/withdraw` (Submit withdrawal request; requires verified phone)
  - `POST /api/users/[id]/tip` (Send tip sparks to creator)
- **Database Tables**:
  - `public.wallets` (`user_id`, `purchased`, `bonus`, `creator`)
  - `public.wallet_ledger` (Full double-entry audit trail)
  - `public.withdrawals` (`id`, `user_id`, `amount_inr`, `upi_id`, `status`)

---

## Module 9: Campus Trust & ID Verification
- **Status**: 🟢 Production Ready
- **Primary Components**:
  - `components/verification/VerificationModal.jsx`
- **Backend APIs**:
  - `GET /api/verification/status` (Current status: `none`, `pending`, `verified`, `rejected`)
  - `POST /api/verification/submit` (Uploads ID card + live selfie with image compression)
- **Database Tables**:
  - `public.verifications` (`id`, `user_id`, `id_card_url`, `selfie_url`, `status`)
  - `public.profiles.tier` (`not_verified` vs `verified`)
- **Unlocks When Verified**:
  - Green Verified Shield Badge across profile & messages.
  - Unlimited daily new message threads (Unverified capped at 5 new peers/day).
  - WebRTC Peer calling unlocked.

---

## Module 10: Campus Ambassador System
- **Status**: 🟢 Production Ready
- **Primary Pages**:
  - `app/ambassador/page.jsx` (Public campus ambassador landing page)
  - `app/ambassador/dashboard/page.jsx` (Recruits, referral link, points & earnings)
- **Backend APIs**:
  - `POST /api/ambassador/apply` (Submit ambassador application)
  - `GET /api/ambassador/dashboard` (Live stats & referred student registrations)
- **Database Tables**:
  - `public.ambassador_applications`
  - `public.ambassador_profiles` (`user_id`, `college_id`, `referral_code`, `total_recruits`)

---

## Module 11: Host Workspace & Moderation
- **Status**: 🟢 Production Ready
- **Primary Pages**:
  - `app/host/page.jsx` & `app/host/HostDashboardClient.jsx`
- **Backend APIs**:
  - `GET /api/host/stats` (Active students, reported items, moderation logs)
  - `POST /api/host/moderate-post` (Remove offending campus moment)
  - `POST /api/host/suspend-user` (Temporary student suspension)
- **Database Tables**:
  - `public.host_logs`, `public.reports`

---

## Module 12: Admin Dashboard & Control Room
- **Status**: 🟢 Production Ready (Restricted to `role: 'admin'`)
- **Primary Pages**:
  - `app/admin/page.js` & `app/admin/AdminClient.jsx`
  - `app/admin/verifications/page.jsx` (Review student ID cards & approve tier)
  - `app/admin/withdrawals/page.js` (Process UPI withdrawals)
  - `app/admin/payments/page.js` (Verify UPI transaction UTRs)
  - `app/admin/users/page.js` (Manage ban/unban status & roles)
  - `app/admin/colleges/page.jsx` (Add/edit universities across India)
- **Backend APIs**:
  - `app/api/admin/*` routes protected by admin role verification (`getUserAdmin`).

---

## Module 13: Progressive Web App (PWA), Web Push & Offline Mode
- **Status**: 🟢 Production Ready
- **Primary Components**:
  - `components/PWAInstallModal.jsx` (OS-specific install prompt for iOS/Android/Desktop with auto `appinstalled` cookie persistence)
  - `components/PWAInstallBanner.jsx` (Smart mobile-first install banner with `beforeinstallprompt` and `__meova_pwa` persistence)
  - `components/NotificationPermissionPrompt.jsx` (User-friendly permission prompt with Web Push VAPID auto-subscription)
  - `components/InAppNotificationBanner.jsx` (In-app real-time banner when app is in foreground)
  - `app/offline/page.js` (Offline fallback screen when internet drops)
  - `public/sw.js` (Service Worker with runtime cache, auto-version updater, Web Push `push` listener, system tray `notificationclick` deep linking, and `message` client notification triggers)
  - `public/manifest.json` (Standalone display mode, portrait orientation, pure white background `#FFFFFF`)
- **Key Capabilities**:
  - Pre-caches core navigation assets.
  - Native standalone display mode: browser address bar (`meova.in` / `admin.meova.in`) is completely eliminated.
  - Standalone Scope Isolation: When launched in installed PWA mode (`?source=pwa` or `__meova_pwa=1`), unauthenticated users bypass the marketing homepage (`meova.in`) and route directly to `/login`, while authenticated users immediately see `FeedClient`.
  - Admin Subdomain Exclusion: `admin.meova.in` is completely isolated from PWA scope and web-app-origin-association so regular app users never encounter admin endpoints.
  - Background Mobile System Notifications: Full W3C Web Push & VAPID integration. Even when the PWA is minimized or closed on Android and iOS (PWA standalone), server push alerts wake up `public/sw.js` to display native status bar notifications outside the app with vibration and deep-link click routing.
  - Dual FCM & WebPush Engine: `lib/pushNotifications.js` automatically partitions native Capacitor mobile tokens (`android`/`ios`) and PWA Web Push subscriptions (`web`), delivering to both simultaneously.

---

## Module 14: Legal, Compliance & Universal Branding
- **Status**: 🟢 Production Ready
- **Public Legal Pages**:
  - `app/terms/page.jsx` (Terms of Service)
  - `app/privacy/page.jsx` (Privacy Policy)
  - `app/refund-policy/page.jsx` (Refund & Cancellation Policy)
  - `app/community-guidelines/page.jsx` (Safety Guidelines)
  - `app/grievance/page.jsx` (IT Act Grievance Redressal Officer)
  - `app/contact/page.jsx` & `ContactForm.jsx` (Contact inquiry form)
- **Robots & SEO**:
  - Clean `sitemap.xml` & `robots.txt` indexing only universal platform pages.

---

## Module 15: WebRTC Voice & Video Calling

### Status: Active Development

### Architecture
- **Provider**: `components/providers/VoiceCallProvider.jsx` — Wraps app, provides `startCall` hook, manages call state + signaling channels via Supabase Realtime Broadcast
- **Call UI**: `components/call/VoiceCallModal.jsx` — Full-screen call modal with voice/video, PiP local preview, ICE restart, mobile audio autoplay workaround
- **Trigger**: `components/call/ProfileCallButton.jsx` — Profile-level call button
- **Signaling**: Supabase Realtime Broadcast channels (`call-user-{uid}` for invites, `call_{roomId}` for WebRTC signaling)
- **ICE/TURN**: `app/api/calls/ice-servers/route.js` — Dynamic Metered.ca TURN credentials + STUN-only fallback
- **Call Invite**: `app/api/calls/invite/route.js` — Tier verification + push notification + call log insert

### Key Features
- Voice and Video calls (both peer verified required)
- Mobile audio autoplay via AudioContext resume + forcePlay retry
- Remote video element always in DOM (CSS visibility toggle, never null ref)
- ICE restart on disconnected (3s delay) and failed (1 attempt before disconnect)
- Bulletproof camera cleanup: PC sender tracks stopped, beforeunload listener, provider-level cleanupRef safety net
- TURN via Metered.ca API (3s timeout), STUN-only fallback (no stale OpenRelay)

### Database Tables
- `calls` — Call log (caller_id, callee_id, call_type, room_id, status)

### Recent Fixes (2026-09-15)
- Fixed mobile audio not playing (autoplay policy workaround)
- Fixed video not showing between mobile↔laptop (video element now always in DOM)
- Fixed call dropping after seconds (removed dead OpenRelay TURN, added ICE restart)
- Fixed camera staying on after hangup (bulletproof cleanup in modal + provider)

---

### Module 4 Update Notes (Push Notifications — 2026-09-15)
- **Auto-Permission Request**: `useNativePush.js` now auto-requests `Notification.permission` on first load (2s delay), then registers WebPush subscription
- **Dual Engine**: Capacitor FCM for native APK + Web Push (VAPID) for PWA
- **device_tokens table**: Stores both web (platform='web') and native (platform='android') tokens, upserted via `/api/fcm/register`

### Module 3 Update Notes (Chat & DM — 2026-09-15)
- **Message Loading Fix**: Added `loadingMessages` state with spinner UI, retry logic (1 attempt after 1.5s), and `!loadingMessages` guard on empty state
- **Consistent History**: Both sender and receiver now see full message history via background API fetch with proper loading indication

---

## How AI & Developers Maintain This Registry

1. **Mandatory Sync**: Whenever a feature, page, table, or API route is added, renamed, or modified, the developer or AI agent **must update this file immediately**.
2. **Verification Rule**: No feature can be marked `🟢 Production Ready` without automated test script execution and `npm run build` compilation (Exit Code 0).
3. **Changelog Log**: Significant architecture revisions must be appended to the top date header and module notes.
