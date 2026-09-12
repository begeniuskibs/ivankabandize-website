-- Create inquiries table for "Let's Talk" contact submissions

CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organisation TEXT,
  problem TEXT NOT NULL,
  help_type TEXT,
  timing TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security immediately
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Grant access to anon and authenticated roles so RLS policies are evaluated
GRANT ALL ON TABLE public.inquiries TO anon, authenticated, service_role;

-- RLS Policies

-- 1. INSERT: Allowed for anon and authenticated roles without restrictions
DROP POLICY IF EXISTS "inquiries_insert_public" ON public.inquiries;
CREATE POLICY "inquiries_insert_public" ON public.inquiries
  FOR INSERT WITH CHECK (true);

-- 2. SELECT: Owner role only (checked via public.users role = 'owner' / is_owner = true / is_owner())
DROP POLICY IF EXISTS "inquiries_select_owner_only" ON public.inquiries;
CREATE POLICY "inquiries_select_owner_only" ON public.inquiries
  FOR SELECT USING (public.is_owner());

-- 3. UPDATE: Owner role only
DROP POLICY IF EXISTS "inquiries_update_owner_only" ON public.inquiries;
CREATE POLICY "inquiries_update_owner_only" ON public.inquiries
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

-- No DELETE policy (non-deletable)
