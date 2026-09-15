-- Migration: add_content_type_to_posts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_content_type') THEN
    CREATE TYPE post_content_type AS ENUM ('random_thoughts', 'structured_thoughts', 'tools_for_thought');
  END IF;
END $$;

ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS content_type post_content_type NOT NULL DEFAULT 'structured_thoughts';
