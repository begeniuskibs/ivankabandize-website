import { createClient } from '@/utils/supabase/server'
import GardenFeed from '@/components/public/GardenFeed'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The Garden | Ivan Kabandize',
  description:
    'A digital garden of essays, random notes, structured thoughts, and tools for thought.',
}

interface GardenPageProps {
  searchParams?: Promise<{ view?: string }>
}

export default async function GardenPage({ searchParams }: GardenPageProps) {
  const params = (await searchParams) || {}
  const isViewAllArticles = params.view === 'articles'
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Query posts table directly with explicit published-only filters
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, content_type, featured_image_url, post_tags(tag:tags(name, slug, is_internal))')
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching garden posts:', error)
  }

  // Fetch library items (latest 3 for landing section)
  const { data: libraryItemsData, error: libraryError } = await supabase
    .from('library_items')
    .select('id, title, creator, type, url, thumbnail_url, recommendation_note, created_at')
    .order('created_at', { ascending: false })
    .limit(3)

  if (libraryError) {
    console.error('Error fetching library items for garden landing:', libraryError)
  }

  // Fetch report digests (only if any exist)
  const { data: reportDigestsData } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, content_type, featured_image_url, post_tags(tag:tags(name, slug, is_internal))')
    .in('content_type', ['report_digest', 'report_digests'])
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .limit(3)

  // Fetch series with published parts count
  const { data: seriesData, error: seriesError } = await supabase
    .from('series')
    .select('id, title, slug, description, cover_emoji, card_tint, status, sort_order, created_at, posts(id, publish_status, published_at)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (seriesError) {
    console.error('Error fetching garden series:', seriesError)
  }

  interface SeriesPostChild {
    id: string
    publish_status: string
    published_at: string | null
  }

  interface SeriesRawItem {
    id: string
    title: string
    slug: string
    description: string | null
    cover_emoji: string | null
    card_tint: string | null
    status: 'growing' | 'complete'
    posts?: SeriesPostChild[]
  }

  // Filter series with zero published parts
  const visibleSeries = ((seriesData || []) as unknown as SeriesRawItem[])
    .map((s) => {
      const publishedPosts = (s.posts || []).filter(
        (p) =>
          p.publish_status === 'published' &&
          p.published_at &&
          p.published_at <= now
      )
      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        description: s.description,
        cover_emoji: s.cover_emoji,
        card_tint: s.card_tint,
        status: s.status,
        published_count: publishedPosts.length,
      }
    })
    .filter((s) => s.published_count > 0)

  return (
    <GardenFeed
      title="The Garden"
      eyebrow="Digital Garden & Notebook"
      description="A living repository of essays, sparks, reflections, and systems notes - tended across different streams of thought."
      currentFilter="all"
      posts={posts || []}
      series={visibleSeries}
      libraryItems={libraryItemsData || []}
      reportDigests={reportDigestsData || []}
      isSectionedLanding={!isViewAllArticles}
    />
  )
}
