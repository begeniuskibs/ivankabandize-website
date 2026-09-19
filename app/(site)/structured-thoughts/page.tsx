import { createClient } from '@/utils/supabase/server'
import GardenFeed from '@/components/public/GardenFeed'

export const dynamic = 'force-dynamic'

// Temporary hero banner image (swap with final image anytime)
const HERO_BANNER = '/images/auth-pool/03-gery-wibowo-laptop-study.jpg'

export const metadata = {
  title: 'Structured Thoughts | Ivan Kabandize',
  description: 'In-depth essays, mental models, systems thinking, and long-form analysis.',
}

export default async function StructuredThoughtsPage() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, content_type, featured_image_url, post_tags(tag:tags(name, slug))')
    .eq('content_type', 'structured_thoughts')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching structured thoughts:', error)
  }

  return (
    <GardenFeed
      title="Structured Thoughts"
      eyebrow="Essays & Deep Dives"
      description="Long-form essays, architectural explorations, and frameworks for leadership and systems."
      currentFilter="structured_thoughts"
      posts={posts || []}
      heroBannerImage={HERO_BANNER}
    />
  )
}
