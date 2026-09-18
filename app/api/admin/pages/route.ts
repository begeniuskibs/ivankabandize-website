import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { data: pages, error } = await supabase
    .from('pages')
    .select('id, slug, title, hero_headline, hero_subheadline, cta_text, cta_url, closing_cta_headline, updated_at, created_at')
    .order('slug', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ pages })
}
