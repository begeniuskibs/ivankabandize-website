-- Migration: 20261007120000_add_series.sql
-- Add series table, relations, triggers, and RLS policies

-- 1. Create series table
CREATE TABLE IF NOT EXISTS public.series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  intro TEXT,
  header_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'growing' CHECK (status IN ('growing', 'complete')),
  cover_emoji TEXT,
  card_tint TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add series_id to posts (nullable, references public.series)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'posts' AND column_name = 'series_id'
  ) THEN
    ALTER TABLE public.posts ADD COLUMN series_id UUID REFERENCES public.series(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Create index on posts.series_id
CREATE INDEX IF NOT EXISTS idx_posts_series_id ON public.posts(series_id);

-- 4. updated_at trigger for series
DROP TRIGGER IF EXISTS set_updated_at_series ON public.series;
CREATE TRIGGER set_updated_at_series
  BEFORE UPDATE ON public.series
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable RLS on series
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies on series
-- Public SELECT
DROP POLICY IF EXISTS "series_select_public" ON public.series;
CREATE POLICY "series_select_public" ON public.series
  FOR SELECT USING (true);

-- Admin/Owner INSERT
DROP POLICY IF EXISTS "series_insert_owner_only" ON public.series;
CREATE POLICY "series_insert_owner_only" ON public.series
  FOR INSERT WITH CHECK (public.is_owner());

-- Admin/Owner UPDATE
DROP POLICY IF EXISTS "series_update_owner_only" ON public.series;
CREATE POLICY "series_update_owner_only" ON public.series
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

-- Admin/Owner DELETE
DROP POLICY IF EXISTS "series_delete_owner_only" ON public.series;
CREATE POLICY "series_delete_owner_only" ON public.series
  FOR DELETE USING (public.is_owner());
