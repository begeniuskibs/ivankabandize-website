import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import GardenFeed from '@/components/public/GardenFeed'
import { getCardMeta } from '@/lib/postTeaser'
import { SITE_URL } from '@/lib/siteUrl'

export const dynamic = 'force-dynamic'

// Temporary hero banner image (swap with final image anytime)
const HERO_BANNER = '/images/auth-pool/01-bookblock-notebook.jpg'

export const metadata: Metadata = {
  title: 'Random Thoughts',
  description: 'Spontaneous sparks, observations, raw reflections, and working notes.',
  alternates: {
    canonical: `${SITE_URL}/random-thoughts`,
  },
}

export default async function RandomThoughtsPage() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, content_type, featured_image_url, post_tags(tag:tags(name, slug, is_internal))')
    .eq('content_type', 'random_thoughts')
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching random thoughts:', error)
  }

  // Previews & read times via single cached helper
  const { previews: cardPreviews, readTimes: cardReadTimes } = await getCardMeta(posts || [])
  const postsWithPreviews = (posts || []).map((p) => ({
    ...p,
    preview: (p.excerpt && p.excerpt.trim()) ? p.excerpt.trim() : (cardPreviews[p.id] || ''),
    readTime: cardReadTimes[p.id] || null,
  }))

  return (
    <GardenFeed
      title="Random Thoughts"
      eyebrow="Sparks & Observations"
      description="Spontaneous ideas, fleeting observations, and short reflections captured in the moment."
      currentFilter="random_thoughts"
      posts={postsWithPreviews}
      heroBannerImage={HERO_BANNER}
    />
  )
}
