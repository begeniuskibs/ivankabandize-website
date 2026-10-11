import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sanitizeSearchQuery, mapPostToSearchResult } from '@/lib/search'

export const dynamic = 'force-dynamic'

interface PostRow {
  id: string
  title: string | null
  slug: string | null
  excerpt: string | null
  content_type: string | null
  published_at: string | null
  publish_status: string
  visibility: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const rawQ = searchParams.get('q') || ''
    const q = rawQ.slice(0, 80).trim()

    // Minimum 2 characters required
    if (q.length < 2) {
      return NextResponse.json(
        { results: [] },
        {
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      )
    }

    const sanitized = sanitizeSearchQuery(q)
    const pattern = `%${sanitized}%`
    const now = new Date().toISOString()
    const supabase = await createClient()

    // 1. Title search (parameterized ILIKE)
    const titlePromise = supabase
      .from('posts')
      .select('id, title, slug, excerpt, content_type, published_at, publish_status, visibility')
      .eq('publish_status', 'published')
      .eq('visibility', 'public')
      .not('published_at', 'is', null)
      .lte('published_at', now)
      .ilike('title', pattern)
      .order('published_at', { ascending: false })
      .limit(8)

    // 2. Excerpt search (parameterized ILIKE)
    const excerptPromise = supabase
      .from('posts')
      .select('id, title, slug, excerpt, content_type, published_at, publish_status, visibility')
      .eq('publish_status', 'published')
      .eq('visibility', 'public')
      .not('published_at', 'is', null)
      .lte('published_at', now)
      .ilike('excerpt', pattern)
      .order('published_at', { ascending: false })
      .limit(8)

    // 3. Topic Tag search: find matching tags, then fetch corresponding published posts
    const tagPromise = (async (): Promise<{ data: PostRow[] | null; error: unknown }> => {
      try {
        const { data: matchedTags, error: tagErr } = await supabase
          .from('tags')
          .select('id')
          .ilike('name', pattern)
          .limit(8)

        if (tagErr || !matchedTags || matchedTags.length === 0) {
          return { data: [], error: tagErr }
        }

        const tagIds = matchedTags.map((t) => t.id)
        const { data: postTagRows, error: ptErr } = await supabase
          .from('post_tags')
          .select('post_id')
          .in('tag_id', tagIds)

        if (ptErr || !postTagRows || postTagRows.length === 0) {
          return { data: [], error: ptErr }
        }

        const postIds = Array.from(new Set(postTagRows.map((r) => r.post_id)))
        const { data: tagPosts, error: postsErr } = await supabase
          .from('posts')
          .select('id, title, slug, excerpt, content_type, published_at, publish_status, visibility')
          .in('id', postIds)
          .eq('publish_status', 'published')
          .eq('visibility', 'public')
          .not('published_at', 'is', null)
          .lte('published_at', now)
          .order('published_at', { ascending: false })
          .limit(8)

        return { data: (tagPosts as PostRow[]) || [], error: postsErr }
      } catch (err) {
        return { data: [], error: err }
      }
    })()

    const [titleRes, excerptRes, tagRes] = await Promise.all([
      titlePromise,
      excerptPromise,
      tagPromise,
    ])

    if (titleRes.error) {
      console.error('Search query error (title):', titleRes.error)
      return NextResponse.json(
        { error: 'An error occurred while searching.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Merge and deduplicate by post id
    const seenIds = new Set<string>()
    const merged: PostRow[] = []

    const addPosts = (posts: PostRow[] | null) => {
      if (!posts) return
      for (const p of posts) {
        if (!p || !p.id || !p.slug) continue
        // Strict guardrails: only public published posts
        if (p.publish_status !== 'published' || p.visibility !== 'public') continue
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id)
          merged.push(p)
          if (merged.length >= 8) break
        }
      }
    }

    addPosts(titleRes.data as PostRow[])
    if (merged.length < 8) addPosts(excerptRes.data as PostRow[])
    if (merged.length < 8) addPosts(tagRes.data as PostRow[])

    const results = merged.slice(0, 8).map(mapPostToSearchResult)

    return NextResponse.json(
      { results },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('Unhandled search route error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
