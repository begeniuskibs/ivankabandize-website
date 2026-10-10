// scripts/test_retag.mjs
// Offline test suite for topic retagging mapping, idempotency, and non-destructive tag rules.

import assert from 'node:assert'
import {
  TOPIC_TAG_MAPPING,
  validateMapping,
  computeRetagPlan,
  formatTable,
  STREAM_LABELS,
} from './retag/apply-topic-tags.mjs'

console.log('='.repeat(80))
console.log('TEST SUITE: TOPIC RETAG UNIT TESTS')
console.log('='.repeat(80))

// ----------------------------------------------------------------------------
// TEST 1: Mapping integrity (no duplicate slugs, every slug appears once)
// ----------------------------------------------------------------------------
console.log('\nTest 1: Mapping integrity and uniqueness')
{
  const result = validateMapping(TOPIC_TAG_MAPPING)
  console.log(`  Total slugs in mapping: ${result.totalSlugs}`)
  console.log(`  Tagged slugs count:     ${result.taggedSlugs}`)
  console.log(`  Tag categories:         ${result.tagCategories.join(', ')}`)

  assert.strictEqual(result.totalSlugs, 37, 'Total slugs in mapping should be 37')
  assert.strictEqual(result.taggedSlugs, 34, 'Tagged slugs should be 34')

  // Verify specific counts per category
  const slugsByTag = {
    Leadership: [],
    Productivity: [],
    Business: [],
    Faith: [],
    'Life and Character': [],
    untagged: [],
  }

  for (const [slug, tags] of Object.entries(TOPIC_TAG_MAPPING)) {
    if (tags.length === 0) {
      slugsByTag.untagged.push(slug)
    } else {
      for (const t of tags) {
        if (!slugsByTag[t]) slugsByTag[t] = []
        slugsByTag[t].push(slug)
      }
    }
  }

  assert.strictEqual(slugsByTag.Leadership.length, 15, 'Leadership must have 15 slugs')
  assert.strictEqual(slugsByTag.Productivity.length, 8, 'Productivity must have 8 slugs')
  assert.strictEqual(slugsByTag.Business.length, 2, 'Business must have 2 slugs')
  assert.strictEqual(slugsByTag.Faith.length, 3, 'Faith must have 3 slugs')
  assert.strictEqual(slugsByTag['Life and Character'].length, 6, 'Life and Character must have 6 slugs')
  assert.strictEqual(slugsByTag.untagged.length, 3, 'Untagged must have 3 slugs')

  // Verify untagged slugs match prompt exactly
  assert.deepStrictEqual(
    slugsByTag.untagged.sort(),
    ['did-it-count', 'people-and-places', 'the-feeling-of-i'].sort(),
    'Untagged slugs must match specified list'
  )

  // Verify pairwise disjointness between all tag categories
  const categories = Object.keys(slugsByTag)
  for (let i = 0; i < categories.length; i++) {
    for (let j = i + 1; j < categories.length; j++) {
      const catA = categories[i]
      const catB = categories[j]
      const intersection = slugsByTag[catA].filter((s) => slugsByTag[catB].includes(s))
      assert.strictEqual(
        intersection.length,
        0,
        `Categories "${catA}" and "${catB}" must share no slugs. Found duplicate: ${intersection.join(', ')}`
      )
    }
  }

  console.log('  PASS: All 37 slugs are unique and mutually disjoint across categories.')
}

// ----------------------------------------------------------------------------
// TEST 2: Existing tags untouched rule (Additive only)
// ----------------------------------------------------------------------------
console.log('\nTest 2: Existing tags untouched rule (Additive only)')
{
  const mockTags = [
    { id: 'tag-1', name: 'Artificial Intelligence', slug: 'artificial-intelligence' },
    { id: 'tag-2', name: 'Leadership', slug: 'leadership' },
    { id: 'tag-3', name: 'Technology', slug: 'technology' },
  ]

  const mockPosts = [
    {
      id: 'post-101',
      slug: 'get-in-the-right-room',
      title: 'Get In The Right Room',
      content_type: 'random_thoughts',
      publish_status: 'published',
    },
  ]

  // Post initially has tags Artificial Intelligence and Technology
  const mockPostTags = [
    { id: 'pt-1', post_id: 'post-101', tag_id: 'tag-1' },
    { id: 'pt-2', post_id: 'post-101', tag_id: 'tag-3' },
  ]

  const plan = computeRetagPlan({
    posts: mockPosts,
    tags: mockTags,
    postTags: mockPostTags,
    mapping: { 'get-in-the-right-room': ['Leadership'] },
  })

  assert.strictEqual(plan.matchedPosts.length, 1)
  const item = plan.matchedPosts[0]

  console.log(`  Initial tags:    ${item.existingTags.join(', ')}`)
  console.log(`  Tags to add:     ${item.tagsToAdd.join(', ')}`)
  console.log(`  Final tags:      ${item.finalTags.join(', ')}`)

  // Pre-existing tags MUST be present in finalTags
  assert.ok(item.finalTags.includes('Artificial Intelligence'), 'Artificial Intelligence must remain')
  assert.ok(item.finalTags.includes('Technology'), 'Technology must remain')
  assert.ok(item.finalTags.includes('Leadership'), 'Leadership must be added')
  assert.strictEqual(item.finalTags.length, 3, 'Must have exactly 3 tags')
  assert.strictEqual(plan.pairsToAdd.length, 1)
  assert.strictEqual(plan.pairsToAdd[0].tag_name, 'Leadership')

  console.log('  PASS: Existing tags are preserved untouched and new tag is added.')
}

// ----------------------------------------------------------------------------
// TEST 3: Idempotency logic (Second run does nothing)
// ----------------------------------------------------------------------------
console.log('\nTest 3: Idempotency logic')
{
  const mockTags = [
    { id: 'tag-1', name: 'Leadership', slug: 'leadership' },
    { id: 'tag-2', name: 'Productivity', slug: 'productivity' },
  ]

  const mockPosts = [
    {
      id: 'post-1',
      slug: 'get-in-the-right-room',
      title: 'Get In The Right Room',
      content_type: 'random_thoughts',
      publish_status: 'published',
    },
    {
      id: 'post-2',
      slug: 'focusing-on-the-big-rocks',
      title: 'Focusing On The Big Rocks',
      content_type: 'random_thoughts',
      publish_status: 'published',
    },
    {
      id: 'post-3',
      slug: 'people-and-places',
      title: 'People and Places',
      content_type: 'random_thoughts',
      publish_status: 'published',
    },
  ]

  const mockMapping = {
    'get-in-the-right-room': ['Leadership'],
    'focusing-on-the-big-rocks': ['Productivity'],
    'people-and-places': [],
  }

  // Initial state: empty postTags
  let currentPostTags = []

  // First run: should produce 2 pairs to add
  const run1 = computeRetagPlan({
    posts: mockPosts,
    tags: mockTags,
    postTags: currentPostTags,
    mapping: mockMapping,
  })

  console.log(`  Run 1 pairs to add: ${run1.totalPairsToAdd} (Expected: 2)`)
  assert.strictEqual(run1.totalPairsToAdd, 2, 'Run 1 should add 2 pairs')

  // Simulate applying run 1
  let nextPtId = 1
  for (const pair of run1.pairsToAdd) {
    currentPostTags.push({
      id: `pt-${nextPtId++}`,
      post_id: pair.post_id,
      tag_id: pair.tag_id,
    })
  }

  // Second run: should produce 0 pairs to add
  const run2 = computeRetagPlan({
    posts: mockPosts,
    tags: mockTags,
    postTags: currentPostTags,
    mapping: mockMapping,
  })

  console.log(`  Run 2 pairs to add: ${run2.totalPairsToAdd} (Expected: 0)`)
  assert.strictEqual(run2.totalPairsToAdd, 0, 'Run 2 should add 0 pairs (idempotent)')
  for (const post of run2.matchedPosts) {
    assert.strictEqual(post.tagsToAdd.length, 0, `Post ${post.slug} should have no tags to add on run 2`)
  }

  console.log('  PASS: Second execution is strictly idempotent (0 additions).')
}

// ----------------------------------------------------------------------------
// TEST 4: Draft posts reported and not skipped
// ----------------------------------------------------------------------------
console.log('\nTest 4: Draft posts reported and not skipped')
{
  const mockTags = [{ id: 'tag-1', name: 'Leadership', slug: 'leadership' }]
  const mockPosts = [
    {
      id: 'post-draft-1',
      slug: 'get-in-the-right-room',
      title: 'Get In The Right Room',
      content_type: 'random_thoughts',
      publish_status: 'draft',
    },
  ]

  const plan = computeRetagPlan({
    posts: mockPosts,
    tags: mockTags,
    postTags: [],
    mapping: { 'get-in-the-right-room': ['Leadership'] },
  })

  assert.strictEqual(plan.matchedPosts.length, 1, 'Draft post should be in matchedPosts')
  assert.strictEqual(plan.draftPosts.length, 1, 'Draft post should be reported in draftPosts')
  assert.strictEqual(plan.draftPosts[0].slug, 'get-in-the-right-room')
  assert.strictEqual(plan.pairsToAdd.length, 1, 'Draft post should still receive planned tags')

  console.log('  PASS: Draft post is properly reported and not skipped.')
}

// ----------------------------------------------------------------------------
// TEST 5: Unmatched slugs reported
// ----------------------------------------------------------------------------
console.log('\nTest 5: Unmatched slugs reported')
{
  const plan = computeRetagPlan({
    posts: [],
    tags: [],
    postTags: [],
    mapping: { 'non-existent-slug': ['Leadership'] },
  })

  assert.strictEqual(plan.unmatchedSlugs.length, 1)
  assert.strictEqual(plan.unmatchedSlugs[0], 'non-existent-slug')

  console.log('  PASS: Unmatched slug reported cleanly.')
}

// ----------------------------------------------------------------------------
// TEST 6: Table formatting
// ----------------------------------------------------------------------------
console.log('\nTest 6: Table formatting')
{
  const mockMatched = [
    {
      slug: 'test-slug',
      title: 'Test Title',
      stream: 'Random Thoughts',
      existingTags: [],
      tagsToAdd: ['Leadership'],
      finalTags: ['Leadership'],
    },
  ]

  const tableStr = formatTable(mockMatched)
  assert.ok(tableStr.includes('test-slug'))
  assert.ok(tableStr.includes('Test Title'))
  assert.ok(tableStr.includes('Leadership'))
  console.log('  PASS: Table formatting produces expected table representation.')
}

console.log('\n' + '='.repeat(80))
console.log('ALL UNIT TESTS PASSED!')
console.log('='.repeat(80))
