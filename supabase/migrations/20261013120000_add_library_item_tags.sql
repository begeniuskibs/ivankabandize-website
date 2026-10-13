-- Rollback:
-- DROP TABLE IF EXISTS public.library_item_tags CASCADE;

-- 1. Create join table for library items and tags
CREATE TABLE IF NOT EXISTS public.library_item_tags (
  library_item_id UUID NOT NULL REFERENCES public.library_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (library_item_id, tag_id)
);

-- 2. Enable Row Level Security
ALTER TABLE public.library_item_tags ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public SELECT: anyone can read library item tags
DROP POLICY IF EXISTS "library_item_tags_select_public" ON public.library_item_tags;
CREATE POLICY "library_item_tags_select_public" ON public.library_item_tags
  FOR SELECT USING (true);

-- Owner/Admin write access: insert, update, delete restricted to owner
DROP POLICY IF EXISTS "library_item_tags_insert_owner_only" ON public.library_item_tags;
CREATE POLICY "library_item_tags_insert_owner_only" ON public.library_item_tags
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "library_item_tags_update_owner_only" ON public.library_item_tags;
CREATE POLICY "library_item_tags_update_owner_only" ON public.library_item_tags
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "library_item_tags_delete_owner_only" ON public.library_item_tags;
CREATE POLICY "library_item_tags_delete_owner_only" ON public.library_item_tags
  FOR DELETE USING (public.is_owner());
