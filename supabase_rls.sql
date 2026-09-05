-- ============================================================================
-- MEETIFY — Row Level Security (RLS) & Role Access Control
-- Run this script in the Supabase SQL Editor to secure your database.
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.usernames enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.payment_requests enable row level security;
alter table public.withdrawals enable row level security;
alter table public.gigs enable row level security;
alter table public.gig_applications enable row level security;
alter table public.bookings enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.fcm_tokens enable row level security;
alter table public.blocks enable row level security;
alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.events enable row level security;
alter table public.posts enable row level security;
alter table public.experiences enable row level security;
alter table public.reviews enable row level security;

-- Drop any existing public policies to reset cleanly
drop policy if exists "Public profiles read" on public.profiles;
drop policy if exists "User profile update" on public.profiles;
drop policy if exists "Service role full access profiles" on public.profiles;

-- 1. Profiles
create policy "Public profiles read" on public.profiles for select using (true);
create policy "User profile update" on public.profiles for update using (auth.uid()::text = id);
create policy "Service role full access profiles" on public.profiles for all using (auth.role() = 'service_role');

-- 2. Wallets (Read-only by owner, writes restricted to service_role)
create policy "Owner read wallet" on public.wallets for select using (auth.uid()::text = user_id);
create policy "Service role full access wallets" on public.wallets for all using (auth.role() = 'service_role');

-- 3. Transactions (Read-only by owner)
create policy "Owner read transactions" on public.transactions for select using (auth.uid()::text = user_id);
create policy "Service role full access transactions" on public.transactions for all using (auth.role() = 'service_role');

-- 4. Payment Requests & Withdrawals
create policy "Owner read payment_requests" on public.payment_requests for select using (auth.uid()::text = user_id);
create policy "Service role full access payment_requests" on public.payment_requests for all using (auth.role() = 'service_role');

create policy "Owner read withdrawals" on public.withdrawals for select using (auth.uid()::text = user_id);
create policy "Service role full access withdrawals" on public.withdrawals for all using (auth.role() = 'service_role');

-- 5. Chats & Messages (Participant access)
create policy "Participant read chats" on public.chats for select using (auth.uid()::text = any(participants));
create policy "Service role full access chats" on public.chats for all using (auth.role() = 'service_role');

create policy "Participant read chat_messages" on public.chat_messages for select using (
  exists (select 1 from public.chats where id = chat_messages.chat_id and auth.uid()::text = any(participants))
);
create policy "Participant insert chat_messages" on public.chat_messages for insert with check (auth.uid()::text = sender_id);
create policy "Service role full access chat_messages" on public.chat_messages for all using (auth.role() = 'service_role');

-- 6. Notifications & FCM Tokens
create policy "Owner read notifications" on public.notifications for select using (auth.uid()::text = user_id);
create policy "Owner update notifications" on public.notifications for update using (auth.uid()::text = user_id);
create policy "Service role full access notifications" on public.notifications for all using (auth.role() = 'service_role');

create policy "Owner manage device_tokens" on public.device_tokens for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Service role full access device_tokens" on public.device_tokens for all using (auth.role() = 'service_role');

create policy "Owner manage fcm_tokens" on public.fcm_tokens for all using (auth.uid()::text = user_id);
create policy "Service role full access fcm_tokens" on public.fcm_tokens for all using (auth.role() = 'service_role');

-- 7. Gigs, Bookings, Posts, Circles, Events (Public read / Authenticated create)
create policy "Public read gigs" on public.gigs for select using (true);
create policy "Host insert gigs" on public.gigs for insert with check (auth.uid()::text = host_id);
create policy "Host update gigs" on public.gigs for update using (auth.uid()::text = host_id);
create policy "Service role full access gigs" on public.gigs for all using (auth.role() = 'service_role');

create policy "User read bookings" on public.bookings for select using (auth.uid()::text = guest_id or auth.uid()::text = host_id);
create policy "Service role full access bookings" on public.bookings for all using (auth.role() = 'service_role');

create policy "Public read posts" on public.posts for select using (true);
create policy "Author insert posts" on public.posts for insert with check (auth.uid()::text = user_id);
create policy "Author update posts" on public.posts for update using (auth.uid()::text = user_id);
create policy "Service role full access posts" on public.posts for all using (auth.role() = 'service_role');

create policy "Public read circles" on public.circles for select using (true);
create policy "Service role full access circles" on public.circles for all using (auth.role() = 'service_role');

create policy "Public read events" on public.events for select using (true);
create policy "Service role full access events" on public.events for all using (auth.role() = 'service_role');
