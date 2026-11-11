import assert from 'node:assert/strict'
import {
  validateLibraryTake,
  isTakeDocEmpty,
  MAX_TAKE_SIZE_BYTES,
} from '../lib/libraryTake.ts'

console.log('=== LIBRARY TAKE UNIT TESTS ===\n')

// ----------------------------------------------------------------------------
// 1. null / undefined clears take
// ----------------------------------------------------------------------------
console.log('--- 1. Testing null and undefined inputs ---')
const nullRes = validateLibraryTake(null)
assert.equal(nullRes.valid, true, 'null input must be valid')
assert.equal(nullRes.value, null, 'null input must produce null value')
assert.equal(nullRes.isEmpty, true, 'null input must be marked as empty')
console.log('  PASS: null successfully clears take')

const undefRes = validateLibraryTake(undefined)
assert.equal(undefRes.valid, true, 'undefined input must be valid')
assert.equal(undefRes.value, null, 'undefined input must produce null value')
assert.equal(undefRes.isEmpty, true, 'undefined input must be marked as empty')
console.log('  PASS: undefined successfully clears take')

// ----------------------------------------------------------------------------
// 2. Empty documents
// ----------------------------------------------------------------------------
console.log('\n--- 2. Testing empty documents ---')
const emptyDocs = [
  { type: 'doc', content: [] },
  { type: 'doc', content: [{ type: 'paragraph' }] },
  { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: '   ' }] }] },
  {
    type: 'doc',
    content: [
      { type: 'paragraph', content: [{ type: 'text', text: '' }] },
      { type: 'paragraph' },
    ],
  },
]

for (const doc of emptyDocs) {
  const res = validateLibraryTake(doc)
  assert.equal(res.valid, true, 'Empty doc structure must be valid')
  assert.equal(res.isEmpty, true, 'Empty doc must be marked as isEmpty: true')
  assert.equal(isTakeDocEmpty(doc), true, 'isTakeDocEmpty must return true')
  console.log(`  PASS: empty doc recognized (${JSON.stringify(doc).slice(0, 40)}...)`)
}

// ----------------------------------------------------------------------------
// 3. Valid non-empty documents
// ----------------------------------------------------------------------------
console.log('\n--- 3. Testing valid non-empty documents ---')
const validDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'This is my personal take on the book.' }],
    },
  ],
}

const validRes = validateLibraryTake(validDoc)
assert.equal(validRes.valid, true, 'Valid doc must be valid')
assert.equal(validRes.isEmpty, false, 'Valid doc must not be empty')
assert.equal(isTakeDocEmpty(validDoc), false, 'isTakeDocEmpty must return false')
assert.deepEqual(validRes.value, validDoc, 'Validated value must equal input doc')
console.log('  PASS: valid doc validated successfully')

// ----------------------------------------------------------------------------
// 4. Invalid shapes rejected
// ----------------------------------------------------------------------------
console.log('\n--- 4. Testing invalid shapes rejection ---')
const badShapes = [
  { input: 'string doc', desc: 'string' },
  { input: 12345, desc: 'number' },
  { input: true, desc: 'boolean' },
  { input: [], desc: 'array' },
  { input: {}, desc: 'empty object' },
  { input: { type: 'paragraph', content: [] }, desc: 'type is not doc' },
  { input: { type: 'doc', content: 'not-array' }, desc: 'content is not array' },
  { input: { type: 'doc' }, desc: 'missing content' },
]

for (const { input, desc } of badShapes) {
  const res = validateLibraryTake(input)
  assert.equal(res.valid, false, `Expected invalid shape (${desc}) to be rejected`)
  assert.ok(res.error, `Expected an error message for (${desc})`)
  console.log(`  PASS: rejected bad shape (${desc}) => "${res.error}"`)
}

// ----------------------------------------------------------------------------
// 5. Size limit (200 KB)
// ----------------------------------------------------------------------------
console.log('\n--- 5. Testing 200 KB size limit ---')
// Create an oversized doc (> 200 KB)
const largeText = 'A'.repeat(MAX_TAKE_SIZE_BYTES + 1000)
const oversizedDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: largeText }],
    },
  ],
}

const overRes = validateLibraryTake(oversizedDoc)
assert.equal(overRes.valid, false, 'Oversized doc must be rejected')
assert.match(overRes.error || '', /200 KB/, 'Error message must mention 200 KB limit')
console.log(`  PASS: oversized doc rejected => "${overRes.error}"`)

// Doc under 200 KB is accepted
const mediumText = 'B'.repeat(50 * 1024)
const allowedDoc = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: mediumText }],
    },
  ],
}
const underRes = validateLibraryTake(allowedDoc)
assert.equal(underRes.valid, true, 'Doc under 200 KB must be accepted')
console.log('  PASS: doc within size limit is accepted')

// ----------------------------------------------------------------------------
// 6. Publishing empty take rule
// ----------------------------------------------------------------------------
console.log('\n--- 6. Testing publishing empty take rule ---')
// Simulates the API route validation rule for take_published = true
function evaluatePublishRule(takeInput, existingStoredTake) {
  let isEffectiveTakeEmpty = null
  if (takeInput !== undefined) {
    const check = validateLibraryTake(takeInput)
    if (!check.valid) return { ok: false, error: check.error }
    isEffectiveTakeEmpty = check.isEmpty ?? isTakeDocEmpty(check.value)
  }

  // If publishing requested (take_published: true)
  if (takeInput !== undefined) {
    if (isEffectiveTakeEmpty) {
      return { ok: false, error: 'Add your take before publishing it.' }
    }
  } else {
    if (!existingStoredTake || isTakeDocEmpty(existingStoredTake)) {
      return { ok: false, error: 'Add your take before publishing it.' }
    }
  }
  return { ok: true }
}

// (a) Publish with null take => rejected
const pubNull = evaluatePublishRule(null, null)
assert.equal(pubNull.ok, false)
assert.equal(pubNull.error, 'Add your take before publishing it.')
console.log('  PASS: publishing with null take is rejected with 400 error')

// (b) Publish with empty doc => rejected
const pubEmpty = evaluatePublishRule({ type: 'doc', content: [] }, null)
assert.equal(pubEmpty.ok, false)
assert.equal(pubEmpty.error, 'Add your take before publishing it.')
console.log('  PASS: publishing with empty doc is rejected with 400 error')

// (c) Publish without take in request, but DB has empty take => rejected
const pubNoTakeEmptyDb = evaluatePublishRule(undefined, null)
assert.equal(pubNoTakeEmptyDb.ok, false)
assert.equal(pubNoTakeEmptyDb.error, 'Add your take before publishing it.')
console.log('  PASS: publishing when existing stored take is null is rejected')

// (d) Publish with valid take => accepted
const pubValid = evaluatePublishRule(validDoc, null)
assert.equal(pubValid.ok, true)
console.log('  PASS: publishing with valid take is accepted')

// (e) Publish without take in request, but DB has valid take => accepted
const pubNoTakeValidDb = evaluatePublishRule(undefined, validDoc)
assert.equal(pubNoTakeValidDb.ok, true)
console.log('  PASS: publishing when existing stored take is valid is accepted')

console.log('\n========================================')
console.log('ALL LIBRARY TAKE TESTS PASSED!')
console.log('========================================')
