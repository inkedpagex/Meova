-- ============================================================================
-- MEOVA VERIFIED / UNVERIFIED USER TIER SYSTEM & MEETING RATES MIGRATION
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1. Extend profiles table with tier, rates, and verification columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'not_verified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_meeting_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_meeting_rate integer NOT NULL DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS next_eligible_resubmit_at timestamptz;

-- Set constraint on tier
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_tier_check'
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_tier_check CHECK (tier IN ('not_verified', 'verified'));
  END IF;
END $$;

-- 2. Create public.users view pointing to public.profiles for unified querying
CREATE OR REPLACE VIEW public.users AS SELECT * FROM public.profiles;

-- 3. Create verification_requests table
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  selfie_url text NOT NULL,
  id_document_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by text,
  rejection_reason text,
  rejection_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT verification_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);

-- 4. Create calls table for WebRTC call tracking and server-side tier gating
CREATE TABLE IF NOT EXISTS public.calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  callee_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  call_type text NOT NULL DEFAULT 'voice', -- 'voice' | 'video'
  room_id text NOT NULL,
  status text NOT NULL DEFAULT 'initiated', -- 'initiated' | 'connected' | 'ended' | 'rejected'
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_calls_caller_id ON public.calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_callee_id ON public.calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_calls_room_id ON public.calls(room_id);

-- 5. Extend bookings (meetings) table with mutual confirmation & anti-double-counting flags
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS confirmed_by_initiator boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS confirmed_by_recipient boolean DEFAULT false;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS counted_for_tier boolean DEFAULT false;

-- Create public.meetings view pointing to public.bookings
CREATE OR REPLACE VIEW public.meetings AS SELECT * FROM public.bookings;

-- 6. Trigger: Photo change on verified profile auto-reverts tier to 'not_verified'
CREATE OR REPLACE FUNCTION public.handle_profile_photo_change_reverification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_doc text;
  v_rej_count integer := 0;
BEGIN
  IF OLD.tier = 'verified' AND NEW.photo_url IS DISTINCT FROM OLD.photo_url AND NEW.photo_url IS NOT NULL AND NEW.photo_url <> '' THEN
    SELECT id_document_url, rejection_count INTO v_last_doc, v_rej_count
    FROM public.verification_requests
    WHERE user_id = NEW.id
    ORDER BY created_at DESC
    LIMIT 1;

    NEW.tier := 'not_verified';
    NEW.verified_at := NULL;

    IF v_last_doc IS NOT NULL THEN
      INSERT INTO public.verification_requests (
        user_id,
        selfie_url,
        id_document_url,
        status,
        rejection_count,
        submitted_at
      ) VALUES (
        NEW.id,
        NEW.photo_url,
        v_last_doc,
        'pending',
        COALESCE(v_rej_count, 0),
        now()
      );
    END IF;

    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      read,
      created_at
    ) VALUES (
      NEW.id,
      'Profile Photo Updated',
      'Because you changed your profile photo, your account requires quick re-verification with your ID document on file to keep our campus safe.',
      'alert',
      false,
      now()
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profile_photo_change ON public.profiles;
CREATE TRIGGER trg_profile_photo_change
BEFORE UPDATE OF photo_url ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_profile_photo_change_reverification();

-- 7. Row Level Security (RLS) Policies
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own verification requests" ON public.verification_requests;
CREATE POLICY "Users can view own verification requests"
  ON public.verification_requests
  FOR SELECT
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Service role full access to verification_requests" ON public.verification_requests;
CREATE POLICY "Service role full access to verification_requests"
  ON public.verification_requests
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Participants can view own calls" ON public.calls;
CREATE POLICY "Participants can view own calls"
  ON public.calls
  FOR SELECT
  USING (auth.uid()::text = caller_id OR auth.uid()::text = callee_id);

DROP POLICY IF EXISTS "Service role full access to calls" ON public.calls;
CREATE POLICY "Service role full access to calls"
  ON public.calls
  FOR ALL
  USING (auth.role() = 'service_role');

GRANT ALL ON TABLE public.verification_requests TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.calls TO postgres, anon, authenticated, service_role;
