import { NextResponse } from 'next/server'
import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import { validateUrlSafety } from '@/lib/urlSafety'

export const dynamic = 'force-dynamic'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALLOWED_TYPES = ['podcast', 'book', 'newsletter'] as const
type AllowedType = (typeof ALLOWED_TYPES)[number]

function isAllowedType(val: string): val is AllowedType {
  return (ALLOWED_TYPES as readonly string[]).includes(val)
}

export async function GET() {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  try {
    // 1. Fetch library items
    const { data: items, error: itemsError } = await supabase
      .from('library_items')
      .select('*')
      .order('created_at', { ascending: false })

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // 2. Fetch non-internal tags
    const { data: tags } = await supabase
      .from('tags')
      .select('id, name, slug, is_internal')
      .eq('is_internal', false)
      .order('name', { ascending: true })

    // 3. Attempt to fetch library_item_tags safely
    const itemTagsMap: Record<string, string[]> = {}
    let topicTaggingAvailable = true

    try {
      const { data: tagLinks, error: tagLinksError } = await supabase
        .from('library_item_tags')
        .select('library_item_id, tag_id')

      if (tagLinksError) {
        topicTaggingAvailable = false
      } else if (tagLinks) {
        tagLinks.forEach((link: { library_item_id: string; tag_id: string }) => {
          if (!itemTagsMap[link.library_item_id]) {
            itemTagsMap[link.library_item_id] = []
          }
          itemTagsMap[link.library_item_id].push(link.tag_id)
        })
      }
    } catch {
      topicTaggingAvailable = false
    }

    const enrichedItems = (items || []).map((item) => ({
      ...item,
      tag_ids: itemTagsMap[item.id] || [],
    }))

    return NextResponse.json({
      items: enrichedItems,
      tags: tags || [],
      topicTaggingAvailable,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  try {
    const admin = createAdminClient()
    const body = await request.json()
    const { id, title, creator, type, url, thumbnail_url, recommendation_note, tag_ids } = body

    // 1. id must be a uuid
    if (!id || typeof id !== 'string' || !UUID_REGEX.test(id.trim())) {
      return NextResponse.json(
        { error: 'Library item id must be a valid UUID' },
        { status: 400 }
      )
    }

    // 2. type must be one of podcast, book, newsletter
    if (type !== undefined) {
      if (typeof type !== 'string' || !isAllowedType(type.trim())) {
        return NextResponse.json(
          { error: 'Type must be one of: podcast, book, newsletter' },
          { status: 400 }
        )
      }
    }

    // 3. url and thumbnail_url must pass the existing helper in lib/urlSafety.ts
    if (url !== undefined) {
      if (!url || typeof url !== 'string') {
        return NextResponse.json(
          { error: 'URL must be a non-empty string' },
          { status: 400 }
        )
      }
      const urlCheck = await validateUrlSafety(url.trim())
      if (!urlCheck.safe) {
        return NextResponse.json(
          { error: `Invalid URL: ${urlCheck.reason || 'Only http and https protocols are allowed'}` },
          { status: 400 }
        )
      }
    }

    if (thumbnail_url !== undefined && thumbnail_url !== null) {
      if (typeof thumbnail_url !== 'string') {
        return NextResponse.json(
          { error: 'Thumbnail URL must be a string or null' },
          { status: 400 }
        )
      }
      if (thumbnail_url.trim() !== '') {
        const thumbCheck = await validateUrlSafety(thumbnail_url.trim())
        if (!thumbCheck.safe) {
          return NextResponse.json(
            { error: `Invalid thumbnail URL: ${thumbCheck.reason || 'Only http and https protocols are allowed'}` },
            { status: 400 }
          )
        }
      }
    }

    // 4. tag_ids must be an array of uuids; every id must exist in tags and have is_internal = false
    if (tag_ids !== undefined) {
      if (!Array.isArray(tag_ids)) {
        return NextResponse.json(
          { error: 'tag_ids must be an array of UUIDs' },
          { status: 400 }
        )
      }

      for (const tagId of tag_ids) {
        if (typeof tagId !== 'string' || !UUID_REGEX.test(tagId.trim())) {
          return NextResponse.json(
            { error: 'Every tag_id must be a valid UUID' },
            { status: 400 }
          )
        }
      }

      if (tag_ids.length > 0) {
        const { data: matchedTags, error: tagsQueryError } = await admin
          .from('tags')
          .select('id, is_internal')
          .in('id', tag_ids)

        if (tagsQueryError) {
          return NextResponse.json({ error: tagsQueryError.message }, { status: 400 })
        }

        const validNonInternalIds = new Set(
          (matchedTags || [])
            .filter((t: { id: string; is_internal: boolean }) => !t.is_internal)
            .map((t: { id: string }) => t.id)
        )
        const internalTagIds = new Set(
          (matchedTags || [])
            .filter((t: { id: string; is_internal: boolean }) => t.is_internal)
            .map((t: { id: string }) => t.id)
        )

        for (const tagId of tag_ids) {
          if (internalTagIds.has(tagId)) {
            return NextResponse.json(
              { error: `Tag ${tagId} is internal and cannot be linked to library items` },
              { status: 400 }
            )
          }
          if (!validNonInternalIds.has(tagId)) {
            return NextResponse.json(
              { error: `Tag ${tagId} does not exist or is not available` },
              { status: 400 }
            )
          }
        }
      }
    }

    // 5. Update library_item
    const updatePayload: Record<string, unknown> = {}
    if (typeof title === 'string') updatePayload.title = title.trim()
    if (typeof creator === 'string') updatePayload.creator = creator.trim()
    if (typeof type === 'string') updatePayload.type = type.trim()
    if (typeof url === 'string') updatePayload.url = url.trim()
    if (thumbnail_url !== undefined) updatePayload.thumbnail_url = thumbnail_url ? thumbnail_url.trim() : null
    if (recommendation_note !== undefined) updatePayload.recommendation_note = recommendation_note ? recommendation_note.trim() : null

    const { error: updateError } = await admin
      .from('library_items')
      .update(updatePayload)
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // 6. Sync tags if tag_ids provided and library_item_tags table exists
    let topicTaggingNeedsUpdate = false
    if (Array.isArray(tag_ids)) {
      try {
        const { error: delError } = await admin
          .from('library_item_tags')
          .delete()
          .eq('library_item_id', id)

        if (delError) {
          topicTaggingNeedsUpdate = true
        } else if (tag_ids.length > 0) {
          const rowsToInsert = tag_ids.map((tagId: string) => ({
            library_item_id: id,
            tag_id: tagId,
          }))
          const { error: insError } = await admin
            .from('library_item_tags')
            .insert(rowsToInsert)

          if (insError) {
            topicTaggingNeedsUpdate = true
          }
        }
      } catch {
        topicTaggingNeedsUpdate = true
      }
    }

    return NextResponse.json({
      success: true,
      topicTaggingNeedsUpdate,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
