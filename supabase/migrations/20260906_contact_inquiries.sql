-- ============================================================
-- Contact Inquiries & Support Tickets Schema Migration
-- 2026-09-06
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  college text,
  category text NOT NULL DEFAULT 'General Support',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
  admin_notes text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indices for rapid querying & admin dashboard filtering
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_created_at ON public.contact_inquiries (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_status ON public.contact_inquiries (status);
CREATE INDEX IF NOT EXISTS idx_contact_inquiries_email ON public.contact_inquiries (email);

-- Enable RLS
ALTER TABLE public.contact_inquiries ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated students can submit inquiries
DROP POLICY IF EXISTS "Anyone can submit contact inquiry" ON public.contact_inquiries;
CREATE POLICY "Anyone can submit contact inquiry"
  ON public.contact_inquiries
  FOR INSERT
  WITH CHECK (true);

-- Service role has complete administrative control
DROP POLICY IF EXISTS "Service role full access to contact_inquiries" ON public.contact_inquiries;
CREATE POLICY "Service role full access to contact_inquiries"
  ON public.contact_inquiries
  FOR ALL
  USING (true)
  WITH CHECK (true);

GRANT ALL ON TABLE public.contact_inquiries TO postgres, anon, authenticated, service_role;
