-- Add structured content columns for pages (About, etc.)
ALTER TABLE public.pages
ADD COLUMN IF NOT EXISTS body_paragraphs JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pullquote TEXT,
ADD COLUMN IF NOT EXISTS background_teaching TEXT,
ADD COLUMN IF NOT EXISTS background_method TEXT,
ADD COLUMN IF NOT EXISTS closing_cta_headline TEXT;
