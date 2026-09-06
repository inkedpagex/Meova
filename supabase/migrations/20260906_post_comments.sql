-- ============================================================
-- Post Comments Schema Migration
-- 2026-09-06
-- ============================================================

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name text,
  author_photo text,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments (post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON public.post_comments (user_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view post comments" ON public.post_comments;
CREATE POLICY "Public can view post comments"
  ON public.post_comments
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert post comments" ON public.post_comments;
CREATE POLICY "Authenticated users can insert post comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (true);

GRANT ALL ON TABLE public.post_comments TO postgres, anon, authenticated, service_role;
