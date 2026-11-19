-- Migration: 20261119160000_resources_flow_schema.sql
-- Purpose: Schema for Resources flow - resources and resource_downloads tables, RLS, grants, and private storage bucket
-- Date: 2026-11-19
-- Note: Spaced hyphen " - " house style used throughout. NOT APPLIED YET.

BEGIN;

-- 1. Table: public.resources
-- Catalogue of downloadable assets. Every per-resource setting has its own column (no JSONB).
CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL,
  description text,
  kind text NOT NULL,
  digest_slug text,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint NOT NULL DEFAULT 0,
  mime_type text NOT NULL DEFAULT 'application/pdf',
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft',
  visibility text NOT NULL DEFAULT 'public',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resources_kind_check CHECK (kind IN ('guide', 'digest_pdf', 'template', 'framework')),
  CONSTRAINT resources_digest_slug_check CHECK (kind <> 'digest_pdf' OR digest_slug IS NOT NULL),
  CONSTRAINT resources_status_check CHECK (status IN ('draft', 'published', 'archived')),
  CONSTRAINT resources_visibility_check CHECK (visibility IN ('public', 'members'))
);

-- Trigger for auto - updating updated_at on public.resources
DROP TRIGGER IF EXISTS set_updated_at_resources ON public.resources;
CREATE TRIGGER set_updated_at_resources
  BEFORE UPDATE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Indexes for public.resources
CREATE INDEX IF NOT EXISTS idx_resources_status_kind ON public.resources (status, kind);
CREATE INDEX IF NOT EXISTS idx_resources_digest_slug ON public.resources (digest_slug) WHERE digest_slug IS NOT NULL;

-- 2. Table: public.resource_downloads
-- Consent and audit record of every download request.
CREATE TABLE IF NOT EXISTS public.resource_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE RESTRICT,
  member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  name text,
  email text,
  anonymised_at timestamptz,
  consent_wording_version text NOT NULL,
  consent_text text NOT NULL,
  signed_link_issued_at timestamptz NOT NULL DEFAULT now(),
  request_fingerprint text,
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resource_downloads_anonymised_check CHECK (anonymised_at IS NOT NULL OR (name IS NOT NULL AND email IS NOT NULL))
);

-- Indexes for public.resource_downloads
CREATE INDEX IF NOT EXISTS idx_resource_downloads_lower_email_created_at ON public.resource_downloads (lower(email), created_at);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_resource_id ON public.resource_downloads (resource_id);
CREATE INDEX IF NOT EXISTS idx_resource_downloads_created_at ON public.resource_downloads (created_at);

-- 3. Row Level Security (RLS)
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;

-- Policy on public.resources: ONE policy, owner only.
-- Public pages will read resources only through the server - only admin client,
-- selecting safe columns, so file_path is never visible to visitors.
DROP POLICY IF EXISTS "resources_owner_all" ON public.resources;
CREATE POLICY "resources_owner_all"
  ON public.resources
  FOR ALL
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- Policies on public.resource_downloads:
-- SELECT policy: owner can view all; authenticated members can view their own downloads.
DROP POLICY IF EXISTS "resource_downloads_select_own_or_owner" ON public.resource_downloads;
CREATE POLICY "resource_downloads_select_own_or_owner"
  ON public.resource_downloads
  FOR SELECT
  TO authenticated
  USING (
    public.is_owner()
    OR (
      member_id IS NOT NULL
      AND member_id IN (
        SELECT m.id FROM public.members m WHERE m.user_id = auth.uid()
      )
    )
  );

-- UPDATE policy: owner only (for yearly review and anonymisation removal routine).
DROP POLICY IF EXISTS "resource_downloads_update_owner_only" ON public.resource_downloads;
CREATE POLICY "resource_downloads_update_owner_only"
  ON public.resource_downloads
  FOR UPDATE
  TO authenticated
  USING (public.is_owner())
  WITH CHECK (public.is_owner());

-- DELETE policy: owner only (for yearly review and removal tool).
DROP POLICY IF EXISTS "resource_downloads_delete_owner_only" ON public.resource_downloads;
CREATE POLICY "resource_downloads_delete_owner_only"
  ON public.resource_downloads
  FOR DELETE
  TO authenticated
  USING (public.is_owner());

-- Note: Deliberately NO insert policy on resource_downloads (rows are created strictly by the server route via admin client).
-- Deliberately NO anonymous policy of any kind on either table.

-- 4. Hardening Grants (Least Privilege)
-- Revoke all privileges from anon role on both tables
REVOKE ALL ON TABLE public.resources, public.resource_downloads FROM anon;

-- Revoke administrative/schema privileges from authenticated role
REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLE public.resources, public.resource_downloads FROM authenticated;

-- On resource_downloads, authenticated only needs SELECT, UPDATE, DELETE (owner/member reads, owner cleanup)
-- It must NOT have INSERT privilege (all download records are created exclusively via service_role admin client)
REVOKE INSERT ON TABLE public.resource_downloads FROM authenticated;

-- Grant explicit least - privilege permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.resources TO authenticated;
GRANT SELECT, UPDATE, DELETE ON TABLE public.resource_downloads TO authenticated;

-- 5. Storage Bucket Configuration
-- Create private storage bucket "resource-files" (public = false, limit 25MB, restricted mime types)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resource-files',
  'resource-files',
  false,
  26214400,
  ARRAY['application/pdf', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = ARRAY['application/pdf', 'application/zip'];

-- Note: Deliberately NO storage.objects policies for anon or authenticated roles.
-- The server route accesses files and generates short - lived signed download URLs using the service_role key.

COMMIT;
