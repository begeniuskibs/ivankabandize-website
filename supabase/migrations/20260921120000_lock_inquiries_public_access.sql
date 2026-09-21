-- Phase 2: Lock down public access on public.inquiries
-- Revoke anonymous access and public insert policy; inquiries are written solely via privileged server client.

DROP POLICY IF EXISTS "inquiries_insert_public" ON public.inquiries;
REVOKE ALL ON public.inquiries FROM anon;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.inquiries FROM authenticated;

-- Undo Script (if ever needed):
-- CREATE POLICY "inquiries_insert_public" ON public.inquiries FOR INSERT TO public WITH CHECK (true);
-- GRANT INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.inquiries TO anon;
-- GRANT INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.inquiries TO authenticated;
