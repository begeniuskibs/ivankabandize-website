import assert from 'node:assert/strict'
import {
  parseRange,
  parseTab,
  toKampalaDate,
  getKampalaDateRange,
  bucketByDay,
  sumViews,
  percentChange,
  shareOfTotal,
  topArticles,
  cumulativeMembersByDay,
  countMembersByTier,
  formatKampalaDisplayDate,
  deriveAnalyticsForRange,
} from '../lib/adminAnalytics.ts'

console.log('Running Admin Analytics unit tests...')

// 1. parseRange
assert.equal(parseRange('7'), 7)
assert.equal(parseRange('90'), 90)
assert.equal(parseRange('30'), 30)
assert.equal(parseRange(null), 30)
assert.equal(parseRange(undefined), 30)
assert.equal(parseRange('invalid'), 30)
console.log('  PASS: parseRange')

// 2. parseTab
assert.equal(parseTab('overview'), 'overview')
assert.equal(parseTab('articles'), 'articles')
assert.equal(parseTab('sources'), 'sources')
assert.equal(parseTab('audience'), 'audience')
assert.equal(parseTab(null), 'overview')
assert.equal(parseTab(undefined), 'overview')
assert.equal(parseTab('xyz'), 'overview')
console.log('  PASS: parseTab')

// 3. toKampalaDate & day boundary at 21:00 UTC
// 20:59:59 UTC is 23:59:59 Kampala time (same date)
const dateBefore = '2026-11-12T20:59:59.000Z'
assert.equal(toKampalaDate(dateBefore), '2026-11-12')

// 21:00:00 UTC is 00:00:00 Kampala time (next date)
const dateAfter = '2026-11-12T21:00:00.000Z'
assert.equal(toKampalaDate(dateAfter), '2026-11-13')
console.log('  PASS: toKampalaDate & 21:00 UTC boundary')

// 4. getKampalaDateRange
const fixedNow = new Date('2026-11-12T12:00:00.000Z').getTime()
const range7 = getKampalaDateRange(7, fixedNow)
assert.equal(range7.length, 7)
assert.equal(range7[0], '2026-11-06')
assert.equal(range7[6], '2026-11-12')

const range30 = getKampalaDateRange(30, fixedNow)
assert.equal(range30.length, 30)
assert.equal(range30[29], '2026-11-12')
console.log('  PASS: getKampalaDateRange')

// 5. bucketByDay with zero-fill
const sampleViews = [
  { viewed_at: '2026-11-12T08:00:00.000Z' },
  { viewed_at: '2026-11-12T10:00:00.000Z' },
  { viewed_at: '2026-11-11T15:00:00.000Z' },
  // Outside 7-day range
  { viewed_at: '2026-10-01T12:00:00.000Z' },
]
const buckets = bucketByDay(sampleViews, 7, fixedNow)
assert.equal(buckets.length, 7)
assert.equal(buckets[6].date, '2026-11-12')
assert.equal(buckets[6].count, 2)
assert.equal(buckets[5].date, '2026-11-11')
assert.equal(buckets[5].count, 1)
assert.equal(buckets[4].date, '2026-11-10')
assert.equal(buckets[4].count, 0)
console.log('  PASS: bucketByDay & zero-fill')

// 6. sumViews
assert.equal(sumViews(buckets), 3)
assert.equal(sumViews([]), 0)
console.log('  PASS: sumViews')

// 7. percentChange
assert.equal(percentChange(100, 0), null)
assert.equal(percentChange(150, 100), 50)
assert.equal(percentChange(80, 100), -20)
assert.equal(percentChange(100, 100), 0)
console.log('  PASS: percentChange')

// 8. shareOfTotal
assert.equal(shareOfTotal(20, 100), 0.2)
assert.equal(shareOfTotal(0, 0), 0)
console.log('  PASS: shareOfTotal')

// 9. topArticles sorting and tie-break
const mockPosts = [
  { id: 'p1', title: 'Beta Article', slug: 'beta', publish_status: 'published' },
  { id: 'p2', title: 'Alpha Article', slug: 'alpha', publish_status: 'published' },
  { id: 'p3', title: 'Gamma Article', slug: 'gamma', publish_status: 'published' },
  { id: 'p4', title: 'Draft Post', slug: 'draft', publish_status: 'draft' },
]
const viewMap = new Map([
  ['p1', 10],
  ['p2', 10], // same views as Beta, should sort Alpha before Beta
  ['p3', 50],
  ['p4', 100], // draft, should be excluded
])

const top = topArticles(viewMap, mockPosts, 5)
assert.equal(top.length, 3)
assert.equal(top[0].id, 'p3')
assert.equal(top[0].views, 50)
assert.equal(top[1].id, 'p2') // Alpha before Beta
assert.equal(top[1].views, 10)
assert.equal(top[2].id, 'p1') // Beta
assert.equal(top[2].views, 10)
// Total published views = 50 + 10 + 10 = 70
assert.equal(Math.round(top[0].share * 70), 50)
console.log('  PASS: topArticles sorting, tie-breaking & draft filtering')

// 10. cumulativeMembersByDay
const mockMembers = [
  { created_at: '2026-11-01T10:00:00.000Z' }, // Before 7-day range
  { created_at: '2026-11-05T10:00:00.000Z' }, // Before 7-day range
  { created_at: '2026-11-08T10:00:00.000Z' }, // During day 2026-11-08
  { created_at: '2026-11-12T09:00:00.000Z' }, // During day 2026-11-12
]
const memberGrowth = cumulativeMembersByDay(mockMembers, 7, fixedNow)
assert.equal(memberGrowth.length, 7)
assert.equal(memberGrowth[0].date, '2026-11-06')
assert.equal(memberGrowth[0].count, 2) // 2 prior members
assert.equal(memberGrowth[1].date, '2026-11-07')
assert.equal(memberGrowth[1].count, 2)
assert.equal(memberGrowth[2].date, '2026-11-08')
assert.equal(memberGrowth[2].count, 3) // +1
assert.equal(memberGrowth[6].date, '2026-11-12')
assert.equal(memberGrowth[6].count, 4) // +1
console.log('  PASS: cumulativeMembersByDay')

// 11. countMembersByTier
const tiers = countMembersByTier([
  { tier_status: 'free' },
  { tier_status: 'paid' },
  { tier_status: 'COMPED' },
  { tier_status: null }, // defaults to free
])
assert.deepEqual(tiers, { free: 2, paid: 1, comped: 1 })
console.log('  PASS: countMembersByTier')

// 12. formatKampalaDisplayDate
assert.equal(formatKampalaDisplayDate('2026-11-12'), '12 Nov')
assert.equal(formatKampalaDisplayDate('2026-11-12', true), '12 Nov 2026')
console.log('  PASS: formatKampalaDisplayDate')

// 13. deriveAnalyticsForRange consistency across 7, 30, and 90 days
const dates180 = getKampalaDateRange(180, fixedNow)
// Synthesize 180 days of views and cumulative members
const dailyViews180 = new Array(180).fill(0).map((_, i) => (i % 3 === 0 ? 5 : i % 2 === 0 ? 2 : 1))
const cumulative180 = new Array(180).fill(10).map((base, i) => base + Math.floor(i / 10))

const mockCompact = {
  range: 30,
  tab: 'overview',
  capHit: false,
  allDates180: dates180,
  dailyTotalViews180: dailyViews180,
  publishedArticles: [
    { id: 'art-1', title: 'First Article', slug: 'first', contentType: 'Article', publishedAt: '2026-10-01' },
    { id: 'art-2', title: 'Second Article', slug: 'second', contentType: 'Article', publishedAt: '2026-10-15' },
  ],
  articleViewsByDate: {
    'art-1': {
      [dates180[179]]: 3, // today
      [dates180[175]]: 4, // 4 days ago
      [dates180[160]]: 8, // 19 days ago
      [dates180[100]]: 15, // 79 days ago
    },
    'art-2': {
      [dates180[178]]: 2, // 1 day ago
      [dates180[155]]: 5, // 24 days ago
      [dates180[110]]: 10, // 69 days ago
    },
  },
  cumulativeMembers180: cumulative180,
  tierCounts: { free: 25, paid: 2, comped: 1 },
}

const derived7 = deriveAnalyticsForRange(mockCompact, 7)
const derived30 = deriveAnalyticsForRange(mockCompact, 30)
const derived90 = deriveAnalyticsForRange(mockCompact, 90)

// Bucket lengths match selected range
assert.equal(derived7.viewsCurrentBuckets.length, 7)
assert.equal(derived7.viewsPrevBuckets.length, 7)
assert.equal(derived30.viewsCurrentBuckets.length, 30)
assert.equal(derived30.viewsPrevBuckets.length, 30)
assert.equal(derived90.viewsCurrentBuckets.length, 90)
assert.equal(derived90.viewsPrevBuckets.length, 90)

// Consistency: 7 <= 30 <= 90 total views
assert.ok(
  derived7.totalViewsCurrent <= derived30.totalViewsCurrent,
  `Expected ${derived7.totalViewsCurrent} <= ${derived30.totalViewsCurrent}`
)
assert.ok(
  derived30.totalViewsCurrent <= derived90.totalViewsCurrent,
  `Expected ${derived30.totalViewsCurrent} <= ${derived90.totalViewsCurrent}`
)

// Article views consistency across ranges: 7 <= 30 <= 90
const art1_7 = derived7.allArticles.find((a) => a.id === 'art-1')?.views || 0
const art1_30 = derived30.allArticles.find((a) => a.id === 'art-1')?.views || 0
const art1_90 = derived90.allArticles.find((a) => a.id === 'art-1')?.views || 0
assert.equal(art1_7, 7) // 3 + 4
assert.equal(art1_30, 15) // 3 + 4 + 8
assert.equal(art1_90, 30) // 3 + 4 + 8 + 15
assert.ok(art1_7 <= art1_30 && art1_30 <= art1_90)

// Member counts end at the same current total across all ranges
assert.equal(derived7.totalMembersCurrent, derived30.totalMembersCurrent)
assert.equal(derived30.totalMembersCurrent, derived90.totalMembersCurrent)
console.log('  PASS: deriveAnalyticsForRange (7 <= 30 <= 90 consistency & bucket lengths)')

console.log('ALL TESTS PASSED!')
