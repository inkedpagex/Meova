-- ============================================================
-- Legal Consent, Policies & Compliance Migration
-- 2026-09-06
-- Compliance with India Information Technology Rules, 2021
-- ============================================================

-- 1. Add terms consent and version tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_version text;

-- 2. Performance index for compliance audit & version lookup
CREATE INDEX IF NOT EXISTS idx_profiles_terms_version ON profiles(terms_version);
CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted_at ON profiles(terms_accepted_at);
