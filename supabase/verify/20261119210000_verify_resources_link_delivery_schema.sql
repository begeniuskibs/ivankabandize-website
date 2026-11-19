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

-- 4. Constraint verification test block (7 negative cases, 2 positive cases)
-- Run section 4 on its own as a separate query. A red error that starts with VERIFY REPORT is the normal, expected output. Expected: 9 PASS and 0 FAIL.
DO $$
DECLARE
  results text[] := ARRAY[]::text[];
BEGIN
  -- Case 1: link without external_url
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, external_url
    ) VALUES (
      'verify-neg-link-no-url', 'Test', 'Summary', 'template', 'link', NULL
    );
    results := array_append(results, 'FAIL - link without external_url');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'PASS - link without external_url');
  END;

  -- Case 2: link with an http:// url
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, external_url
    ) VALUES (
      'verify-neg-link-http-url', 'Test', 'Summary', 'template', 'link', 'http://insecure.example.com'
    );
    results := array_append(results, 'FAIL - link with an http:// url');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'PASS - link with an http:// url');
  END;

  -- Case 3: link that also has a file_path
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, external_url, file_path
    ) VALUES (
      'verify-neg-link-with-file', 'Test', 'Summary', 'template', 'link', 'https://secure.example.com', 'files/test.pdf'
    );
    results := array_append(results, 'FAIL - link that also has a file_path');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'PASS - link that also has a file_path');
  END;

  -- Case 4: file with an external_url
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name, external_url
    ) VALUES (
      'verify-neg-file-with-url', 'Test', 'Summary', 'template', 'file', 'files/test.pdf', 'test.pdf', 'https://secure.example.com'
    );
    results := array_append(results, 'FAIL - file with an external_url');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'PASS - file with an external_url');
  END;

  -- Case 5: file without file_path
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name
    ) VALUES (
      'verify-neg-file-no-path', 'Test', 'Summary', 'template', 'file', NULL, 'test.pdf'
    );
    results := array_append(results, 'FAIL - file without file_path');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'PASS - file without file_path');
  END;

  -- Case 6: page_details as a JSON array
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name, page_details
    ) VALUES (
      'verify-neg-page-details-array', 'Test', 'Summary', 'template', 'file', 'files/test.pdf', 'test.pdf', '["not", "an", "object"]'::jsonb
    );
    results := array_append(results, 'FAIL - page_details as a JSON array');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'PASS - page_details as a JSON array');
  END;

  -- Case 7: category longer than 60 characters
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name, category
    ) VALUES (
      'verify-neg-category-too-long', 'Test', 'Summary', 'template', 'file', 'files/test.pdf', 'test.pdf', repeat('x', 61)
    );
    results := array_append(results, 'FAIL - category longer than 60 characters');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'PASS - category longer than 60 characters');
  END;

  -- Case 8 (Positive 1): valid link
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, external_url, category, page_details
    ) VALUES (
      'verify-pos-link', 'Test', 'Summary', 'template', 'link', 'https://www.notion.so/verify-example', 'Productivity', '{"facts": []}'::jsonb
    );
    results := array_append(results, 'PASS - valid link');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'FAIL - valid link');
  END;

  -- Case 9 (Positive 2): valid file
  BEGIN
    INSERT INTO public.resources (
      slug, title, summary, kind, delivery_type, file_path, file_name
    ) VALUES (
      'verify-pos-file', 'Test', 'Summary', 'guide', 'file', 'verify/test.pdf', 'test.pdf'
    );
    results := array_append(results, 'PASS - valid file');
  EXCEPTION WHEN check_violation THEN
    results := array_append(results, 'FAIL - valid file');
  END;

  -- Raise an expected exception to report all results and roll back all test inserts
  RAISE EXCEPTION '%', format('VERIFY REPORT (this error is expected, it rolls everything back so nothing is saved): %s', array_to_string(results, ' | '));
END $$;
