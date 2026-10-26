import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import GardenLandingA2 from '@/components/public/GardenLandingA2'
import GardenArticlesView from '@/components/public/GardenArticlesView'
import { getCardMeta } from '@/lib/postTeaser'
import { SITE_URL } from '@/lib/siteUrl'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'The Garden',
  description:
    'A digital garden of essays, working notes and evolving ideas on technology, leadership and systems thinking.',
  alternates: {
    canonical: `${SITE_URL}/garden`,
  },
}

interface GardenPageProps {
  searchParams?: Promise<{ view?: string }>
}

export default async function GardenPage({ searchParams }: GardenPageProps) {
  const params = (await searchParams) || {}
  const isViewAllArticles = params.view === 'articles'
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Query posts table and library items in parallel (never select content)
  const [
    { data: posts, count: totalArticlesCount, error },
    { data: libraryItemsData, count: totalLibraryCount, error: libraryError },
  ] = await Promise.all([
    supabase
      .from('posts')
      .select(
        'id, title, slug, excerpt, published_at, visibility, publish_status, content_type, featured_image_url, post_tags(tag:tags(name, slug, is_internal))',
        { count: 'exact' }
      )
      .eq('publish_status', 'published')
      .not('published_at', 'is', null)
      .lte('published_at', now)
      .order('published_at', { ascending: false }),
    supabase
      .from('library_items')
      .select('id, title, creator, type, url, thumbnail_url, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  if (error) {
    console.error('Error fetching garden posts:', error)
  }
  if (libraryError) {
    console.error('Error fetching library items for garden landing:', libraryError)
  }

  // Previews & read times via single cached helper, parallelized with series query if on view=articles
  let cardPreviews: Record<string, string> = {}
  let cardReadTimes: Record<string, number> = {}
  let seriesData: unknown[] | null = null

  if (isViewAllArticles) {
    const [metaResult, seriesResult] = await Promise.all([
      getCardMeta(posts || []),
      supabase
        .from('series')
        .select('id, title, slug, description, cover_emoji, card_tint, header_image_url, status, sort_order, created_at, posts(id, publish_status, published_at)')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ])
    cardPreviews = metaResult.previews
    cardReadTimes = metaResult.readTimes
    seriesData = seriesResult.data
    if (seriesResult.error) {
      console.error('Error fetching garden series:', seriesResult.error)
    }
  } else {
    const metaResult = await getCardMeta(posts || [])
    cardPreviews = metaResult.previews
    cardReadTimes = metaResult.readTimes
  }

  const postsWithPreviews = (posts || []).map((p) => ({
    ...p,
    preview: (p.excerpt && p.excerpt.trim()) ? p.excerpt.trim() : (cardPreviews[p.id] || ''),
    readTime: cardReadTimes[p.id] || null,
  }))

  // If view=articles is requested, render the flat all-articles feed with stream filters
  if (isViewAllArticles) {

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
      header_image_url?: string | null
      status: 'growing' | 'complete'
      posts?: SeriesPostChild[]
    }

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
          header_image_url: s.header_image_url || null,
          status: s.status,
          published_count: publishedPosts.length,
        }
      })
      .filter((s) => s.published_count > 0)

    // Extract topic tags with published content (reusing Garden B logic: real tags, non-internal, no category names)
    const CATEGORY_NAMES = ['random thoughts', 'structured thoughts', 'tools for thought']
    const topicTagMap = new Map<string, string>()

    posts?.forEach((post) => {
      const ptList = post.post_tags || []
      ptList.forEach((pt: { tag?: { name?: string | null; slug?: string | null; is_internal?: boolean | null } | { name?: string | null; slug?: string | null; is_internal?: boolean | null }[] | null }) => {
        const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
        if (tagObj?.name && tagObj?.slug && !tagObj.is_internal) {
          const name = tagObj.name.trim()
          if (!CATEGORY_NAMES.includes(name.toLowerCase())) {
            topicTagMap.set(name, tagObj.slug)
          }
        }
      })
    })

    const topicTags = Array.from(topicTagMap.entries())
      .map(([name, slug]) => ({ name, slug }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return (
      <GardenArticlesView
        posts={postsWithPreviews}
        series={visibleSeries}
        topicTags={topicTags}
      />
    )
  }

  // Extract topic tags with published content (reusing Garden B logic: real tags, non-internal, no category names)
  const CATEGORY_NAMES = ['random thoughts', 'structured thoughts', 'tools for thought']
  const topicTagMap = new Map<string, string>()

  posts?.forEach((post) => {
    const ptList = post.post_tags || []
    ptList.forEach((pt: { tag?: { name?: string | null; slug?: string | null; is_internal?: boolean | null } | { name?: string | null; slug?: string | null; is_internal?: boolean | null }[] | null }) => {
      const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
      if (tagObj?.name && tagObj?.slug && !tagObj.is_internal) {
        const name = tagObj.name.trim()
        if (!CATEGORY_NAMES.includes(name.toLowerCase())) {
          topicTagMap.set(name, tagObj.slug)
        }
      }
    })
  })

  const topicTags = Array.from(topicTagMap.entries())
    .map(([name, slug]) => ({ name, slug }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <GardenLandingA2
      articles={postsWithPreviews}
      totalArticlesCount={totalArticlesCount ?? (posts || []).length}
      libraryItems={libraryItemsData || []}
      totalLibraryCount={totalLibraryCount ?? (libraryItemsData || []).length}
      topicTags={topicTags}
    />
  )
}
