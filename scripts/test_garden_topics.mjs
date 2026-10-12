import assert from 'node:assert'
import { getSupabaseClient } from './storage-cleanup/trash-unreferenced.mjs'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function runTests() {
  console.log('=== TEST GARDEN TOPICS ROUTE & SECURITY ===\n')
  console.log(`Testing against target dev server: ${BASE_URL}\n`)

  const client = getSupabaseClient()

  // --------------------------------------------------------------------------
  // TEST (a): Valid topic slug returns 200 and lists only posts carrying that tag
  // --------------------------------------------------------------------------
  console.log('--- TEST (a): Valid topic slug returns 200 and lists only tagged posts ---')
  const validRes = await fetch(`${BASE_URL}/garden/topics/artificial-intelligence`)
  assert.strictEqual(validRes.status, 200, `Expected 200 for valid topic slug, got ${validRes.status}`)

  const validHtml = await validRes.text()
  assert(
    validHtml.includes('Artificial Intelligence'),
    'Topic page must display the tag name'
  )

  // In database, 'The Research That Changed Everything' and 'The AI You Already Use.' carry artificial-intelligence
  assert(
    validHtml.includes('The Research That Changed Everything') ||
      validHtml.includes('The AI You Already Use.'),
    'Topic page must contain posts tagged with artificial-intelligence'
  )

  // 'A First Step Prolonged' has no tags and must NOT appear on /garden/topics/artificial-intelligence
  assert(
    !validHtml.includes('A First Step Prolonged'),
    'Topic page must not list posts that do not carry this tag'
  )
  console.log('PASS (a): Valid topic slug returns 200 and lists only posts with that tag.\n')

  // --------------------------------------------------------------------------
  // TEST (b): Made-up slug returns 404 (and tag with zero published posts returns 404)
  // --------------------------------------------------------------------------
  console.log('--- TEST (b): Non-existent and zero-post topic slugs return 404 ---')
  const notFoundRes = await fetch(`${BASE_URL}/garden/topics/non-existent-topic-slug-xyz123`)
  assert.strictEqual(
    notFoundRes.status,
    404,
    `Expected 404 for made-up topic slug, got ${notFoundRes.status}`
  )

  // 'business' tag exists in database but has 0 published posts
  const zeroPostRes = await fetch(`${BASE_URL}/garden/topics/business`)
  assert.strictEqual(
    zeroPostRes.status,
    404,
    `Expected 404 for tag with zero published posts, got ${zeroPostRes.status}`
  )
  console.log('PASS (b): Made-up slug and zero-published-post slugs correctly return 404.\n')

  // --------------------------------------------------------------------------
  // TEST (c): Topic page with members-only post does not appear for anonymous visitors
  // --------------------------------------------------------------------------
  console.log('--- TEST (c): Members-only post on topic page is hidden from anonymous visitors ---')

  // 1. Initial count before creating temporary post
  const { count: countBefore, error: countBeforeErr } = await client
    .from('posts')
    .select('*', { count: 'exact', head: true })

  if (countBeforeErr) {
    throw new Error(`Failed to get initial post count: ${countBeforeErr.message}`)
  }

  console.log(`[test_garden_topics] Total posts count before test (c): ${countBefore}`)

  const testSlug = 'zz-test-members-only-topic-leak'
  const secretParagraph = 'TOPIC_TEST_SECRET_SECOND_PARAGRAPH_NEVER_LEAK_987654321'

  try {
    // 2. Lookup 'artificial-intelligence' tag ID
    const { data: tag, error: tagErr } = await client
      .from('tags')
      .select('id, name, slug')
      .eq('slug', 'artificial-intelligence')
      .single()

    if (tagErr || !tag) {
      throw new Error(`Failed to find artificial-intelligence tag: ${tagErr?.message}`)
    }

    // 3. Create temporary members-only test post
    const { data: post, error: insertErr } = await client
      .from('posts')
      .insert({
        title: 'Temporary Members-Only Topic Security Test Post',
        slug: testSlug,
        visibility: 'free',
        publish_status: 'published',
        published_at: new Date(Date.now() - 3600000).toISOString(),
        excerpt: 'Public teaser excerpt for security check.',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'First teaser paragraph visible to visitors.' }],
            },
            {
              type: 'paragraph',
              content: [{ type: 'text', text: secretParagraph }],
            },
          ],
        },
      })
      .select('id, title, slug')
      .single()

    if (insertErr || !post) {
      throw new Error(`Failed to insert temporary members-only post: ${insertErr?.message}`)
    }

    console.log(`Created temporary test post "${post.title}" (ID: ${post.id})`)

    // 4. Attach post to artificial-intelligence tag in post_tags
    const { error: ptErr } = await client.from('post_tags').insert({
      post_id: post.id,
      tag_id: tag.id,
    })

    if (ptErr) {
      throw new Error(`Failed to attach post_tags: ${ptErr.message}`)
    }

    // 5. Fetch topic page from running server as anonymous visitor
    const topicRes = await fetch(`${BASE_URL}/garden/topics/artificial-intelligence`)
    assert.strictEqual(topicRes.status, 200, `Expected 200 for topic page, got ${topicRes.status}`)

    const topicHtml = await topicRes.text()

    // Post title must NOT appear for anonymous visitor (RLS enforcement)
    assert(
      !topicHtml.includes('Temporary Members-Only Topic Security Test Post'),
      'Topic page must NOT display members-only test post title for anonymous visitors'
    )

    // Second paragraph of post MUST NOT be present in HTML
    assert(
      !topicHtml.includes(secretParagraph),
      'Topic page HTML must NOT contain second paragraph of members-only post'
    )
    console.log('Verified: Topic page does NOT display members-only post title or second paragraph to anonymous visitors.')
  } finally {
    // 6. Delete test post using delete-test-post pattern
    console.log(`Cleaning up temporary test post with slug "${testSlug}"...`)
    const { data: deleted, error: delErr } = await client
      .from('posts')
      .delete()
      .eq('slug', testSlug)
      .select('id, title, slug')

    if (delErr) {
      console.error(`Error deleting temporary post: ${delErr.message}`)
    } else {
      console.log('Deleted temporary test post:', deleted)
    }

    // 7. Verify post count matches initial count exactly
    const { count: countAfter, error: countAfterErr } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })

    if (countAfterErr) {
      throw new Error(`Failed to get final post count: ${countAfterErr.message}`)
    }

    console.log(`[test_garden_topics] Total posts count after test (c): ${countAfter}`)
    assert.strictEqual(
      countBefore,
      countAfter,
      `Post count before (${countBefore}) and after (${countAfter}) must match!`
    )
    console.log('PASS (c): Members-only post is absent for anonymous visitors, cleanup succeeded, and post counts match before and after.\n')
  }

  // --------------------------------------------------------------------------
  // TEST (d): Tag with is_internal = true returns 404
  // --------------------------------------------------------------------------
  console.log('--- TEST (d): Tag with is_internal = true returns 404 ---')

  // 1. Initial tag and post counts before test (d)
  const { count: tagCountBefore, error: tagCountBeforeErr } = await client
    .from('tags')
    .select('*', { count: 'exact', head: true })

  if (tagCountBeforeErr) {
    throw new Error(`Failed to get initial tag count: ${tagCountBeforeErr.message}`)
  }

  const { count: postCountBeforeD, error: postCountBeforeDErr } = await client
    .from('posts')
    .select('*', { count: 'exact', head: true })

  if (postCountBeforeDErr) {
    throw new Error(`Failed to get initial post count for test (d): ${postCountBeforeDErr.message}`)
  }

  console.log(`[test_garden_topics] Total tags count before test (d): ${tagCountBefore}`)
  console.log(`[test_garden_topics] Total posts count before test (d): ${postCountBeforeD}`)

  const internalTagSlug = 'zz-test-internal-tag-secret'
  let createdInternalTagId = null

  try {
    // 2. Create temporary internal tag (is_internal = true)
    const { data: internalTag, error: tagInsertErr } = await client
      .from('tags')
      .insert({
        name: 'Temporary Internal Security Test Tag',
        slug: internalTagSlug,
        is_internal: true,
        description: 'Internal tag for test (d) verification.',
      })
      .select('id, name, slug, is_internal')
      .single()

    if (tagInsertErr || !internalTag) {
      throw new Error(`Failed to insert temporary internal tag: ${tagInsertErr?.message}`)
    }

    createdInternalTagId = internalTag.id
    console.log(`Created temporary internal tag "${internalTag.name}" (slug: ${internalTag.slug}, ID: ${internalTag.id})`)

    // 3. Test: Fetch internal topic page - must return 404
    const internalRes = await fetch(`${BASE_URL}/garden/topics/${internalTagSlug}`)
    assert.strictEqual(
      internalRes.status,
      404,
      `Expected 404 for is_internal = true tag, got ${internalRes.status}`
    )
    console.log(`Verified: /garden/topics/${internalTagSlug} returned 404.`)

    // 4. Attach to an existing published post and verify it still returns 404 and is excluded from /garden topics pill row
    const { data: publishedPost } = await client
      .from('posts')
      .select('id')
      .eq('publish_status', 'published')
      .limit(1)
      .single()

    if (publishedPost) {
      await client.from('post_tags').insert({
        post_id: publishedPost.id,
        tag_id: internalTag.id,
      })

      const internalWithPostRes = await fetch(`${BASE_URL}/garden/topics/${internalTagSlug}`)
      assert.strictEqual(
        internalWithPostRes.status,
        404,
        `Expected 404 for is_internal = true tag even with published posts, got ${internalWithPostRes.status}`
      )

      const gardenRes = await fetch(`${BASE_URL}/garden`)
      if (gardenRes.status === 200) {
        const gardenHtml = await gardenRes.text()
        assert(
          !gardenHtml.includes(`/garden/topics/${internalTagSlug}`),
          'Topics pill row on /garden must NOT link to is_internal = true tag'
        )
      }
      console.log('Verified: Internal tag with published post returns 404 and is excluded from Topics pill row.')
    }
  } finally {
    // 5. Cleanup: delete post_tags entry and temporary internal tag
    console.log(`Cleaning up temporary internal tag "${internalTagSlug}"...`)
    if (createdInternalTagId) {
      await client.from('post_tags').delete().eq('tag_id', createdInternalTagId)
    }
    const { data: deletedTag, error: delTagErr } = await client
      .from('tags')
      .delete()
      .eq('slug', internalTagSlug)
      .select('id, name, slug')

    if (delTagErr) {
      console.error(`Error deleting temporary tag: ${delTagErr.message}`)
    } else {
      console.log('Deleted temporary internal tag:', deletedTag)
    }

    // 6. Verify tag count matches initial count exactly
    const { count: tagCountAfter, error: tagCountAfterErr } = await client
      .from('tags')
      .select('*', { count: 'exact', head: true })

    if (tagCountAfterErr) {
      throw new Error(`Failed to get final tag count: ${tagCountAfterErr.message}`)
    }

    console.log(`[test_garden_topics] Total tags count after test (d): ${tagCountAfter}`)
    assert.strictEqual(
      tagCountBefore,
      tagCountAfter,
      `Tag count before (${tagCountBefore}) and after (${tagCountAfter}) must match!`
    )

    // 7. Verify post count matches initial count exactly
    const { count: postCountAfterD, error: postCountAfterDErr } = await client
      .from('posts')
      .select('*', { count: 'exact', head: true })

    if (postCountAfterDErr) {
      throw new Error(`Failed to get final post count for test (d): ${postCountAfterDErr.message}`)
    }

    console.log(`[test_garden_topics] Total posts count after test (d): ${postCountAfterD}`)
    assert.strictEqual(
      postCountBeforeD,
      postCountAfterD,
      `Post count before (${postCountBeforeD}) and after (${postCountAfterD}) must match!`
    )

    console.log('PASS (d): Tag with is_internal = true returns 404, cleanup succeeded, and tag/post counts match before and after.\n')
  }

  console.log('=== ALL GARDEN TOPICS TESTS PASSED SUCCESSFULLY! ===')
}

runTests().catch((err) => {
  console.error('\nFAIL: Test suite encountered an error:')
  console.error(err)
  process.exit(1)
})
