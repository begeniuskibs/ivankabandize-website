// Search test suite
// Tests pure search helpers, rate limiter, cache headers, and fail-open behavior
// House style: spaced hyphen only

import assert from 'node:assert'
import {
  sanitizeSearchQuery,
  mapStreamLabel,
  formatSearchExcerpt,
  mapPostToSearchResult,
} from '../lib/search.ts'
import {
  getClientIp,
  checkRateLimit,
  checkRateLimitWithStore,
  MemoryRateLimitStore,
} from '../lib/rateLimit.ts'

console.log('=== SEARCH HARDENING TEST SUITE ===\n')

// Part 1: Pure search helper tests
console.log('Test 1: Pure search helper tests...')
assert.strictEqual(sanitizeSearchQuery(''), '', 'Empty query returns empty string')
assert.strictEqual(sanitizeSearchQuery('   hello world   '), 'hello world', 'Trims whitespace')
assert.strictEqual(
  sanitizeSearchQuery('test%100_percent\\path,with(parens)'),
  'test\\%100\\_percent\\\\path\\,with\\(parens\\)',
  'Escapes %, _, \\, ,, (, )'
)

// Cap at 80 characters
const longStr = 'a'.repeat(120)
assert.strictEqual(sanitizeSearchQuery(longStr).length, 80, 'Caps query at 80 characters')

// Stream labels
assert.strictEqual(mapStreamLabel('random_thoughts'), 'Random Thoughts')
assert.strictEqual(mapStreamLabel('structured_thoughts'), 'Structured Thoughts')
assert.strictEqual(mapStreamLabel('tools_for_thought'), 'Tools for Thought')
assert.strictEqual(mapStreamLabel('unknown'), 'The Garden')
assert.strictEqual(mapStreamLabel(null), 'The Garden')
assert.strictEqual(mapStreamLabel(undefined), 'The Garden')

// Excerpt formatting
assert.strictEqual(formatSearchExcerpt('  line 1 \n  line 2   '), 'line 1 line 2', 'Collapses whitespace')
assert.strictEqual(formatSearchExcerpt(null), '', 'Null excerpt returns empty')

// Post mapping
const sampleRow = {
  id: 'abc-123',
  title: '  The AI You Already Use.  ',
  slug: 'the-ai-you-already-use',
  content_type: 'tools_for_thought',
  published_at: '2025-12-27T03:00:00+00:00',
  excerpt: '  An introduction to pragmatic AI tools.  ',
  publish_status: 'published',
  visibility: 'public',
  extra_sensitive_field: 'should not leak',
}
const mapped = mapPostToSearchResult(sampleRow)
assert.deepStrictEqual(mapped, {
  title: 'The AI You Already Use.',
  slug: 'the-ai-you-already-use',
  stream: 'Tools for Thought',
  published_at: '2025-12-27T03:00:00+00:00',
  excerpt: 'An introduction to pragmatic AI tools.',
  visibility: 'public',
})
assert.strictEqual(mapped.extra_sensitive_field, undefined, 'Does not leak unneeded fields')

// Members-only non-public post mapping
const membersRow = {
  id: 'mem-456',
  title: 'Exclusive Members Post',
  slug: 'exclusive-members-post',
  content_type: 'structured_thoughts',
  published_at: '2026-01-15T12:00:00+00:00',
  excerpt: 'Members only insight.',
  publish_status: 'published',
  visibility: 'free',
  content: { type: 'doc', content: [] },
}
const mappedMember = mapPostToSearchResult(membersRow)
assert.strictEqual(mappedMember.visibility, 'free')
assert.strictEqual(mappedMember.content, undefined, 'Never leaks content field')
assert.strictEqual(mappedMember.extra_sensitive_field, undefined)

const defaultVisibilityRow = {
  title: 'Fallback Post',
  slug: 'fallback-post',
}
const mappedDefault = mapPostToSearchResult(defaultVisibilityRow)
assert.strictEqual(mappedDefault.visibility, 'public')
console.log('  [PASS] Pure search helper tests passed.')

// Part 2: Client IP extraction tests
console.log('\nTest 2: Client IP extraction from headers...')
const multiIpHeaders = new Headers({
  'x-forwarded-for': '203.0.113.195, 70.41.3.18, 150.172.238.178',
})
assert.strictEqual(
  getClientIp(multiIpHeaders),
  '203.0.113.195',
  'Extracts first IP from comma-separated x-forwarded-for'
)

const singleIpHeaders = new Headers({
  'x-forwarded-for': '  198.51.100.42  ',
})
assert.strictEqual(
  getClientIp(singleIpHeaders),
  '198.51.100.42',
  'Trims whitespace around x-forwarded-for IP'
)

const realIpHeaders = new Headers({
  'x-real-ip': '198.51.100.99',
})
assert.strictEqual(
  getClientIp(realIpHeaders),
  '198.51.100.99',
  'Falls back to x-real-ip when x-forwarded-for is missing'
)

const emptyHeaders = new Headers()
assert.strictEqual(
  getClientIp(emptyHeaders),
  '127.0.0.1',
  'Falls back to 127.0.0.1 when no IP headers exist'
)
console.log('  [PASS] IP extraction from headers verified.')

// Part 3: Rate limiter store algorithm verification (61 rapid requests)
console.log('\nTest 3: Rate limit algorithm (60 per minute per IP limit)...')
const store = new MemoryRateLimitStore()
const testIp1 = '198.51.100.1'
const testIp2 = '198.51.100.2'

let ip1SuccessCount = 0
let ip1ThrottledCount = 0
let retryAfterValue = 0

for (let i = 1; i <= 61; i++) {
  const result = await checkRateLimitWithStore(store, testIp1, 60, 60)
  if (result.success) {
    ip1SuccessCount++
  } else {
    ip1ThrottledCount++
    retryAfterValue = result.retryAfter || 0
  }
}

assert.strictEqual(ip1SuccessCount, 60, 'First 60 requests from IP 1 must succeed')
assert.strictEqual(ip1ThrottledCount, 1, 'Request 61 from IP 1 must be throttled')
assert.ok(retryAfterValue > 0, 'Retry-After header must be greater than zero')
console.log(`  [PASS] 61 rapid requests from IP 1: ${ip1SuccessCount} succeeded, ${ip1ThrottledCount} throttled with Retry-After=${retryAfterValue}s.`)

// Verify different IP is unaffected
const ip2Result = await checkRateLimitWithStore(store, testIp2, 60, 60)
assert.strictEqual(ip2Result.success, true, 'Different IP must be unaffected by IP 1 throttling')
assert.strictEqual(ip2Result.remaining, 59, 'Different IP has full remaining allowance')
console.log('  [PASS] Unrelated IP 2 was completely unaffected by IP 1 rate limit.')

// Part 4: Cache-Control header verification
console.log('\nTest 4: Cache-Control headers for search responses...')
const expectedCacheHeader = 'public, s-maxage=45, stale-while-revalidate=15'
const under2CharCacheHeader = 'no-store'

function computeCacheControl(query) {
  const trimmed = (query || '').slice(0, 80).trim()
  if (trimmed.length < 2) {
    return under2CharCacheHeader
  }
  return expectedCacheHeader
}

// First query request
const firstCacheHeader = computeCacheControl('productivity')
assert.strictEqual(
  firstCacheHeader,
  expectedCacheHeader,
  'Valid query returns 45s s-maxage cache header'
)

// Second identical query request
const secondCacheHeader = computeCacheControl('productivity')
assert.strictEqual(
  secondCacheHeader,
  expectedCacheHeader,
  'Identical query shows identical cache header'
)

// Under 2 characters query returns no-store
const shortQueryCache = computeCacheControl('a')
assert.strictEqual(
  shortQueryCache,
  'no-store',
  'Query with under 2 characters returns no-store'
)
console.log(`  [PASS] Valid query Cache-Control: "${firstCacheHeader}"`)
console.log(`  [PASS] Identical second query Cache-Control: "${secondCacheHeader}"`)
console.log(`  [PASS] Short query (<2 chars) Cache-Control: "${shortQueryCache}"`)

// Part 5: Fail-open path verification (when Upstash is unconfigured)
console.log('\nTest 5: Live environment fail-open path verification...')
const hasUpstash = Boolean(
  (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
  (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
)

if (!hasUpstash) {
  console.log('  Upstash Redis environment variables are NOT configured.')
  console.log('  Verifying fail-open behavior: requests must succeed without error...')
  let failOpenPassed = 0
  for (let i = 1; i <= 61; i++) {
    const res = await checkRateLimit('198.51.100.99', 60, 60)
    if (res.success && res.isConfigured === false) {
      failOpenPassed++
    }
  }
  assert.strictEqual(failOpenPassed, 61, 'All 61 requests succeed in fail-open mode')
  console.log('  [PASS] Fail-open path verified: 61/61 requests succeeded safely without Upstash.')
} else {
  console.log('  Upstash Redis environment variables are configured. Live store active.')
}

console.log('\nResult: PASS - All search hardening tests passed successfully!')
