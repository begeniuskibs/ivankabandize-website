-- Migration: 20261021160100_function_hardening.sql
-- Purpose: Function security hardening - pin search_path on handle_updated_at and revoke execute on internal trigger functions
-- Date: 2026-10-21
-- Status: approved by Ivan 2026-10-21

-- WARNING: DO NOT touch public.is_owner() or public.can_view_post(...).
-- Row security policies call them as the anonymous visitor; revoking would break every public page.

BEGIN;

-- a. Pin search_path on handle_updated_at to prevent search_path hijacking
ALTER FUNCTION public.handle_updated_at() SET search_path = public, pg_temp;

-- b. Revoke EXECUTE on internal trigger functions from PUBLIC, anon, and authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user(), public.rls_auto_enable(), public.handle_updated_at() FROM PUBLIC, anon, authenticated;

COMMIT;
