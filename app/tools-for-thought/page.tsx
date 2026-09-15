import { createClient } from '@/utils/supabase/server'
import GardenFeed from '@/components/public/GardenFeed'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tools for Thought | Ivan Kabandize',
  description: 'Workflows, software tools, personal operating systems, and cognitive instruments.',
}

export default async function ToolsForThoughtPage() {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, content_type, post_tags(tag:tags(name, slug))')
    .eq('content_type', 'tools_for_thought')
    .order('published_at', { ascending: false })

  if (error) {
    console.error('Error fetching tools for thought:', error)
  }

  return (
    <GardenFeed
      title="Tools for Thought"
      eyebrow="Systems & Workflows"
      description="Software, tools, mental setups, and workflows designed to extend thinking and eliminate friction."
      currentFilter="tools_for_thought"
      posts={posts || []}
    />
  )
}
