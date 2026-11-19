-- Migration: 20261119210000_resources_link_delivery_schema.sql
-- Purpose: Add link-type delivery support to public.resources (delivery_type, external_url, category, page_details)
-- Date: 2026-11-19
-- Note: Spaced hyphen " - " house style used throughout. NOT APPLIED YET.

BEGIN;

-- 1. Add new columns to public.resources
ALTER TABLE public.resources
  ADD COLUMN IF NOT EXISTS delivery_type text NOT NULL DEFAULT 'file',
  ADD COLUMN IF NOT EXISTS external_url text NULL,
  ADD COLUMN IF NOT EXISTS category text NULL,
  ADD COLUMN IF NOT EXISTS page_details jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2. Alter existing columns file_path and file_name to be nullable
ALTER TABLE public.resources
  ALTER COLUMN file_path DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL;

-- 3. Add named constraints (guarded with DROP CONSTRAINT IF EXISTS for idempotent re-runs)
ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_delivery_type_check,
  ADD CONSTRAINT resources_delivery_type_check
    CHECK (delivery_type IN ('file', 'link'));

ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_external_url_check,
  ADD CONSTRAINT resources_external_url_check
    CHECK (char_length(external_url) <= 2000);

ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_category_check,
  ADD CONSTRAINT resources_category_check
    CHECK (char_length(category) <= 60);

ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_page_details_check,
  ADD CONSTRAINT resources_page_details_check
    CHECK (jsonb_typeof(page_details) = 'object');

ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_delivery_consistent,
  ADD CONSTRAINT resources_delivery_consistent
    CHECK (
      (delivery_type = 'file' AND file_path IS NOT NULL AND file_name IS NOT NULL AND external_url IS NULL)
      OR
      (delivery_type = 'link' AND external_url IS NOT NULL AND external_url ~ '^https://' AND file_path IS NULL AND file_name IS NULL)
    );

-- 4. Column documentation comments
COMMENT ON COLUMN public.resources.delivery_type IS 'Delivery mechanism for the resource: file (direct/signed file download) or link (external destination URL).';
COMMENT ON COLUMN public.resources.external_url IS 'Destination URL for link-type resources. It is returned only by the server download route after the form is submitted and must never be selected by public page code.';
COMMENT ON COLUMN public.resources.category IS 'Optional broad category grouping for shelf display and filtering (max 60 characters).';
COMMENT ON COLUMN public.resources.page_details IS 'Structured JSON object that holds page sections (facts, steps, FAQ and similar), never secrets and never the external_url.';

COMMIT;
