import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface PostChild {
  id: string
  title: string
  slug: string
  publish_status: string
  published_at: string | null
  created_at: string
}

interface SeriesDbRecord {
  id: string
  title: string
  slug: string
  description: string | null
  intro: string | null
  status: string
  cover_emoji: string | null
  card_tint: string | null
  header_image_url: string | null
  sort_order: number
  created_at: string
  updated_at: string
  posts?: PostChild[]
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { data: seriesItem, error } = await supabase
    .from('series')
    .select('*, posts(id, title, slug, publish_status, published_at, created_at)')
    .eq('id', id)
    .single()

  if (error || !seriesItem) {
    return NextResponse.json({ error: error?.message || 'Series not found' }, { status: 404 })
  }

  const record = seriesItem as unknown as SeriesDbRecord
  const rawPosts = Array.isArray(record.posts) ? record.posts : []
  const sortedPosts = [...rawPosts].sort((a: PostChild, b: PostChild) => {
    const aDate = a.published_at ? new Date(a.published_at).getTime() : new Date(a.created_at).getTime()
    const bDate = b.published_at ? new Date(b.published_at).getTime() : new Date(b.created_at).getTime()
    return aDate - bDate
  })

  return NextResponse.json({
    series: {
      ...record,
      posts: sortedPosts,
      total_posts: sortedPosts.length,
      published_posts: sortedPosts.filter((p: PostChild) => p.publish_status === 'published').length,
    },
  })
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
      description,
      intro,
      status,
      cover_emoji,
      card_tint,
      header_image_url,
      sort_order,
    } = body

    const updatePayload: Record<string, unknown> = {}
    if (title !== undefined) updatePayload.title = title.trim()
    if (slug !== undefined) {
      const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      if (!cleanSlug) {
        return NextResponse.json({ error: 'Valid slug is required' }, { status: 400 })
      }
      if (cleanSlug === 'series') {
        return NextResponse.json({ error: "The slug 'series' is reserved" }, { status: 400 })
      }
      updatePayload.slug = cleanSlug
    }
    if (description !== undefined) updatePayload.description = description?.trim() || null
    if (intro !== undefined) updatePayload.intro = intro?.trim() || null
    if (status !== undefined) updatePayload.status = status === 'complete' ? 'complete' : 'growing'
    if (cover_emoji !== undefined) updatePayload.cover_emoji = cover_emoji?.trim() || null
    if (card_tint !== undefined) updatePayload.card_tint = card_tint?.trim() || null
    if (header_image_url !== undefined) updatePayload.header_image_url = header_image_url?.trim() || null
    if (sort_order !== undefined) updatePayload.sort_order = typeof sort_order === 'number' ? sort_order : 0

    const { data: updatedSeries, error } = await supabase
      .from('series')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ series: updatedSeries })
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

  // Check if any posts use this series
  const { count, error: countError } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('series_id', id)

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 400 })
  }

  if (count && count > 0) {
    return NextResponse.json(
      { error: `Cannot delete series with existing posts (${count} post${count === 1 ? '' : 's'} assigned)` },
      { status: 400 }
    )
  }

  const { error: deleteError } = await supabase.from('series').delete().eq('id', id)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 403 })
  }

  return NextResponse.json({ success: true })
}
