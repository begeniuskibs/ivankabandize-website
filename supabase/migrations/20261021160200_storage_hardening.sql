-- Migration: 20261021160200_storage_hardening.sql
-- Purpose: Storage security hardening - restrict object listing to authenticated owners and configure bucket limits
-- Date: 2026-10-21
-- Status: approved by Ivan 2026-10-21

BEGIN;

-- a. Drop existing permissive public SELECT policies on storage.objects
DROP POLICY "Public post images are viewable by everyone" ON storage.objects;
DROP POLICY "Public post videos are viewable by everyone" ON storage.objects;

-- b. Create replacement SELECT policies restricted to authenticated owners using public.is_owner()
-- Public file URLs keep working because buckets are public; only listing objects is restricted.
CREATE POLICY "Post images can be viewed by owners only"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'post-images' AND public.is_owner());

CREATE POLICY "Post videos can be viewed by owners only"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'post-videos' AND public.is_owner());

-- c. Configure file size limits and allowed MIME types on storage.buckets
UPDATE storage.buckets
SET file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
WHERE id = 'post-images';

UPDATE storage.buckets
SET file_size_limit = 104857600,
    allowed_mime_types = ARRAY['video/mp4','video/webm','video/quicktime','video/x-m4v']
WHERE id = 'post-videos';

COMMIT;
