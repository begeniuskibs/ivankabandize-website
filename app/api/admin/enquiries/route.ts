import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'
import { INQUIRY_STATUSES, type InquiryStatus } from '@/lib/inquiries'

export async function GET() {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const { data: enquiries, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error('[api/admin/enquiries GET]', error.message)
    return NextResponse.json({ error: 'Could not fetch enquiries' }, { status: 400 })
  }

  return NextResponse.json({ enquiries: enquiries || [] })
}

export async function PATCH(request: NextRequest) {
  const { supabase, error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Inquiry ID is required' }, { status: 400 })
    }

    if (!INQUIRY_STATUSES.includes(status as InquiryStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Allowed values: ${INQUIRY_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[api/admin/enquiries PATCH]', error.message)
      return NextResponse.json({ error: 'Could not update enquiry' }, { status: 400 })
    }

    return NextResponse.json({ inquiry })
  } catch (err: any) {
    const message = err?.message || 'Server error updating inquiry'
    console.error('[api/admin/enquiries PATCH]', message)
    return NextResponse.json(
      { error: 'Could not update enquiry' },
      { status: 500 }
    )
  }
}
