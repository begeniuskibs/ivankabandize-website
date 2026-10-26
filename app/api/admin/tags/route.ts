import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET() {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { data: tags, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('[api/admin/tags GET]', error.message)
    return NextResponse.json({ error: 'Could not fetch tags' }, { status: 400 })
  }

  return NextResponse.json({ tags })
}

export async function POST(request: NextRequest) {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  try {
    const { name, is_internal = false, description = null } = await request.json()
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }

    if (description && typeof description === 'string' && description.length > 280) {
      return NextResponse.json(
        { error: 'Description must be at most 280 characters' },
        { status: 400 }
      )
    }

    const trimmedName = name.trim()
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const trimmedDescription =
      typeof description === 'string' && description.trim() !== ''
        ? description.trim()
        : null

    const { data: tag, error } = await supabase
      .from('tags')
      .insert({
        name: trimmedName,
        slug,
        is_internal: Boolean(is_internal),
        description: trimmedDescription,
      })
      .select()
      .single()

    if (error) {
      console.error('[api/admin/tags POST]', error.message)
      return NextResponse.json({ error: 'Could not create tag' }, { status: 403 })
    }

    return NextResponse.json({ tag }, { status: 201 })
  } catch (err) {
    console.error('[api/admin/tags POST]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Could not create tag' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  try {
    const body = await request.json()
    const { id, description, name, is_internal } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 })
    }

    if (description !== undefined && description !== null && typeof description === 'string' && description.length > 280) {
      return NextResponse.json(
        { error: 'Description must be at most 280 characters' },
        { status: 400 }
      )
    }

    const updates: {
      description?: string | null
      name?: string
      is_internal?: boolean
      updated_at: string
    } = {
      updated_at: new Date().toISOString(),
    }

    if (description !== undefined) {
      updates.description =
        typeof description === 'string' && description.trim() !== ''
          ? description.trim()
          : null
    }

    if (name !== undefined && typeof name === 'string' && name.trim() !== '') {
      updates.name = name.trim()
    }

    if (is_internal !== undefined) {
      updates.is_internal = Boolean(is_internal)
    }

    const { data: tag, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[api/admin/tags PATCH]', error.message)
      return NextResponse.json({ error: 'Could not update tag' }, { status: 400 })
    }

    return NextResponse.json({ tag })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown server error'
    console.error('[api/admin/tags PATCH]', message)
    return NextResponse.json({ error: 'Could not update tag' }, { status: 500 })
  }
}

