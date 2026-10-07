import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET() {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, post_tags(tag:tags(*)), series:series(*)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ posts })
}

export async function POST(request: NextRequest) {
  const { supabase, user, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError || !user) {
    return NextResponse.json({ error: authError || 'Unauthorized' }, { status: authStatus })
  }

  try {
    const body = await request.json()
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image_url,
      header_image_width = 'standard',
      visibility = 'public',
      publish_status = 'draft',
      content_type = 'structured_thoughts',
      published_at,
      tag_ids = [],
      series_id = null,
    } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (slug && slug.trim().toLowerCase() === 'series') {
      return NextResponse.json({ error: "The slug 'series' is reserved" }, { status: 400 })
    }

    const generatedSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + `-${Date.now()}`

    if (generatedSlug.toLowerCase() === 'series') {
      return NextResponse.json({ error: "The slug 'series' is reserved" }, { status: 400 })
    }

    // Insert post under active user session (RLS enforces is_owner)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        title,
        slug: generatedSlug,
        excerpt,
        content: content || {},
        featured_image_url: featured_image_url || null,
        header_image_width: header_image_width === 'wide' ? 'wide' : 'standard',
        visibility,
        publish_status,
        content_type,
        series_id: series_id || null,
        published_at:
          publish_status === 'published' && !published_at
            ? new Date().toISOString()
            : published_at || null,
        author_id: user.id,
      })
      .select()
      .single()

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 403 })
    }

    // Attach tags if tag_ids are provided
    if (tag_ids && Array.isArray(tag_ids) && tag_ids.length > 0) {
      const postTagRecords = tag_ids.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }))
      const { error: tagError } = await supabase
        .from('post_tags')
        .insert(postTagRecords)

      if (tagError) {
        console.error('Post tags error:', tagError)
      }
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
