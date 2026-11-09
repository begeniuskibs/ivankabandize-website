// Pure unit tests for Library Item Links, Slug, and Video URL validators
import assert from 'node:assert/strict'
import {
  validateLibrarySlug,
  validateLibraryVideoUrl,
  validateLibraryLinks,
} from '../lib/libraryLinks.ts'

console.log('=== LIBRARY VALIDATION UNIT TESTS ===\n')

// ----------------------------------------------------------------------------
// 1. Slug Validation Tests
// ----------------------------------------------------------------------------
console.log('--- 1. Testing validateLibrarySlug ---')

const slugGoodCases = [
  'entrepreneurship-masterclass',
  'how-to-build-a-business-in-2026',
  'abc',
  'a-1-b-2',
  'slug-with-numbers-12345',
]

const slugBadCases = [
  { input: '', desc: 'empty string' },
  { input: '   ', desc: 'whitespace string' },
  { input: 'ab', desc: 'too short (<3 chars)' },
  { input: 'a'.repeat(81), desc: 'too long (>80 chars)' },
  { input: 'slug_with_underscores', desc: 'contains underscores' },
  { input: 'slug-with-Capital', desc: 'contains uppercase' },
  { input: 'slug--double-hyphen', desc: 'consecutive hyphens' },
  { input: '-leading-hyphen', desc: 'leading hyphen' },
  { input: 'trailing-hyphen-', desc: 'trailing hyphen' },
  { input: null, desc: 'null' },
  { input: undefined, desc: 'undefined' },
  { input: 12345, desc: 'number' },
]

for (const input of slugGoodCases) {
  const res = validateLibrarySlug(input)
  assert.equal(res.valid, true, `Expected "${input}" to be valid`)
  console.log(`  PASS: good slug "${input}" => valid`)
}

for (const { input, desc } of slugBadCases) {
  const res = validateLibrarySlug(input)
  assert.equal(res.valid, false, `Expected bad slug (${desc}) to be invalid`)
  console.log(`  PASS: bad slug (${desc}) rejected => error: "${res.error}"`)
}

// ----------------------------------------------------------------------------
// 2. Video URL Validation Tests
// ----------------------------------------------------------------------------
console.log('\n--- 2. Testing validateLibraryVideoUrl ---')

const videoGoodCases = [
  { input: null, expectedValue: null, desc: 'null clears video_url' },
  { input: '', expectedValue: null, desc: 'empty string clears video_url' },
  { input: '   ', expectedValue: null, desc: 'whitespace clears video_url' },
  { input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expectedValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'www.youtube.com' },
  { input: 'https://youtube.com/watch?v=dQw4w9WgXcQ', expectedValue: 'https://youtube.com/watch?v=dQw4w9WgXcQ', desc: 'youtube.com' },
  { input: 'https://youtu.be/dQw4w9WgXcQ', expectedValue: 'https://youtu.be/dQw4w9WgXcQ', desc: 'youtu.be' },
  { input: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ', expectedValue: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'm.youtube.com' },
]

const videoBadCases = [
  { input: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'http instead of https' },
  { input: 'https://vimeo.com/123456', desc: 'vimeo.com (not YouTube)' },
  { input: 'https://evil-youtube.com/video', desc: 'spoofed host' },
  { input: 'not-a-valid-url', desc: 'invalid URL syntax' },
  { input: 'javascript:alert(1)', desc: 'javascript scheme' },
  { input: 'https://localhost/watch?v=1', desc: 'localhost URL' },
  { input: 'https://127.0.0.1/watch?v=1', desc: 'private IP literal' },
  { input: 123456, desc: 'number instead of string' },
]

for (const { input, expectedValue, desc } of videoGoodCases) {
  const res = await validateLibraryVideoUrl(input)
  assert.equal(res.valid, true, `Expected video url (${desc}) to be valid`)
  assert.equal(res.value, expectedValue, `Expected value ${expectedValue}`)
  console.log(`  PASS: good video URL (${desc}) => valid`)
}

for (const { input, desc } of videoBadCases) {
  const res = await validateLibraryVideoUrl(input)
  assert.equal(res.valid, false, `Expected bad video url (${desc}) to be invalid`)
  console.log(`  PASS: bad video URL (${desc}) rejected => error: "${res.error}"`)
}

// ----------------------------------------------------------------------------
// 3. Links Validation Tests
// ----------------------------------------------------------------------------
console.log('\n--- 3. Testing validateLibraryLinks ---')

const linksGoodCases = [
  {
    desc: 'empty links array',
    input: [],
  },
  {
    desc: 'single valid Spotify link with label',
    input: [
      {
        type: 'spotify',
        url: 'https://open.spotify.com/episode/abc123',
        label: 'Listen on Spotify',
      },
    ],
  },
  {
    desc: 'multiple valid links (Audible and Book)',
    input: [
      {
        type: 'audible',
        url: 'https://www.audible.com/pd/B0000000',
        label: 'Audiobook edition',
      },
      {
        type: 'book',
        url: 'https://www.amazon.com/dp/1234567890',
      },
    ],
  },
  {
    desc: 'all 6 types covered up to 6 links',
    input: [
      { type: 'book', url: 'https://books.google.com/1' },
      { type: 'audible', url: 'https://audible.com/2' },
      { type: 'spotify', url: 'https://spotify.com/3' },
      { type: 'apple_podcasts', url: 'https://podcasts.apple.com/4' },
      { type: 'youtube', url: 'https://youtube.com/5' },
      { type: 'website', url: 'https://example.com/6' },
    ],
  },
]

const linksBadCases = [
  { input: 'not an array', desc: 'string instead of array' },
  { input: null, desc: 'null' },
  {
    input: new Array(9).fill({ type: 'website', url: 'https://example.com' }),
    desc: 'more than 8 links (length 9)',
  },
  {
    input: [{ type: 'unknown_service', url: 'https://example.com' }],
    desc: 'disallowed link type',
  },
  {
    input: [{ type: 'book', url: '' }],
    desc: 'empty url',
  },
  {
    input: [{ type: 'audible', url: 'http://www.audible.com/item' }],
    desc: 'http protocol (not https)',
  },
  {
    input: [{ type: 'spotify', url: 'ftp://spotify.com' }],
    desc: 'ftp protocol',
  },
  {
    input: [
      {
        type: 'website',
        url: 'https://example.com',
        label: 'A'.repeat(61),
      },
    ],
    desc: 'label exceeding 60 characters',
  },
  {
    input: ['not an object'],
    desc: 'element is string not object',
  },
  {
    input: [{ type: 'website', url: 'https://127.0.0.1/secret' }],
    desc: 'loopback / SSRF blocked url',
  },
]

for (const { input, desc } of linksGoodCases) {
  const res = await validateLibraryLinks(input)
  assert.equal(res.valid, true, `Expected links (${desc}) to be valid`)
  console.log(`  PASS: good links (${desc}) => valid count ${res.value.length}`)
}

for (const { input, desc } of linksBadCases) {
  const res = await validateLibraryLinks(input)
  assert.equal(res.valid, false, `Expected bad links (${desc}) to be invalid`)
  console.log(`  PASS: bad links (${desc}) rejected => error: "${res.error}"`)
}

console.log('\n========================================')
console.log('ALL LIBRARY VALIDATION TESTS PASSED!')
console.log('========================================')

