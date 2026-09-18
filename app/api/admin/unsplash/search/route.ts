import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { error: authError, status: authStatus } = await getAuthenticatedOwner()

  if (authError) {
    return NextResponse.json({ error: authError }, { status: authStatus })
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY
  if (!accessKey) {
    return NextResponse.json(
      {
        error: 'UNSPLASH_ACCESS_KEY is not configured in the environment.',
        isConfigured: false,
      },
      { status: 503 }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('per_page') || '12'

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
  }

  try {
    const unsplashRes = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        query
      )}&page=${encodeURIComponent(page)}&per_page=${encodeURIComponent(perPage)}`,
      {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1',
        },
      }
    )

    if (!unsplashRes.ok) {
      const errorData = await unsplashRes.text()
      return NextResponse.json(
        { error: `Unsplash API returned ${unsplashRes.status}: ${errorData}` },
        { status: unsplashRes.status }
      )
    }

    const data = await unsplashRes.json()

    // Map results with proper UTM params
    const utmSource = 'ghost'
    const results = (data.results || []).map((photo: any) => {
      const photographerName = photo.user?.name || photo.user?.username || 'Unsplash Creator'
      const userProfileUrl = photo.user?.links?.html
        ? `${photo.user.links.html}?utm_source=${utmSource}&utm_medium=referral&utm_campaign=api-credit`
        : `https://unsplash.com/@${photo.user?.username || ''}?utm_source=${utmSource}&utm_medium=referral&utm_campaign=api-credit`
      const unsplashUrl = `https://unsplash.com/?utm_source=${utmSource}&utm_medium=referral&utm_campaign=api-credit`
      const caption = `Photo by <a href="${userProfileUrl}" target="_blank" rel="noopener noreferrer" class="underline hover:text-[#232536]">${photographerName}</a> / <a href="${unsplashUrl}" target="_blank" rel="noopener noreferrer" class="underline hover:text-[#232536]">Unsplash</a>`

      return {
        id: photo.id,
        description: photo.description || photo.alt_description || 'Unsplash photo',
        urls: {
          raw: photo.urls?.raw,
          full: photo.urls?.full,
          regular: photo.urls?.regular,
          small: photo.urls?.small,
          thumb: photo.urls?.thumb,
        },
        user: {
          name: photographerName,
          username: photo.user?.username,
          profileUrl: userProfileUrl,
        },
        caption,
        downloadLocation: photo.links?.download_location,
      }
    })

    return NextResponse.json({
      total: data.total,
      total_pages: data.total_pages,
      results,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to search Unsplash'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
