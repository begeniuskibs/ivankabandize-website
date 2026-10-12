-- Migration: add_description_to_tags
-- Adds description text null to public.tags

ALTER TABLE public.tags
ADD COLUMN IF NOT EXISTS description text null;
