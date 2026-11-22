import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  pickRelatedArticles,
  type CandidatePost,
  type RelatedArticleItem,
} from './resourceRelated'

// Server loader for public candidate posts matching a resource category
// House style: spaced hyphen " - " only

interface RawPostTagJoin {
  tag?: { name?: string | null } | Array<{ name?: string | null }> | null
  tags?: { name?: string | null } | Array<{ name?: string | null }> | null
}

interface RawPostRow {
  title: string
  slug: string
  content_type: string | null
  published_at: string | null
  post_tags?: RawPostTagJoin[] | null
}

function extractTopics(rawPostTags: unknown): string[] {
  if (!Array.isArray(rawPostTags)) return []
  const topics: string[] = []
  for (const pt of rawPostTags) {
    if (!pt || typeof pt !== 'object') continue
    const tagData =
      (pt as RawPostTagJoin).tag ?? (pt as RawPostTagJoin).tags
    if (tagData && typeof tagData === 'object') {
      if (Array.isArray(tagData)) {
        for (const t of tagData) {
          if (t && typeof t.name === 'string' && t.name.trim()) {
            topics.push(t.name.trim())
          }
        }
      } else if (typeof tagData.name === 'string' && tagData.name.trim()) {
        topics.push(tagData.name.trim())
      }
    }
  }
  return topics
}

/**
 * Fetches public candidate posts and picks up to `limit` related articles for a resource category.
 * Selects only safe public projection: title, slug, content_type, published_at, and tag names.
 * Excludes members-only posts, unpublished drafts, and body/content fields.
 * Fails safe and logs a short non-sensitive message if the database query fails.
 */
export async function getAutoRelatedArticles(
  category: string | null | undefined,
  limit: number = 3
): Promise<RelatedArticleItem[]> {
  if (!category || typeof category !== 'string' || !category.trim()) {
    return []
  }

  try {
    const admin = createAdminClient()
    const now = new Date().toISOString()
    const { data, error } = await admin
      .from('posts')
      .select('title, slug, content_type, published_at, post_tags(tag:tags(name))')
      .eq('publish_status', 'published')
      .eq('visibility', 'public')
      .not('published_at', 'is', null)
      .lte('published_at', now)
      .order('published_at', { ascending: false })
      .limit(200)

    if (error || !data) {
      console.error('[resourceRelated] failed to fetch candidate posts')
      return []
    }

    const candidates: CandidatePost[] = (data as unknown as RawPostRow[]).map(
      (row) => ({
        title: row.title,
        slug: row.slug,
        content_type: row.content_type,
        published_at: row.published_at,
        topics: extractTopics(row.post_tags),
      })
    )

    return pickRelatedArticles(candidates, category, limit)
  } catch {
    console.error('[resourceRelated] failed to load related articles')
    return []
  }
}
