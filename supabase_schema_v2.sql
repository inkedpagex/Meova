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
-- Grant permissions on new tables
-- ----------------------------------------------------------------------------
grant all privileges on table public.phone_otps to postgres, anon, authenticated, service_role;
grant all privileges on table public.post_likes to postgres, anon, authenticated, service_role;
grant all privileges on table public.audit_logs to postgres, anon, authenticated, service_role;
