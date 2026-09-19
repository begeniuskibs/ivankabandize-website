import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { slug } = await params

  const { data: page, error } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !page) {
    return NextResponse.json({ error: error?.message || 'Page not found' }, { status: 404 })
  }

  return NextResponse.json({ page })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { slug } = await params

  try {
    const body = await request.json()
    const {
      title,
      hero_headline,
      hero_subheadline,
      cta_text,
      cta_url,
      closing_cta_headline,
      body_paragraphs,
      pullquote,
      background_teaching,
      background_method,
      trust_bar_entities,
      testimonials,
    } = body

    if (!hero_headline && hero_headline !== undefined && hero_headline !== '') {
      return NextResponse.json({ error: 'Hero headline is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (title !== undefined) updates.title = title
    if (hero_headline !== undefined) updates.hero_headline = hero_headline
    if (hero_subheadline !== undefined) updates.hero_subheadline = hero_subheadline
    if (cta_text !== undefined) updates.cta_text = cta_text
    if (cta_url !== undefined) updates.cta_url = cta_url
    if (closing_cta_headline !== undefined) updates.closing_cta_headline = closing_cta_headline
    if (body_paragraphs !== undefined) updates.body_paragraphs = body_paragraphs
    if (pullquote !== undefined) updates.pullquote = pullquote
    if (background_teaching !== undefined) updates.background_teaching = background_teaching
    if (background_method !== undefined) updates.background_method = background_method
    if (trust_bar_entities !== undefined) updates.trust_bar_entities = trust_bar_entities
    if (testimonials !== undefined) updates.testimonials = testimonials

    const { data: page, error } = await supabase
      .from('pages')
      .update(updates)
      .eq('slug', slug)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ page })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
