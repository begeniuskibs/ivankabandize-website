import { getSupabaseClient } from './storage-cleanup/trash-unreferenced.mjs'

async function main() {
  const isApply = process.argv.includes('--apply')
  const client = getSupabaseClient()

  console.log(`[delete-test-post] Running in ${isApply ? 'APPLY' : 'DRY-RUN'} mode...`)

  // 1. Check for the test post
  const { data: posts, error: findError } = await client
    .from('posts')
    .select('id, title, slug, publish_status, visibility')
    .eq('slug', 'zz-teaser-test')

  if (findError) {
    console.error('[delete-test-post] Error querying post:', findError)
    process.exit(1)
  }

  if (!posts || posts.length === 0) {
    console.log('[delete-test-post] No post found with slug "zz-teaser-test".')
  } else {
    console.log(`[delete-test-post] Found ${posts.length} candidate post(s):`, posts)
  }

  if (!isApply) {
    console.log('[delete-test-post] Dry-run complete. Re-run with --apply to delete the test post.')
    return
  }

  // 2. Perform deletion
  const { data: deleted, error: deleteError } = await client
    .from('posts')
    .delete()
    .eq('slug', 'zz-teaser-test')
    .select('id, title, slug')

  if (deleteError) {
    console.error('[delete-test-post] Error deleting post:', deleteError)
    process.exit(1)
  }

  console.log('[delete-test-post] Deleted test post:', deleted)

  // 3. Confirm total count
  const { count, error: countError } = await client
    .from('posts')
    .select('*', { count: 'exact', head: true })

  if (countError) {
    console.error('[delete-test-post] Error getting total count:', countError)
    process.exit(1)
  }

  console.log(`[delete-test-post] Current total posts count in database: ${count}`)
}

main().catch((err) => {
  console.error('[delete-test-post] Unexpected error:', err)
  process.exit(1)
})
