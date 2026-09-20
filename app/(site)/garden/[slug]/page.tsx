import { createClient } from '@/utils/supabase/server'
import ArticleView, { RelatedPostData } from '@/components/public/ArticleView'
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
    .select('id, title, slug, content, excerpt, published_at, content_type, featured_image_url, post_tags(tag:tags(name, slug))')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !post) {
    notFound()
  }

  // Fetch a related/recent post for the optional "You might have missed" bookmark card
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, content_type, featured_image_url')
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(1)

  const relatedPost = (relatedPosts && relatedPosts.length > 0 ? relatedPosts[0] : null) as RelatedPostData | null

  return <ArticleView post={post} relatedPost={relatedPost} />
}
