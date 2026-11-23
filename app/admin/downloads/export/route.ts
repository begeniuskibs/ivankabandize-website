import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import {
  parseDownloadsFilterParams,
  buildDownloadsExportCsv,
  type CsvExportRow,
} from '@/lib/adminDownloads'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { supabase, user, isOwner } = await getAuthenticatedOwner({ checkMfa: false })

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', '/admin/downloads')
    loginUrl.searchParams.set('error', 'Please sign in to access the Admin Console')
    return NextResponse.redirect(loginUrl, 307)
  }

  if (!isOwner) {
    const accountUrl = new URL('/auth/account', request.url)
    accountUrl.searchParams.set(
      'error',
      'Access restricted. Owner privileges required for Admin Console.'
    )
    return NextResponse.redirect(accountUrl, 307)
  }

  const rawParams: Record<string, string> = {}
  request.nextUrl.searchParams.forEach((value, key) => {
    rawParams[key] = value
  })

  const filters = parseDownloadsFilterParams(rawParams)

  let query = supabase
    .from('resource_downloads')
    .select(`
      id,
      created_at,
      name,
      email,
      anonymised_at,
      intended_use,
      email_sent_at,
      email_error,
      resource:resources(title)
    `)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (filters.resource) {
    query = query.eq('resource_id', filters.resource)
  }

  if (filters.use) {
    if (filters.use === 'none') {
      query = query.is('intended_use', null)
    } else {
      query = query.eq('intended_use', filters.use)
    }
  }

  if (filters.from) {
    query = query.gte('created_at', `${filters.from}T00:00:00.000Z`)
  }

  if (filters.to) {
    query = query.lte('created_at', `${filters.to}T23:59:59.999Z`)
  }

  if (filters.q) {
    query = query.or(`name.imatch.${filters.q},email.imatch.${filters.q}`)
  }

  const { data, error } = await query

  if (error) {
    // Note: Do not log names, emails, or personal data
    console.error('[admin/downloads/export] Supabase query failed:', error.message)
    return new NextResponse('Failed to generate export', { status: 500 })
  }

  const rows: CsvExportRow[] = (data || []).map((item) => {
    const resourceObj = item.resource as { title?: string } | null
    return {
      created_at: item.created_at,
      resource_title: resourceObj?.title || 'Unknown Resource',
      name: item.name,
      email: item.email,
      anonymised_at: item.anonymised_at,
      intended_use: item.intended_use,
      email_sent_at: item.email_sent_at,
      email_error: item.email_error,
    }
  })

  const csvContent = buildDownloadsExportCsv(rows)
  const todayIso = new Date().toISOString().slice(0, 10)
  const filename = `downloads-export-${todayIso}.csv`

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
