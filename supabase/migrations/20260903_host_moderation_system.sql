-- Migration: Campus Host and Community Moderation System
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create Dedicated Host Moderation Logs Table
create table if not exists public.host_moderation_logs (
  id              text primary key default gen_random_uuid()::text,
  host_id         text not null references public.profiles(id) on delete cascade,
  action_type     text not null, -- 'DELETE_POST', 'HIDE_POST', 'SUSPEND_USER', 'UNSUSPEND_USER', 'KICK_MEMBER'
  target_type     text not null, -- 'post', 'profile', 'circle', 'circle_member'
  target_id       text not null,
  target_user_id  text references public.profiles(id) on delete set null,
  reason          text not null,
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamp with time zone default now()
);

create index if not exists idx_host_logs_host_id on public.host_moderation_logs(host_id);
create index if not exists idx_host_logs_target_user on public.host_moderation_logs(target_user_id);
create index if not exists idx_host_logs_action on public.host_moderation_logs(action_type);
grant all privileges on table public.host_moderation_logs to postgres, anon, authenticated, service_role;

-- 2. Suspension tracking columns on profiles
alter table public.profiles add column if not exists is_suspended boolean default false;
alter table public.profiles add column if not exists suspended_reason text;
alter table public.profiles add column if not exists suspended_by text;
alter table public.profiles add column if not exists suspended_at timestamp with time zone;
alter table public.profiles add column if not exists is_host boolean default false;

-- 3. Moderation tracking columns on posts
alter table public.posts add column if not exists is_hidden boolean default false;
alter table public.posts add column if not exists moderated_by text;
alter table public.posts add column if not exists moderated_reason text;

-- 4. Fast indexes for querying
create index if not exists idx_profiles_is_suspended on public.profiles(is_suspended);
create index if not exists idx_posts_is_hidden on public.posts(is_hidden);
