import type {
  AnalyticsRange,
  AnalyticsTab,
  DayBucket,
  TopArticleItem,
  TierCounts,
} from '@/lib/adminAnalytics'

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

