import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

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
    let itemTagsMap: Record<string, string[]> = {}
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
      itemTagsMap = {}
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
  try {
    const admin = createAdminClient()
    const body = await request.json()
    const { id, title, creator, type, url, thumbnail_url, recommendation_note, tag_ids } = body

    if (!id) {
      return NextResponse.json({ error: 'Library item id is required' }, { status: 400 })
    }

    // Update library_item
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

    // Sync tags if tag_ids provided and library_item_tags table exists
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
