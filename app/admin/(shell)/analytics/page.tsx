import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { createAdminClient } from '@/utils/supabase/admin'
import {
  parseRange,
  parseTab,
  getKampalaDateRange,
  toKampalaDate,
  bucketByDay,
  sumViews,
  percentChange,
  topArticles,
  cumulativeMembersByDay,
  countMembersByTier,
  formatKampalaDisplayDate,
  type PostRecord,
} from '@/lib/adminAnalytics'
import { AnalyticsClient } from '@/components/admin/analytics/AnalyticsClient'
import type { AnalyticsData } from '@/components/admin/analytics/types'

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

async function fetchAdminAnalytics(
  range: ReturnType<typeof parseRange>,
  tab: ReturnType<typeof parseTab>
): Promise<AnalyticsData> {
  const nowMs = Date.now()
  const kampalaDates2X = getKampalaDateRange(2 * range, nowMs)
  const prevPeriodDates = kampalaDates2X.slice(0, range)
  const currentPeriodDates = kampalaDates2X.slice(range)

  // Start date in UTC corresponding to 00:00:00 Kampala time on the earliest date
  const earliestDateStr = kampalaDates2X[0]
  const [ey, em, ed] = earliestDateStr.split('-').map(Number)
  const startUtcMs = Date.UTC(ey, em - 1, ed) - 3 * 3600 * 1000
  const startDateIso = new Date(startUtcMs).toISOString()

  const supabase = createAdminClient()

  // 1. Fetch post_views in chunks of 1000, capped at 200,000 views
  // SECURITY: Strictly select post_id and viewed_at ONLY. No personal or session fields are requested.
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

  // 2. Fetch posts
  const { data: postsData, error: postsError } = await supabase
    .from('posts')
    .select('id, title, slug, content_type, publish_status, published_at')

  if (postsError) {
    console.error('Error querying posts for admin analytics:', postsError)
  }

  // 3. Fetch members
  const { data: membersData, error: membersError } = await supabase
    .from('members')
    .select('id, tier_status, created_at')

  if (membersError) {
    console.error('Error querying members for admin analytics:', membersError)
  }

  // Split views into current and previous periods by Kampala date
  const currentDateSet = new Set(currentPeriodDates)
  const prevDateSet = new Set(prevPeriodDates)

  const currentViews: { post_id: string; viewed_at: string }[] = []
  const prevViews: { post_id: string; viewed_at: string }[] = []

  for (const v of allViews) {
    if (!v.viewed_at) continue
    const dateStr = toKampalaDate(v.viewed_at)
    if (currentDateSet.has(dateStr)) {
      currentViews.push(v)
    } else if (prevDateSet.has(dateStr)) {
      prevViews.push(v)
    }
  }

  const viewsCurrentBuckets = bucketByDay(currentViews, range, nowMs)

  // Previous period buckets
  const prevCountMap = new Map<string, number>()
  for (const date of prevPeriodDates) {
    prevCountMap.set(date, 0)
  }
  for (const v of prevViews) {
    const dateStr = toKampalaDate(v.viewed_at)
    if (prevCountMap.has(dateStr)) {
      prevCountMap.set(dateStr, (prevCountMap.get(dateStr) || 0) + 1)
    }
  }
  const viewsPrevBuckets = prevPeriodDates.map((date) => ({
    date,
    count: prevCountMap.get(date) || 0,
  }))

  const totalViewsCurrent = sumViews(viewsCurrentBuckets)
  const totalViewsPrev = sumViews(viewsPrevBuckets)
  const viewsPercentDelta = percentChange(totalViewsCurrent, totalViewsPrev)

  // Best day in current period
  let bestDayCount = 0
  let bestDayDate = ''
  for (const bucket of viewsCurrentBuckets) {
    if (bucket.count >= bestDayCount && bucket.count > 0) {
      bestDayCount = bucket.count
      bestDayDate = bucket.date
    }
  }
  const bestDayDateDisplay =
    bestDayCount > 0 ? formatKampalaDisplayDate(bestDayDate) : ''

  // Top articles and all articles
  const currentPostViewCounts = new Map<string, number>()
  for (const v of currentViews) {
    currentPostViewCounts.set(
      v.post_id,
      (currentPostViewCounts.get(v.post_id) || 0) + 1
    )
  }

  const typedPosts = (postsData || []) as PostRecord[]
  const topArticlesList = topArticles(currentPostViewCounts, typedPosts, 5)
  const allArticlesList = topArticles(currentPostViewCounts, typedPosts, 1000)

  // Members data
  const typedMembers = (membersData || []) as {
    id: string
    tier_status: string | null
    created_at: string
  }[]
  const member2XBuckets = cumulativeMembersByDay(typedMembers, 2 * range, nowMs)
  const memberPrevBuckets = member2XBuckets.slice(0, range)
  const memberCurrentBuckets = member2XBuckets.slice(range)

  const totalMembersCurrent =
    memberCurrentBuckets[memberCurrentBuckets.length - 1]?.count || 0
  const totalMembersPrev =
    memberPrevBuckets[memberPrevBuckets.length - 1]?.count || 0
  const memberPercentDelta = percentChange(
    totalMembersCurrent,
    totalMembersPrev
  )

  const tierCounts = countMembersByTier(typedMembers)

  return {
    range,
    tab,
    capHit,
    currentPeriodDates,
    previousPeriodDates: prevPeriodDates,
    viewsCurrentBuckets,
    viewsPrevBuckets,
    totalViewsCurrent,
    totalViewsPrev,
    viewsPercentDelta,
    bestDayCount,
    bestDayDateDisplay,
    memberCurrentBuckets,
    memberPrevBuckets,
    totalMembersCurrent,
    totalMembersPrev,
    memberPercentDelta,
    tierCounts,
    topArticles: topArticlesList,
    allArticles: allArticlesList,
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

  const analyticsData = await fetchAdminAnalytics(range, tab)

  return <AnalyticsClient initialData={analyticsData} />
}
