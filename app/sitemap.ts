import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/utils/supabase/admin'
import { SITE_URL } from '@/lib/siteUrl'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString()
  const adminClient = createAdminClient()

  // 1. Static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/me`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/workwithme`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/garden`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/now`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/lets-talk`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/library`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // 2. Published posts
  // SECURITY: Whitelist of allowed fields only (never select content).
  const { data: posts } = await adminClient
    .from('posts')
    .select('id, slug, title, excerpt, published_at, updated_at, featured_image_url, visibility, publish_status')
    .eq('publish_status', 'published')
    .eq('visibility', 'public')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })

  const postRoutes: MetadataRoute.Sitemap = (posts || [])
    .filter((p) => Boolean(p.slug))
    .map((p) => ({
      url: `${SITE_URL}/garden/${p.slug}`,
      lastModified: p.updated_at
        ? new Date(p.updated_at)
        : p.published_at
          ? new Date(p.published_at)
          : new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    }))

  // 3. Series routes
  const { data: series } = await adminClient
    .from('series')
    .select('id, slug, updated_at')

  const seriesRoutes: MetadataRoute.Sitemap = (series || [])
    .filter((s) => Boolean(s.slug))
    .map((s) => ({
      url: `${SITE_URL}/garden/series/${s.slug}`,
      lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  // 4. Topic routes
  // Only include non-internal tags that resolve with published posts or library items.
  const postIds = (posts || []).map((p) => p.id)
  const activeTagIds = new Set<string>()

  if (postIds.length > 0) {
    const { data: ptRows } = await adminClient
      .from('post_tags')
      .select('tag_id')
      .in('post_id', postIds)
    ptRows?.forEach((r) => activeTagIds.add(r.tag_id))
  }

  const { data: litRows } = await adminClient
    .from('library_item_tags')
    .select('tag_id')
  litRows?.forEach((r) => activeTagIds.add(r.tag_id))

  const { data: tags } = await adminClient
    .from('tags')
    .select('id, slug, is_internal, updated_at')
    .eq('is_internal', false)

  const topicRoutes: MetadataRoute.Sitemap = (tags || [])
    .filter((t) => Boolean(t.slug) && activeTagIds.has(t.id))
    .map((t) => ({
      url: `${SITE_URL}/garden/topics/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

  return [...staticRoutes, ...topicRoutes, ...seriesRoutes, ...postRoutes]
}
