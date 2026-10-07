import { createClient } from '@/utils/supabase/server'
import ArticleView, { RelatedPostData, ArticleSeriesContext } from '@/components/public/ArticleView'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface GardenPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: GardenPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt')
    .eq('slug', slug)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle()

  if (!post) {
    return { title: 'Post Not Found | Ivan Kabandize' }
  }

  return {
    title: `${post.title} | The Garden`,
    description: post.excerpt || undefined,
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
    notFound()
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
