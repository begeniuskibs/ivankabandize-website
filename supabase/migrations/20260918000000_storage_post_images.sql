-- Sprint A3: Storage bucket for post images with owner-only RLS policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public post images are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Post images can be uploaded by owners only" ON storage.objects;
DROP POLICY IF EXISTS "Post images can be updated by owners only" ON storage.objects;
DROP POLICY IF EXISTS "Post images can be deleted by owners only" ON storage.objects;

CREATE POLICY "Public post images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Post images can be uploaded by owners only"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'post-images' AND
  (SELECT is_owner FROM public.users WHERE id = auth.uid()) = true
);

CREATE POLICY "Post images can be updated by owners only"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'post-images' AND
  (SELECT is_owner FROM public.users WHERE id = auth.uid()) = true
)
WITH CHECK (
  bucket_id = 'post-images' AND
  (SELECT is_owner FROM public.users WHERE id = auth.uid()) = true
);

CREATE POLICY "Post images can be deleted by owners only"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'post-images' AND
  (SELECT is_owner FROM public.users WHERE id = auth.uid()) = true
);
