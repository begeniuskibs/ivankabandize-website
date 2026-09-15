import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, post_tags(tag:tags(*))')
    .eq('id', id)
    .single()

  if (error || !post) {
    return NextResponse.json({ error: error?.message || 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ post })
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  try {
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      visibility,
      publish_status,
      content_type,
      published_at,
      tag_ids,
    } = body

    const updatePayload: Record<string, unknown> = {}
    if (title !== undefined) updatePayload.title = title
    if (slug !== undefined) updatePayload.slug = slug
    if (excerpt !== undefined) updatePayload.excerpt = excerpt
    if (content !== undefined) updatePayload.content = content
    if (visibility !== undefined) updatePayload.visibility = visibility
    if (content_type !== undefined) updatePayload.content_type = content_type
    if (publish_status !== undefined) {
      updatePayload.publish_status = publish_status
      if (publish_status === 'published' && !published_at) {
        updatePayload.published_at = new Date().toISOString()
      } else if (published_at !== undefined) {
        updatePayload.published_at = published_at
      }
    }

    const { data: post, error: updateError } = await supabase
      .from('posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 403 })
    }

    // Update tags if provided
    if (tag_ids && Array.isArray(tag_ids)) {
      await supabase.from('post_tags').delete().eq('post_id', id)
      if (tag_ids.length > 0) {
        const records = tag_ids.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId,
        }))
        await supabase.from('post_tags').insert(records)
      }
    }

    return NextResponse.json({ post })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { error } = await supabase.from('posts').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  return NextResponse.json({ success: true })
}
