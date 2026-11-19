-- Verification: 20261119160000_verify_resources_flow_schema.sql
-- Purpose: Read - only verification queries for resources and resource_downloads schema
-- Date: 2026-11-19
-- Note: Run these read - only queries after applying the migration to verify tables, RLS, grants, and bucket.

-- 1. Verify tables exist in public schema (expected: 2 rows; total tables in public will be 19)
SELECT table_name, table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('resources', 'resource_downloads')
ORDER BY table_name;

-- 2. Verify Row Level Security (RLS) is enabled on both tables (expected: relrowsecurity = true for both)
SELECT relname AS table_name, relrowsecurity AS rls_enabled
FROM pg_class
WHERE relname IN ('resources', 'resource_downloads')
  AND relnamespace = 'public'::regnamespace
ORDER BY relname;

-- 3. Verify RLS policies on both tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('resources', 'resource_downloads')
ORDER BY tablename, policyname;

-- 4. Verify no policy mentions anon or public roles (expected: 0 rows)
SELECT tablename, policyname, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('resources', 'resource_downloads')
  AND (roles::text[] && ARRAY['anon', 'public'])
ORDER BY tablename, policyname;

-- 5. Verify private storage bucket "resource-files" exists with public = false and correct limits
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id = 'resource-files';

-- 6. Verify table privileges: anon has zero privileges, authenticated has no TRUNCATE/TRIGGER/REFERENCES, and no INSERT on resource_downloads
SELECT grantee, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('resources', 'resource_downloads')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee, privilege_type;

-- 7. Manual test for anon role permissions (Run as superuser / postgres in Supabase SQL editor):
-- Note: On project - scoped read - only connection poolers, 'SET LOCAL ROLE anon' returns
-- '42501: permission denied to set role "anon"'. Therefore, execute this test manually in
-- the Supabase dashboard SQL Editor where superuser elevation is available:
--
-- BEGIN;
-- SET LOCAL ROLE anon;
-- SELECT count(*) FROM public.resource_downloads; -- Expected: permission denied (42501)
-- SELECT count(*) FROM public.resources;          -- Expected: 0 rows (RLS blocks anon) or permission denied (42501)
-- ROLLBACK;
