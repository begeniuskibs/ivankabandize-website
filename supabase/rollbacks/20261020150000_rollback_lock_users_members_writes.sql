-- Rollback: 20261020150000_rollback_lock_users_members_writes.sql
-- Description: Restores table write privileges on public.users and public.members to anon and authenticated, and resets search_path on the three functions.

BEGIN;

-- 1. Restore table write, truncate, delete, and reference privileges as recorded prior to migration
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.users TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.members TO anon, authenticated;

-- 2. Reset search_path on the three functions back to default
ALTER FUNCTION public.is_owner() RESET search_path;
ALTER FUNCTION public.can_view_post(p_visibility post_visibility, p_publish_status post_publish_status) RESET search_path;
ALTER FUNCTION public.handle_new_user() RESET search_path;

COMMIT;
