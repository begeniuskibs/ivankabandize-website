// Test publish readiness dry-run safety
// Verifies that running restore-dates.mjs in dry-run mode causes zero database mutations
// Computes post count and SHA256 checksum of all published_at values before and after
// House style: spaced hyphen only

import crypto from 'node:crypto'
import { execSync } from 'node:child_process'
import { getSupabaseClient } from './publish-readiness/restore-dates.mjs'

function computeChecksum(posts) {
  const hash = crypto.createHash('sha256')
  for (const post of posts) {
    hash.update(`${post.slug}:${post.published_at || 'NULL'};`)
  }
  return hash.digest('hex')
}

async function fetchAllPosts(supabase) {
  const { data, error } = await supabase
    .from('posts')
    .select('id, slug, published_at')
    .order('slug', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch posts: ${error.message}`)
  }
  return data || []
}

async function main() {
  console.log('=== TEST PUBLISH READINESS: DRY-RUN SAFETY VERIFICATION ===\n')

  const supabase = getSupabaseClient()

  console.log('Step 1: Reading baseline database state...')
  const beforePosts = await fetchAllPosts(supabase)
  const beforeCount = beforePosts.length
  const beforeChecksum = computeChecksum(beforePosts)

  console.log(`Baseline posts count: ${beforeCount}`)
  console.log(`Baseline published_at SHA256 checksum: ${beforeChecksum}\n`)

  console.log('Step 2: Executing dry run (node scripts/publish-readiness/restore-dates.mjs)...')
  const dryRunOutput = execSync(
    'node scripts/publish-readiness/restore-dates.mjs',
    {
      encoding: 'utf8',
      stdio: 'pipe',
    }
  )

  const lineCount = dryRunOutput.trim().split('\n').length
  console.log(`Dry run completed with ${lineCount} lines of output.\n`)

  console.log('Step 3: Reading database state after dry run...')
  const afterPosts = await fetchAllPosts(supabase)
  const afterCount = afterPosts.length
  const afterChecksum = computeChecksum(afterPosts)

  console.log(`After dry-run posts count: ${afterCount}`)
  console.log(`After dry-run published_at SHA256 checksum: ${afterChecksum}\n`)

  console.log('Step 4: Verifying assertions...')
  let failed = false

  if (beforeCount === afterCount) {
    console.log(`  [PASS] Post count unchanged: ${beforeCount} === ${afterCount}`)
  } else {
    console.error(
      `  [FAIL] Post count mismatch: before=${beforeCount}, after=${afterCount}`
    )
    failed = true
  }

  if (beforeChecksum === afterChecksum) {
    console.log(
      `  [PASS] Checksum identical: ${beforeChecksum} === ${afterChecksum}`
    )
  } else {
    console.error(
      `  [FAIL] Checksum mismatch: before=${beforeChecksum}, after=${afterChecksum}`
    )
    failed = true
  }

  if (failed) {
    console.error('\nResult: FAILED - Database was mutated during dry run!')
    process.exit(1)
  } else {
    console.log(
      '\nResult: PASS - Zero mutations detected. Dry run is completely non-mutating.'
    )
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
