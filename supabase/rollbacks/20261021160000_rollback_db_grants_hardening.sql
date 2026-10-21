-- Rollback: 20261021160000_rollback_db_grants_hardening.sql
-- Purpose: Restore table grants, function execution rights, storage policies, and bucket settings to pre-hardening state
-- Date: 2026-10-21
-- Status: approved by Ivan 2026-10-21
--
-- Table lists restored (matching baseline Section A table privileges):
-- 1. TRUNCATE, TRIGGER, REFERENCES restored to anon and authenticated (14 tables):
--    public.comments, public.library_item_tags, public.library_items,
--    public.newsletter_subscriptions, public.newsletters, public.now_entries,
--    public.pages, public.post_tags, public.post_views, public.posts,
--    public.series, public.subscriptions, public.tags, public.tiers
-- 2. TRIGGER, REFERENCES (no TRUNCATE) restored to anon and authenticated (2 tables):
--    public.members, public.users
-- 3. Inquiries: no grants restored (inquiries had no TRUNCATE, TRIGGER, or REFERENCES)
-- 4. INSERT, UPDATE, DELETE restored to anon (13 tables):
--    public.comments, public.library_item_tags, public.library_items,
--    public.newsletter_subscriptions, public.newsletters, public.now_entries,
--    public.pages, public.post_tags, public.posts,
--    public.series, public.subscriptions, public.tags, public.tiers
-- 5. SELECT, UPDATE, DELETE restored to anon (1 table):
--    public.post_views

BEGIN;

-- 1. Restore TRUNCATE, TRIGGER, REFERENCES on 14 tables to anon and authenticated
GRANT TRUNCATE, TRIGGER, REFERENCES ON TABLE
  public.comments,
  public.library_item_tags,
  public.library_items,
  public.newsletter_subscriptions,
  public.newsletters,
  public.now_entries,
  public.pages,
  public.post_tags,
  public.post_views,
  public.posts,
  public.series,
  public.subscriptions,
  public.tags,
  public.tiers
TO anon, authenticated;

-- 2. Restore TRIGGER, REFERENCES (without TRUNCATE) on members and users to anon and authenticated
GRANT TRIGGER, REFERENCES ON TABLE
  public.members,
  public.users
TO anon, authenticated;

-- 3. Restore INSERT, UPDATE, DELETE on 13 content tables to anon
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

-- 4. Restore SELECT, UPDATE, DELETE on post_views to anon
GRANT SELECT, UPDATE, DELETE ON TABLE public.post_views TO anon;

-- 5. Restore function execution grants and reset search_path (restores State C)
ALTER FUNCTION public.handle_updated_at() RESET search_path;

GRANT EXECUTE ON FUNCTION public.handle_new_user(), public.rls_auto_enable(), public.handle_updated_at() TO PUBLIC, anon, authenticated;

-- 6. Restore storage.objects policies and bucket configurations (restores State B)
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
