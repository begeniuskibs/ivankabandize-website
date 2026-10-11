/**
 * Search helpers: query sanitization and stream mapping.
 */

export interface SearchResultItem {
  title: string
  slug: string
  stream: string
  published_at: string
  excerpt: string
}

/**
 * Caps query at 80 characters, trims whitespace, and escapes
 * special PostgREST / ILIKE characters (%, _, \, ,, (, )).
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return ''
  const capped = query.slice(0, 80).trim()
  return capped
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '\\,')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
}

/**
 * Maps database content_type enum to human-friendly Garden stream label.
 */
export function mapStreamLabel(contentType: string | null | undefined): string {
  switch (contentType) {
    case 'random_thoughts':
      return 'Random Thoughts'
    case 'structured_thoughts':
      return 'Structured Thoughts'
    case 'tools_for_thought':
      return 'Tools for Thought'
    default:
      return 'The Garden'
  }
}

/**
 * Formats one-line excerpt.
 */
export function formatSearchExcerpt(excerpt: string | null | undefined): string {
  if (!excerpt) return ''
  return excerpt.trim().replace(/\s+/g, ' ')
}

/**
 * Pure mapping from raw database post row to UI SearchResultItem.
 */
export function mapPostToSearchResult(post: {
  title?: string | null
  slug?: string | null
  content_type?: string | null
  published_at?: string | null
  excerpt?: string | null
}): SearchResultItem {
  return {
    title: (post.title || '').trim(),
    slug: (post.slug || '').trim(),
    stream: mapStreamLabel(post.content_type),
    published_at: post.published_at || '',
    excerpt: formatSearchExcerpt(post.excerpt),
  }
}
