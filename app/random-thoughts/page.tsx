import { createClient } from '@/utils/supabase/server'
import GardenFeed from '@/components/public/GardenFeed'

export const dynamic = 'force-dynamic'

// Temporary hero banner image (swap with final image anytime)
const HERO_BANNER = '/images/auth-pool/01-bookblock-notebook.jpg'

export const metadata = {
  title: 'Random Thoughts | Ivan Kabandize',
  description: 'Spontaneous sparks, observations, raw reflections, and working notes.',
}

export default async function RandomThoughtsPage() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, content_type, post_tags(tag:tags(name, slug))')
    .eq('content_type', 'random_thoughts')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching random thoughts:', error)
  }

  return (
    <GardenFeed
      title="Random Thoughts"
      eyebrow="Sparks & Observations"
      description="Spontaneous ideas, fleeting observations, and short reflections captured in the moment."
      currentFilter="random_thoughts"
      posts={posts || []}
      heroBannerImage={HERO_BANNER}
    />
  )
}
