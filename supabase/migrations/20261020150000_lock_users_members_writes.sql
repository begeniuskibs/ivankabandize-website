-- Migration: 20261020150000_lock_users_members_writes.sql
-- Description: Revoke client-side write privileges (INSERT, UPDATE, DELETE, TRUNCATE) on public.users and public.members from roles anon and authenticated.
-- Client-side writes are prohibited; new records are created solely via the handle_new_user SECURITY DEFINER trigger.
-- Policy note: Existing RLS policies (e.g. users_update_own_or_owner, members_update_own_or_owner) are intentionally preserved in place as a second defense layer rather than dropped. The privilege revokes serve as the primary hard barrier against unauthorized client modifications.
-- SELECT privileges for anon and authenticated remain intact.
-- Privileges for service_role and postgres remain untouched.

BEGIN;

-- 1. Revoke table-level write privileges from anon and authenticated
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.users FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.members FROM anon, authenticated;

-- 2. Revoke column-level write privileges explicitly (ensuring no column grants remain)
REVOKE INSERT (id, email, full_name, avatar_url, role, is_owner, created_at, updated_at),
       UPDATE (id, email, full_name, avatar_url, role, is_owner, created_at, updated_at)
ON TABLE public.users FROM anon, authenticated;

REVOKE INSERT (id, user_id, tier_status, referral_code, signup_source, created_at, updated_at),
       UPDATE (id, user_id, tier_status, referral_code, signup_source, created_at, updated_at)
ON TABLE public.members FROM anon, authenticated;

COMMIT;
