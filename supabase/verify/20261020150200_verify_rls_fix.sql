-- Verification Script: 20261020150200_verify_rls_fix.sql
-- Description: Post-approval verification script for RLS privilege fixes and search_path pinning.
-- Designed to be run safely inside a rolled-back transaction block (safe simulation).

BEGIN;

-- 1. Check table privileges for public.users and public.members
-- Expected: Zero rows returned (no INSERT, UPDATE, DELETE, or TRUNCATE privileges for anon or authenticated).
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name IN ('users', 'members')
  AND grantee IN ('anon', 'authenticated')
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
ORDER BY table_name, grantee, privilege_type;

-- 2. Check proconfig on the three SECURITY DEFINER functions
-- Expected: Each function returns proconfig containing 'search_path=public, pg_temp'.
SELECT p.proname,
       pg_get_function_identity_arguments(p.oid) AS identity_args,
       p.prosecdef AS is_security_definer,
       p.proconfig AS config
FROM pg_proc p
WHERE p.proname IN ('is_owner', 'can_view_post', 'handle_new_user')
  AND p.pronamespace = 'public'::regnamespace
ORDER BY p.proname;

-- 3. Check row counts on public.users and public.members remain unchanged
-- Expected: users count = 1, members count = 1.
SELECT 'users' AS table_name, count(*) AS row_count FROM public.users
UNION ALL
SELECT 'members' AS table_name, count(*) AS row_count FROM public.members;

-- 4. Simulated write check under authenticated role
-- Proves that an UPDATE on public.users and public.members fails with permission denied.
DO $$
DECLARE
  v_users_update_succeeded boolean := false;
  v_members_update_succeeded boolean := false;
BEGIN
  -- Switch local transaction session to authenticated role
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000000', true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Test 4a: Attempt UPDATE on public.users
  BEGIN
    UPDATE public.users SET full_name = 'Privilege Escalation Test' WHERE true;
    v_users_update_succeeded := true;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'SUCCESS: UPDATE on public.users denied with insufficient_privilege.';
  END;

  IF v_users_update_succeeded THEN
    RAISE EXCEPTION 'FAILURE: UPDATE on public.users succeeded unexpectedly!';
  END IF;

  -- Test 4b: Attempt UPDATE on public.members
  BEGIN
    UPDATE public.members SET tier_status = 'paid' WHERE true;
    v_members_update_succeeded := true;
  EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'SUCCESS: UPDATE on public.members denied with insufficient_privilege.';
  END IF;

  IF v_members_update_succeeded THEN
    RAISE EXCEPTION 'FAILURE: UPDATE on public.members succeeded unexpectedly!';
  END IF;

  -- Reset role back before ending the block
  RESET ROLE;
END $$;

-- Rollback the entire transaction block so no changes or session configurations persist
ROLLBACK;
