import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  parseRange,
  parseTab,
  getKampalaDateRange,
  toKampalaDate,
  cumulativeMembersByDay,
  countMembersByTier,
  type CompactAnalyticsData,
  type PublishedArticleRecord,
} from '@/lib/adminAnalytics'
import { AnalyticsClient } from '@/components/admin/analytics/AnalyticsClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Analytics - Admin Console',
  robots: {
    index: false,
    follow: false,
  },
}

interface AnalyticsPageProps {
  searchParams?: Promise<{
    range?: string | string[]
    tab?: string | string[]
  }>
}

async function fetchAllPostViews(startDateIso: string): Promise<{
  allViews: { post_id: string; viewed_at: string }[]
  capHit: boolean
}> {
  const supabase = createAdminClient()
  const CHUNK_SIZE = 1000
  const MAX_ROWS = 200000
  const allViews: { post_id: string; viewed_at: string }[] = []
  let from = 0
  let capHit = false

  while (from < MAX_ROWS) {
    const to = Math.min(from + CHUNK_SIZE - 1, MAX_ROWS - 1)
    const { data: viewChunk, error: viewError } = await supabase
      .from('post_views')
      .select('post_id, viewed_at')
      .gte('viewed_at', startDateIso)
      .order('viewed_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, to)

    if (viewError) {
      console.error('Error querying post_views for admin analytics:', viewError)
      break
    }

    if (!viewChunk || viewChunk.length === 0) {
      break
    }

    allViews.push(...viewChunk)
    if (viewChunk.length < CHUNK_SIZE) {
      break
    }

    from += CHUNK_SIZE
    if (allViews.length >= MAX_ROWS) {
      capHit = true
      break
    }
  }

  return { allViews, capHit }
}

async function fetchCompactAnalytics(
  range: ReturnType<typeof parseRange>,
  tab: ReturnType<typeof parseTab>
): Promise<CompactAnalyticsData> {
  const nowMs = Date.now()
  const allDates180 = getKampalaDateRange(180, nowMs)

  // Start date in UTC corresponding to 00:00:00 Kampala time on the earliest date of the 180 days
  const earliestDateStr = allDates180[0]
  const [ey, em, ed] = earliestDateStr.split('-').map(Number)
  const startUtcMs = Date.UTC(ey, em - 1, ed) - 3 * 3600 * 1000
  const startDateIso = new Date(startUtcMs).toISOString()

  const supabase = createAdminClient()

  // Run post_views paging, posts, and members in parallel
  const [viewsResult, postsResult, membersResult] = await Promise.all([
    fetchAllPostViews(startDateIso),
    supabase
      .from('posts')
      .select('id, title, slug, content_type, publish_status, published_at')
      .eq('publish_status', 'published'),
    supabase
      .from('members')
      .select('id, tier_status, created_at'),
  ])

  if (postsResult.error) {
    console.error('Error querying posts for admin analytics:', postsResult.error)
  }

  if (membersResult.error) {
    console.error('Error querying members for admin analytics:', membersResult.error)
  }

  // Aggregate views per day and sparse date mapping per article
  const dateToIndex = new Map<string, number>()
  allDates180.forEach((date, i) => dateToIndex.set(date, i))

  const dailyTotalViews180 = new Array(180).fill(0)
  const articleViewsByDate: Record<string, Record<string, number>> = {}

  for (const v of viewsResult.allViews) {
    if (!v.viewed_at || !v.post_id) continue
    const dateStr = toKampalaDate(v.viewed_at)
    const idx = dateToIndex.get(dateStr)
    if (idx !== undefined) {
      dailyTotalViews180[idx]++
      if (!articleViewsByDate[v.post_id]) {
        articleViewsByDate[v.post_id] = {}
      }
      articleViewsByDate[v.post_id][dateStr] =
        (articleViewsByDate[v.post_id][dateStr] || 0) + 1
    }
  }

  // Published articles list
  const publishedArticles: PublishedArticleRecord[] = (postsResult.data || []).map(
    (p) => ({
      id: p.id,
      title: p.title || 'Untitled',
      slug: p.slug || '',
      contentType: p.content_type || 'Article',
      publishedAt: p.published_at || null,
    })
  )

  // Cumulative members over the 180 days
  const typedMembers = (membersResult.data || []) as {
    id: string
    tier_status: string | null
    created_at: string
  }[]
  const memberBuckets180 = cumulativeMembersByDay(typedMembers, 180, nowMs)
  const cumulativeMembers180 = memberBuckets180.map((b) => b.count)
  const tierCounts = countMembersByTier(typedMembers)

  return {
    range,
    tab,
    capHit: viewsResult.capHit,
    allDates180,
    dailyTotalViews180,
    publishedArticles,
    articleViewsByDate,
    cumulativeMembers180,
    tierCounts,
  }
}

export default async function AnalyticsPage({
  searchParams,
}: AnalyticsPageProps) {
  const { user, isOwner } = await getAuthenticatedOwner({ checkMfa: false })

  if (!user) {
    redirect(
      '/login?redirectTo=/admin/analytics&error=Please+sign+in+to+access+the+Admin+Console'
    )
  }

  if (!isOwner) {
    redirect(
      '/auth/account?error=Access+restricted.+Owner+privileges+required+for+Admin+Console.'
    )
  }

  const params = (await searchParams) || {}
  const rawRange = Array.isArray(params.range) ? params.range[0] : params.range
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab

  const range = parseRange(rawRange)
  const tab = parseTab(rawTab)

  const compactData = await fetchCompactAnalytics(range, tab)

  return <AnalyticsClient initialCompact={compactData} />
}
