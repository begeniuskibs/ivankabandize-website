// scripts/test_retag.mjs
// Offline test suite for topic retagging mapping, idempotency, non-destructive tag rules,
// pre-apply manifest structure, and zero-rows tag removal rule.

import assert from 'node:assert'
import {
  TOPIC_TAG_MAPPING,
  validateMapping,
  computeRetagPlan,
  formatTable,
  buildPreApplyManifest,
  canDeleteCreatedTag,
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

// ----------------------------------------------------------------------------
// TEST 7: Pre-apply manifest content validation
// ----------------------------------------------------------------------------
console.log('\nTest 7: Pre-apply manifest content validation')
{
  const mockPairsToAdd = [
    {
      post_id: 'uuid-post-1',
      post_slug: 'get-in-the-right-room',
      post_title: 'Get In The Right Room',
      tag_name: 'Leadership',
      tag_id: 'uuid-tag-1',
    },
    {
      post_id: 'uuid-post-2',
      post_slug: 'loving-giving-and-resilience-2',
      post_title: 'Loving, Giving, and Resilience',
      tag_name: 'Life and Character',
      tag_id: null,
    },
  ]

  const customTimestamp = '2026-10-10T16:30:00.000Z'
  const manifest = buildPreApplyManifest({
    pairsToAdd: mockPairsToAdd,
    willCreateTag: true,
    timestamp: customTimestamp,
  })

  console.log(`  Manifest timestamp:                    ${manifest.timestamp}`)
  console.log(`  willCreateLifeAndCharacterTag:         ${manifest.willCreateLifeAndCharacterTag}`)
  console.log(`  totalPlannedPairs:                     ${manifest.totalPlannedPairs}`)

  assert.strictEqual(manifest.timestamp, customTimestamp, 'Timestamp should match input')
  assert.strictEqual(manifest.willCreateLifeAndCharacterTag, true, 'willCreateTag should be true')
  assert.strictEqual(manifest.totalPlannedPairs, 2, 'Total planned pairs should be 2')
  assert.strictEqual(manifest.plannedPairs.length, 2, 'plannedPairs length should be 2')

  // Check structure of each item in plannedPairs: exactly (post_id, post_slug, tag_name)
  assert.deepStrictEqual(manifest.plannedPairs[0], {
    post_id: 'uuid-post-1',
    post_slug: 'get-in-the-right-room',
    tag_name: 'Leadership',
  })
  assert.deepStrictEqual(manifest.plannedPairs[1], {
    post_id: 'uuid-post-2',
    post_slug: 'loving-giving-and-resilience-2',
    tag_name: 'Life and Character',
  })

  // Test with willCreateTag = false
  const manifestNoCreate = buildPreApplyManifest({
    pairsToAdd: mockPairsToAdd,
    willCreateTag: false,
  })
  assert.strictEqual(manifestNoCreate.willCreateLifeAndCharacterTag, false)

  console.log('  PASS: Pre-apply manifest contains all required fields with exact shape.')
}

// ----------------------------------------------------------------------------
// TEST 8: Zero-rows rule for created tag deletion on restore
// ----------------------------------------------------------------------------
console.log('\nTest 8: Zero-rows rule for created tag deletion on restore')
{
  const tagId = 'tag-life-and-character-uuid'

  // Case 1: Flag not passed -> NEVER delete tag, regardless of row count
  assert.strictEqual(
    canDeleteCreatedTag({
      createdTagId: tagId,
      remainingPostTagsCount: 0,
      removeCreatedTagFlag: false,
    }),
    false,
    'Without --remove-created-tag flag, tag should NOT be deleted even with 0 remaining rows'
  )

  // Case 2: Flag passed, but createdTagId is null/absent -> do not delete
  assert.strictEqual(
    canDeleteCreatedTag({
      createdTagId: null,
      remainingPostTagsCount: 0,
      removeCreatedTagFlag: true,
    }),
    false,
    'Without createdTagId, should not delete tag'
  )

  // Case 3: Flag passed, but remaining rows > 0 (tag is used elsewhere) -> MUST NOT delete
  assert.strictEqual(
    canDeleteCreatedTag({
      createdTagId: tagId,
      remainingPostTagsCount: 3,
      removeCreatedTagFlag: true,
    }),
    false,
    'When remaining post_tags > 0, MUST NOT delete created tag'
  )
  assert.strictEqual(
    canDeleteCreatedTag({
      createdTagId: tagId,
      remainingPostTagsCount: 1,
      removeCreatedTagFlag: true,
    }),
    false,
    'When remaining post_tags == 1, MUST NOT delete created tag'
  )

  // Case 4: Flag passed, createdTagId present, AND remaining rows == 0 -> CAN delete tag
  assert.strictEqual(
    canDeleteCreatedTag({
      createdTagId: tagId,
      remainingPostTagsCount: 0,
      removeCreatedTagFlag: true,
    }),
    true,
    'When flag is set, tag ID is present, and remaining post_tags == 0, tag CAN be deleted'
  )

  console.log('  PASS: Zero-rows rule and flag guarding behave correctly across all scenarios.')
}

console.log('\n' + '='.repeat(80))
console.log('ALL UNIT TESTS PASSED!')
console.log('='.repeat(80))
