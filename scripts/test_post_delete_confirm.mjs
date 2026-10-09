// Unit tests for post deletion confirmation logic (slug-match gating)
import { isDeleteConfirmationValid } from '../lib/postDelete.ts'

console.log('=== TEST SUITE: Post Delete Confirmation Gating ===\n')

const testCases = [
  // 1. Draft posts: simple confirmation, no slug matching required
  {
    status: 'draft',
    expectedSlug: 'sample-draft-post',
    typedSlug: '',
    expectedResult: true,
    desc: 'Draft with empty typed input enables delete',
  },
  {
    status: 'draft',
    expectedSlug: 'sample-draft-post',
    typedSlug: 'random-text',
    expectedResult: true,
    desc: 'Draft with random typed input enables delete',
  },
  {
    status: 'draft',
    expectedSlug: 'sample-draft-post',
    typedSlug: 'sample-draft-post',
    expectedResult: true,
    desc: 'Draft with matching slug enables delete',
  },

  // 2. Published posts: require typing exact post slug
  {
    status: 'published',
    expectedSlug: 'systems-over-goals',
    typedSlug: '',
    expectedResult: false,
    desc: 'Published post with empty input blocks delete',
  },
  {
    status: 'published',
    expectedSlug: 'systems-over-goals',
    typedSlug: 'systems',
    expectedResult: false,
    desc: 'Published post with partial slug blocks delete',
  },
  {
    status: 'published',
    expectedSlug: 'systems-over-goals',
    typedSlug: 'systems-over-goals-wrong',
    expectedResult: false,
    desc: 'Published post with incorrect slug blocks delete',
  },
  {
    status: 'published',
    expectedSlug: 'systems-over-goals',
    typedSlug: 'systems-over-goals',
    expectedResult: true,
    desc: 'Published post with exact slug enables delete',
  },
  {
    status: 'published',
    expectedSlug: 'systems-over-goals',
    typedSlug: '  systems-over-goals  ',
    expectedResult: true,
    desc: 'Published post with trimmed slug enables delete',
  },

  // 3. Scheduled posts: require typing exact post slug
  {
    status: 'scheduled',
    expectedSlug: 'future-scheduled-announcement',
    typedSlug: '',
    expectedResult: false,
    desc: 'Scheduled post with empty input blocks delete',
  },
  {
    status: 'scheduled',
    expectedSlug: 'future-scheduled-announcement',
    typedSlug: 'future-scheduled',
    expectedResult: false,
    desc: 'Scheduled post with partial slug blocks delete',
  },
  {
    status: 'scheduled',
    expectedSlug: 'future-scheduled-announcement',
    typedSlug: 'future-scheduled-announcement',
    expectedResult: true,
    desc: 'Scheduled post with exact slug enables delete',
  },

  // 4. Edge cases
  {
    status: 'published',
    expectedSlug: '',
    typedSlug: '',
    expectedResult: false,
    desc: 'Published post with empty expectedSlug blocks delete',
  },
  {
    status: 'draft',
    expectedSlug: '',
    typedSlug: '',
    expectedResult: true,
    desc: 'Draft post with empty expectedSlug allows delete',
  },
]

let passed = 0
let failed = 0

for (const tc of testCases) {
  const result = isDeleteConfirmationValid(tc.status, tc.expectedSlug, tc.typedSlug)
  const isOk = result === tc.expectedResult
  if (isOk) {
    passed++
    console.log(`[PASS] ${tc.desc}`)
    console.log(`       Status: ${tc.status} | Expected: "${tc.expectedSlug}" | Typed: "${tc.typedSlug}" -> ${result}`)
  } else {
    failed++
    console.error(`[FAIL] ${tc.desc}`)
    console.error(`       Status: ${tc.status} | Expected: "${tc.expectedSlug}" | Typed: "${tc.typedSlug}" -> Result: ${result}, Expected: ${tc.expectedResult}`)
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed.\n`)

if (failed > 0) {
  process.exit(1)
}
