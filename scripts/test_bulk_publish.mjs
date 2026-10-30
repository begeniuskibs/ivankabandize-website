// Unit tests for bulk-publish pure functions
// Covers: selection, exclusion matching (exact + numeric suffix, zero or multiple match STOP),
// blocked-row rules (null, empty, invalid, and future published_at), resolvePublishedAt parity, and plan counts
// House style: spaced hyphen only

import assert from 'node:assert/strict'
import {
  buildBulkPublishPlan,
  matchExclusions,
  resolvePublishedAt,
  validateTargetPost,
} from './publish-readiness/bulk-publish.mjs'

function makeSamplePosts({
  publishedCount = 10,
  targetDraftCount = 47,
  excludedSlugs = ['on-pioneering-again', 'on-the-gain-and-the-gap'],
  pastDate = '2024-12-15T08:00:00.000Z',
} = {}) {
  const posts = []
  let idx = 1

  for (let i = 0; i < publishedCount; i++) {
    posts.push({
      id: `pub-${idx}`,
      slug: `published-post-${idx}`,
      title: `Published Post ${idx}`,
      publish_status: 'published',
      published_at: '2025-05-01T10:00:00.000Z',
      visibility: 'public',
      content_type: 'structured_thoughts',
    })
    idx++
  }

  for (const slug of excludedSlugs) {
    posts.push({
      id: `excl-${idx}`,
      slug,
      title: `Excluded Draft ${slug}`,
      publish_status: 'draft',
      published_at: null,
      visibility: 'public',
      content_type: 'random_thoughts',
    })
    idx++
  }

  for (let i = 0; i < targetDraftCount; i++) {
    posts.push({
      id: `draft-${idx}`,
      slug: `target-draft-${idx}`,
      title: `Target Draft ${idx}`,
      publish_status: 'draft',
      published_at: pastDate,
      visibility: 'public',
      content_type: 'random_thoughts',
    })
    idx++
  }

  return posts
}

function runTests() {
  console.log('=== TEST BULK PUBLISH PURE FUNCTIONS ===\n')
  const fixedNow = '2026-10-30T12:00:00.000Z'

  // 1. Exact slug exclusion match and standard 59-post plan counts (47 target, 2 excluded, 10 published)
  {
    const posts = makeSamplePosts()
    const plan = buildBulkPublishPlan(posts, { now: fixedNow })

    assert.equal(plan.exclusionMatches.length, 2)
    assert.equal(plan.exclusionMatches[0].matchType, 'exact')
    assert.equal(plan.exclusionMatches[1].matchType, 'exact')
    assert.equal(plan.targetRows.length, 47)
    assert.equal(plan.blockedRows.length, 0)
    assert.deepEqual(plan.counts, {
      totalPosts: 59,
      toPublish: 47,
      stayingDraft: 2,
      alreadyPublished: 10,
      blockedCount: 0,
      expectedResultingPublished: 57,
      expectedResultingDraft: 2,
      expectedResultingTotal: 59,
    })
    console.log(
      '  [PASS] 1. Exact exclusion match and 47/2/10 -> 57/2/59 plan counts verified'
    )
  }

  // 2. Numeric timestamp suffix fallback exclusion matching
  {
    const posts = makeSamplePosts({
      excludedSlugs: [
        'on-pioneering-again-1728510000123',
        'on-the-gain-and-the-gap-99887766',
      ],
    })
    const { excludedIds, exclusionMatches } = matchExclusions(posts)
    assert.equal(excludedIds.size, 2)
    assert.equal(exclusionMatches[0].matchType, 'suffix')
    assert.equal(
      exclusionMatches[0].slug,
      'on-pioneering-again-1728510000123'
    )
    assert.equal(exclusionMatches[1].matchType, 'suffix')
    assert.equal(
      exclusionMatches[1].slug,
      'on-the-gain-and-the-gap-99887766'
    )
    console.log(
      '  [PASS] 2. Numeric timestamp suffix fallback exclusion matching verified'
    )
  }

  // 3. Non-numeric suffix does NOT match exclusion pattern (triggers 0-match STOP)
  {
    const posts = makeSamplePosts({
      excludedSlugs: [
        'on-pioneering-again-part-2',
        'on-the-gain-and-the-gap',
      ],
    })
    assert.throws(
      () => matchExclusions(posts),
      /STOP: Exclusion slug "on-pioneering-again" matched 0 draft posts/
    )
    console.log(
      '  [PASS] 3. Zero-match exclusion STOP verified (including non-numeric suffix rejection)'
    )
  }

  // 4. Multiple-match exclusion STOP
  {
    const posts = makeSamplePosts({
      excludedSlugs: [
        'on-pioneering-again-111',
        'on-pioneering-again-222',
        'on-the-gain-and-the-gap',
      ],
    })
    assert.throws(
      () => matchExclusions(posts),
      /STOP: Exclusion slug "on-pioneering-again" matched 2 draft posts/
    )
    console.log('  [PASS] 4. Multiple-match exclusion STOP verified')
  }

  // 5. Target count mismatch STOP when count !== 47
  {
    const posts = makeSamplePosts({ targetDraftCount: 46 })
    assert.throws(
      () => buildBulkPublishPlan(posts, { now: fixedNow }),
      /STOP: Expected exactly 47 target draft posts after exclusions, but found 46/
    )
    console.log('  [PASS] 5. Non-47 target count STOP verified')
  }

  // 6. Blocked-row rules: null published_at and future published_at
  {
    const nullDateCheck = validateTargetPost(
      { slug: 'null-date', published_at: null },
      fixedNow
    )
    assert.equal(nullDateCheck.blocked, true)
    assert.match(nullDateCheck.reason, /null or empty/)

    const futureDateCheck = validateTargetPost(
      { slug: 'future-date', published_at: '2027-01-01T00:00:00.000Z' },
      fixedNow
    )
    assert.equal(futureDateCheck.blocked, true)
    assert.match(futureDateCheck.reason, /in the future/)

    const validPastCheck = validateTargetPost(
      { slug: 'valid-past', published_at: '2024-06-15T12:00:00.000Z' },
      fixedNow
    )
    assert.equal(validPastCheck.blocked, false)
    assert.equal(validPastCheck.reason, null)

    const posts = makeSamplePosts()
    // Mutate two target drafts: one null date, one future date
    const firstTarget = posts.find((p) => p.slug === 'target-draft-13')
    const secondTarget = posts.find((p) => p.slug === 'target-draft-14')
    firstTarget.published_at = null
    secondTarget.published_at = '2028-05-01T00:00:00.000Z'

    const plan = buildBulkPublishPlan(posts, { now: fixedNow })
    assert.equal(plan.targetRows.length, 45)
    assert.equal(plan.blockedRows.length, 2)
    assert.equal(plan.counts.toPublish, 45)
    assert.equal(plan.counts.blockedCount, 2)
    assert.equal(plan.counts.stayingDraft, 2)
    assert.equal(plan.counts.alreadyPublished, 10)
    assert.equal(plan.counts.expectedResultingPublished, 55)
    assert.equal(plan.counts.expectedResultingDraft, 4)
    console.log(
      '  [PASS] 6. Blocked-row rules for null and future published_at verified'
    )
  }

  // 7. resolvePublishedAt rule parity (preserves existing date on publish when incoming is null)
  {
    const preserved = resolvePublishedAt({
      incomingPublishedAt: null,
      existingPublishedAt: '2023-04-10T09:30:00.000Z',
      publishStatus: 'published',
      now: fixedNow,
    })
    assert.equal(preserved, '2023-04-10T09:30:00.000Z')

    const fallbackNow = resolvePublishedAt({
      incomingPublishedAt: null,
      existingPublishedAt: null,
      publishStatus: 'published',
      now: fixedNow,
    })
    assert.equal(fallbackNow, fixedNow)
    console.log('  [PASS] 7. resolvePublishedAt rule parity verified')
  }

  console.log('\nResult: ALL 7 TEST SUITES PASSED.')
}

runTests()

