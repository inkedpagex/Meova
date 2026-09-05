-- ==============================================================================
-- Migration: Native Firebase Cloud Messaging (FCM) & Device Tokens Setup
-- ==============================================================================

-- 1. Create minimal device_tokens table
create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  fcm_token text not null,
  platform text not null default 'android',
  updated_at timestamptz not null default now(),
  constraint unique_user_platform unique (user_id, platform)
);

-- 2. Create index for fast lookups
create index if not exists idx_device_tokens_user_id on public.device_tokens(user_id);

-- 3. Enable Row Level Security (RLS)
alter table public.device_tokens enable row level security;

-- Drop existing policies if any
drop policy if exists "Users manage own device_tokens" on public.device_tokens;
drop policy if exists "Service role full access device_tokens" on public.device_tokens;

-- 4. RLS Policies
create policy "Users manage own device_tokens"
  on public.device_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access device_tokens"
  on public.device_tokens
  for all
  using (auth.role() = 'service_role');

-- ==============================================================================
-- 5. Optional Postgres Trigger for Automatic Chat Notifications
-- ==============================================================================
-- This function automatically notifies the recipient when a new message is inserted.
-- It invokes the Supabase Edge Function 'send-notification' via pg_net.

create or replace function public.handle_new_message_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  sender_record record;
  recipient_id uuid;
  project_url text := current_setting('app.settings.supabase_url', true);
  anon_key text := current_setting('app.settings.supabase_anon_key', true);
begin
  -- Fetch sender details
  select full_name into sender_record from public.users where id = NEW.sender_id;

  -- Determine recipient (if conversation is between 2 users)
  recipient_id := NEW.recipient_id;

  if recipient_id is not null and recipient_id <> NEW.sender_id then
    -- If pg_net extension is available, trigger Edge Function in background
    if exists (select 1 from pg_extension where extname = 'pg_net') then
      perform net.http_post(
        url := coalesce(project_url, '') || '/functions/v1/send-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || coalesce(anon_key, '')
        ),
        body := jsonb_build_object(
          'target_user_id', recipient_id,
          'title', coalesce(sender_record.full_name, 'New Message'),
          'body', NEW.content,
          'data', jsonb_build_object(
            'type', 'message',
            'sender_id', NEW.sender_id,
            'conversation_id', NEW.conversation_id,
            'url', '/messages?userId=' || NEW.sender_id
          )
        )
      );
    end if;
  end if;

  return NEW;
end;
$$;
