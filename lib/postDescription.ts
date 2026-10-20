import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import { extractFirstParagraph } from './postTeaser'

export const DEFAULT_SITE_DESCRIPTION =
  'Ivan Kabandize writes about leadership, systems thinking, technology and faith, and helps organisations get their operations, systems and teams in order.'

export interface PostDescriptionInput {
  id?: string
  excerpt?: string | null
  visibility?: string | null
  publish_status?: string | null
}

/**
 * Trims text to about maxLength characters (target <= 160) at a word boundary.
 * Ends with no ellipsis character (use "..." only if cut).
 * Replaces any em or en dashes with house style spaced hyphen " - ".
 * Hard ceiling of 200 characters maximum.
 */
export function formatDescription(text: string, maxLength: number = 150): string {
  const clean = text
    .replace(/[\u2013\u2014]/g, ' - ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (clean.length === 0) {
    return DEFAULT_SITE_DESCRIPTION
  }

  if (clean.length <= maxLength) {
    return clean
  }

  // Slice at maxLength - 3 so the resulting string with "..." never exceeds maxLength
  const cut = clean.slice(0, maxLength - 3)
  const lastSpace = cut.lastIndexOf(' ')
  const boundary = lastSpace > 0 ? cut.slice(0, lastSpace) : cut
  const strippedBoundary = boundary.replace(/[.,;:!?\s-]+$/, '')
  const result = `${strippedBoundary}...`

  return result.slice(0, 200)
}

/**
 * Returns a plain - text description for a single post:
 * - If excerpt is present, returns it (trimmed to <= 160 chars at word boundary if needed).
 * - For PUBLIC posts only (visibility = 'public' and publish_status = 'published'),
 *   if excerpt is empty, fetches content server - side to extract the first paragraph.
 * - For non - public or members - only posts, NEVER reads content; uses excerpt if present,
 *   otherwise DEFAULT_SITE_DESCRIPTION.
 * - Always returns at most 200 characters (target <= 160).
 */
export async function getPostDescription(post: PostDescriptionInput): Promise<string> {
  const descriptions = await getPostDescriptions([post])
  if (post.id && descriptions[post.id]) {
    return descriptions[post.id]
  }
  return DEFAULT_SITE_DESCRIPTION
}

/**
 * Batch helper returning descriptions for an array of posts.
 * Reuses the server - only admin client pattern.
 */
export async function getPostDescriptions(
  posts: PostDescriptionInput[]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}
  if (!posts || posts.length === 0) {
    return results
  }

  const missingPublicIds: string[] = []

  for (const post of posts) {
    if (!post.id) continue

    const hasExcerpt = Boolean(post.excerpt && post.excerpt.trim().length > 0)

    if (hasExcerpt) {
      // Excerpt is present
      results[post.id] = formatDescription(post.excerpt!)
      continue
    }

    const isPublic = post.visibility === 'public' && post.publish_status === 'published'

    if (!isPublic) {
      // Non - public or members - only: NEVER read content
      results[post.id] = DEFAULT_SITE_DESCRIPTION
    } else {
      // Public post with missing excerpt: queue for server - side content lookup
      missingPublicIds.push(post.id)
    }
  }

  if (missingPublicIds.length === 0) {
    return results
  }

  const adminClient = createAdminClient()

  // Select ONLY id and content, strictly for public and published posts
  const { data, error } = await adminClient
    .from('posts')
    .select('id, content')
    .in('id', missingPublicIds)
    .eq('visibility', 'public')
    .eq('publish_status', 'published')

  if (error) {
    console.error('getPostDescriptions query error:', error)
    for (const id of missingPublicIds) {
      if (!results[id]) results[id] = DEFAULT_SITE_DESCRIPTION
    }
    return results
  }

  const contentMap = new Map<string, unknown>()
  if (data) {
    for (const row of data) {
      contentMap.set(row.id, row.content)
    }
  }

  for (const id of missingPublicIds) {
    const rawContent = contentMap.get(id)
    const firstPara = extractFirstParagraph(rawContent)
    if (firstPara && firstPara.trim().length > 0) {
      results[id] = formatDescription(firstPara)
    } else {
      results[id] = DEFAULT_SITE_DESCRIPTION
    }
  }

  return results
}
