import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import GardenFeed, { TopicTagItem } from '@/components/public/GardenFeed'

export const dynamic = 'force-dynamic'

interface TopicPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tag } = await supabase
    .from('tags')
    .select('name, description, is_internal')
    .eq('slug', slug)
    .maybeSingle()

  if (!tag || tag.is_internal) {
    return {
      title: 'Topic Not Found | The Garden | Ivan Kabandize',
    }
  }

  const title = `${tag.name} | The Garden | Ivan Kabandize`
  const description =
    tag.description && tag.description.trim() !== ''
      ? tag.description.trim()
      : `Explore essays, notes, and ideas tagged with ${tag.name} in The Garden by Ivan Kabandize.`

  return {
    title,
    description,
  }
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const now = new Date().toISOString()

  // 1. Fetch tag record
  const { data: tag, error: tagError } = await supabase
    .from('tags')
    .select('id, name, slug, description, is_internal')
    .eq('slug', slug)
    .maybeSingle()

  // Exclude is_internal = true tags from topic page route
  if (tagError || !tag || tag.is_internal) {
    notFound()
  }

  // 2. Fetch post IDs associated with this tag
  const { data: postTagRows, error: postTagError } = await supabase
    .from('post_tags')
    .select('post_id')
    .eq('tag_id', tag.id)

  if (postTagError) {
    console.error('Error fetching post_tags for topic:', postTagError)
  }

  const postIds = (postTagRows || []).map((row: { post_id: string }) => row.post_id)

  // A tag with zero published items returns notFound(). No empty topic pages.
  if (postIds.length === 0) {
    notFound()
  }

  // 3. Query visible published posts with this tag using the same filters as Garden page
  // Uses RLS client so anonymous visitors see only what Garden page shows.
  // Security rule: Do NOT select or send content.
  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, content_type, featured_image_url, post_tags(tag:tags(name, slug, is_internal))')
    .in('id', postIds)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })

  if (postsError) {
    console.error('Error fetching topic posts:', postsError)
  }

  if (!posts || posts.length === 0) {
    notFound()
  }

  // 4. Fetch all tags with at least 1 published post for topic pills row
  // Exclude is_internal = true tags
  const { data: allPublishedPosts } = await supabase
    .from('posts')
    .select('id, post_tags(tag:tags(name, slug, is_internal))')
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)

  const CATEGORY_NAMES = ['random thoughts', 'structured thoughts', 'tools for thought']
  const topicTagMap = new Map<string, string>()
  allPublishedPosts?.forEach((p) => {
    const ptList = (p.post_tags as { tag?: { name?: string | null; slug?: string | null; is_internal?: boolean | null } | { name?: string | null; slug?: string | null; is_internal?: boolean | null }[] | null }[]) || []
    ptList.forEach((pt) => {
      const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
      if (tagObj?.name && tagObj?.slug && !tagObj.is_internal) {
        const name = tagObj.name.trim()
        if (!CATEGORY_NAMES.includes(name.toLowerCase())) {
          topicTagMap.set(name, tagObj.slug)
        }
      }
    })
  })

  const topicTags: TopicTagItem[] = Array.from(topicTagMap.entries())
    .map(([name, tagSlug]) => ({ name, slug: tagSlug }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <GardenFeed
      title={tag.name}
      eyebrow="The Garden - Topic"
      description={tag.description}
      currentFilter="topic"
      posts={posts}
      topicTags={topicTags}
      activeTopicSlug={tag.slug}
    />
  )
}
