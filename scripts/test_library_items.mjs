import assert from 'node:assert/strict'
import {
  PUBLIC_LIBRARY_COLUMNS,
  SLUG_REGEX,
  getPublishedTake,
  getLibraryNeighbours,
} from '../lib/libraryItems.ts'

console.log('=== LIBRARY ITEMS UNIT TESTS ===\n')

// ----------------------------------------------------------------------------
// (a) PUBLIC_LIBRARY_COLUMNS verification
// ----------------------------------------------------------------------------
console.log('--- (a) PUBLIC_LIBRARY_COLUMNS test ---')
const expectedCols = [
  'id',
  'title',
  'creator',
  'type',
  'url',
  'thumbnail_url',
  'recommendation_note',
  'created_at',
  'slug',
  'links',
  'video_url',
  'take_published',
]

const actualCols = PUBLIC_LIBRARY_COLUMNS.split(',').map((c) => c.trim())
assert.deepEqual(
  actualCols,
  expectedCols,
  'Expected columns to exactly match 12 allowed columns'
)
assert.equal(actualCols.length, 12, 'Must have exactly 12 columns')

// Assert "take" alone is never present
assert.equal(actualCols.includes('take'), false, '"take" must not be in public columns')
assert.equal(
  PUBLIC_LIBRARY_COLUMNS.includes('take,'),
  false,
  '"take," must not be in public columns string'
)
assert.equal(
  PUBLIC_LIBRARY_COLUMNS.includes('take '),
  false,
  '"take " must not be in public columns string'
)
console.log('  PASS: PUBLIC_LIBRARY_COLUMNS matches 12 allowed columns and contains no public "take"')

// ----------------------------------------------------------------------------
// (b) getPublishedTake never calls admin client when take_published is false / falsy
// ----------------------------------------------------------------------------
console.log('\n--- (b) getPublishedTake falsy take_published test ---')
let adminCallCount = 0
const mockAdminClient = {
  from: () => {
    adminCallCount++
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { take: { type: 'doc', content: [{ type: 'paragraph', text: 'secret take' }] } },
            error: null,
          }),
        }),
      }),
    }
  },
}

const falsyCases = [false, null, undefined, 0, '']
for (const val of falsyCases) {
  // @ts-expect-error test falsy inputs
  const result = await getPublishedTake('test-id', val, mockAdminClient)
  assert.equal(result, null, `Expected null when take_published is ${val}`)
}
assert.equal(
  adminCallCount,
  0,
  `Admin client must never be called when take_published is falsy (called ${adminCallCount} times)`
)
console.log('  PASS: Admin client was never called for any falsy take_published value')

// ----------------------------------------------------------------------------
// (c) getPublishedTake returns null for a null or empty document
// ----------------------------------------------------------------------------
console.log('\n--- (c) getPublishedTake null / empty document test ---')
const emptyDocs = [
  null,
  undefined,
  {},
  { type: 'doc' },
  { type: 'doc', content: [] },
  { type: 'doc', content: [{ type: 'paragraph' }] },
  { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '   ' }] }] },
]

for (const emptyDoc of emptyDocs) {
  const mockClient = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: { take: emptyDoc }, error: null }),
        }),
      }),
    }),
  }
  const res = await getPublishedTake('test-id', true, mockClient)
  assert.equal(res, null, `Expected null for empty doc: ${JSON.stringify(emptyDoc)}`)
}

// Test with a non-empty document returns the document
const validDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'This is a valid published take.' }],
    },
  ],
}
const mockValidClient = {
  from: () => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: { take: validDoc }, error: null }),
      }),
    }),
  }),
}
const validRes = await getPublishedTake('test-id', true, mockValidClient)
assert.deepEqual(validRes, validDoc, 'Expected valid document to be returned')
console.log('  PASS: getPublishedTake returns null for null/empty docs and returns valid docs')

// ----------------------------------------------------------------------------
// (d) slug regex tests
// ----------------------------------------------------------------------------
console.log('\n--- (d) slug regex tests ---')
assert.equal(SLUG_REGEX.test('../x'), false, 'Rejects "../x"')
assert.equal(SLUG_REGEX.test('A'), false, 'Rejects "A"')
assert.equal(SLUG_REGEX.test('a_b'), false, 'Rejects "a_b"')
assert.equal(SLUG_REGEX.test(''), false, 'Rejects ""')
assert.equal(SLUG_REGEX.test('feel-good-productivity'), true, 'Accepts "feel-good-productivity"')

console.log('  PASS: slug regex correctly rejects "../x", "A", "a_b", "" and accepts "feel-good-productivity"')

// ----------------------------------------------------------------------------
// (e) getLibraryNeighbours tie-break & ordering tests
// ----------------------------------------------------------------------------
console.log('\n--- (e) getLibraryNeighbours identical created_at tie-break tests ---')
const fakeDb = [
  { id: 'book-02', slug: 'book-b', title: 'Book B', type: 'book', created_at: '2026-09-14T20:52:06.189Z' },
  { id: 'book-01', slug: 'book-a', title: 'Book A', type: 'book', created_at: '2026-09-14T20:52:06.189Z' },
  { id: 'book-03', slug: 'book-c', title: 'Book C', type: 'book', created_at: '2026-09-14T20:52:06.189Z' },
  { id: 'pod-01', slug: 'pod-a', title: 'Podcast A', type: 'podcast', created_at: '2026-09-14T20:52:06.189Z' },
]

const mockNeighboursClient = {
  from: (table) => {
    assert.equal(table, 'library_items')
    let filteredType = null
    const builder = {
      select: () => builder,
      eq: (col, val) => {
        if (col === 'type') filteredType = val
        return builder
      },
      not: () => builder,
      order: () => builder,
      then: (resolve) => {
        let result = fakeDb.filter((r) => !filteredType || r.type === filteredType)
        // Sort by created_at asc, id asc
        result.sort((a, b) => {
          if (a.created_at !== b.created_at) return a.created_at.localeCompare(b.created_at)
          return a.id.localeCompare(b.id)
        })
        return Promise.resolve({ data: result, error: null }).then(resolve)
      },
    }
    return builder
  },
}

// 1. First item has no prev, next is book-b
const firstRes = await getLibraryNeighbours({ id: 'book-01', type: 'book' }, mockNeighboursClient)
assert.equal(firstRes.prev, null, 'First item must have no previous item')
assert.notEqual(firstRes.next, null, 'First item must have a next item')
assert.equal(firstRes.next.slug, 'book-b', 'Next item must follow id tie-break order (book-b)')
console.log('  PASS: First item has no prev, next is book-b following id tie-break')

// 2. Middle item has prev book-a and next book-c
const middleRes = await getLibraryNeighbours({ id: 'book-02', type: 'book' }, mockNeighboursClient)
assert.notEqual(middleRes.prev, null, 'Middle item must have a previous item')
assert.equal(middleRes.prev.slug, 'book-a', 'Previous item must be book-a')
assert.notEqual(middleRes.next, null, 'Middle item must have a next item')
assert.equal(middleRes.next.slug, 'book-c', 'Next item must be book-c')
console.log('  PASS: Middle item has prev book-a and next book-c')

// 3. Last item has prev book-b, next is null
const lastRes = await getLibraryNeighbours({ id: 'book-03', type: 'book' }, mockNeighboursClient)
assert.notEqual(lastRes.prev, null, 'Last item must have a previous item')
assert.equal(lastRes.prev.slug, 'book-b', 'Previous item must be book-b')
assert.equal(lastRes.next, null, 'Last item must have no next item')
console.log('  PASS: Last item has prev book-b, next is null')

// 4. Other types (podcast) are skipped
const podRes = await getLibraryNeighbours({ id: 'pod-01', type: 'podcast' }, mockNeighboursClient)
assert.equal(podRes.prev, null, 'Only podcast item has no prev')
assert.equal(podRes.next, null, 'Only podcast item has no next')
console.log('  PASS: Podcast item sequence is isolated from books')

console.log('\n========================================')
console.log('ALL LIBRARY ITEMS TESTS PASSED!')
console.log('========================================')
