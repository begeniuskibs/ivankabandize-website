import 'server-only'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '../utils/supabase/admin.ts'
import { calculateReadTime } from './readTime.ts'

export interface TeaserPostTagItem {
  tag?: {
    name?: string
    slug?: string
  } | Array<{
    name?: string
    slug?: string
  }> | null
}

export interface TeaserPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  published_at: string | null
  content_type: string | null
  featured_image_url: string | null
  header_image_width: 'standard' | 'wide' | null
  visibility: string
  post_tags?: TeaserPostTagItem[] | null
  firstParagraph: string | null
}

interface TipTapNode {
  type?: string
  text?: string
  content?: TipTapNode[]
  [key: string]: unknown
}

export function extractNodeText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as TipTapNode
  let text = typeof n.text === 'string' ? n.text : ''
  if (Array.isArray(n.content)) {
    for (const child of n.content) {
      text += extractNodeText(child)
    }
  }
  return text
}

export function extractFirstParagraph(doc: unknown): string | null {
  if (!doc || typeof doc !== 'object') return null
  const d = doc as { content?: unknown[] }
  if (!Array.isArray(d.content)) return null

  // 1. Look for first non-empty top-level paragraph
  for (const node of d.content) {
    if (node && typeof node === 'object' && (node as TipTapNode).type === 'paragraph') {
      const text = extractNodeText(node).trim()
      if (text.length > 0) return text
    }
  }

  // 2. If none found at top level, search recursively (e.g. inside lists, blockquotes)
  const findNested = (node: unknown): string | null => {
    if (!node || typeof node !== 'object') return null
    const n = node as TipTapNode
    if (n.type === 'paragraph') {
      const text = extractNodeText(n).trim()
      if (text.length > 0) return text
    }
    if (Array.isArray(n.content)) {
      for (const child of n.content) {
        const found = findNested(child)
        if (found) return found
      }
    }
    return null
  }

  for (const node of d.content) {
    const found = findNested(node)
    if (found) return found
  }

  return null
}

export function isTeaserEligible(post: {
  publish_status?: string | null
  published_at?: string | null
  visibility?: string | null
}): boolean {
  if (!post) return false
  if (post.publish_status !== 'published') return false
  if (!post.published_at) return false
  const pubDate = new Date(post.published_at)
  if (isNaN(pubDate.getTime()) || pubDate > new Date()) return false
  if (!post.visibility || post.visibility === 'public') return false
  return true
}

export async function getPostTeaser(slug: string): Promise<TeaserPost | null> {
  if (!slug) return null

  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  const { data: post, error } = await adminClient
    .from('posts')
    .select('id, title, slug, excerpt, published_at, publish_status, content_type, featured_image_url, header_image_width, visibility, content, post_tags(tag:tags(name, slug))')
    .eq('slug', slug)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .neq('visibility', 'public')
    .maybeSingle()

  if (error || !post) {
    if (error) console.error('getPostTeaser query error:', error)
    return null
  }

  // Double check eligibility
  if (!isTeaserEligible(post)) {
    return null
  }

  const firstParagraph = extractFirstParagraph(post.content)

  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    published_at: post.published_at,
    content_type: post.content_type,
    featured_image_url: post.featured_image_url,
    header_image_width: (post.header_image_width as 'standard' | 'wide') || 'standard',
    visibility: post.visibility,
    post_tags: (post.post_tags as TeaserPostTagItem[]) || null,
    firstParagraph,
  }
}

/**
 * Truncates text on a word boundary to approximately maxLength characters,
 * appending an ellipsis if truncated.
 */
export function truncateOnWordBoundary(text: string, maxLength: number = 160): string {
  const trimmed = text.trim()
  if (trimmed.length <= maxLength) return trimmed
  const cut = trimmed.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  const boundary = lastSpace > 0 ? cut.slice(0, lastSpace) : cut
  return `${boundary.replace(/[.,;:!?]+$/, '')}...`
}

/**
 * Returns card previews and read times for an array of posts.
 * Cached using unstable_cache with revalidate: 300 and tags: ['card-meta'].
 * Uses a single admin client query to select ONLY id and content for the given posts.
 * Review for leakage: only derived strings and numbers leave the server.
 */
export async function getCardMeta(
  posts: Array<{ id: string; excerpt?: string | null }>
): Promise<{ previews: Record<string, string>; readTimes: Record<string, number> }> {
  const previews: Record<string, string> = {}
  const readTimes: Record<string, number> = {}

  if (!posts || posts.length === 0) {
    return { previews, readTimes }
  }

  // Build sorted list of post IDs and excerpt join to form cache key
  const sortedPosts = [...posts]
    .filter((p) => Boolean(p.id))
    .sort((a, b) => a.id.localeCompare(b.id))

  if (sortedPosts.length === 0) {
    return { previews, readTimes }
  }

  const sortedIds = sortedPosts.map((p) => p.id)
  const excerptJoin = sortedPosts.map((p) => `${p.id}:${p.excerpt ?? ''}`).join('|')
  const cacheKeyParts = ['card-meta', sortedIds.join(','), excerptJoin]

  const fetchCardMeta = unstable_cache(
    async (): Promise<{ previews: Record<string, string>; readTimes: Record<string, number> }> => {
      const cachedPreviews: Record<string, string> = {}
      const cachedReadTimes: Record<string, number> = {}

      const ids = sortedIds
      const excerptMap = new Map<string, string | null | undefined>()

      for (const post of sortedPosts) {
        excerptMap.set(post.id, post.excerpt)
        if (post.excerpt && post.excerpt.trim().length > 0) {
          cachedPreviews[post.id] = post.excerpt.trim()
        }
      }

      const adminClient = createAdminClient()
      const now = new Date().toISOString()

      // ONE query: admin client, select 'id, content' from posts
      const { data, error } = await adminClient
        .from('posts')
        .select('id, content')
        .in('id', ids)
        .eq('publish_status', 'published')
        .not('published_at', 'is', null)
        .lte('published_at', now)

      if (error) {
        console.error('getCardMeta query error:', error)
        return { previews: cachedPreviews, readTimes: cachedReadTimes }
      }

      if (data) {
        for (const row of data) {
          // Derive preview text: only posts with no excerpt get a preview, first paragraph only, length limit
          if (!cachedPreviews[row.id]) {
            const firstPara = extractFirstParagraph(row.content)
            cachedPreviews[row.id] = firstPara ? truncateOnWordBoundary(firstPara, 160) : ''
          }
          // Derive read time: calculateReadTime from lib/readTime.ts, excerpt-plus-text rule
          cachedReadTimes[row.id] = calculateReadTime(row.content, excerptMap.get(row.id))
        }
      }

      return { previews: cachedPreviews, readTimes: cachedReadTimes }
    },
    cacheKeyParts,
    {
      revalidate: 300,
      tags: ['card-meta'],
    }
  )

  const result = await fetchCardMeta()
  return {
    previews: result.previews,
    readTimes: result.readTimes,
  }
}

