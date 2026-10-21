-- Migration: 20261021160000_revoke_excess_table_grants.sql
-- Purpose: Revoke excess table privileges from anon and authenticated roles
-- Date: 2026-10-21
-- Status: approved by Ivan 2026-10-21
-- Note: Authenticated write privileges on core tables are preserved for owner admin editor. Default privileges are not modified.

BEGIN;

-- a. Revoke TRUNCATE, TRIGGER, REFERENCES on all tables in schema public from anon and authenticated
REVOKE TRUNCATE, TRIGGER, REFERENCES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- b. Revoke INSERT, UPDATE, DELETE on content and system tables from anon
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.comments,
  public.library_item_tags,
  public.library_items,
  public.newsletter_subscriptions,
  public.newsletters,
  public.now_entries,
  public.pages,
  public.post_tags,
  public.posts,
  public.series,
  public.subscriptions,
  public.tags,
  public.tiers
FROM anon;

-- c. Revoke SELECT, UPDATE, DELETE on public.post_views from anon (anon INSERT on post_views must stay)
REVOKE SELECT, UPDATE, DELETE ON TABLE public.post_views FROM anon;

COMMIT;
