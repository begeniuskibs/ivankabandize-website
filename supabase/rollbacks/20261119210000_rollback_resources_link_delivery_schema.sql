-- Rollback: 20261119210000_rollback_resources_link_delivery_schema.sql
-- Purpose: Rollback link delivery columns and constraints from public.resources
-- Date: 2026-11-19
-- Note: Spaced hyphen " - " house style used throughout. NOT APPLIED YET.

BEGIN;

-- 1. Safety check: Abort if any row has delivery_type = 'link' or file_path IS NULL or file_name IS NULL
DO $$
DECLARE
  v_link_count integer;
  v_null_file_count integer;
BEGIN
  SELECT count(*) INTO v_link_count
  FROM public.resources
  WHERE delivery_type = 'link';

  IF v_link_count > 0 THEN
    RAISE EXCEPTION 'Cannot rollback: % link-type resource(s) exist in public.resources. Remove or convert them before rolling back.', v_link_count;
  END IF;

  SELECT count(*) INTO v_null_file_count
  FROM public.resources
  WHERE file_path IS NULL OR file_name IS NULL;

  IF v_null_file_count > 0 THEN
    RAISE EXCEPTION 'Cannot rollback: % resource(s) have NULL file_path or file_name.', v_null_file_count;
  END IF;
END $$;

-- 2. Drop the new constraints
ALTER TABLE public.resources
  DROP CONSTRAINT IF EXISTS resources_delivery_consistent,
  DROP CONSTRAINT IF EXISTS resources_page_details_check,
  DROP CONSTRAINT IF EXISTS resources_category_check,
  DROP CONSTRAINT IF EXISTS resources_external_url_check,
  DROP CONSTRAINT IF EXISTS resources_delivery_type_check;

-- 3. Drop the 4 new columns
ALTER TABLE public.resources
  DROP COLUMN IF EXISTS page_details,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS external_url,
  DROP COLUMN IF EXISTS delivery_type;

-- 4. Set NOT NULL back on file_path and file_name
ALTER TABLE public.resources
  ALTER COLUMN file_path SET NOT NULL,
  ALTER COLUMN file_name SET NOT NULL;

COMMIT;
