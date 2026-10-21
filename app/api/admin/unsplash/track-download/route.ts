import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const { error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return NextResponse.json(
      { error: 'UNSPLASH_ACCESS_KEY is not configured in the environment.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const downloadLocation = body?.downloadLocation

    if (typeof downloadLocation !== 'string') {
      return NextResponse.json({ error: 'Invalid download location' }, { status: 400 })
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(downloadLocation)
    } catch {
      return NextResponse.json({ error: 'Invalid download location' }, { status: 400 })
    }

    if (parsedUrl.protocol !== 'https:' || parsedUrl.hostname !== 'api.unsplash.com') {
      return NextResponse.json({ error: 'Invalid download location' }, { status: 400 })
    }

    // Call Unsplash download location endpoint
    const trackRes = await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    })

    if (!trackRes.ok) {
      console.warn('Unsplash track-download returned non-200 status:', trackRes.status)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error tracking Unsplash download:', err)
    return NextResponse.json({ error: 'Failed to track download' }, { status: 500 })
  }
}
