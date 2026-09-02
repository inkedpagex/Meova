-- ============================================================================
-- MEETIFY — Schema v2 Migrations
-- Run this AFTER supabase_schema.sql in the Supabase SQL Editor
-- Adds missing columns and tables needed for full Firebase → Supabase migration
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Extend: profiles — phone verification + joined groups
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone               text,
  add column if not exists phone_verified      boolean default false,
  add column if not exists phone_verified_at   timestamp with time zone,
  add column if not exists joined_groups       jsonb default '[]'::jsonb,
  add column if not exists looking_for         text,
  add column if not exists study_style         text,
  add column if not exists is_host             boolean default false,
  add column if not exists age                 integer default 20,
  add column if not exists university          text;

-- ----------------------------------------------------------------------------
-- Extend: circles — full community fields
-- ----------------------------------------------------------------------------
alter table public.circles
  add column if not exists invite_link         text,
  add column if not exists platform            text default 'WhatsApp',
  add column if not exists price               numeric default 0,
  add column if not exists is_paid             boolean default false,
  add column if not exists total_sparks_earned numeric default 0,
  add column if not exists member_count        integer default 1,
  add column if not exists host_name           text,
  add column if not exists host_photo          text,
  add column if not exists image               text,
  add column if not exists approved_by         text,
  add column if not exists approved_at         timestamp with time zone,
  add column if not exists admin_note          text,
  add column if not exists updated_at          timestamp with time zone default now();

-- ----------------------------------------------------------------------------
-- Extend: circle_members — sparks_paid tracking
-- ----------------------------------------------------------------------------
alter table public.circle_members
  add column if not exists sparks_paid numeric default 0;

-- ----------------------------------------------------------------------------
-- Extend: posts — more fields
-- ----------------------------------------------------------------------------
alter table public.posts
  add column if not exists category      text,
  add column if not exists location      text,
  add column if not exists author_branch text,
  add column if not exists is_hidden     boolean default false,
  add column if not exists likes_count   integer default 0;

-- ----------------------------------------------------------------------------
-- Extend: gig_applications — accept/reject workflow fields
-- ----------------------------------------------------------------------------
alter table public.gig_applications
  add column if not exists meeting_code  text,
  add column if not exists accepted_at   timestamp with time zone,
  add column if not exists rejected_at   timestamp with time zone,
  add column if not exists escrow_amount numeric default 0;

-- ----------------------------------------------------------------------------
-- Extend: gigs — more fields matching current Firestore shape
-- ----------------------------------------------------------------------------
alter table public.gigs
  add column if not exists author_id             text references public.profiles(id) on delete cascade,
  add column if not exists company               text,
  add column if not exists budget                text,
  add column if not exists duration              text,
  add column if not exists type                  text default 'FREELANCE',
  add column if not exists desc                  text,
  add column if not exists accepted_applicant_id text references public.profiles(id) on delete set null,
  add column if not exists updated_at            timestamp with time zone default now();

-- ----------------------------------------------------------------------------
-- Extend: bookings — meeting status, codes & disputes
-- ----------------------------------------------------------------------------
alter table public.bookings
  add column if not exists title               text,
  add column if not exists price               numeric default 0,
  add column if not exists meeting_code        text,
  add column if not exists disputed_at         timestamp with time zone,
  add column if not exists disputed_by         text,
  add column if not exists completed_at        timestamp with time zone,
  add column if not exists cancelled_at        timestamp with time zone,
  add column if not exists cancellation_reason text,
  add column if not exists booking_date        text;

-- ----------------------------------------------------------------------------
-- Extend: notifications — direct action metadata
-- ----------------------------------------------------------------------------
alter table public.notifications
  add column if not exists booking_id text,
  add column if not exists gig_id     text,
  add column if not exists action_url text;

-- ----------------------------------------------------------------------------
-- Extend: transactions — extra metadata fields
-- ----------------------------------------------------------------------------
alter table public.transactions
  add column if not exists to_user_id   text,
  add column if not exists from_user_id text,
  add column if not exists spark_type   text,
  add column if not exists metadata     jsonb;

-- ----------------------------------------------------------------------------
-- New: phone_otps — temporary OTP storage with TTL
-- ----------------------------------------------------------------------------
create table if not exists public.phone_otps (
  user_id    text primary key references public.profiles(id) on delete cascade,
  phone      text not null,
  otp        text not null,
  expires_at timestamp with time zone not null,
  attempts   integer default 0,
  created_at timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- New: post_likes — prevents duplicate likes per user per post
-- ----------------------------------------------------------------------------
create table if not exists public.post_likes (
  id         text primary key default gen_random_uuid()::text,
  post_id    text not null references public.posts(id) on delete cascade,
  user_id    text not null references public.profiles(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (post_id, user_id)
);

-- ----------------------------------------------------------------------------
-- New: audit_logs — admin action history
-- ----------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id         text primary key default gen_random_uuid()::text,
  admin_id   text not null references public.profiles(id) on delete cascade,
  action     text not null,
  target_uid text,
  old_value  jsonb,
  new_value  jsonb,
  timestamp  timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- Indexes for new tables/columns
-- ----------------------------------------------------------------------------
create index if not exists idx_phone_otps_user_id on public.phone_otps(user_id);
create index if not exists idx_post_likes_post_id on public.post_likes(post_id);
create index if not exists idx_post_likes_user_id on public.post_likes(user_id);
create index if not exists idx_audit_logs_admin_id on public.audit_logs(admin_id);
create index if not exists idx_circles_host_id on public.circles(creator_id);
create index if not exists idx_circles_status on public.circles(status);
create index if not exists idx_gigs_author_id on public.gigs(author_id);

-- ----------------------------------------------------------------------------
-- Extend: circles — monetization, base member count, and direct invite links
-- ----------------------------------------------------------------------------
alter table public.circles
  add column if not exists whatsapp_link        text,
  add column if not exists invite_link          text,
  add column if not exists price                integer default 0,
  add column if not exists is_paid              boolean default false,
  add column if not exists platform             text default 'WhatsApp',
  add column if not exists image                text,
  add column if not exists member_count         integer default 1,
  add column if not exists total_sparks_earned  integer default 0,
  add column if not exists host_name            text,
  add column if not exists host_photo           text,
  add column if not exists updated_at           timestamp with time zone default now();

-- ----------------------------------------------------------------------------
-- Extend: bookings — 20-minute live synchronized timer & progression
-- ----------------------------------------------------------------------------
alter table public.bookings
  add column if not exists started_at        timestamp with time zone,
  add column if not exists duration_minutes  integer default 20,
  add column if not exists host_tier_price   numeric default 100;

-- ----------------------------------------------------------------------------
-- New: story_campaign_claims — Top 100 Instagram Story Growth Campaign
-- ----------------------------------------------------------------------------
create table if not exists public.story_campaign_claims (
  id                  text primary key default gen_random_uuid()::text,
  user_id             text not null references public.profiles(id) on delete cascade,
  user_name           text,
  user_email          text,
  instagram_handle    text not null,
  reward_sparks       numeric default 100,
  status              text default 'pending', -- 'pending' | 'approved' | 'rejected'
  admin_note          text,
  reviewed_by         text references public.profiles(id) on delete set null,
  reviewed_at         timestamp with time zone,
  created_at          timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- New: post_reports & user_reports — Campus Content & Safety Moderation Shield
-- ----------------------------------------------------------------------------
create table if not exists public.post_reports (
  id          text primary key default gen_random_uuid()::text,
  post_id     text not null references public.posts(id) on delete cascade,
  reporter_id text not null references public.profiles(id) on delete cascade,
  reason      text not null,
  created_at  timestamp with time zone default now(),
  unique (post_id, reporter_id)
);

create table if not exists public.user_reports (
  id               text primary key default gen_random_uuid()::text,
  reported_user_id text not null references public.profiles(id) on delete cascade,
  reporter_id      text not null references public.profiles(id) on delete cascade,
  reason           text not null,
  created_at       timestamp with time zone default now()
);

-- ----------------------------------------------------------------------------
-- Indexes for new campaign and safety tables
-- ----------------------------------------------------------------------------
create index if not exists idx_story_claims_status on public.story_campaign_claims(status, created_at desc);
create index if not exists idx_story_claims_user on public.story_campaign_claims(user_id);
create index if not exists idx_post_reports_post on public.post_reports(post_id);
create index if not exists idx_user_reports_target on public.user_reports(reported_user_id);

-- ----------------------------------------------------------------------------
-- New: rsvps — Campus Event Attendance Tracking
-- ----------------------------------------------------------------------------
create table if not exists public.rsvps (
  id          text primary key default gen_random_uuid()::text,
  event_id    text not null references public.events(id) on delete cascade,
  user_id     text not null references public.profiles(id) on delete cascade,
  status      text default 'going',
  created_at  timestamp with time zone default now(),
  unique (event_id, user_id)
);

-- ----------------------------------------------------------------------------
-- Comprehensive Column Extensions across all core tables
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists phone_verified          boolean default false,
  add column if not exists phone_verified_at       timestamp with time zone,
  add column if not exists live_until              timestamp with time zone,
  add column if not exists last_location_update    timestamp with time zone,
  add column if not exists completed_meets_count   integer default 0;

alter table public.notifications
  add column if not exists url           text,
  add column if not exists sender_name   text,
  add column if not exists sender_photo  text,
  add column if not exists gig_id        text;

alter table public.payment_requests
  add column if not exists email           text,
  add column if not exists amount_inr      numeric,
  add column if not exists unique_decimal  text,
  add column if not exists reference_code  text,
  add column if not exists updated_at      timestamp with time zone;

alter table public.withdrawals
  add column if not exists email         text,
  add column if not exists bank_details  jsonb,
  add column if not exists admin_id      text,
  add column if not exists reviewed_at   timestamp with time zone,
  add column if not exists processed_at  timestamp with time zone,
  add column if not exists remarks       text;

alter table public.bookings
  add column if not exists auto_refunded_at  timestamp with time zone,
  add column if not exists completed_at      timestamp with time zone;

alter table public.gigs
  add column if not exists expired_at             timestamp with time zone,
  add column if not exists accepted_applicant_id  text;

alter table public.transactions
  add column if not exists spark_type     text,
  add column if not exists metadata       jsonb,
  add column if not exists withdrawal_id  text;

alter table public.audit_logs
  add column if not exists admin_uid      text,
  add column if not exists target_id      text,
  add column if not exists details        jsonb,
  add column if not exists amount         numeric,
  add column if not exists message        text,
  add column if not exists host_id        text,
  add column if not exists freelancer_id  text,
  add column if not exists gig_title      text,
  add column if not exists created_at     timestamp with time zone default now();

-- ----------------------------------------------------------------------------
-- Grant permissions on new tables
-- ----------------------------------------------------------------------------
grant all privileges on table public.phone_otps to postgres, anon, authenticated, service_role;
grant all privileges on table public.post_likes to postgres, anon, authenticated, service_role;
grant all privileges on table public.audit_logs to postgres, anon, authenticated, service_role;
grant all privileges on table public.circles to postgres, anon, authenticated, service_role;
grant all privileges on table public.circle_members to postgres, anon, authenticated, service_role;
grant all privileges on table public.story_campaign_claims to postgres, anon, authenticated, service_role;
grant all privileges on table public.post_reports to postgres, anon, authenticated, service_role;
grant all privileges on table public.user_reports to postgres, anon, authenticated, service_role;
grant all privileges on table public.rsvps to postgres, anon, authenticated, service_role;

