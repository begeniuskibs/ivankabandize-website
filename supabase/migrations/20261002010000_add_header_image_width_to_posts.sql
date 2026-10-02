-- Migration: add_header_image_width_to_posts
-- Adds header_image_width column to public.posts with allowed values 'standard' or 'wide', defaulting to 'standard'

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS header_image_width TEXT NOT NULL DEFAULT 'standard';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_header_image_width_check'
  ) THEN
    ALTER TABLE public.posts
    ADD CONSTRAINT posts_header_image_width_check
    CHECK (header_image_width IN ('standard', 'wide'));
  END IF;
END $$;

-- Migrate legacy header_image_width from content JSONB if present
UPDATE public.posts
SET header_image_width = content->>'header_image_width'
WHERE content->>'header_image_width' IS NOT NULL
  AND content->>'header_image_width' IN ('standard', 'wide');

-- Clean up header_image_width from content JSONB if present
UPDATE public.posts
SET content = content - 'header_image_width'
WHERE content ? 'header_image_width';
