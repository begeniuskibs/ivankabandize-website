-- Verification: 20261021160300_verify_db_hardening.sql
-- Purpose: Read-only verification of database, function, and storage hardening
-- Date: 2026-10-21
-- Status: approved by Ivan 2026-10-21

-- Check 1: No TRUNCATE, TRIGGER, or REFERENCES privileges remain for anon or authenticated
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND grantee IN ('anon', 'authenticated')
    AND privilege_type IN ('TRUNCATE', 'TRIGGER', 'REFERENCES');

  IF v_count > 0 THEN
    RAISE EXCEPTION 'Verification failed: TRUNCATE/TRIGGER/REFERENCES privileges remain for anon or authenticated (% found)', v_count;
  END IF;
END;
$$;

-- Check 2: Anon has no INSERT, UPDATE, or DELETE privileges on public tables except INSERT on post_views
DO $$
DECLARE
  v_excess_writes integer;
  v_post_views_insert integer;
BEGIN
  SELECT count(*) INTO v_excess_writes
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE')
    AND NOT (table_name = 'post_views' AND privilege_type = 'INSERT');

  IF v_excess_writes > 0 THEN
    RAISE EXCEPTION 'Verification failed: unexpected write privileges remain for anon (% found)', v_excess_writes;
  END IF;

  SELECT count(*) INTO v_post_views_insert
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND grantee = 'anon'
    AND table_name = 'post_views'
    AND privilege_type = 'INSERT';

  IF v_post_views_insert = 0 THEN
    RAISE EXCEPTION 'Verification failed: anon must have INSERT privilege on public.post_views';
  END IF;
END;
$$;

-- Check 3: Authenticated still retains INSERT, UPDATE, DELETE on posts, pages, tags, series, post_tags
DO $$
DECLARE
  v_auth_writes integer;
BEGIN
  SELECT count(*) INTO v_auth_writes
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND grantee = 'authenticated'
    AND table_name IN ('posts', 'pages', 'tags', 'series', 'post_tags')
    AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE');

  IF v_auth_writes <> 15 THEN
    RAISE EXCEPTION 'Verification failed: authenticated missing write privileges on core tables (expected 15, found %)', v_auth_writes;
  END IF;
END;
$$;

-- Check 4: public.handle_updated_at search_path is pinned to public, pg_temp
DO $$
DECLARE
  v_proconfig text[];
BEGIN
  SELECT proconfig INTO v_proconfig
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'handle_updated_at';

  IF v_proconfig IS NULL OR NOT ('search_path=public, pg_temp' = ANY(v_proconfig)) THEN
    RAISE EXCEPTION 'Verification failed: handle_updated_at search_path is not pinned to public, pg_temp';
  END IF;
END;
$$;

-- Check 5: Anon and authenticated cannot EXECUTE the 3 trigger functions
DO $$
DECLARE
  v_func text;
  v_role text;
  v_has_priv boolean;
BEGIN
  FOREACH v_func IN ARRAY ARRAY['handle_new_user', 'rls_auto_enable', 'handle_updated_at'] LOOP
    FOREACH v_role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      SELECT has_function_privilege(v_role, ('public.' || quote_ident(v_func) || '()')::regprocedure, 'EXECUTE')
      INTO v_has_priv;

      IF v_has_priv THEN
        RAISE EXCEPTION 'Verification failed: role % has EXECUTE privilege on %', v_role, v_func;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;

-- Check 6: Anon CAN still EXECUTE is_owner and can_view_post
DO $$
DECLARE
  v_can_is_owner boolean;
  v_can_view_post boolean;
BEGIN
  SELECT has_function_privilege('anon', 'public.is_owner()', 'EXECUTE') INTO v_can_is_owner;
  SELECT has_function_privilege('anon', 'public.can_view_post(public.post_visibility, public.post_publish_status)', 'EXECUTE') INTO v_can_view_post;

  IF NOT v_can_is_owner THEN
    RAISE EXCEPTION 'Verification failed: anon must be able to EXECUTE public.is_owner()';
  END IF;

  IF NOT v_can_view_post THEN
    RAISE EXCEPTION 'Verification failed: anon must be able to EXECUTE public.can_view_post(...)';
  END IF;
END;
$$;

-- Check 7: Anon cannot SELECT from storage.objects (tested under simulated anon role)
BEGIN;
SET LOCAL ROLE anon;
DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*) INTO v_count FROM storage.objects;
  IF v_count > 0 THEN
    RAISE EXCEPTION 'Verification failed: anon was able to SELECT rows from storage.objects (% rows seen)', v_count;
  END IF;
END;
$$;
ROLLBACK;

-- Check 8: Storage bucket limits and allowed MIME types are set
DO $$
DECLARE
  v_img_size bigint;
  v_img_mime text[];
  v_vid_size bigint;
  v_vid_mime text[];
BEGIN
  SELECT file_size_limit, allowed_mime_types INTO v_img_size, v_img_mime
  FROM storage.buckets
  WHERE id = 'post-images';

  IF v_img_size <> 10485760 THEN
    RAISE EXCEPTION 'Verification failed: post-images file_size_limit is %, expected 10485760', v_img_size;
  END IF;

  IF v_img_mime <> ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif'] THEN
    RAISE EXCEPTION 'Verification failed: post-images allowed_mime_types mismatch';
  END IF;

  SELECT file_size_limit, allowed_mime_types INTO v_vid_size, v_vid_mime
  FROM storage.buckets
  WHERE id = 'post-videos';

  IF v_vid_size <> 104857600 THEN
    RAISE EXCEPTION 'Verification failed: post-videos file_size_limit is %, expected 104857600', v_vid_size;
  END IF;

  IF v_vid_mime <> ARRAY['video/mp4','video/webm','video/quicktime','video/x-m4v'] THEN
    RAISE EXCEPTION 'Verification failed: post-videos allowed_mime_types mismatch';
  END IF;
END;
$$;
