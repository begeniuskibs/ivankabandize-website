-- Sprint A1: Deploy full 13-table data model with RLS policies

-- ============================================================================
-- 1. ENUMS & EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
  CREATE TYPE member_tier_status AS ENUM ('free', 'paid', 'comped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'incomplete', 'trialing');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_visibility AS ENUM ('public', 'free', 'paid', 'comped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE post_publish_status AS ENUM ('draft', 'scheduled', 'published');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE newsletter_subscription_status AS ENUM ('active', 'unsubscribed', 'pending');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE comment_status AS ENUM ('published', 'soft_deleted');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- 2. HELPER FUNCTIONS
-- ============================================================================

-- Function to handle auto-updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper function to check if current user is the Owner or service_role
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  IF current_setting('role', true) = 'service_role' THEN
    RETURN true;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND (role = 'owner' OR is_owner = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function to check post visibility based on user auth & member tier
CREATE OR REPLACE FUNCTION public.can_view_post(p_visibility post_visibility, p_publish_status post_publish_status)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier member_tier_status;
BEGIN
  -- Owner can view all posts (including drafts and scheduled)
  IF public.is_owner() THEN
    RETURN true;
  END IF;

  -- Non-published posts cannot be viewed by public/non-owner members
  IF p_publish_status != 'published' THEN
    RETURN false;
  END IF;

  -- Public posts are accessible to everyone
  IF p_visibility = 'public' THEN
    RETURN true;
  END IF;

  -- Anon visitors cannot view non-public posts
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Get member tier_status
  SELECT tier_status INTO v_tier FROM public.members WHERE user_id = auth.uid();
  IF v_tier IS NULL THEN
    RETURN (p_visibility = 'free');
  END IF;

  IF v_tier = 'comped' THEN
    RETURN true;
  ELSIF v_tier = 'paid' THEN
    RETURN p_visibility IN ('public', 'free', 'paid');
  ELSIF v_tier = 'free' THEN
    RETURN p_visibility IN ('public', 'free');
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- 3. TABLES DEFINITION (13 TABLES)
-- ============================================================================

-- 1. users: Supabase Auth-linked profile table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  is_owner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. members: tier_status, signup_source, referral_code
CREATE TABLE IF NOT EXISTS public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  tier_status member_tier_status NOT NULL DEFAULT 'free',
  signup_source TEXT,
  referral_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. tiers: tier definitions (name, price, description)
CREATE TABLE IF NOT EXISTS public.tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  currency TEXT NOT NULL DEFAULT 'USD',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. subscriptions: links members to tiers, status, billing period
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  tier_id UUID NOT NULL REFERENCES public.tiers(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'active',
  billing_period TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly', 'quarterly', 'lifetime')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. posts: title, content (JSONB), visibility, publish_status, published_at
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  excerpt TEXT,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  visibility post_visibility NOT NULL DEFAULT 'public',
  publish_status post_publish_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  featured_image_url TEXT,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. tags: name, is_internal (boolean)
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT UNIQUE,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. post_tags: join table, posts <-> tags
CREATE TABLE IF NOT EXISTS public.post_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, tag_id)
);

-- 8. newsletters: multiple distinct newsletters: name, description, is_active
CREATE TABLE IF NOT EXISTS public.newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. newsletter_subscriptions: member_id, newsletter_id, subscribed_at, status
CREATE TABLE IF NOT EXISTS public.newsletter_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  newsletter_id UUID NOT NULL REFERENCES public.newsletters(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status newsletter_subscription_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, newsletter_id)
);

-- 10. comments: post_id, author info, content, parent_comment_id, status
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  author_name TEXT,
  author_email TEXT,
  author_avatar_url TEXT,
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  status comment_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. pages: for structural pages (Homepage, Services, About): slug, hero_headline, trust_bar_entities (JSONB), testimonials (JSONB), cta_text
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  hero_headline TEXT NOT NULL,
  hero_subheadline TEXT,
  trust_bar_entities JSONB NOT NULL DEFAULT '[]'::jsonb,
  testimonials JSONB NOT NULL DEFAULT '[]'::jsonb,
  cta_text TEXT,
  cta_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. post_views: post_id, session_hash, viewed_at
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  session_hash TEXT NOT NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. now_entries: content (text), entry_date (date), is_current (boolean), status_tags (text array). ALWAYS PUBLIC.
CREATE TABLE IF NOT EXISTS public.now_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  status_tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- 4. UPDATED_AT TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_members ON public.members;
CREATE TRIGGER set_updated_at_members BEFORE UPDATE ON public.members FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tiers ON public.tiers;
CREATE TRIGGER set_updated_at_tiers BEFORE UPDATE ON public.tiers FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_subscriptions ON public.subscriptions;
CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_posts ON public.posts;
CREATE TRIGGER set_updated_at_posts BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_tags ON public.tags;
CREATE TRIGGER set_updated_at_tags BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_post_tags ON public.post_tags;
CREATE TRIGGER set_updated_at_post_tags BEFORE UPDATE ON public.post_tags FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_newsletters ON public.newsletters;
CREATE TRIGGER set_updated_at_newsletters BEFORE UPDATE ON public.newsletters FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_newsletter_subscriptions ON public.newsletter_subscriptions;
CREATE TRIGGER set_updated_at_newsletter_subscriptions BEFORE UPDATE ON public.newsletter_subscriptions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_comments ON public.comments;
CREATE TRIGGER set_updated_at_comments BEFORE UPDATE ON public.comments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_pages ON public.pages;
CREATE TRIGGER set_updated_at_pages BEFORE UPDATE ON public.pages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_post_views ON public.post_views;
CREATE TRIGGER set_updated_at_post_views BEFORE UPDATE ON public.post_views FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_now_entries ON public.now_entries;
CREATE TRIGGER set_updated_at_now_entries BEFORE UPDATE ON public.now_entries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. AUTH SIGNUP TRIGGER (SYNC auth.users -> public.users & public.members)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, is_owner)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    COALESCE(NEW.raw_app_meta_data->>'role', 'member'),
    COALESCE((NEW.raw_app_meta_data->>'is_owner')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.members (user_id, tier_status, signup_source)
  VALUES (
    NEW.id,
    'free',
    COALESCE(NEW.raw_user_meta_data->>'signup_source', 'web')
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (ALL 13 TABLES)
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.now_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 7.1 users
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "users_select_own_or_owner" ON public.users;
CREATE POLICY "users_select_own_or_owner" ON public.users
  FOR SELECT USING ((id = auth.uid()) OR public.is_owner());

DROP POLICY IF EXISTS "users_insert_own_or_owner" ON public.users;
CREATE POLICY "users_insert_own_or_owner" ON public.users
  FOR INSERT WITH CHECK ((id = auth.uid()) OR public.is_owner());

DROP POLICY IF EXISTS "users_update_own_or_owner" ON public.users;
CREATE POLICY "users_update_own_or_owner" ON public.users
  FOR UPDATE USING ((id = auth.uid()) OR public.is_owner()) WITH CHECK ((id = auth.uid()) OR public.is_owner());

DROP POLICY IF EXISTS "users_delete_owner_only" ON public.users;
CREATE POLICY "users_delete_owner_only" ON public.users
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.2 members
-- No public SELECT. Member SELECT/UPDATE own row. NO DELETE policy (blocked at RLS level).
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "members_select_own_or_owner" ON public.members;
CREATE POLICY "members_select_own_or_owner" ON public.members
  FOR SELECT USING ((user_id = auth.uid()) OR public.is_owner());

DROP POLICY IF EXISTS "members_insert_own_or_owner" ON public.members;
CREATE POLICY "members_insert_own_or_owner" ON public.members
  FOR INSERT WITH CHECK ((user_id = auth.uid()) OR public.is_owner());

DROP POLICY IF EXISTS "members_update_own_or_owner" ON public.members;
CREATE POLICY "members_update_own_or_owner" ON public.members
  FOR UPDATE USING ((user_id = auth.uid()) OR public.is_owner()) WITH CHECK ((user_id = auth.uid()) OR public.is_owner());

-- Explicitly NO DELETE policy on members table to block DELETE at RLS level entirely.

-- ----------------------------------------------------------------------------
-- 7.3 tiers
-- Read-only for authenticated members / Owner; Owner-only writes.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "tiers_select_authenticated_or_owner" ON public.tiers;
CREATE POLICY "tiers_select_authenticated_or_owner" ON public.tiers
  FOR SELECT USING ((auth.role() = 'authenticated') OR public.is_owner());

DROP POLICY IF EXISTS "tiers_insert_owner_only" ON public.tiers;
CREATE POLICY "tiers_insert_owner_only" ON public.tiers
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "tiers_update_owner_only" ON public.tiers;
CREATE POLICY "tiers_update_owner_only" ON public.tiers
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "tiers_delete_owner_only" ON public.tiers;
CREATE POLICY "tiers_delete_owner_only" ON public.tiers
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.4 subscriptions
-- Read-only for authenticated members on own subscription; Owner-only writes.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "subscriptions_select_own_or_owner" ON public.subscriptions;
CREATE POLICY "subscriptions_select_own_or_owner" ON public.subscriptions
  FOR SELECT USING (
    public.is_owner() OR member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "subscriptions_insert_owner_only" ON public.subscriptions;
CREATE POLICY "subscriptions_insert_owner_only" ON public.subscriptions
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "subscriptions_update_owner_only" ON public.subscriptions;
CREATE POLICY "subscriptions_update_owner_only" ON public.subscriptions
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "subscriptions_delete_owner_only" ON public.subscriptions;
CREATE POLICY "subscriptions_delete_owner_only" ON public.subscriptions
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.5 posts
-- Public: visibility='public' AND publish_status='published'.
-- Authenticated members: matching tier_status or lower. Owner: full access.
-- Writes: Owner only.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "posts_select_visibility_or_owner" ON public.posts;
CREATE POLICY "posts_select_visibility_or_owner" ON public.posts
  FOR SELECT USING (public.can_view_post(visibility, publish_status));

DROP POLICY IF EXISTS "posts_insert_owner_only" ON public.posts;
CREATE POLICY "posts_insert_owner_only" ON public.posts
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "posts_update_owner_only" ON public.posts;
CREATE POLICY "posts_update_owner_only" ON public.posts
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "posts_delete_owner_only" ON public.posts;
CREATE POLICY "posts_delete_owner_only" ON public.posts
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.6 tags
-- Public SELECT. Owner-only INSERT/UPDATE/DELETE.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "tags_select_public" ON public.tags;
CREATE POLICY "tags_select_public" ON public.tags
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "tags_insert_owner_only" ON public.tags;
CREATE POLICY "tags_insert_owner_only" ON public.tags
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "tags_update_owner_only" ON public.tags;
CREATE POLICY "tags_update_owner_only" ON public.tags
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "tags_delete_owner_only" ON public.tags;
CREATE POLICY "tags_delete_owner_only" ON public.tags
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.7 post_tags
-- SELECT based on post viewability / owner. Owner-only write.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "post_tags_select_viewable_or_owner" ON public.post_tags;
CREATE POLICY "post_tags_select_viewable_or_owner" ON public.post_tags
  FOR SELECT USING (
    public.is_owner() OR EXISTS (
      SELECT 1 FROM public.posts
      WHERE posts.id = post_tags.post_id AND public.can_view_post(posts.visibility, posts.publish_status)
    )
  );

DROP POLICY IF EXISTS "post_tags_insert_owner_only" ON public.post_tags;
CREATE POLICY "post_tags_insert_owner_only" ON public.post_tags
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "post_tags_update_owner_only" ON public.post_tags;
CREATE POLICY "post_tags_update_owner_only" ON public.post_tags
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "post_tags_delete_owner_only" ON public.post_tags;
CREATE POLICY "post_tags_delete_owner_only" ON public.post_tags
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.8 newsletters
-- Public SELECT. Owner-only write.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "newsletters_select_public" ON public.newsletters;
CREATE POLICY "newsletters_select_public" ON public.newsletters
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "newsletters_insert_owner_only" ON public.newsletters;
CREATE POLICY "newsletters_insert_owner_only" ON public.newsletters
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "newsletters_update_owner_only" ON public.newsletters;
CREATE POLICY "newsletters_update_owner_only" ON public.newsletters
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "newsletters_delete_owner_only" ON public.newsletters;
CREATE POLICY "newsletters_delete_owner_only" ON public.newsletters
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.9 newsletter_subscriptions
-- Readable/writable only by owning member or owner.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "newsletter_subs_select_own_or_owner" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_subs_select_own_or_owner" ON public.newsletter_subscriptions
  FOR SELECT USING (
    public.is_owner() OR member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "newsletter_subs_insert_own_or_owner" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_subs_insert_own_or_owner" ON public.newsletter_subscriptions
  FOR INSERT WITH CHECK (
    public.is_owner() OR member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "newsletter_subs_update_own_or_owner" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_subs_update_own_or_owner" ON public.newsletter_subscriptions
  FOR UPDATE USING (
    public.is_owner() OR member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  ) WITH CHECK (
    public.is_owner() OR member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "newsletter_subs_delete_own_or_owner" ON public.newsletter_subscriptions;
CREATE POLICY "newsletter_subs_delete_own_or_owner" ON public.newsletter_subscriptions
  FOR DELETE USING (
    public.is_owner() OR member_id IN (
      SELECT id FROM public.members WHERE user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 7.10 comments
-- Public SELECT where status='published' (or own comment / owner).
-- Authenticated users can INSERT. Soft-delete (UPDATE) for author. DELETE Owner-only.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "comments_select_published_or_own_or_owner" ON public.comments;
CREATE POLICY "comments_select_published_or_own_or_owner" ON public.comments
  FOR SELECT USING (
    public.is_owner() OR (user_id = auth.uid()) OR (
      status = 'published' AND EXISTS (
        SELECT 1 FROM public.posts
        WHERE posts.id = comments.post_id AND public.can_view_post(posts.visibility, posts.publish_status)
      )
    )
  );

DROP POLICY IF EXISTS "comments_insert_authenticated_or_owner" ON public.comments;
CREATE POLICY "comments_insert_authenticated_or_owner" ON public.comments
  FOR INSERT WITH CHECK (
    public.is_owner() OR (
      auth.role() = 'authenticated' AND (user_id IS NULL OR user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "comments_update_author_or_owner" ON public.comments;
CREATE POLICY "comments_update_author_or_owner" ON public.comments
  FOR UPDATE USING (
    (user_id = auth.uid()) OR public.is_owner()
  ) WITH CHECK (
    (user_id = auth.uid()) OR public.is_owner()
  );

DROP POLICY IF EXISTS "comments_delete_owner_only" ON public.comments;
CREATE POLICY "comments_delete_owner_only" ON public.comments
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.11 pages
-- Public SELECT allowed. Editing requires Owner role. NO DELETE policy for anyone.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "pages_select_public" ON public.pages;
CREATE POLICY "pages_select_public" ON public.pages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "pages_insert_owner_only" ON public.pages;
CREATE POLICY "pages_insert_owner_only" ON public.pages
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "pages_update_owner_only" ON public.pages;
CREATE POLICY "pages_update_owner_only" ON public.pages
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

-- Explicitly NO DELETE policy for pages table (non-deletable).

-- ----------------------------------------------------------------------------
-- 7.12 post_views
-- INSERT-only from public. SELECT/UPDATE/DELETE Owner-only.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "post_views_insert_public" ON public.post_views;
CREATE POLICY "post_views_insert_public" ON public.post_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "post_views_select_owner_only" ON public.post_views;
CREATE POLICY "post_views_select_owner_only" ON public.post_views
  FOR SELECT USING (public.is_owner());

DROP POLICY IF EXISTS "post_views_update_owner_only" ON public.post_views;
CREATE POLICY "post_views_update_owner_only" ON public.post_views
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "post_views_delete_owner_only" ON public.post_views;
CREATE POLICY "post_views_delete_owner_only" ON public.post_views
  FOR DELETE USING (public.is_owner());

-- ----------------------------------------------------------------------------
-- 7.13 now_entries
-- ALWAYS PUBLIC SELECT. Owner-only write.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "now_entries_select_public" ON public.now_entries;
CREATE POLICY "now_entries_select_public" ON public.now_entries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "now_entries_insert_owner_only" ON public.now_entries;
CREATE POLICY "now_entries_insert_owner_only" ON public.now_entries
  FOR INSERT WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "now_entries_update_owner_only" ON public.now_entries;
CREATE POLICY "now_entries_update_owner_only" ON public.now_entries
  FOR UPDATE USING (public.is_owner()) WITH CHECK (public.is_owner());

DROP POLICY IF EXISTS "now_entries_delete_owner_only" ON public.now_entries;
CREATE POLICY "now_entries_delete_owner_only" ON public.now_entries
  FOR DELETE USING (public.is_owner());
