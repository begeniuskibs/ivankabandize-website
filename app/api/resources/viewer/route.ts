import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getFirstName } from '@/lib/resourceFlow'

// Viewer status check for Resources flow (member vs visitor)
// House style: spaced hyphen " - " only

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { isMember: false, firstName: null },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      )
    }

    const { data: member } = await supabase
      .from('members')
      .select('id, tier_status')
      .eq('user_id', user.id)
      .maybeSingle()

    const isMember = Boolean(
      member &&
        member.tier_status &&
        ['free', 'paid', 'comped'].includes(member.tier_status)
    )

    let firstName: string | null = null
    if (isMember) {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      const rawName =
        profile?.full_name ||
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        ''
      firstName = getFirstName(rawName) || null
    }

    return NextResponse.json(
      { isMember, firstName },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch {
    return NextResponse.json(
      { isMember: false, firstName: null },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  }
}
