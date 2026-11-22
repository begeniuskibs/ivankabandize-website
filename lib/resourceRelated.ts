// Pure helpers for selecting related articles for resource pages
// House style: spaced hyphen " - " only

export interface CandidatePost {
  title: string
  slug: string
  content_type?: string | null
  published_at?: string | null
  topics?: string[] | null
}

export interface RelatedPostCardItem {
  id: string
  title: string
  slug: string
  featured_image_url?: string | null
  excerpt?: string | null
  preview?: string | null
  published_at?: string | null
  readTime?: number | null
}

export interface RelatedArticleItem {
  title: string
  href: string
  label: string
  post?: RelatedPostCardItem | null
}

const ARTICLE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Pure helper: extracts an article slug from an internal href of the form "/garden/<slug>".
 * Returns the slug if valid, or null for other paths, external links, empty or non-string inputs.
 */
export function extractArticleSlugFromHref(href: unknown): string | null {
  if (typeof href !== 'string') return null
  const trimmed = href.trim()
  if (!trimmed.startsWith('/garden/')) return null

  // Drop query strings and hash anchors
  const pathWithoutQuery = trimmed.split(/[?#]/)[0]
  const remainder = pathWithoutQuery.slice('/garden/'.length)
  if (!remainder || remainder.includes('/')) return null
  if (!ARTICLE_SLUG_REGEX.test(remainder)) return null

  return remainder
}

function resolveArticleLabel(contentType?: string | null): string {
  switch (contentType) {
    case 'tools_for_thought':
      return 'Tools for thought'
    case 'random_thoughts':
      return 'Reflection'
    case 'structured_thoughts':
    default:
      return 'Article'
  }
}

function getContentTypePriority(contentType?: string | null): number {
  if (
    contentType === 'structured_thoughts' ||
    contentType === 'tools_for_thought'
  ) {
    return 1
  }
  return 2
}

/**
 * Pure function: picks up to `limit` related articles matching the resource category.
 *
 * Rules:
 * - Keeps only posts whose topics include the category, compared case-insensitively after trimming.
 * - Ranks structured_thoughts and tools_for_thought before random_thoughts.
 * - Within each group, newest published_at first; tie-break by slug.
 * - href is "/garden/" + slug.
 * - label: structured_thoughts = "Article", tools_for_thought = "Tools for thought", random_thoughts = "Reflection".
 * - Returns [] when category is empty or nothing matches. Never throws on bad input.
 */
export function pickRelatedArticles(
  posts: readonly CandidatePost[] | null | undefined,
  category: string | null | undefined,
  limit: number = 3
): RelatedArticleItem[] {
  if (!category || typeof category !== 'string') {
    return []
  }

  const normalizedCategory = category.trim().toLowerCase()
  if (!normalizedCategory) {
    return []
  }

  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    return []
  }

  const safeLimit = typeof limit === 'number' && limit > 0 ? limit : 3

  try {
    const matching: CandidatePost[] = []

    for (const post of posts) {
      if (!post || typeof post !== 'object') continue
      if (typeof post.title !== 'string' || !post.title.trim()) continue
      if (typeof post.slug !== 'string' || !post.slug.trim()) continue
      if (!Array.isArray(post.topics) || post.topics.length === 0) continue

      const hasMatchingTopic = post.topics.some(
        (t: string | unknown) =>
          typeof t === 'string' && t.trim().toLowerCase() === normalizedCategory
      )

      if (hasMatchingTopic) {
        matching.push(post)
      }
    }

    if (matching.length === 0) {
      return []
    }

    matching.sort((a, b) => {
      const priorityA = getContentTypePriority(a.content_type)
      const priorityB = getContentTypePriority(b.content_type)
      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      const timeA = a.published_at ? new Date(a.published_at).getTime() : 0
      const timeB = b.published_at ? new Date(b.published_at).getTime() : 0
      if (timeA !== timeB) {
        return timeB - timeA
      }

      const slugA = typeof a.slug === 'string' ? a.slug : ''
      const slugB = typeof b.slug === 'string' ? b.slug : ''
      return slugA.localeCompare(slugB)
    })

    return matching.slice(0, safeLimit).map((post) => ({
      title: post.title.trim(),
      href: `/garden/${post.slug.trim()}`,
      label: resolveArticleLabel(post.content_type),
    }))
  } catch {
    return []
  }
}
