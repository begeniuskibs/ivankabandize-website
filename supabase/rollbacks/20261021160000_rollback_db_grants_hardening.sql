-- Rollback: 20261021160000_rollback_db_grants_hardening.sql
-- Purpose: Restore table grants, function execution rights, storage policies, and bucket settings to pre-hardening state
-- Date: 2026-10-21
-- Status: approved by Ivan 2026-10-21

BEGIN;

-- 1. Restore table privileges revoked from anon and authenticated (restores State A)
GRANT TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE
  public.comments,
  public.library_item_tags,
  public.library_items,
  public.newsletter_subscriptions,
  public.newsletters,
  public.now_entries,
  public.pages,
  public.post_tags,
  public.posts,
  public.series,
  public.subscriptions,
  public.tags,
  public.tiers
TO anon;

GRANT SELECT, UPDATE, DELETE ON TABLE public.post_views TO anon;

-- 2. Restore function execution grants and reset search_path (restores State C)
ALTER FUNCTION public.handle_updated_at() RESET search_path;

GRANT EXECUTE ON FUNCTION public.handle_new_user(), public.rls_auto_enable(), public.handle_updated_at() TO PUBLIC, anon, authenticated;

-- 3. Restore storage.objects policies and bucket configurations (restores State B)
DROP POLICY IF EXISTS "Post images can be viewed by owners only" ON storage.objects;
DROP POLICY IF EXISTS "Post videos can be viewed by owners only" ON storage.objects;

CREATE POLICY "Public post images are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

CREATE POLICY "Public post videos are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-videos');

UPDATE storage.buckets
SET file_size_limit = NULL,
    allowed_mime_types = NULL
WHERE id IN ('post-images', 'post-videos');

COMMIT;
