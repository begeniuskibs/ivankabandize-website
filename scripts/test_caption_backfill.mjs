import assert from 'node:assert'
import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import { getSupabaseClient } from './caption-backfill/backfill-captions.mjs'

function computeContentChecksum(posts) {
  const hash = crypto.createHash('sha256')
  const sorted = [...posts].sort((a, b) => a.id.localeCompare(b.id))
  for (const post of sorted) {
    hash.update(post.id)
    hash.update(JSON.stringify(post.content || {}))
  }
  return hash.digest('hex')
}

async function runTest() {
  console.log('=== TEST CAPTION BACKFILL: DRY RUN SAFETY VERIFICATION ===\n')

  const client = getSupabaseClient()

  // 1. Snapshot state before dry run
  const { data: postsBefore, error: errBefore } = await client
    .from('posts')
    .select('id, slug, content')
    .order('id', { ascending: true })

  if (errBefore) {
    throw new Error(`Failed to query posts before dry run: ${errBefore.message}`)
  }

  const countBefore = postsBefore.length
  const checksumBefore = computeContentChecksum(postsBefore)

  console.log(`[test_caption_backfill] Total posts count before dry run: ${countBefore}`)
  console.log(`[test_caption_backfill] Content SHA-256 checksum before:   ${checksumBefore}\n`)

  assert.strictEqual(countBefore, 61, `Expected total post count to be 61, got ${countBefore}`)

  // 2. Execute dry run script
  console.log('--- Executing: node scripts/caption-backfill/backfill-captions.mjs ---\n')
  const dryRunOutput = execSync('node scripts/caption-backfill/backfill-captions.mjs', {
    encoding: 'utf8',
  })
  console.log(dryRunOutput)
  console.log('--- Dry run execution completed ---\n')

  // 3. Snapshot state after dry run
  const { data: postsAfter, error: errAfter } = await client
    .from('posts')
    .select('id, slug, content')
    .order('id', { ascending: true })

  if (errAfter) {
    throw new Error(`Failed to query posts after dry run: ${errAfter.message}`)
  }

  const countAfter = postsAfter.length
  const checksumAfter = computeContentChecksum(postsAfter)

  console.log(`[test_caption_backfill] Total posts count after dry run:  ${countAfter}`)
  console.log(`[test_caption_backfill] Content SHA-256 checksum after:    ${checksumAfter}\n`)

  // 4. Assertions
  assert.strictEqual(
    countBefore,
    countAfter,
    `Post count before (${countBefore}) and after (${countAfter}) must match!`
  )
  assert.strictEqual(countAfter, 61, `Expected final post count to be 61, got ${countAfter}`)
  assert.strictEqual(
    checksumBefore,
    checksumAfter,
    `Content checksum before (${checksumBefore}) and after (${checksumAfter}) must be identical!`
  )

  console.log('PASS: Post count remained exactly 61.')
  console.log('PASS: Content checksum verified 100% identical before and after dry run.')
  console.log('\n=== ALL CAPTION BACKFILL TESTS PASSED SUCCESSFULLY! ===')
}

runTest().catch((err) => {
  console.error('\nFAIL: Test encountered an error:')
  console.error(err)
  process.exit(1)
})
