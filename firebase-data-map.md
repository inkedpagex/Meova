# Firebase Data Structure & Migration Map for Supabase (PostgreSQL)

This document provides a comprehensive mapping of the Meetify application's Firebase infrastructure (Firestore collections, Auth, Storage, Security Rules, real-time listeners, and data routes). It is designed as an authoritative technical reference for migrating the backend to Supabase (PostgreSQL).

---

## 1. Firestore Collections & Subcollections

### 1.1 `users` (Collection)
* **Description**: User profile documents containing demographic info, campus preferences, live availability status, and role metadata.
* **Document ID**: `uid` (Matches Firebase Auth `user.uid`).

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `uid` | `string` | **Required** | Primary key. Maps to `auth.users.id`. |
| `email` | `string` | **Required** | User email address. |
| `full_name` | `string` | **Required** | Display / full name. |
| `username` | `string` | **Optional** | Unique handle (shadowed in `usernames` collection). |
| `photo_url` | `string` | **Optional** | Avatar image URL (Cloudinary / Google OAuth / Dicebear). |
| `year` | `string` | **Optional** | Academic year (e.g., `'1st Year'`, `'2nd Year'`). |
| `branch` | `string` | **Optional** | Major / department (e.g., `'Computer Science'`). |
| `bio` | `string` | **Optional** | Short bio / introduction. |
| `gender` | `string` | **Optional** | Gender (`'male'`, `'female'`, `'non-binary'`, `'prefer-not-to-say'`). |
| `age` | `number` / `string` | **Optional** | User age. |
| `interests` | `array<string>` | **Optional** | Interest tags (e.g., `['Coding & Tech', 'Music & Bands']`). |
| `lookingFor` | `string` | **Optional** | Primary goal (`'Coffee Chat'`, `'Study Partner'`, `'Gig Work'`). |
| `studyStyle` | `string` | **Optional** | Preferred study environment. |
| `role` | `string` | **Optional** | Role for permissions (`'user'`, `'admin'`). Default: `'user'`. |
| `status` | `string` | **Optional** | Account status (`'active'`, `'blocked'`). |
| `isBlocked` | `boolean` | **Optional** | Admin block flag. |
| `isLiveOnCampus` | `boolean` | **Optional** | Real-time presence flag for campus availability. |
| `liveUntil` | `string` (ISO) | **Optional** | Expiration timestamp for "Live on Campus" state. |
| `freeNowNote` | `string` | **Optional** | Custom broadcast status message. |
| `phone` | `string` | **Optional** | Verified phone number. |
| `phoneVerified` | `boolean` | **Optional** | Phone verification state. |
| `location` | `map/object` | **Optional** | Geo location `{ lat: number, lng: number, placeName: string, updatedAt: string }`. |
| `onboardingCompleted` | `boolean` | **Optional** | Onboarding wizard completion status. |
| `created_at` | `timestamp` / `string` | **Required** | Document creation time. |
| `updated_at` | `timestamp` / `string` | **Optional** | Last update timestamp. |

---

### 1.2 `users/{uid}/notifications` (Subcollection)
* **Description**: In-app user notifications.
* **Document ID**: Auto-generated `notifId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Required** | Notification title. |
| `message` / `body` | `string` | **Required** | Notification message text. |
| `type` | `string` | **Optional** | Type (`'alert'`, `'gig_application'`, `'booking_request'`, `'booking_accepted'`). |
| `read` | `boolean` | **Required** | Read state (Default: `false`). |
| `gigId` | `string` | **Optional** | Reference to `gigs/{gigId}`. |
| `bookingId` | `string` | **Optional** | Reference to `bookings/{bookingId}`. |
| `senderId` | `string` | **Optional** | Reference to `users/{uid}`. |
| `created_at` | `timestamp` / `string` | **Required** | Creation timestamp. |

---

### 1.3 `users/{uid}/fcmTokens` (Subcollection)
* **Description**: Firebase Cloud Messaging tokens for push notifications.
* **Document ID**: FCM Token string or auto-generated `tokenId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `token` | `string` | **Required** | FCM registration token string. |
| `platform` | `string` | **Optional** | Platform identifier (e.g., `'web'`). |
| `created_at` | `timestamp` / `string` | **Required** | Token registration timestamp. |

---

### 1.4 `users/{uid}/blocks` (Subcollection)
* **Description**: List of users blocked by a specific user.
* **Document ID**: Target user's `uid`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `blockedId` | `string` | **Required** | Reference to `users/{blockedUid}`. |
| `blockedAt` | `timestamp` / `string` | **Required** | Block timestamp. |

---

### 1.5 `usernames` (Collection)
* **Description**: Shadow collection used to enforce unique username handle allocation.
* **Document ID**: `username` (Lowercase string).

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `uid` | `string` | **Required** | Reference to `users/{uid}` owner. |
| `createdAt` | `timestamp` / `string` | **Required** | Allocation timestamp. |

---

### 1.6 `wallets` (Collection)
* **Description**: Virtual wallet ledger holding Sparks balance for users.
* **Document ID**: `uid` (Matches `users/{uid}`).

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **Required** | Maps to `users/{uid}`. |
| `userId` | `string` | **Required** | Reference to `users/{uid}`. |
| `email` | `string` | **Optional** | User email copy. |
| `purchased` | `number` | **Required** | Purchased Sparks balance (Default: `0`). |
| `bonus` | `number` | **Required** | Free/Bonus Sparks balance (Default: `100` welcome bonus). |
| `creator` | `number` | **Required** | Earned/Creator Sparks balance (Default: `0`). |
| `lifetime_purchased` | `number` | **Required** | Lifetime purchased Sparks (Default: `0`). |
| `lifetime_earned` | `number` | **Required** | Lifetime earned Sparks (Default: `0`). |
| `lifetime_withdrawn` | `number` | **Required** | Lifetime withdrawn Sparks (Default: `0`). |
| `updated_at` | `string` (ISO) | **Required** | Last update timestamp. |

---

### 1.7 `transactions` (Collection)
* **Description**: Immutable financial transaction log for all Sparks activity (purchases, payouts, escrows, tips).
* **Document ID**: Auto-generated `txId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `userId` | `string` | **Required** | Reference to `users/{uid}`. |
| `type` | `string` | **Required** | Transaction type (`'bonus'`, `'purchase'`, `'withdrawal'`, `'gig_escrow'`, `'gig_payout'`, `'tip'`, `'booking_escrow'`, `'booking_payout'`, `'dispute_refund'`). |
| `amount` | `number` | **Required** | Sparks change (positive for credit, negative for debit). |
| `description` | `string` | **Required** | Human-readable log summary. |
| `status` | `string` | **Required** | Status (`'COMPLETED'`, `'PENDING'`, `'FAILED'`). |
| `referenceId` | `string` | **Optional** | Related entity ID (`bookingId`, `gigId`, or `payId`). |
| `created_at` | `string` (ISO) | **Required** | Transaction timestamp. |

---

### 1.8 `withdrawals` (Collection)
* **Description**: User cashout / withdrawal requests converting earned Sparks to real money via UPI.
* **Document ID**: Auto-generated `wdId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `userId` | `string` | **Required** | Reference to `users/{uid}`. |
| `userEmail` | `string` | **Optional** | User email. |
| `userName` | `string` | **Optional** | User display name. |
| `sparks` | `number` | **Required** | Amount of creator Sparks to cash out. |
| `inrAmount` | `number` | **Required** | Equivalent payout amount in INR. |
| `upiId` | `string` | **Required** | Destination UPI address. |
| `status` | `string` | **Required** | Status (`'pending'`, `'approved'`, `'rejected'`). |
| `requested_at` | `string` (ISO) | **Required** | Request submission timestamp. |
| `processed_at` | `string` (ISO) | **Optional** | Admin approval/rejection timestamp. |
| `rejectionReason` | `string` | **Optional** | Reason provided if rejected by admin. |

---

### 1.9 `payment_requests` (Collection)
* **Description**: Deposit / top-up requests where users purchase Sparks by submitting a UTR reference.
* **Document ID**: Auto-generated `payId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `userId` | `string` | **Required** | Reference to `users/{uid}`. |
| `userEmail` | `string` | **Optional** | User email. |
| `userName` | `string` | **Optional** | User display name. |
| `sparks` | `number` | **Required** | Amount of Sparks being purchased. |
| `inrAmount` | `number` | **Required** | INR cost of package. |
| `packageId` | `string` | **Optional** | Package tier ID (`'starter'`, `'pro'`, `'popular'`). |
| `utr` | `string` | **Required** | Unique Payment UTR / Transaction reference code. |
| `status` | `string` | **Required** | Status (`'pending'`, `'approved'`, `'rejected'`). |
| `created_at` | `string` (ISO) | **Required** | Submission timestamp. |
| `processed_at` | `string` (ISO) | **Optional** | Admin verification timestamp. |

---

### 1.10 `audit_logs` (Collection)
* **Description**: Admin action log capturing sensitive administrative operations.
* **Document ID**: Auto-generated `logId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `adminUid` | `string` | **Required** | Reference to `users/{uid}` (Admin). |
| `action` | `string` | **Required** | Action string (`'APPROVE_PAYMENT'`, `'RESOLVE_DISPUTE'`, `'BLOCK_USER'`, `'UPDATE_ROLE'`). |
| `targetId` | `string` | **Optional** | Target document/user ID. |
| `details` | `map/object` | **Optional** | Action context payload object. |
| `created_at` | `string` (ISO) | **Required** | Action timestamp. |

---

### 1.11 `circles` (Collection)
* **Description**: Campus interest groups / communities.
* **Document ID**: Auto-generated `circleId` or slug string.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `name` | `string` | **Required** | Circle title. |
| `description` | `string` | **Required** | Circle description. |
| `category` | `string` | **Required** | Interest category (e.g., `'Tech'`, `'Music'`, `'Sports'`). |
| `cover_image` / `image` | `string` | **Optional** | Header photo URL. |
| `host_id` / `creatorId` | `string` | **Required** | Reference to `users/{uid}`. |
| `host_name` | `string` | **Optional** | Creator name preview. |
| `host_photo` | `string` | **Optional** | Creator avatar preview. |
| `members_count` | `number` | **Required** | Total member count (Default: `1`). |
| `status` | `string` | **Optional** | Approval status (`'active'`, `'pending_approval'`). |
| `created_at` | `timestamp` / `string` | **Required** | Creation timestamp. |

---

### 1.12 `circle_members` (Collection)
* **Description**: Membership mapping between users and circles.
* **Document ID**: Composite string `${circleId}_${userId}` or auto-generated `memberId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `circle_id` | `string` | **Required** | Reference to `circles/{circleId}`. |
| `user_id` | `string` | **Required** | Reference to `users/{uid}`. |
| `role` | `string` | **Required** | Member role (`'member'`, `'admin'`, `'host'`). |
| `joined_at` | `timestamp` / `string` | **Required** | Join timestamp. |

---

### 1.13 `events` (Collection)
* **Description**: Community events hosted by circles or users.
* **Document ID**: Auto-generated `eventId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Required** | Event title. |
| `description` | `string` | **Optional** | Event details. |
| `circle_id` | `string` | **Optional** | Reference to `circles/{circleId}`. |
| `host_id` | `string` | **Required** | Reference to `users/{uid}`. |
| `location` | `string` | **Required** | Campus venue / location. |
| `date` | `string` | **Required** | Event date (`YYYY-MM-DD`). |
| `time` | `string` | **Optional** | Event time string (`HH:MM`). |
| `max_attendees` | `number` | **Optional** | Capacity limit. |
| `attendees_count` | `number` | **Optional** | Current RSVP count (Default: `0`). |
| `created_at` | `timestamp` / `string` | **Required** | Creation timestamp. |

---

### 1.14 `rsvps` (Collection)
* **Description**: Event attendance records.
* **Document ID**: Composite `${eventId}_${userId}` or auto-generated `rsvpId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `event_id` | `string` | **Required** | Reference to `events/{eventId}`. |
| `user_id` | `string` | **Required** | Reference to `users/{uid}`. |
| `status` | `string` | **Required** | RSVP state (`'going'`, `'maybe'`, `'cancelled'`). |
| `created_at` | `timestamp` / `string` | **Required** | Timestamp. |

---

### 1.15 `chats` (Collection)
* **Description**: Direct message conversations between two users.
* **Document ID**: Auto-generated `chatId` or deterministic `${uid1}_${uid2}`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `participants` | `array<string>` | **Required** | Array of participant user IDs `[uid1, uid2]`. References `users/{uid}`. |
| `participantProfiles` | `map/object` | **Optional** | Embedded profile data keyed by UID `{ [uid]: { full_name, photo_url, username } }`. |
| `lastMessage` | `string` | **Optional** | Content snippet of last sent message. |
| `lastMessageTime` / `updatedAt` | `timestamp` / `string` | **Required** | Timestamp of latest activity. |
| `unreadCount` | `map/object` | **Optional** | Unread counters per user `{ [uid]: number }`. |
| `created_at` | `timestamp` / `string` | **Required** | Chat initiation timestamp. |

---

### 1.16 `chats/{chatId}/messages` (Subcollection)
* **Description**: Individual messages inside a chat conversation.
* **Document ID**: Auto-generated `msgId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `senderId` | `string` | **Required** | Reference to `users/{uid}`. |
| `text` | `string` | **Required** | Message text body. |
| `readBy` | `array<string>` | **Optional** | Array of user UIDs who have read the message. |
| `created_at` | `timestamp` / `string` | **Required** | Sent timestamp. |

---

### 1.17 `gigs` (Collection)
* **Description**: Freelance and peer-to-peer campus task listings with escrow rewards.
* **Document ID**: Auto-generated `gigId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Required** | Gig title. |
| `desc` / `description` | `string` | **Required** | Task description and requirements. |
| `category` | `string` | **Required** | Skill category (e.g., `'Design'`, `'Tutoring'`, `'Media'`). |
| `budget` | `string` / `number` | **Required** | Reward amount in Sparks. |
| `duration` | `string` | **Optional** | Estimated timeframe. |
| `type` | `string` | **Optional** | Listing category (Default: `'CAMPUS GIG'`). |
| `company` | `string` | **Optional** | Organization / Host label. |
| `authorId` | `string` | **Required** | Reference to `users/{uid}`. |
| `authorName` | `string` | **Optional** | Author display name. |
| `authorPhoto` | `string` | **Optional** | Author avatar URL. |
| `status` | `string` | **Optional** | Gig status (`'open'`, `'in_progress'`, `'completed'`, `'closed'`, `'expired'`). |
| `assignedApplicantId` | `string` | **Optional** | Reference to `users/{uid}` of accepted applicant. |
| `applicationsCount` | `number` | **Required** | Count of received applications (Default: `0`). |
| `isHidden` | `boolean` | **Optional** | Moderation flag (Default: `false`). |
| `createdAt` | `timestamp` / `string` | **Required** | Creation timestamp. |

---

### 1.18 `gigs/{gigId}/applications` (Subcollection)
* **Description**: Applications submitted by students for a specific gig.
* **Document ID**: Applicant user's `uid`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `applicantId` | `string` | **Required** | Reference to `users/{uid}`. |
| `applicantName` | `string` | **Required** | Applicant full name. |
| `applicantPhoto` | `string` | **Optional** | Applicant avatar URL. |
| `applicantUsername` | `string` | **Optional** | Applicant handle. |
| `applicantBranch` | `string` | **Optional** | Applicant branch/major. |
| `pitch` | `string` | **Optional** | Application pitch (Max 300 characters). |
| `status` | `string` | **Required** | Status (`'PENDING'`, `'ACCEPTED'`, `'REJECTED'`). |
| `appliedAt` | `timestamp` / `string` | **Required** | Application timestamp. |

---

### 1.19 `posts` (Collection)
* **Description**: Community feed posts and work showcases.
* **Document ID**: Auto-generated `postId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `authorId` | `string` | **Required** | Reference to `users/{uid}`. |
| `authorName` | `string` | **Optional** | Author name. |
| `authorPhoto` | `string` | **Optional** | Author avatar URL. |
| `authorUsername` | `string` | **Optional** | Author handle. |
| `content` | `string` | **Required** | Text content of post. |
| `media_url` / `imageUrl` | `string` | **Optional** | Attached image URL. |
| `likesCount` | `number` | **Required** | Like counter (Default: `0`). |
| `likedBy` | `array<string>` | **Optional** | Array of user UIDs who liked the post. |
| `commentsCount` | `number` | **Optional** | Comment counter (Default: `0`). |
| `createdAt` | `timestamp` / `string` | **Required** | Post creation timestamp. |

---

### 1.20 `experiences` (Collection)
* **Description**: Pre-configured coffee meet and 1-on-1 interaction offerings created by hosts.
* **Document ID**: Auto-generated `experienceId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `title` | `string` | **Required** | Experience title (e.g., `"Coffee & Tech Chat"`). |
| `description` | `string` | **Optional** | Offer details. |
| `price` | `number` | **Required** | Price in Sparks. |
| `hostId` | `string` | **Required** | Reference to `users/{uid}`. |
| `hostName` | `string` | **Optional** | Host display name. |
| `hostPhoto` | `string` | **Optional** | Host avatar URL. |
| `location` | `string` | **Required** | Default meeting location on campus. |
| `category` | `string` | **Optional** | Experience category. |
| `active` | `boolean` | **Optional** | Availability flag (Default: `true`). |
| `created_at` | `timestamp` / `string` | **Required** | Creation timestamp. |

---

### 1.21 `bookings` (Collection)
* **Description**: 1-on-1 meetup bookings with escrow payments.
* **Document ID**: Auto-generated `bookingId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `experienceId` | `string` | **Optional** | Reference to `experiences/{experienceId}`. |
| `guestId` | `string` | **Required** | Reference to `users/{guestUid}` (Requester). |
| `guestName` | `string` | **Optional** | Guest display name. |
| `guestPhoto` | `string` | **Optional** | Guest avatar URL. |
| `hostId` | `string` | **Required** | Reference to `users/{hostUid}` (Host). |
| `hostName` | `string` | **Optional** | Host display name. |
| `hostPhoto` | `string` | **Optional** | Host avatar URL. |
| `sparksAmount` | `number` | **Required** | Escrow Sparks held for booking. |
| `location` | `string` | **Required** | Selected campus venue (from `APPROVED_LOCATIONS`). |
| `timeSlot` | `string` | **Required** | Selected meeting slot (e.g., `'2:00 PM - 3:00 PM'`). |
| `agenda` | `string` | **Optional** | Pre-meeting objective string. |
| `status` | `string` | **Required** | Lifecycle status (`'PENDING'`, `'ACCEPTED'`, `'DECLINED'`, `'COMPLETED'`, `'DISPUTED'`, `'REFUNDED'`). |
| `disputeReason` | `string` | **Optional** | Note explaining dispute if raised. |
| `disputedBy` | `string` | **Optional** | Reference to `users/{uid}` who opened dispute. |
| `disputedAt` | `timestamp` / `string` | **Optional** | Dispute timestamp. |
| `resolvedAt` | `timestamp` / `string` | **Optional** | Resolution timestamp. |
| `resolution` | `string` | **Optional** | Resolution action (`'REFUNDED_TO_GUEST'`, `'PAYOUT_TO_HOST'`). |
| `createdAt` | `timestamp` / `string` | **Required** | Booking creation timestamp. |

---

### 1.22 `reviews` (Collection)
* **Description**: Host reviews and peer feedback rating system.
* **Document ID**: Auto-generated `reviewId`.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `targetUserId` | `string` | **Required** | Reference to `users/{targetUid}` (User being reviewed). |
| `authorId` | `string` | **Required** | Reference to `users/{authorUid}` (Review author). |
| `authorName` | `string` | **Optional** | Review author name. |
| `authorPhoto` | `string` | **Optional** | Review author avatar. |
| `bookingId` | `string` | **Optional** | Reference to `bookings/{bookingId}`. |
| `rating` | `number` | **Required** | Rating scale (`1` to `5`). |
| `comment` | `string` | **Required** | Review message body. |
| `created_at` | `timestamp` / `string` | **Required** | Creation timestamp. |

---

### 1.23 `phone_otps` (Collection)
* **Description**: Temporary phone number verification codes for mobile verification.
* **Document ID**: Phone number string or auto ID.

| Field Name | Data Type | Required / Optional | Description / References |
| :--- | :--- | :--- | :--- |
| `phone` | `string` | **Required** | E.164 formatted phone number string. |
| `otp` | `string` | **Required** | 6-digit verification OTP code. |
| `uid` | `string` | **Required** | Reference to `users/{uid}`. |
| `expiresAt` | `timestamp` / `string` | **Required** | OTP expiry timestamp. |
| `created_at` | `timestamp` / `string` | **Required** | Generation timestamp. |

---

## 2. Data Routes & Functions Matrix

This section inventories every location in the codebase performing Firestore operations.

| File Path / Route | Function / API | Operation | Collection & Fields Touched |
| :--- | :--- | :--- | :--- |
| `lib/wallet.js` | `getWallet(uid)` | **Read** | Reads `wallets/{uid}` |
| `lib/wallet.js` | `getOrCreateWallet(uid)` | **Create / Read** | Reads `wallets/{uid}`; creates `wallets/{uid}`, `transactions` (`userId`, `type`, `amount`, `status`, `created_at`), `users/{uid}/notifications` (`title`, `message`, `type`, `read`, `created_at`) |
| `lib/wallet.js` | `getTransactions(uid)` | **Query** | Queries `transactions` (`userId`, `created_at`) & `payment_requests` (`userId`, `created_at`) |
| `lib/wallet.js` | `spendSparks(uid, amount)` | **Transaction Update** | Updates `wallets/{uid}` (`purchased`, `bonus`, `creator`, `updated_at`) |
| `lib/wallet.js` | `creditSparks(uid, amount)` | **Transaction Set/Update** | Sets/Updates `wallets/{uid}` (`purchased`, `creator`, `lifetime_*`) |
| `lib/firebaseAdminQueries.js` | `fetchUsersAdmin` | **Query** | Queries `users` (`isBlocked`, `status`) |
| `lib/firebaseAdminQueries.js` | `fetchProfileAdmin` | **Read** | Reads `users/{userId}` |
| `lib/firebaseAdminQueries.js` | `fetchCirclesAdmin` | **Query** | Queries `circles` (`status`) |
| `lib/firebaseAdminQueries.js` | `fetchCircleMembersAdmin` | **Query** | Queries `circle_members` (`circle_id`) |
| `lib/firebaseAdminQueries.js` | `fetchCircleEventsAdmin` | **Query** | Queries `events` (`circle_id`) |
| `lib/firebaseAdminQueries.js` | `fetchUpcomingEventsAdmin` | **Query** | Queries `events` (`date >= now`, ordered by `date asc`) |
| `lib/firebaseAdminQueries.js` | `fetchUserBookingsAdmin` | **Query** | Queries `bookings` (`guestId` & `hostId`) |
| `lib/firebaseAdminQueries.js` | `fetchNotificationsAdmin` | **Query** | Queries `notifications` (`userId`, `created_at desc`) |
| `features/auth/auth.actions.js` | `syncUserSession` | **Create / Update** | Creates/Updates `users/{uid}` and initializes `wallets/{uid}` |
| `features/circles/circles.actions.js` | `joinCircle` / `leaveCircle` | **Create / Delete** | Writes/Deletes `circle_members` & updates `circles/{id}` (`members_count`) |
| `features/events/events.actions.js` | `rsvpEvent` / `cancelRsvp` | **Create / Delete** | Writes/Deletes `rsvps` & updates `events/{id}` (`attendees_count`) |
| `app/api/auth/google/route.js` | `POST` | **Create / Update** | Updates `users/{uid}` (`full_name`, `photo_url`, `updated_at`) |
| `app/api/bookings/route.js` | `GET` / `POST` | **Read / Create** | Reads `bookings`; Creates `bookings` & deducts Sparks from `wallets/{uid}` |
| `app/api/chats/route.js` | `GET` / `POST` | **Read / Create** | Queries `chats` (`participants`); Creates `chats` document |
| `app/api/chats/[id]/messages/route.js` | `GET` / `POST` | **Read / Create** | Queries `chats/{id}/messages`; Creates message & updates `chats/{id}` (`lastMessage`, `lastMessageTime`, `unreadCount`) |
| `app/api/gigs/route.js` | `GET` / `POST` | **Read / Create** | Reads `gigs`; Creates `gigs` document & logs `transactions` |
| `app/api/gigs/[id]/apply/route.js` | `POST` | **Create / Update** | Creates `gigs/{id}/applications/{uid}` & increments `gigs/{id}.applicationsCount` |
| `app/api/gigs/[id]/complete/route.js` | `POST` | **Update** | Updates `gigs/{id}` (`status: 'completed'`) & payouts Sparks via `wallets/{applicantId}` |
| `app/api/onboarding/route.js` | `POST` | **Update / Create** | Updates `users/{uid}` profile, sets `usernames/{username}`, initializes `wallets/{uid}` |
| `app/api/users/check-username/route.js` | `GET` | **Read** | Reads `usernames/{username}` |
| `app/api/users/free-now/route.js` | `POST` | **Update** | Updates `users/{uid}` (`isLiveOnCampus`, `liveUntil`, `freeNowNote`) |
| `app/api/users/location/route.js` | `POST` | **Update** | Updates `users/{uid}` (`location`) |
| `app/api/users/block/route.js` | `POST` | **Create / Delete** | Writes/Deletes `users/{uid}/blocks/{targetUid}` |
| `app/api/wallet/intent/route.js` | `POST` | **Create** | Creates `payment_requests` (`userId`, `sparks`, `inrAmount`, `utr`, `status: 'pending'`) |
| `app/api/wallet/withdraw/route.js` | `POST` | **Create** | Creates `withdrawals` (`userId`, `sparks`, `upiId`, `status: 'pending'`) |
| `app/api/admin/verify-payment/route.js` | `POST` | **Update / Transaction** | Updates `payment_requests` status & credits `wallets/{userId}` |
| `app/api/admin/resolve-dispute/route.js` | `POST` | **Update / Transaction** | Updates `bookings/{id}` & executes Spark refund/payout transaction |
| `app/api/admin/toggle-block-user/route.js` | `POST` | **Update** | Updates `users/{uid}` (`isBlocked`, `status`) |
| `app/api/cron/auto-refund/route.js` | `POST` | **Query / Update** | Queries expired `bookings` and executes automated refund |
| `app/api/cron/expire-gigs/route.js` | `POST` | **Query / Update** | Queries expired `gigs` and updates status to `'expired'` |

---

## 3. Firebase Auth Architecture

### 3.1 Authentication Data Model
Firebase Auth retains primary identity credentials for users:
* **`uid`**: Primary 28-character unique identifier.
* **`email`**: User email address (University/Google email).
* **`displayName`**: Full display name.
* **`photoURL`**: Default OAuth avatar URL.
* **`phoneNumber`**: E.164 phone string (if verified).
* **`providerData`**: Array of linked authentication providers (`'google.com'`, `'password'`).
* **`customClaims`**: Object payload containing role permissions, e.g., `{ role: 'admin' }`.

### 3.2 Firestore Linkage
* Every Firebase Auth user corresponds 1-to-1 with a document in the `users` collection (`users/{uid}`).
* The `uid` is mirrored across `wallets/{uid}` and referenced as foreign keys (`userId`, `authorId`, `hostId`, `guestId`, `senderId`, `applicantId`) across all transactional collections.

---

## 4. Firebase Storage & Asset Handling

### 4.1 Asset Storage Strategy
* **Storage Bucket**: Configured as `process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (`Meova-ae3bc.firebasestorage.app`).
* **Media Handling**: Profile images and feed media uploaded via client components use Cloudinary (`api.cloudinary.com`) with browser image compression (`browser-image-compression`).
* **Avatar Fallbacks**: Google OAuth high-res URLs (`googleusercontent.com`) and Dicebear Adventurer API (`api.dicebear.com/9.x/micah/svg`).

### 4.2 Firestore URL Field Mapping
The following Firestore document fields store HTTP/HTTPS image URL strings:
* **`users`**: `photo_url`
* **`circles`**: `cover_image`, `host_photo`
* **`gigs`**: `authorPhoto`, `applicantPhoto`
* **`posts`**: `media_url` / `imageUrl`, `authorPhoto`
* **`experiences`**: `hostPhoto`
* **`bookings`**: `guestPhoto`, `hostPhoto`
* **`reviews`**: `authorPhoto`

---

## 5. Real-Time Listeners (`onSnapshot`)

The client application registers active real-time listeners for live dynamic updates:

| Component / Page | Collection / Path Listened | Filter / Query | Purpose |
| :--- | :--- | :--- | :--- |
| `components/Sidebar.jsx` | `users/{uid}/notifications` | `where('read', '==', false)` | Real-time unread notification badge counter. |
| `components/Sidebar.jsx` | `chats` | `where('participants', 'array-contains', user.id)` | Computes total unread direct message count. |
| `components/Sidebar.jsx` | `bookings` | `where('hostId', '==', user.id)` & `where('status', '==', 'Requested')` | Pending booking badge counter for hosts. |
| `components/Sidebar.jsx` | `wallets/{uid}` | Document listener on `wallets/{uid}` | Real-time navbar Sparks balance counter. |
| `app/messages/page.jsx` | `chats` | `where('participants', 'array-contains', uid)` ordered by `lastMessageTime desc` | Dynamic live inbox thread listing. |
| `app/messages/page.jsx` | `chats/{chatId}/messages` | Subcollection ordered by `created_at asc`, `limit(100)` | Real-time chat message stream. |

---

## 6. Entity Relationship Model

```
               +-------------------+
               |    auth.users     |
               +---------+---------+
                         | 1:1
                         v
                   +-----------+
                   |   users   | <------+
                   +-----+-----+        |
                         |              |
         +---------------+---------------+---------------+---------------+
         | 1:1           | 1:N           | 1:N           | 1:N           | 1:N
         v               v               v               v               v
   +----------+    +-----------+   +-----------+   +-----------+   +-----------+
   | wallets  |    |   gigs    |   |   posts   |   |  circles  |   |experiences|
   +----------+    +-----+-----+   +-----------+   +-----+-----+   +-----+-----+
   | 1:N           | 1:N           |               | 1:N           | 1:N
   v               v               v               v               v
+------------+  +------------+  +-----------+   +-----------+   +-----------+
|transactions|  |applications|  |   chats   |   |  events   |   | bookings  |
+------------+  +------------+  +-----+-----+   +-----+-----+   +-----+-----+
                                      | 1:N           | 1:N           | 1:N
                                      v               v               v
                                +-----------+   +-----------+   +-----------+
                                | messages  |   |   rsvps   |   |  reviews  |
                                +-----------+   +-----------+   +-----------+
```

### Relational Descriptions:
1. **Users to Wallets**: Strict 1-to-1 relationship (`users.uid` == `wallets.userId`).
2. **Users to Transactions**: 1-to-Many (`transactions.userId` foreign key).
3. **Users to Gigs**: 1-to-Many as host (`gigs.authorId`).
4. **Gigs to Applications**: 1-to-Many subcollection (`gigs/{gigId}/applications/{applicantId}`).
5. **Users to Posts**: 1-to-Many (`posts.authorId`).
6. **Users to Circles**: 1-to-Many as creator (`circles.host_id`) and N-to-M member mapping via `circle_members` (`circle_id`, `user_id`).
7. **Circles to Events**: 1-to-Many (`events.circle_id`).
8. **Users to Events**: N-to-M attendee mapping via `rsvps` (`event_id`, `user_id`).
9. **Users to Chats**: N-to-M conversations via `chats.participants` array containing user UIDs.
10. **Chats to Messages**: 1-to-Many subcollection (`chats/{chatId}/messages/{msgId}`).
11. **Users to Experiences**: 1-to-Many as host (`experiences.hostId`).
12. **Users to Bookings**: 1-to-Many as guest (`bookings.guestId`) and as host (`bookings.hostId`).
13. **Bookings to Reviews**: 1-to-Many / 1-to-1 target feedback (`reviews.bookingId`, `reviews.targetUserId`).

---

## 7. Security Rules Summary (`firestore.rules`)

The security policy enforces strict document access controls:

* **Authentication Helper Functions**:
  * `isAdmin()`: Validates that `request.auth` is non-null and `users/{auth.uid}.role == 'admin'`.
  * `isOwner(userId)`: Validates that `request.auth.uid == userId`.

* **Collection Access Permissions**:
  * **`users/{uid}`**: Authenticated users can read any profile. Write allowed only by profile owner or admin.
  * **`users/{uid}/notifications`**: Read/Update/Delete allowed only by profile owner. Create allowed by authenticated users/server.
  * **`wallets/{uid}`**: Read allowed for owner or admin. **Client-side write is completely blocked** (`allow write: if false`). Wallets are modified exclusively via Firebase Admin SDK.
  * **`transactions`**: Read allowed for owner (`userId`) or admin. **Client-side write blocked** (`allow write: if false`).
  * **`withdrawals`**: Read for owner or admin. Create allowed for authenticated user where `userId == auth.uid` and `status == 'pending'`. Update/Delete restricted to admin.
  * **`payment_requests`**: Read for owner or admin. Create allowed for authenticated user where `userId == auth.uid` and `status == 'pending'`. Update/Delete restricted to admin.
  * **`audit_logs`**: Restricted strictly to admin read/write.
  * **`circles` & `events`**: Public read. Write allowed for authenticated users.
  * **`chats`**: Read/Update restricted to conversation participants (`request.auth.uid in resource.data.participants`). Client creation/deletion blocked.
  * **`chats/{chatId}/messages`**: Read/Create restricted to chat participants (with `senderId == auth.uid`). Update/Delete blocked.
  * **`usernames`**: Public read for handle checking. Create/Update/Delete restricted to username owner.

---

## 8. Complex Queries & Composite Index Requirements

The following queries executed in the application require composite index definitions in PostgreSQL/Supabase:

1. **`transactions`**:
   * Filter: `userId == uid`
   * Sort: `created_at DESC`
   * Index: `(user_id ASC, created_at DESC)`

2. **`payment_requests`**:
   * Filter: `userId == uid`
   * Sort: `created_at DESC`
   * Index: `(user_id ASC, created_at DESC)`

3. **`payment_requests`**:
   * Filter: `userId == uid AND status == 'pending'`
   * Index: `(user_id ASC, status ASC)`

4. **`withdrawals`**:
   * Filter: `userId == uid`
   * Sort: `requested_at DESC`
   * Index: `(user_id ASC, requested_at DESC)`

5. **`circles`**:
   * Filter: `status == 'pending_approval'`
   * Sort: `created_at DESC`
   * Index: `(status ASC, created_at DESC)`

6. **`events`**:
   * Filter: `date >= current_date`
   * Sort: `date ASC`
   * Index: `(date ASC)`

7. **`experiences`**:
   * Filter: `active != false AND hostId == hostId`
   * Index: `(host_id ASC, active ASC)`

8. **`notifications`**:
   * Filter: `userId == uid`
   * Sort: `created_at DESC`
   * Index: `(user_id ASC, created_at DESC)`

9. **`chats`**:
   * Filter: `participants ARRAY_CONTAINS uid`
   * Sort: `lastMessageTime DESC`
   * Index / GIN Index: `(participants GIN, last_message_time DESC)`

10. **`bookings`**:
   * Filter: `hostId == uid AND status == 'Requested'`
   * Index: `(host_id ASC, status ASC)`
