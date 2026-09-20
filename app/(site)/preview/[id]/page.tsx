import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import ArticleView from '@/components/public/ArticleView'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params
  const { user, isOwner, supabase } = await getAuthenticatedOwner()

  if (!user || !isOwner) {
    notFound()
  }

  // Owner is authenticated: fetch post by ID in ANY status (draft, scheduled, published)
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, content, excerpt, published_at, content_type, featured_image_url, post_tags(tag:tags(name, slug))')
    .eq('id', id)
    .maybeSingle()

  if (error || !post) {
    notFound()
  }

  return <ArticleView post={post} isPreview />
}
