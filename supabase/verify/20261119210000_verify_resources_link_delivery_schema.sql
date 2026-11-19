-- Verification: 20261119210000_verify_resources_link_delivery_schema.sql
-- Purpose: Read-only verification queries and negative constraint tests for resources link delivery schema
-- Date: 2026-11-19
-- Note: Spaced hyphen " - " house style used throughout. Run in Supabase SQL Editor after applying migration.

-- 1. Verify the 4 new columns and the nullability of file_path and file_name
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'resources'
  AND column_name IN (
    'delivery_type',
    'external_url',
    'category',
    'page_details',
    'file_path',
    'file_name'
  )
ORDER BY ordinal_position;

-- 2. Verify the 5 new check constraints on public.resources
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
WHERE conrelid = 'public.resources'::regclass
  AND conname IN (
    'resources_delivery_type_check',
    'resources_external_url_check',
    'resources_category_check',
    'resources_page_details_check',
    'resources_delivery_consistent'
  )
ORDER BY conname;

-- 3. Verify resource counts grouped by delivery_type
SELECT
  delivery_type,
  count(*) AS count
FROM public.resources
GROUP BY delivery_type
ORDER BY delivery_type;

-- 4. Negative constraint test block (wrapped in BEGIN ... ROLLBACK so nothing persists)
BEGIN;

DO $$
BEGIN
  -- Case 1: link without external_url
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, external_url
    ) VALUES (
      'verify-neg-link-no-url', 'Test', 'Summary', 'template', 'link', NULL
    );
    RAISE NOTICE 'FAIL - link without external_url';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS - link without external_url';
  END;

  -- Case 2: link with an http:// url
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, external_url
    ) VALUES (
      'verify-neg-link-http-url', 'Test', 'Summary', 'template', 'link', 'http://insecure.example.com'
    );
    RAISE NOTICE 'FAIL - link with an http:// url';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS - link with an http:// url';
  END;

  -- Case 3: link that also has a file_path
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, external_url, file_path
    ) VALUES (
      'verify-neg-link-with-file', 'Test', 'Summary', 'template', 'link', 'https://secure.example.com', 'files/test.pdf'
    );
    RAISE NOTICE 'FAIL - link that also has a file_path';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS - link that also has a file_path';
  END;

  -- Case 4: file with an external_url
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name, external_url
    ) VALUES (
      'verify-neg-file-with-url', 'Test', 'Summary', 'template', 'file', 'files/test.pdf', 'test.pdf', 'https://secure.example.com'
    );
    RAISE NOTICE 'FAIL - file with an external_url';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS - file with an external_url';
  END;

  -- Case 5: file without file_path
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name
    ) VALUES (
      'verify-neg-file-no-path', 'Test', 'Summary', 'template', 'file', NULL, 'test.pdf'
    );
    RAISE NOTICE 'FAIL - file without file_path';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS - file without file_path';
  END;

  -- Case 6: page_details set to a JSON array
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name, page_details
    ) VALUES (
      'verify-neg-page-details-array', 'Test', 'Summary', 'template', 'file', 'files/test.pdf', 'test.pdf', '["not", "an", "object"]'::jsonb
    );
    RAISE NOTICE 'FAIL - page_details set to a JSON array';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS - page_details set to a JSON array';
  END;

  -- Case 7: category longer than 60 characters
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name, category
    ) VALUES (
      'verify-neg-category-too-long', 'Test', 'Summary', 'template', 'file', 'files/test.pdf', 'test.pdf', repeat('x', 61)
    );
    RAISE NOTICE 'FAIL - category longer than 60 characters';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS - category longer than 60 characters';
  END;
END $$;

ROLLBACK;
