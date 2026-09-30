-- Storage bucket for post videos with owner-only RLS policies matching post-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-videos', 'post-videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public post videos are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Post videos can be uploaded by owners only" ON storage.objects;
DROP POLICY IF EXISTS "Post videos can be updated by owners only" ON storage.objects;
DROP POLICY IF EXISTS "Post videos can be deleted by owners only" ON storage.objects;

CREATE POLICY "Public post videos are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-videos');

CREATE POLICY "Post videos can be uploaded by owners only"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-videos' AND
  (SELECT is_owner FROM public.users WHERE id = auth.uid()) = true
);

CREATE POLICY "Post videos can be updated by owners only"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-videos' AND
  (SELECT is_owner FROM public.users WHERE id = auth.uid()) = true
)
WITH CHECK (
  bucket_id = 'post-videos' AND
  (SELECT is_owner FROM public.users WHERE id = auth.uid()) = true
);

CREATE POLICY "Post videos can be deleted by owners only"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-videos' AND
  (SELECT is_owner FROM public.users WHERE id = auth.uid()) = true
);
