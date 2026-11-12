import assert from 'node:assert/strict'
import {
  isBotUserAgent,
  isValidSlug,
  makeSessionHash,
  getUtcDay,
} from '../lib/viewCounting.ts'

console.log('=== VIEW COUNTING UNIT TESTS ===\n')

// ----------------------------------------------------------------------------
// 1. isBotUserAgent
// ----------------------------------------------------------------------------
console.log('--- 1. Testing isBotUserAgent ---')

// True cases: empty, null, undefined, whitespace
assert.equal(isBotUserAgent(''), true, 'Empty string must be detected as bot')
assert.equal(isBotUserAgent(null), true, 'null must be detected as bot')
assert.equal(isBotUserAgent(undefined), true, 'undefined must be detected as bot')
assert.equal(isBotUserAgent('   '), true, 'Whitespace must be detected as bot')

// True cases: all specified crawler / bot patterns
const botUserAgents = [
  'Googlebot/2.1 (+http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'Baiduspider+(+http://www.baidu.com/search/spider.htm)',
  'Yahoo! Slurp',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Lighthouse/11.0.0',
  'Vercelbot/1.0',
  'UptimeRobot/2.0 (http://www.uptimerobot.com/)',
  'curl/7.88.1',
  'Wget/1.21.3',
  'python-requests/2.31.0',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'WhatsApp/2.21.12.21 A',
  'TelegramBot (like TwitterBot)',
  'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SkypeUriPreview Preview/0.5',
]

for (const ua of botUserAgents) {
  assert.equal(isBotUserAgent(ua), true, `Bot UA "${ua}" must be detected as bot`)
}
console.log('  PASS: all bot user agents correctly flagged as bots')

// False cases: normal desktop & mobile browsers
const legitimateUserAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Android 14; Mobile; rv:122.0) Gecko/122.0 Firefox/122.0',
  'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:122.0) Gecko/20100101 Firefox/122.0',
]

for (const ua of legitimateUserAgents) {
  assert.equal(isBotUserAgent(ua), false, `Legitimate browser "${ua}" must NOT be detected as bot`)
}
console.log('  PASS: legitimate user agents correctly accepted')

// ----------------------------------------------------------------------------
// 2. isValidSlug
// ----------------------------------------------------------------------------
console.log('\n--- 2. Testing isValidSlug ---')

// Good cases
const validSlugs = [
  'a',
  '1',
  'a-b',
  'feel-good-productivity',
  'weekly-planning-for-productivity-in-2026',
  'article-12345',
  'a'.repeat(200),
]

for (const slug of validSlugs) {
  assert.equal(isValidSlug(slug), true, `Slug "${slug.slice(0, 30)}..." must be valid`)
}
console.log('  PASS: valid slugs accepted')

// Bad cases
const invalidSlugs = [
  '',
  ' ',
  'Upper-Case',
  'with_underscore',
  'with spaces',
  '../traversal',
  'article!@#$',
  'a'.repeat(201),
  null,
  undefined,
  12345,
  {},
  [],
]

for (const slug of invalidSlugs) {
  assert.equal(isValidSlug(slug), false, `Invalid slug ${JSON.stringify(slug)} must be rejected`)
}
console.log('  PASS: invalid slugs rejected')

// ----------------------------------------------------------------------------
// 3. makeSessionHash
// ----------------------------------------------------------------------------
console.log('\n--- 3. Testing makeSessionHash ---')

const secret = 'test-secret-service-role-key-123456789'
const ip = '198.51.100.42'
const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
const postId = '11111111-2222-3333-4444-555555555555'
const day = '2026-11-12'

const hash1 = makeSessionHash({ secret, ip, userAgent, postId, day })
const hash2 = makeSessionHash({ secret, ip, userAgent, postId, day })

// Stable for same inputs
assert.equal(hash1, hash2, 'makeSessionHash must be deterministic for identical inputs')
assert.match(hash1, /^[0-9a-f]{64}$/, 'Hash must be a 64-char hex string (SHA256)')

// Different for another day
const diffDayHash = makeSessionHash({ secret, ip, userAgent, postId, day: '2026-11-13' })
assert.notEqual(hash1, diffDayHash, 'Hash must differ for a different day')

// Different for another post
const diffPostHash = makeSessionHash({
  secret,
  ip,
  userAgent,
  postId: '99999999-8888-7777-6666-555555555555',
  day,
})
assert.notEqual(hash1, diffPostHash, 'Hash must differ for a different post ID')

// Different for another IP
const diffIpHash = makeSessionHash({ secret, ip: '198.51.100.43', userAgent, postId, day })
assert.notEqual(hash1, diffIpHash, 'Hash must differ for a different IP')

// Different for another userAgent
const diffUaHash = makeSessionHash({ secret, ip, userAgent: 'Different UA', postId, day })
assert.notEqual(hash1, diffUaHash, 'Hash must differ for a different user agent')

// Never contains raw IP or user agent
assert.equal(hash1.includes(ip), false, 'Hash output must never contain raw IP')
assert.equal(hash1.includes(userAgent), false, 'Hash output must never contain raw user agent')
console.log('  PASS: hash is stable, differs per day/post/IP/UA, and never leaks raw IP/UA')

// ----------------------------------------------------------------------------
// 4. getUtcDay
// ----------------------------------------------------------------------------
console.log('\n--- 4. Testing getUtcDay ---')
const fixedDate = new Date('2026-11-12T23:59:59.999Z')
assert.equal(getUtcDay(fixedDate), '2026-11-12', 'getUtcDay must return UTC date in YYYY-MM-DD')
console.log('  PASS: getUtcDay produces valid UTC YYYY-MM-DD')

console.log('\n========================================')
console.log('ALL VIEW COUNTING TESTS PASSED!')
console.log('========================================')
