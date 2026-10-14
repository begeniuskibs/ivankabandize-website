import 'server-only'
import { createAdminClient } from '../utils/supabase/admin.ts'

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
 * Returns card previews for an array of posts.
 * If a post already has an excerpt, uses that excerpt.
 * For posts with an empty or missing excerpt, uses the server - only admin client
 * to select ONLY id and content, extracts the first paragraph, truncates to
 * approximately 160 characters on a word boundary with an ellipsis, and returns
 * ONLY that string in a Record<string, string> map.
 * Never returns content JSON or more than the first paragraph.
 */
export async function getCardPreviews(
  posts: Array<{ id: string; excerpt?: string | null }>
): Promise<Record<string, string>> {
  const previews: Record<string, string> = {}
  if (!posts || posts.length === 0) return previews

  const missingIds: string[] = []

  for (const post of posts) {
    if (post.excerpt && post.excerpt.trim().length > 0) {
      previews[post.id] = post.excerpt.trim()
    } else if (post.id) {
      missingIds.push(post.id)
    }
  }

  if (missingIds.length === 0) {
    return previews
  }

  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // Select ONLY id and content for published posts that are not in the future
  const { data, error } = await adminClient
    .from('posts')
    .select('id, content')
    .in('id', missingIds)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)

  if (error) {
    console.error('getCardPreviews query error:', error)
    return previews
  }

  if (data) {
    for (const row of data) {
      const firstPara = extractFirstParagraph(row.content)
      if (firstPara) {
        previews[row.id] = truncateOnWordBoundary(firstPara, 160)
      } else {
        previews[row.id] = ''
      }
    }
  }

  return previews
}

