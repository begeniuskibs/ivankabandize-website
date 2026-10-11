import assert from 'node:assert'
import {
  sanitizeSearchQuery,
  mapStreamLabel,
  formatSearchExcerpt,
  mapPostToSearchResult,
} from '../lib/search.ts'

console.log('Running search pure helper tests...')

// 1. sanitizeSearchQuery
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

// 2. mapStreamLabel
assert.strictEqual(mapStreamLabel('random_thoughts'), 'Random Thoughts')
assert.strictEqual(mapStreamLabel('structured_thoughts'), 'Structured Thoughts')
assert.strictEqual(mapStreamLabel('tools_for_thought'), 'Tools for Thought')
assert.strictEqual(mapStreamLabel('unknown'), 'The Garden')
assert.strictEqual(mapStreamLabel(null), 'The Garden')
assert.strictEqual(mapStreamLabel(undefined), 'The Garden')

// 3. formatSearchExcerpt
assert.strictEqual(formatSearchExcerpt('  line 1 \n  line 2   '), 'line 1 line 2', 'Collapses whitespace')
assert.strictEqual(formatSearchExcerpt(null), '', 'Null excerpt returns empty')

// 4. mapPostToSearchResult
const sampleRow = {
  id: 'abc-123',
  title: '  The AI You Already Use.  ',
  slug: 'the-ai-you-already-use',
  content_type: 'tools_for_thought',
  published_at: '2025-12-27T03:00:00+00:00',
  excerpt: '  An introduction to pragmatic AI tools.  ',
  publish_status: 'published',
  extra_sensitive_field: 'should not leak',
}

const mapped = mapPostToSearchResult(sampleRow)
assert.deepStrictEqual(mapped, {
  title: 'The AI You Already Use.',
  slug: 'the-ai-you-already-use',
  stream: 'Tools for Thought',
  published_at: '2025-12-27T03:00:00+00:00',
  excerpt: 'An introduction to pragmatic AI tools.',
})
assert.strictEqual(mapped.extra_sensitive_field, undefined, 'Does not leak unneeded fields')

console.log('✔ All search helper tests passed successfully!')
