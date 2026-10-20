-- Migration: 20261020150100_pin_function_search_path.sql
-- Description: Pin search_path to 'public, pg_temp' on SECURITY DEFINER functions to prevent search_path hijacking vulnerabilities.
-- Signatures verified from pg_get_function_identity_arguments.
-- Function bodies verified to ensure all table and function references are schema-qualified or resolve in public.

BEGIN;

ALTER FUNCTION public.is_owner() SET search_path = public, pg_temp;

ALTER FUNCTION public.can_view_post(p_visibility post_visibility, p_publish_status post_publish_status) SET search_path = public, pg_temp;

ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;

COMMIT;
