export type AnalyticsRange = 7 | 30 | 90
export type AnalyticsTab = 'overview' | 'articles' | 'sources' | 'audience'
export type TimeChartStyle = 'bar' | 'line' | 'area' | 'step'
export type ShareChartStyle = 'bars' | 'donut'

export interface PostRecord {
  id: string
  title: string
  slug: string
  content_type?: string | null
  publish_status?: string | null
  published_at?: string | null
}

export interface PublishedArticleRecord {
  id: string
  title: string
  slug: string
  contentType: string
  publishedAt: string | null
}

export interface TopArticleItem {
  id: string
  title: string
  slug: string
  contentType: string
  publishedAt: string | null
  views: number
  share: number
}

export interface DayBucket {
  date: string
  count: number
}

export interface TierCounts {
  free: number
  paid: number
  comped: number
}

export interface AnalyticsData {
  range: AnalyticsRange
  tab: AnalyticsTab
  capHit: boolean
  currentPeriodDates: string[]
  previousPeriodDates: string[]
  viewsCurrentBuckets: DayBucket[]
  viewsPrevBuckets: DayBucket[]
  totalViewsCurrent: number
  totalViewsPrev: number
  viewsPercentDelta: number | null
  bestDayCount: number
  bestDayDateDisplay: string
  memberCurrentBuckets: DayBucket[]
  memberPrevBuckets: DayBucket[]
  totalMembersCurrent: number
  totalMembersPrev: number
  memberPercentDelta: number | null
  tierCounts: TierCounts
  topArticles: TopArticleItem[]
  allArticles: TopArticleItem[]
}

export interface CompactAnalyticsData {
  range: AnalyticsRange
  tab: AnalyticsTab
  capHit: boolean
  allDates180: string[]
  dailyTotalViews180: number[]
  publishedArticles: PublishedArticleRecord[]
  articleViewsByDate: Record<string, Record<string, number>>
  cumulativeMembers180: number[]
  tierCounts: TierCounts
}

export interface YAxisBounds {
  min: number
  max: number
  nice: number
  floor: number
}

export interface DonutSegment {
  label: string
  value: number
  percent: number
  color: string
  strokeDasharray: string
  strokeDashoffset: number
}

export const BRAND_PALETTE = [
  '#CF3F29',
  '#232536',
  '#3C6FD1',
  '#2F9E7A',
  '#B07A1E',
  '#8A6BB5',
  '#5C5F73',
  '#C9A66B',
]

const KAMPALA_OFFSET_MS = 3 * 60 * 60 * 1000 // UTC+3 with no DST
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function parseRange(value: string | null | undefined): AnalyticsRange {
  if (value === '7') return 7
  if (value === '90') return 90
  return 30
}

export function parseTab(value: string | null | undefined): AnalyticsTab {
  if (value === 'articles') return 'articles'
  if (value === 'sources') return 'sources'
  if (value === 'audience') return 'audience'
  return 'overview'
}

export function toKampalaDate(dateInput: string | Date | number): string {
  const ms =
    typeof dateInput === 'string'
      ? new Date(dateInput).getTime()
      : typeof dateInput === 'number'
        ? dateInput
        : dateInput.getTime()

  const kampalaDate = new Date(ms + KAMPALA_OFFSET_MS)
  const y = kampalaDate.getUTCFullYear()
  const m = String(kampalaDate.getUTCMonth() + 1).padStart(2, '0')
  const d = String(kampalaDate.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatKampalaLongDate(dateInput?: string | Date | number): string {
  const ms =
    dateInput !== undefined
      ? typeof dateInput === 'string'
        ? new Date(dateInput).getTime()
        : typeof dateInput === 'number'
          ? dateInput
          : dateInput.getTime()
      : Date.now()

  const d = new Date(ms + KAMPALA_OFFSET_MS)
  const dayOfWeek = DAYS_FULL[d.getUTCDay()]
  const dayOfMonth = d.getUTCDate()
  const month = MONTHS_FULL[d.getUTCMonth()]
  const year = d.getUTCFullYear()
  return `${dayOfWeek}, ${dayOfMonth} ${month} ${year}`
}

export function getKampalaDateRange(days: number, nowMs: number = Date.now()): string[] {
  const todayKampalaStr = toKampalaDate(nowMs)
  const [year, month, day] = todayKampalaStr.split('-').map(Number)
  const todayUtcMidnight = Date.UTC(year, month - 1, day)

  const result: string[] = []
  for (let i = days - 1; i >= 0; i--) {
    const targetMs = todayUtcMidnight - i * 86400000
    const d = new Date(targetMs)
    const y = d.getUTCFullYear()
    const m = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dayStr = String(d.getUTCDate()).padStart(2, '0')
    result.push(`${y}-${m}-${dayStr}`)
  }
  return result
}

export function bucketByDay(
  views: { viewed_at: string }[],
  days: number,
  nowMs: number = Date.now()
): DayBucket[] {
  const dateRange = getKampalaDateRange(days, nowMs)
  const countMap = new Map<string, number>()
  for (const date of dateRange) {
    countMap.set(date, 0)
  }

  for (const view of views) {
    if (!view.viewed_at) continue
    const dateStr = toKampalaDate(view.viewed_at)
    if (countMap.has(dateStr)) {
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1)
    }
  }

  return dateRange.map((date) => ({
    date,
    count: countMap.get(date) || 0,
  }))
}

export function sumViews(viewsByDay: { count: number }[]): number {
  return viewsByDay.reduce((acc, curr) => acc + curr.count, 0)
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null
  return Math.round(((current - previous) / previous) * 100)
}

export function shareOfTotal(views: number, total: number): number {
  if (total <= 0) return 0
  return views / total
}

export function topArticles(
  viewCountsByPostId: Map<string, number>,
  posts: PostRecord[],
  limit = 8
): TopArticleItem[] {
  const postMap = new Map<string, PostRecord>()
  for (const post of posts) {
    postMap.set(post.id, post)
  }

  const items: TopArticleItem[] = []
  let totalViews = 0

  for (const post of posts) {
    // Only published articles are counted
    if (post.publish_status && post.publish_status !== 'published') {
      continue
    }
    const views = viewCountsByPostId.get(post.id) || 0
    totalViews += views
    items.push({
      id: post.id,
      title: post.title || 'Untitled',
      slug: post.slug || '',
      contentType: post.content_type || 'Article',
      publishedAt: post.published_at || null,
      views,
      share: 0,
    })
  }

  items.sort((a, b) => {
    if (b.views !== a.views) {
      return b.views - a.views
    }
    return a.title.localeCompare(b.title)
  })

  for (const item of items) {
    item.share = shareOfTotal(item.views, totalViews)
  }

  return items.slice(0, limit)
}

export function cumulativeMembersByDay(
  members: { created_at: string }[],
  days: number,
  nowMs: number = Date.now(),
  startingTotal?: number
): DayBucket[] {
  const dateRange = getKampalaDateRange(days, nowMs)
  if (dateRange.length === 0) return []

  const firstDate = dateRange[0]
  let runningCount =
    typeof startingTotal === 'number'
      ? startingTotal
      : members.filter((m) => toKampalaDate(m.created_at) < firstDate).length

  const membersByDay = new Map<string, number>()
  for (const date of dateRange) {
    membersByDay.set(date, 0)
  }

  for (const m of members) {
    if (!m.created_at) continue
    const dateStr = toKampalaDate(m.created_at)
    if (membersByDay.has(dateStr)) {
      membersByDay.set(dateStr, (membersByDay.get(dateStr) || 0) + 1)
    }
  }

  return dateRange.map((date) => {
    runningCount += membersByDay.get(date) || 0
    return {
      date,
      count: runningCount,
    }
  })
}

export function countMembersByTier(
  members: { tier_status: string | null }[]
): TierCounts {
  let free = 0
  let paid = 0
  let comped = 0

  for (const m of members) {
    const status = (m.tier_status || 'free').toLowerCase()
    if (status === 'paid') {
      paid++
    } else if (status === 'comped') {
      comped++
    } else {
      free++
    }
  }

  return { free, paid, comped }
}

export function formatKampalaDisplayDate(
  dateStr: string,
  includeYear = false
): string {
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = parts[0]
  const monthIdx = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const monthName = MONTHS_SHORT[monthIdx] || parts[1]

  if (includeYear) {
    return `${day} ${monthName} ${year}`
  }
  return `${day} ${monthName}`
}

export function buildStepPath(points: [number, number][]): string {
  if (points.length === 0) return ''
  let d = `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`
  for (let i = 1; i < points.length; i++) {
    d += ` H ${points[i][0].toFixed(1)} V ${points[i][1].toFixed(1)}`
  }
  return d
}

export function calculateYAxisBounds(
  data: number[],
  isFloor: boolean,
  isBar: boolean
): YAxisBounds {
  if (!data || data.length === 0) {
    return { min: 0, max: 0, nice: 4, floor: 0 }
  }
  const max = Math.max(...data, 0)
  const min = Math.min(...data)

  if (isBar || !isFloor) {
    let nice = 4
    if (max > 100) {
      nice = Math.ceil(max / 50) * 50
    } else if (max > 20) {
      nice = Math.ceil(max / 20) * 20
    } else if (max > 10) {
      nice = 20
    } else if (max > 4) {
      nice = 10
    } else {
      nice = 4
    }
    return { min, max, nice, floor: 0 }
  }

  const lo = Math.floor((min * 0.9) / 5) * 5
  let nice = Math.ceil((max * 1.05) / 5) * 5
  if (nice <= lo) {
    nice = lo + 5
  }
  return { min, max, nice, floor: lo }
}

export function calculateDonutSegments(
  rows: [string, number][] | { label: string; value: number }[],
  palette: string[] = BRAND_PALETTE
): DonutSegment[] {
  const normalized = rows.map((r) =>
    Array.isArray(r) ? { label: r[0], value: r[1] } : r
  )
  const total = normalized.reduce((acc, curr) => acc + curr.value, 0) || 1
  let offset = 25 // 12 o'clock

  return normalized.map((item, idx) => {
    const percent = Math.round((item.value / total) * 100)
    const p = (item.value / total) * 100
    const strokeDasharray = `${p.toFixed(2)} ${(100 - p).toFixed(2)}`
    const strokeDashoffset = offset
    offset -= p

    return {
      label: item.label,
      value: item.value,
      percent,
      color: palette[idx % palette.length],
      strokeDasharray,
      strokeDashoffset,
    }
  })
}

export function deriveAnalyticsForRange(
  compact: CompactAnalyticsData,
  range: AnalyticsRange,
  currentTab: AnalyticsTab = compact.tab
): AnalyticsData {
  const len = compact.allDates180.length
  // Current range: last `range` days of 180 days
  const currentStartIdx = Math.max(0, len - range)
  const currentPeriodDates = compact.allDates180.slice(currentStartIdx)
  const currentViewCounts = compact.dailyTotalViews180.slice(currentStartIdx)

  const viewsCurrentBuckets: DayBucket[] = currentPeriodDates.map((date, idx) => ({
    date,
    count: currentViewCounts[idx] || 0,
  }))

  // Previous range: `range` days immediately preceding current period
  const prevStartIdx = Math.max(0, len - 2 * range)
  const prevEndIdx = currentStartIdx
  const previousPeriodDates = compact.allDates180.slice(prevStartIdx, prevEndIdx)
  const prevViewCounts = compact.dailyTotalViews180.slice(prevStartIdx, prevEndIdx)

  const viewsPrevBuckets: DayBucket[] = previousPeriodDates.map((date, idx) => ({
    date,
    count: prevViewCounts[idx] || 0,
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

  // Articles calculation for current period
  const currentDateSet = new Set(currentPeriodDates)
  const allArticlesList: TopArticleItem[] = compact.publishedArticles.map((article) => {
    const dateMap = compact.articleViewsByDate[article.id] || {}
    let views = 0
    for (const [date, count] of Object.entries(dateMap)) {
      if (currentDateSet.has(date)) {
        views += count
      }
    }
    return {
      id: article.id,
      title: article.title,
      slug: article.slug,
      contentType: article.contentType,
      publishedAt: article.publishedAt,
      views,
      share: 0,
    }
  })

  allArticlesList.sort((a, b) => {
    if (b.views !== a.views) {
      return b.views - a.views
    }
    return a.title.localeCompare(b.title)
  })

  for (const item of allArticlesList) {
    item.share = shareOfTotal(item.views, totalViewsCurrent)
  }

  const topArticlesList = allArticlesList.slice(0, 8)

  // Members calculation
  const currentMemberCounts = compact.cumulativeMembers180.slice(currentStartIdx)
  const prevMemberCounts = compact.cumulativeMembers180.slice(prevStartIdx, prevEndIdx)

  const memberCurrentBuckets: DayBucket[] = currentPeriodDates.map((date, idx) => ({
    date,
    count: currentMemberCounts[idx] || 0,
  }))

  const memberPrevBuckets: DayBucket[] = previousPeriodDates.map((date, idx) => ({
    date,
    count: prevMemberCounts[idx] || 0,
  }))

  const totalMembersCurrent =
    currentMemberCounts[currentMemberCounts.length - 1] || 0
  const totalMembersPrev = prevMemberCounts[prevMemberCounts.length - 1] || 0
  const memberPercentDelta = percentChange(totalMembersCurrent, totalMembersPrev)

  return {
    range,
    tab: currentTab,
    capHit: compact.capHit,
    currentPeriodDates,
    previousPeriodDates,
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
    tierCounts: compact.tierCounts,
    topArticles: topArticlesList,
    allArticles: allArticlesList,
  }
}
