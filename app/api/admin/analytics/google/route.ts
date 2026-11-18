import { NextResponse } from 'next/server'
import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { getGoogleDataBundle } from '@/lib/googleAnalytics'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { user, isOwner, error: authError, status: authStatus } =
    await getAuthenticatedOwner({ checkMfa: false })

  if (authError || !user || !isOwner) {
    return NextResponse.json(
      { error: authError || 'Unauthorized' },
      { status: authStatus || 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const rangeParam = searchParams.get('range')
  const range = rangeParam === '7' ? 7 : rangeParam === '90' ? 90 : 30

  try {
    const bundle = await getGoogleDataBundle(range)
    return NextResponse.json(bundle)
  } catch {
    return NextResponse.json(
      { error: 'Failed to retrieve Google analytics data' },
      { status: 500 }
    )
  }
}
