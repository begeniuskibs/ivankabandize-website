-- Rollback: 20261119160000_rollback_resources_flow_schema.sql
-- Purpose: Rollback resources and resource_downloads tables, triggers, policies, and private bucket
-- Date: 2026-11-19
-- Note: Spaced hyphen " - " house style used throughout. NOT APPLIED YET.

BEGIN;

-- 1. Storage bucket removal notice
-- Note: Supabase blocks direct deletions on storage tables ("Direct deletion from storage tables is not allowed. Use the Storage API instead.").
-- The bucket resource-files must be emptied and then deleted by hand in the Supabase dashboard (Storage) or through the Storage API;
-- this rollback only removes the policies, trigger, indexes and tables.

-- 2. Drop policies on resource_downloads
DROP POLICY IF EXISTS "resource_downloads_delete_owner_only" ON public.resource_downloads;
DROP POLICY IF EXISTS "resource_downloads_update_owner_only" ON public.resource_downloads;
DROP POLICY IF EXISTS "resource_downloads_select_own_or_owner" ON public.resource_downloads;

-- 3. Drop policies on resources
DROP POLICY IF EXISTS "resources_owner_all" ON public.resources;

-- 4. Drop trigger on resources
DROP TRIGGER IF EXISTS set_updated_at_resources ON public.resources;

-- 5. Drop tables (resource_downloads first due to foreign key reference)
DROP TABLE IF EXISTS public.resource_downloads;
DROP TABLE IF EXISTS public.resources;

COMMIT;
