export const PUBLIC_LIBRARY_COLUMNS =
  'id, title, creator, type, url, thumbnail_url, recommendation_note, created_at, slug, links, video_url, take_published' as const

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface PublicLibraryItem {
  id: string
  title: string
  creator: string
  type: 'podcast' | 'book' | 'newsletter' | string
  url: string
  thumbnail_url: string | null
  recommendation_note: string | null
  created_at: string
  slug: string
  links: unknown
  video_url: string | null
  take_published: boolean | null
}

export interface LibraryNeighbour {
  slug: string
  title: string
  type: string
}

export interface LibraryTopic {
  id: string
  name: string
  slug: string
}

interface QueryBuilderLike extends PromiseLike<{ data: unknown; error: unknown }> {
  select: (...args: unknown[]) => QueryBuilderLike
  eq: (...args: unknown[]) => QueryBuilderLike
  neq: (...args: unknown[]) => QueryBuilderLike
  lt: (...args: unknown[]) => QueryBuilderLike
  gt: (...args: unknown[]) => QueryBuilderLike
  in: (...args: unknown[]) => QueryBuilderLike
  not: (...args: unknown[]) => QueryBuilderLike
  order: (...args: unknown[]) => QueryBuilderLike
  limit: (...args: unknown[]) => QueryBuilderLike
  maybeSingle: () => Promise<{ data: unknown; error: unknown }>
  [key: string]: unknown
}

interface ClientLike {
  from: (table: string) => QueryBuilderLike
}

export function isNonEmptyTipTapDoc(doc: unknown): boolean {
  if (!doc || typeof doc !== 'object') return false
  const d = doc as { type?: string; content?: unknown[] }
  if (!Array.isArray(d.content) || d.content.length === 0) return false

  const hasTextOrMedia = (nodes: unknown[]): boolean => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as { type?: string; text?: string; content?: unknown[] }
      if (typeof n.text === 'string' && n.text.trim().length > 0) return true
      if (n.type && !['paragraph', 'doc', 'text'].includes(n.type)) return true
      if (Array.isArray(n.content) && hasTextOrMedia(n.content)) return true
    }
    return false
  }

  return hasTextOrMedia(d.content)
}

export function getTipTapWordCount(doc: unknown): number {
  if (!doc || typeof doc !== 'object') return 0
  let text = ''
  const extract = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { text?: string; content?: unknown[] }
    if (typeof n.text === 'string') {
      text += ' ' + n.text
    }
    if (Array.isArray(n.content)) {
      n.content.forEach(extract)
    }
  }
  const d = doc as { content?: unknown[] }
  if (Array.isArray(d.content)) {
    d.content.forEach(extract)
  }
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length
}

export async function getLibraryItemBySlug(
  slug: string,
  client?: unknown
): Promise<PublicLibraryItem | null> {
  if (!slug || typeof slug !== 'string' || !SLUG_REGEX.test(slug)) {
    return null
  }

  const supabase =
    (client as ClientLike) ||
    (await (await import('@/utils/supabase/server')).createClient())

  const { data, error } = (await supabase
    .from('library_items')
    .select(PUBLIC_LIBRARY_COLUMNS)
    .eq('slug', slug)
    .maybeSingle()) as { data: unknown; error: unknown }

  if (error || !data) {
    return null
  }

  return data as PublicLibraryItem
}

export async function getPublishedTake(
  id: string,
  takePublished: boolean | null | undefined,
  adminClient?: unknown
): Promise<Record<string, unknown> | null> {
  if (!takePublished) {
    return null
  }

  if (!id || typeof id !== 'string') {
    return null
  }

  const admin =
    (adminClient as ClientLike) ||
    (await (await import('@/utils/supabase/admin')).createAdminClient())

  const { data, error } = (await admin
    .from('library_items')
    .select('take')
    .eq('id', id)
    .maybeSingle()) as { data: { take?: unknown } | null; error: unknown }

  if (error || !data || !data.take) {
    return null
  }

  let parsedTake = data.take
  if (typeof parsedTake === 'string') {
    try {
      parsedTake = JSON.parse(parsedTake)
    } catch {
      return null
    }
  }

  if (!isNonEmptyTipTapDoc(parsedTake)) {
    return null
  }

  return parsedTake as Record<string, unknown>
}

export async function getLibraryNeighbours(
  item: { id: string; created_at: string },
  client?: unknown
): Promise<{ prev: LibraryNeighbour | null; next: LibraryNeighbour | null }> {
  const supabase =
    (client as ClientLike) ||
    (await (await import('@/utils/supabase/server')).createClient())

  const [prevRes, nextRes] = (await Promise.all([
    supabase
      .from('library_items')
      .select('slug, title, type')
      .lt('created_at', item.created_at)
      .not('slug', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('library_items')
      .select('slug, title, type')
      .gt('created_at', item.created_at)
      .not('slug', 'is', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])) as Array<{ data: LibraryNeighbour | null }>

  return {
    prev: prevRes?.data || null,
    next: nextRes?.data || null,
  }
}

export async function getLibraryItemTopics(
  itemId: string,
  client?: unknown
): Promise<LibraryTopic[]> {
  const supabase =
    (client as ClientLike) ||
    (await (await import('@/utils/supabase/server')).createClient())

  const { data: itemTagRows, error: itError } = (await supabase
    .from('library_item_tags')
    .select('tag_id')
    .eq('library_item_id', itemId)) as {
    data: Array<{ tag_id: string }> | null
    error: unknown
  }

  if (itError || !itemTagRows || itemTagRows.length === 0) {
    return []
  }

  const tagIds = itemTagRows.map((r: { tag_id: string }) => r.tag_id)
  const { data: tags, error: tagsError } = (await supabase
    .from('tags')
    .select('id, name, slug, is_internal')
    .in('id', tagIds)
    .eq('is_internal', false)
    .order('name', { ascending: true })) as {
    data: LibraryTopic[] | null
    error: unknown
  }

  if (tagsError || !tags) {
    return []
  }

  return tags
}

export async function getRelatedLibraryItems(
  firstTagId: string,
  currentItemId: string,
  client?: unknown
): Promise<PublicLibraryItem[]> {
  const supabase =
    (client as ClientLike) ||
    (await (await import('@/utils/supabase/server')).createClient())

  const { data: tagRows, error: tagError } = (await supabase
    .from('library_item_tags')
    .select('library_item_id')
    .eq('tag_id', firstTagId)
    .neq('library_item_id', currentItemId)
    .limit(10)) as {
    data: Array<{ library_item_id: string }> | null
    error: unknown
  }

  if (tagError || !tagRows || tagRows.length === 0) {
    return []
  }

  const itemIds = tagRows.map((r: { library_item_id: string }) => r.library_item_id)
  const { data: items, error: itemsError } = (await supabase
    .from('library_items')
    .select(PUBLIC_LIBRARY_COLUMNS)
    .in('id', itemIds)
    .not('slug', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)) as {
    data: PublicLibraryItem[] | null
    error: unknown
  }

  if (itemsError || !items) {
    return []
  }

  return items
}
