import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

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

export async function GET() {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { data: seriesList, error } = await supabase
    .from('series')
    .select('*, posts(id, title, slug, publish_status, published_at, created_at)')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const records = (seriesList || []) as unknown as SeriesDbRecord[]

  // Sort child posts in order of published_at ascending (nulls/drafts fallback to created_at)
  const formattedSeries = records.map((s) => {
    const rawPosts = Array.isArray(s.posts) ? s.posts : []
    const sortedPosts = [...rawPosts].sort((a: PostChild, b: PostChild) => {
      const aDate = a.published_at ? new Date(a.published_at).getTime() : new Date(a.created_at).getTime()
      const bDate = b.published_at ? new Date(b.published_at).getTime() : new Date(b.created_at).getTime()
      return aDate - bDate
    })
    return {
      ...s,
      posts: sortedPosts,
      total_posts: sortedPosts.length,
      published_posts: sortedPosts.filter((p: PostChild) => p.publish_status === 'published').length,
    }
  })

  return NextResponse.json({ series: formattedSeries })
}

export async function POST(request: NextRequest) {
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
      status = 'growing',
      cover_emoji,
      card_tint,
      header_image_url,
      sort_order = 0,
    } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const cleanSlug = (slug || title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    if (!cleanSlug) {
      return NextResponse.json({ error: 'Valid slug is required' }, { status: 400 })
    }

    if (cleanSlug === 'series') {
      return NextResponse.json({ error: "The slug 'series' is reserved" }, { status: 400 })
    }

    const { data: newSeries, error } = await supabase
      .from('series')
      .insert({
        title: title.trim(),
        slug: cleanSlug,
        description: description?.trim() || null,
        intro: intro?.trim() || null,
        status: status === 'complete' ? 'complete' : 'growing',
        cover_emoji: cover_emoji?.trim() || null,
        card_tint: card_tint?.trim() || null,
        header_image_url: header_image_url?.trim() || null,
        sort_order: typeof sort_order === 'number' ? sort_order : 0,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ series: newSeries }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
