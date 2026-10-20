import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import GardenFeed, { TopicTagItem, LibraryFeedItem, PostItem } from '@/components/public/GardenFeed'
import { getCardPreviews } from '@/lib/postTeaser'

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
      title: 'Topic Not Found',
    }
  }

  const title = `${tag.name} - The Garden`
  const description =
    tag.description && tag.description.trim() !== ''
      ? tag.description.trim()
      : `Essays, notes and resources on ${tag.name} in The Garden by Ivan Kabandize.`

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

  // 3. Query visible published posts with this tag using safe fields (no content)
  let posts: PostItem[] = []
  if (postIds.length > 0) {
    const { data: postsData, error: postsError } = await supabase
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
    const cardPreviews = await getCardPreviews(postsData || [])
    posts = (postsData || []).map((p) => ({
      ...p,
      preview: (p.excerpt && p.excerpt.trim()) ? p.excerpt.trim() : (cardPreviews[p.id] || ''),
    }))
  }

  // 4. Guarded query for library items matched through library_item_tags
  // If the table does not exist yet, this must NOT throw and show articles only.
  let libraryItems: LibraryFeedItem[] = []
  try {
    const { data: itemTagRows, error: itemTagError } = await supabase
      .from('library_item_tags')
      .select('library_item_id')
      .eq('tag_id', tag.id)

    if (!itemTagError && itemTagRows && itemTagRows.length > 0) {
      const itemIds = itemTagRows.map((r: { library_item_id: string }) => r.library_item_id)
      const { data: libData, error: libError } = await supabase
        .from('library_items')
        .select('id, title, creator, type, url, thumbnail_url, recommendation_note, created_at')
        .in('id', itemIds)
        .order('created_at', { ascending: false })

      if (!libError && libData) {
        libraryItems = libData
      }
    }
  } catch (err) {
    // Graceful fallback if library_item_tags table is missing
    console.warn('library_item_tags query safely caught:', err)
    libraryItems = []
  }

  // A tag with zero published items (neither articles nor library items) returns notFound()
  if (posts.length === 0 && libraryItems.length === 0) {
    notFound()
  }

  // 5. Fetch all tags with at least 1 published post for topic pills row
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
      libraryItems={libraryItems}
    />
  )
}
