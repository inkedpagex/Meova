-- ============================================================================
-- MEETIFY — Complete PostgreSQL Database Schema
-- Run this script FIRST in the Supabase SQL Editor before supabase_functions.sql
-- ============================================================================

-- Reset public schema if previously created with old UUID types
drop schema if exists public cascade;
create schema public;

-- Grant Schema Usage to Supabase Roles
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres;
grant all on schema public to public;

-- Enable pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Profiles (replaces Firestore 'users' collection)
-- Text ID accepts both Supabase Auth UUIDs and Firebase alphanumeric UIDs
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  text primary key,
  email               text,
  full_name           text,
  username            text unique,
  photo_url           text,
  gender              text,
  role                text default 'user',
  is_blocked          boolean default false,
  status              text default 'active',
  year                text,
  branch              text,
  bio                 text,
  interests           text[] default '{}',
  instagram           text,
  upi_id              text,
  profile_complete    boolean default true,
  is_live_on_campus   boolean default false,
  live_location       jsonb,
  created_at          timestamp with time zone default now(),
  updated_at          timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 2. Usernames (atomic username reservation)
-- ----------------------------------------------------------------------------
create table if not exists public.usernames (
  username   text primary key,
  user_id    text not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 3. Wallets (user token balances and lifetime tracking)
-- ----------------------------------------------------------------------------
create table if not exists public.wallets (
  user_id            text primary key references public.profiles(id) on delete cascade,
  purchased          numeric default 0 check (purchased >= 0),
  bonus              numeric default 0 check (bonus >= 0),
  creator            numeric default 0 check (creator >= 0),
  lifetime_purchased numeric default 0 check (lifetime_purchased >= 0),
  lifetime_earned    numeric default 0 check (lifetime_earned >= 0),
  lifetime_withdrawn numeric default 0 check (lifetime_withdrawn >= 0),
  created_at         timestamp with time zone default now(),
  updated_at         timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 4. Transactions (ledger of balance deductions, payouts, and purchases)
-- ----------------------------------------------------------------------------
create table if not exists public.transactions (
  id           text primary key default gen_random_uuid()::text,
  user_id      text not null references public.profiles(id) on delete cascade,
  type         text not null,
  amount       numeric not null,
  description  text,
  status       text default 'COMPLETED',
  reference_id text,
  created_at   timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 5. Payment Requests (UPI spark purchase intents)
-- ----------------------------------------------------------------------------
create table if not exists public.payment_requests (
  id             text primary key default gen_random_uuid()::text,
  user_id        text not null references public.profiles(id) on delete cascade,
  user_name      text,
  user_email     text,
  sparks         numeric not null,
  rupees         numeric not null,
  upi_id         text,
  utr_number     text,
  unique_decimal text,
  status         text default 'pending',
  created_at     timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 6. Withdrawals (spark cash-out requests)
-- ----------------------------------------------------------------------------
create table if not exists public.withdrawals (
  id           text primary key default gen_random_uuid()::text,
  user_id      text not null references public.profiles(id) on delete cascade,
  sparks       numeric not null,
  rupees       numeric not null,
  upi_id       text not null,
  status       text default 'pending',
  requested_at timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 7. Gigs (campus task marketplace)
-- ----------------------------------------------------------------------------
create table if not exists public.gigs (
  id                     text primary key default gen_random_uuid()::text,
  title                  text not null,
  description            text,
  category               text,
  reward_sparks          numeric not null check (reward_sparks > 0),
  status                 text default 'open',
  host_id                text not null references public.profiles(id) on delete cascade,
  host_name              text,
  host_photo             text,
  selected_applicant_id  text references public.profiles(id) on delete set null,
  applications_count     integer default 0,
  created_at             timestamp with time zone default now(),
  expires_at             timestamp with time zone
);

-- ----------------------------------------------------------------------------
-- 8. Gig Applications
-- ----------------------------------------------------------------------------
create table if not exists public.gig_applications (
  id              text primary key default gen_random_uuid()::text,
  gig_id          text not null references public.gigs(id) on delete cascade,
  applicant_id    text not null references public.profiles(id) on delete cascade,
  applicant_name  text,
  applicant_photo text,
  pitch           text,
  status          text default 'pending',
  created_at      timestamp with time zone default now(),
  unique (gig_id, applicant_id)
);

-- ----------------------------------------------------------------------------
-- 9. Bookings (meetups & escrow)
-- ----------------------------------------------------------------------------
create table if not exists public.bookings (
  id           text primary key default gen_random_uuid()::text,
  guest_id     text not null references public.profiles(id) on delete cascade,
  host_id      text not null references public.profiles(id) on delete cascade,
  sparks_spent numeric not null default 0,
  status       text default 'Requested',
  location     text,
  time_slot    text,
  agenda       text,
  created_at   timestamp with time zone default now(),
  updated_at   timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 10. Chats & Messages
-- ----------------------------------------------------------------------------
create table if not exists public.chats (
  id                 text primary key,
  participants       text[] not null,
  participant_names  jsonb default '{}'::jsonb,
  participant_photos jsonb default '{}'::jsonb,
  unread_count       jsonb default '{}'::jsonb,
  last_message       text,
  last_sender_id     text,
  last_message_at    timestamp with time zone default now(),
  created_at         timestamp with time zone default now()
);

create table if not exists public.chat_messages (
  id         text primary key default gen_random_uuid()::text,
  chat_id    text not null references public.chats(id) on delete cascade,
  sender_id  text not null,
  text       text not null,
  status     text default 'sent',
  created_at timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 11. Notifications
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references public.profiles(id) on delete cascade,
  sender_id  text references public.profiles(id) on delete cascade,
  title      text not null,
  message    text not null,
  type       text default 'system',
  read       boolean default false,
  created_at timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 12. Device Tokens (Native FCM / Capacitor)
-- ----------------------------------------------------------------------------
create table if not exists public.device_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  fcm_token  text not null,
  platform   text not null default 'android',
  updated_at timestamp with time zone default now(),
  constraint unique_user_platform unique (user_id, platform)
);

create table if not exists public.fcm_tokens (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references public.profiles(id) on delete cascade,
  token      text unique not null,
  created_at timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 13. Blocks (user blocking)
-- ----------------------------------------------------------------------------
create table if not exists public.blocks (
  id         text primary key default gen_random_uuid()::text,
  blocker_id text not null references public.profiles(id) on delete cascade,
  blocked_id text not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (blocker_id, blocked_id)
);

-- ----------------------------------------------------------------------------
-- 14. Circles & Circle Members
-- ----------------------------------------------------------------------------
create table if not exists public.circles (
  id            text primary key default gen_random_uuid()::text,
  name          text not null,
  description   text,
  category      text,
  icon          text,
  creator_id    text references public.profiles(id) on delete set null,
  status        text default 'active',
  members_count integer default 1,
  created_at    timestamp with time zone default now()
);

create table if not exists public.circle_members (
  id         text primary key default gen_random_uuid()::text,
  circle_id  text not null references public.circles(id) on delete cascade,
  user_id    text not null references public.profiles(id) on delete cascade,
  role       text default 'member',
  joined_at  timestamp with time zone default now(),
  unique (circle_id, user_id)
);

-- ----------------------------------------------------------------------------
-- 15. Events
-- ----------------------------------------------------------------------------
create table if not exists public.events (
  id          text primary key default gen_random_uuid()::text,
  circle_id   text references public.circles(id) on delete cascade,
  title       text not null,
  description text,
  date        text,
  location    text,
  host_id     text references public.profiles(id) on delete set null,
  created_at  timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 16. Posts
-- ----------------------------------------------------------------------------
create table if not exists public.posts (
  id           text primary key default gen_random_uuid()::text,
  user_id      text not null references public.profiles(id) on delete cascade,
  author_name  text,
  author_photo text,
  content      text,
  media_urls   text[] default '{}',
  likes_count  integer default 0,
  created_at   timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- 17. Experiences & Reviews
-- ----------------------------------------------------------------------------
create table if not exists public.experiences (
  id           text primary key default gen_random_uuid()::text,
  host_id      text not null references public.profiles(id) on delete cascade,
  title        text not null,
  description  text,
  price_sparks numeric default 0,
  active       boolean default true,
  created_at   timestamp with time zone default now()
);

create table if not exists public.reviews (
  id             text primary key default gen_random_uuid()::text,
  reviewer_id    text not null references public.profiles(id) on delete cascade,
  target_user_id text not null references public.profiles(id) on delete cascade,
  rating         numeric check (rating >= 1 and rating <= 5),
  comment        text,
  created_at     timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- Indexes for High Performance
-- ----------------------------------------------------------------------------
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_gigs_host_id on public.gigs(host_id);
create index if not exists idx_gigs_author_status on public.gigs(author_id, status);
create index if not exists idx_bookings_guest_id on public.bookings(guest_id);
create index if not exists idx_bookings_host_id on public.bookings(host_id);
create index if not exists idx_bookings_host_status on public.bookings(host_id, status);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, read, created_at desc);
create index if not exists idx_transactions_user_date on public.transactions(user_id, created_at desc);
create index if not exists idx_posts_created_at_desc on public.posts(created_at desc);
create index if not exists idx_post_likes_user_post on public.post_likes(user_id, post_id);
create index if not exists idx_chat_messages_chat_created on public.chat_messages(chat_id, created_at desc);
create index if not exists idx_device_tokens_user_platform on public.device_tokens(user_id, platform);
create index if not exists idx_blocks_blocker on public.blocks(blocker_id);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);

-- ----------------------------------------------------------------------------
-- Grant All Table & Function Permissions to Supabase Roles
-- ----------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on all tables in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all privileges on all functions in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
