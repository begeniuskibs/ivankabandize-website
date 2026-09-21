import { createClient } from '@/utils/supabase/server'
import GardenFeed from '@/components/public/GardenFeed'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'The Garden | Ivan Kabandize',
  description:
    'A digital garden of essays, random notes, structured thoughts, and tools for thought.',
}

export default async function GardenPage() {
  const supabase = await createClient()

  // Query posts table directly with explicit published-only filters
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, content_type, featured_image_url, post_tags(tag:tags(name, slug))')
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching garden posts:', error)
  }

  return (
    <GardenFeed
      title="The Garden"
      eyebrow="Digital Garden & Notebook"
      description="A living repository of essays, sparks, reflections, and systems notes - tended across different streams of thought."
      currentFilter="all"
      posts={posts || []}
    />
  )
}
