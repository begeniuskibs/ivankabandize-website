import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import ArticleView, { RelatedPostData, ArticleSeriesContext } from '@/components/public/ArticleView'
import TeaserArticleView from '@/components/public/TeaserArticleView'
import { getPostTeaser } from '@/lib/postTeaser'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface GardenPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: GardenPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // SECURITY RULE: select only whitelisted fields, never select content.
  const { data: post } = await adminClient
    .from('posts')
    .select('id, slug, title, excerpt, published_at, updated_at, featured_image_url, visibility, publish_status')
    .eq('slug', slug)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .maybeSingle()

  if (!post) {
    return { title: 'Post Not Found' }
  }

  const description = post.excerpt ? post.excerpt.trim() : undefined
  const ogImages = post.featured_image_url ? [{ url: post.featured_image_url }] : undefined

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: 'article',
      publishedTime: post.published_at || undefined,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: post.featured_image_url ? [post.featured_image_url] : undefined,
    },
  }
}

export default async function GardenPostPage({ params }: GardenPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Query post by slug - RLS restricts anon users to visibility='public' AND publish_status='published'
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, content, excerpt, published_at, content_type, featured_image_url, header_image_width, series_id, post_tags(tag:tags(name, slug))')
    .eq('slug', slug)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle()

  if (error || !post) {
    const teaser = await getPostTeaser(slug)
    if (!teaser) {
      notFound()
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const isUpgrade = Boolean(user)

    return <TeaserArticleView teaser={teaser} isUpgrade={isUpgrade} />
  }

  // Fetch series context if post belongs to a series
  let seriesContext: ArticleSeriesContext | null = null
  if (post.series_id) {
    const now = new Date().toISOString()
    const { data: seriesData } = await supabase
      .from('series')
      .select('id, title, slug, status')
      .eq('id', post.series_id)
      .maybeSingle()

    if (seriesData) {
      // Query published siblings in published_at ascending order
      const { data: siblings } = await supabase
        .from('posts')
        .select('id, title, slug, published_at')
        .eq('series_id', post.series_id)
        .eq('publish_status', 'published')
        .not('published_at', 'is', null)
        .lte('published_at', now)
        .order('published_at', { ascending: true })

      if (siblings && siblings.length > 0) {
        const currentIndex = siblings.findIndex((s) => s.id === post.id)
        if (currentIndex !== -1) {
          seriesContext = {
            series: seriesData,
            partNumber: currentIndex + 1,
            totalParts: siblings.length,
            prevPost:
              currentIndex > 0
                ? { title: siblings[currentIndex - 1].title, slug: siblings[currentIndex - 1].slug }
                : null,
            nextPost:
              currentIndex < siblings.length - 1
                ? { title: siblings[currentIndex + 1].title, slug: siblings[currentIndex + 1].slug }
                : null,
          }
        }
      }
    }
  }

  // Fetch a related/recent post for the optional "You might have missed" bookmark card
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, content_type, featured_image_url')
    .neq('slug', slug)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(1)

  const relatedPost = (relatedPosts && relatedPosts.length > 0 ? relatedPosts[0] : null) as RelatedPostData | null

  return <ArticleView post={post} relatedPost={relatedPost} seriesContext={seriesContext} />
}
