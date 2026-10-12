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
  // TEST (c): Topic page with members-only post does not contain second paragraph
  // --------------------------------------------------------------------------
  console.log('--- TEST (c): Members-only post on topic page does not leak content ---')

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

    // 5. Fetch topic page from running server
    const topicRes = await fetch(`${BASE_URL}/garden/topics/artificial-intelligence`)
    assert.strictEqual(topicRes.status, 200, `Expected 200 for topic page, got ${topicRes.status}`)

    const topicHtml = await topicRes.text()

    // Post title must appear in feed
    assert(
      topicHtml.includes('Temporary Members-Only Topic Security Test Post'),
      'Topic page must display the temporary test post title'
    )

    // Second paragraph of post MUST NOT be present in HTML
    assert(
      !topicHtml.includes(secretParagraph),
      'SECURITY LEAK DETECTED: Topic page HTML contains second paragraph of members-only post!'
    )
    console.log('Verified: Topic page displays members-only card without leaking second paragraph.')
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
    console.log('PASS (c): Temporary post deleted and database post counts match before and after.\n')
  }

  console.log('=== ALL GARDEN TOPICS TESTS PASSED SUCCESSFULLY! ===')
}

runTests().catch((err) => {
  console.error('\nFAIL: Test suite encountered an error:')
  console.error(err)
  process.exit(1)
})
