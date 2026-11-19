import 'server-only'
import { createAdminClient } from '@/utils/supabase/admin'
import { SLUG_REGEX } from '@/lib/resourceDownload'
import { parsePageDetails, type PageDetails } from '@/lib/resourcePageDetails'

// Server-only data access for public downloadable resources
// House style: spaced hyphen " - " only

export const PUBLIC_RESOURCE_COLUMNS =
  'id, slug, title, summary, description, kind, cover_image_url, file_size_bytes, mime_type, sort_order, delivery_type, category, page_details' as const

export type ResourceKind = 'guide' | 'template' | 'framework'

export interface PublicResource {
  id: string
  slug: string
  title: string
  summary: string
  description: string | null
  kind: ResourceKind | string
  cover_image_url: string | null
  file_size_bytes: number
  mime_type: string
  sort_order: number
  delivery_type: 'file' | 'link'
  category: string | null
  details: PageDetails
}

interface RawResourceRow {
  id: string
  slug: string
  title: string
  summary: string
  description: string | null
  kind: string
  cover_image_url: string | null
  file_size_bytes: number
  mime_type: string
  sort_order: number
  delivery_type: string
  category: string | null
  page_details: unknown
}

function mapRowToPublicResource(row: RawResourceRow): PublicResource {
  const { page_details, ...rest } = row
  return {
    ...rest,
    delivery_type: row.delivery_type === 'link' ? 'link' : 'file',
    category:
      typeof row.category === 'string' && row.category.trim()
        ? row.category.trim()
        : null,
    details: parsePageDetails(page_details),
  }
}

/**
 * Fetches all published public resources (excluding report digests) ordered by sort_order and created_at.
 * Uses explicit safe column projection only; file_path, file_name, and external_url are never selected or returned.
 */
export async function getPublishedResources(): Promise<PublicResource[]> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('resources')
      .select(PUBLIC_RESOURCE_COLUMNS)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .neq('kind', 'digest_pdf')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error || !data) {
      console.error('[resources] failed to fetch published resources')
      return []
    }

    return (data as unknown as RawResourceRow[]).map(mapRowToPublicResource)
  } catch {
    console.error('[resources] getPublishedResources error')
    return []
  }
}

/**
 * Fetches a single published public resource by slug.
 * Returns null if the slug is invalid, not found, draft, or members-only.
 * Uses explicit safe column projection only; storage details and external_url are never selected or returned.
 */
export async function getPublishedResourceBySlug(
  slug: string
): Promise<PublicResource | null> {
  if (!slug || typeof slug !== 'string' || !SLUG_REGEX.test(slug)) {
    return null
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('resources')
      .select(PUBLIC_RESOURCE_COLUMNS)
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('visibility', 'public')
      .neq('kind', 'digest_pdf')
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return mapRowToPublicResource(data as unknown as RawResourceRow)
  } catch {
    console.error('[resources] getPublishedResourceBySlug error')
    return null
  }
}
