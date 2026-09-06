-- ============================================================
-- Campus Ambassador Program v2 — Schema Migration
-- 2026-09-06
-- ============================================================

-- ── 1. COLLEGES ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colleges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text,
  state text,
  domain text,           -- e.g. 'gla.ac.in' — used for email domain matching
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "colleges_read_all" ON colleges;
CREATE POLICY "colleges_read_all" ON colleges
  FOR SELECT USING (true);

-- ── 2. AMBASSADOR APPLICATIONS ──────────────────────────────
-- NOTE: profiles.id is text (stores Firebase/Google auth string IDs)
CREATE TABLE IF NOT EXISTS ambassador_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES profiles(id) ON DELETE CASCADE,
  college_id uuid REFERENCES colleges(id),
  college_name text,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  year text,
  branch text,
  why_ambassador text,
  instagram_handle text,
  linkedin_url text,
  meeting_locations text[],   -- campus spots proposed for meetups
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','shortlisted','rejected','approved','revoked')),
  admin_note text,
  shortlisted_at timestamptz,
  shortlisted_by text,
  approved_at timestamptz,
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ambassador_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ambapp_select_own" ON ambassador_applications;
CREATE POLICY "ambapp_select_own" ON ambassador_applications
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "ambapp_insert_own" ON ambassador_applications;
CREATE POLICY "ambapp_insert_own" ON ambassador_applications
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

-- ── 3. REFERRALS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id text REFERENCES profiles(id),
  referred_user_id text REFERENCES profiles(id),
  referral_code text NOT NULL,
  signup_at timestamptz NOT NULL DEFAULT now(),
  college_id uuid REFERENCES colleges(id),
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referred_user_id)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "referrals_select_own" ON referrals;
CREATE POLICY "referrals_select_own" ON referrals
  FOR SELECT USING (ambassador_id = auth.uid()::text);

-- ── 4. AMBASSADOR AUDIT LOGS ────────────────────────────────
CREATE TABLE IF NOT EXISTS ambassador_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ambassador_id text REFERENCES profiles(id),
  action text NOT NULL,
    -- 'confirm_college' | 'block_user' | 'unblock_user' | 'remove_post' | 'flag_user' | 'flag_post'
  target_id text,           -- user_id or post_id being acted on
  target_type text,         -- 'user' | 'post'
  college_id uuid REFERENCES colleges(id),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ambassador_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auditlog_select_own" ON ambassador_audit_logs;
CREATE POLICY "auditlog_select_own" ON ambassador_audit_logs
  FOR SELECT USING (ambassador_id = auth.uid()::text);

DROP POLICY IF EXISTS "auditlog_insert_own" ON ambassador_audit_logs;
CREATE POLICY "auditlog_insert_own" ON ambassador_audit_logs
  FOR INSERT WITH CHECK (ambassador_id = auth.uid()::text);

-- ── 5. COLLEGE MEETING LOCATIONS ────────────────────────────
CREATE TABLE IF NOT EXISTS college_meeting_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid REFERENCES colleges(id),
  name text NOT NULL,          -- e.g. 'Main Canteen', 'AB-1 Lawns', etc.
  description text,
  is_approved boolean NOT NULL DEFAULT false,
  approved_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE college_meeting_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "meeting_locations_read_approved" ON college_meeting_locations;
CREATE POLICY "meeting_locations_read_approved" ON college_meeting_locations
  FOR SELECT USING (is_approved = true);

-- ── 6. ADD COLUMNS TO EXISTING TABLES ───────────────────────

-- profiles: ambassador + college columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES colleges(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college_confirmed boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS college_confirmed_via text;
  -- 'email' | 'ambassador' | 'full_verification' | NULL (unconfirmed)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_ambassador boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ambassador_tier text NOT NULL DEFAULT 'none';
  -- 'none' | 'probation' | 'full'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by text REFERENCES profiles(id);

-- Add unique constraint on referral_code safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_referral_code_unique'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_referral_code_unique UNIQUE (referral_code);
  END IF;
END $$;

-- bookings: add college scope
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES colleges(id);

-- Refresh meetings view if it exists so it inherits college_id from bookings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'meetings' AND schemaname = 'public') THEN
    CREATE OR REPLACE VIEW meetings AS SELECT * FROM bookings;
  END IF;
END $$;

-- posts: add college scope
ALTER TABLE posts ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES colleges(id);

-- ── 7. PERFORMANCE INDEXES ───────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_college_id ON profiles(college_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_referrals_ambassador_id ON referrals(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_user_id ON ambassador_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_ambassador_applications_status ON ambassador_applications(status);
CREATE INDEX IF NOT EXISTS idx_ambassador_audit_logs_ambassador_id ON ambassador_audit_logs(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_posts_college_id ON posts(college_id) WHERE college_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_college_id ON bookings(college_id) WHERE college_id IS NOT NULL;

-- ── 8. SEED: INITIAL COLLEGES (UTTAR PRADESH ONLY - MATHURA & PRIVATE UNIVERSITIES) ──
INSERT INTO colleges (name, city, state, domain, is_active) VALUES
  -- Mathura & Agra Region (Priority Focus)
  ('GLA University', 'Mathura', 'Uttar Pradesh', 'gla.ac.in', true),
  ('Sanskriti University', 'Mathura', 'Uttar Pradesh', 'sanskriti.edu.in', true),
  ('KD Dental College and Hospital', 'Mathura', 'Uttar Pradesh', 'kddentalcollege.com', true),
  ('BSA College of Engineering and Technology', 'Mathura', 'Uttar Pradesh', 'bsacet.org', true),
  ('Hindustan College of Science and Technology (HCST)', 'Mathura', 'Uttar Pradesh', 'sgei.org', true),
  ('Anand Engineering College', 'Agra', 'Uttar Pradesh', 'sgei.org', true),
  ('Dayalbagh Educational Institute (DEI)', 'Agra', 'Uttar Pradesh', 'dei.ac.in', true),
  ('RBS Engineering Technical Campus', 'Agra', 'Uttar Pradesh', 'rbsec.org', true),

  -- Noida & Greater Noida (Private Universities Hub)
  ('Amity University', 'Noida', 'Uttar Pradesh', 'amity.edu', true),
  ('Galgotias University', 'Greater Noida', 'Uttar Pradesh', 'galgotiasuniversity.edu.in', true),
  ('Sharda University', 'Greater Noida', 'Uttar Pradesh', 'sharda.ac.in', true),
  ('Bennett University', 'Greater Noida', 'Uttar Pradesh', 'bennett.edu.in', true),
  ('Shiv Nadar University', 'Greater Noida', 'Uttar Pradesh', 'snu.edu.in', true),
  ('Noida International University (NIU)', 'Greater Noida', 'Uttar Pradesh', 'niu.edu.in', true),
  ('GL Bajaj Institute of Technology and Management', 'Greater Noida', 'Uttar Pradesh', 'glbitm.org', true),
  ('Jaypee Institute of Information Technology (JIIT)', 'Noida', 'Uttar Pradesh', 'jiit.ac.in', true),
  ('JSS Academy of Technical Education', 'Noida', 'Uttar Pradesh', 'jssaten.ac.in', true),
  ('IIMT College of Engineering', 'Greater Noida', 'Uttar Pradesh', 'iimtindia.net', true),

  -- Ghaziabad Region
  ('KIET Group of Institutions', 'Ghaziabad', 'Uttar Pradesh', 'kiet.edu', true),
  ('Ajay Kumar Garg Engineering College (AKGEC)', 'Ghaziabad', 'Uttar Pradesh', 'akgec.ac.in', true),
  ('ABES Engineering College', 'Ghaziabad', 'Uttar Pradesh', 'abes.ac.in', true),
  ('IMS Engineering College', 'Ghaziabad', 'Uttar Pradesh', 'imsec.ac.in', true),

  -- Lucknow & Kanpur Region
  ('Babu Banarasi Das University (BBDU)', 'Lucknow', 'Uttar Pradesh', 'bbdu.ac.in', true),
  ('Integral University', 'Lucknow', 'Uttar Pradesh', 'iul.ac.in', true),
  ('Shri Ramswaroop Memorial University (SRMU)', 'Lucknow', 'Uttar Pradesh', 'srmu.ac.in', true),
  ('Amity University', 'Lucknow', 'Uttar Pradesh', 'amity.edu', true),
  ('Pranveer Singh Institute of Technology (PSIT)', 'Kanpur', 'Uttar Pradesh', 'psit.in', true),
  ('Rama University', 'Kanpur', 'Uttar Pradesh', 'ramauniversity.ac.in', true),

  -- Bareilly, Moradabad & Meerut
  ('Invertis University', 'Bareilly', 'Uttar Pradesh', 'invertisuniversity.ac.in', true),
  ('SRMS College of Engineering and Technology', 'Bareilly', 'Uttar Pradesh', 'srms.ac.in', true),
  ('Teerthanker Mahaveer University (TMU)', 'Moradabad', 'Uttar Pradesh', 'tmu.ac.in', true),
  ('Swami Vivekanand Subharti University', 'Meerut', 'Uttar Pradesh', 'subharti.org', true),
  ('IIMT University', 'Meerut', 'Uttar Pradesh', 'iimtu.com', true),
  ('Shobhit University', 'Meerut', 'Uttar Pradesh', 'shobhituniversity.ac.in', true),

  -- Premier UP Flagship Institutes
  ('IIT Kanpur', 'Kanpur', 'Uttar Pradesh', 'iitk.ac.in', true),
  ('Banaras Hindu University (BHU)', 'Varanasi', 'Uttar Pradesh', 'bhu.ac.in', true),
  ('MNNIT Allahabad', 'Prayagraj', 'Uttar Pradesh', 'mnnit.ac.in', true)
ON CONFLICT DO NOTHING;
