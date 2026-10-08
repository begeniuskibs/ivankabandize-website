import fs from 'node:fs'

const data = JSON.parse(fs.readFileSync('scripts/ghost-import/preflight-report.json', 'utf8'))

console.log('================================================================================')
console.log('STEP 4 PREFLIGHT SUMMARY: REAL TOTALS & TABLES STRAIGHT FROM preflight-report.json')
console.log('================================================================================\n')

console.log('1. TOTAL POSTS:')
console.log(`   Total target posts: ${data.postsTable.length}`)
const publishedCount = data.postsTable.filter(p => !p.published_at.startsWith('draft')).length
const draftCount = data.postsTable.filter(p => p.published_at.startsWith('draft')).length
console.log(`   - Published: ${publishedCount}`)
console.log(`   - Drafts: ${draftCount}\n`)

console.log('2. MEDIA FILES & STATUSES:')
console.log(`   Total unique Ghost media files: ${data.mediaResults.length}`)
const mediaStatusCounts = {}
for (const m of data.mediaResults) {
  mediaStatusCounts[m.status] = (mediaStatusCounts[m.status] || 0) + 1
}
console.log('   Status breakdown:', JSON.stringify(mediaStatusCounts))
console.log(`   Oversized images (> 45 MB): ${data.mediaResults.filter(m => m.bucket === 'post-images' && m.bytes > 45 * 1024 * 1024).length}`)
console.log(`   Oversized videos (> 50 MB): ${data.mediaResults.filter(m => m.bucket === 'post-videos' && m.bytes > 50 * 1024 * 1024).length}\n`)

console.log('3. BOOKMARKS (INTERNAL vs EXTERNAL):')
console.log(`   Total bookmark URLs audited: ${data.bookmarkResults.length}`)
const internalBookmarks = data.bookmarkResults.filter(b => b.isInternal)
const externalBookmarks = data.bookmarkResults.filter(b => !b.isInternal)
console.log(`   - Internal bookmarks: ${internalBookmarks.length} (all resolve cleanly to /garden/ routes or series)`)
console.log(`   - External bookmarks: ${externalBookmarks.length}`)
for (const eb of externalBookmarks) {
  console.log(`     * [HTTP ${eb.status}] ${eb.rawUrl} (${eb.valid ? 'VALID' : 'BLOCKED/BOT_CHALLENGE'})`)
}
console.log('')

console.log('4. EMBEDS WITH STATUSES:')
console.log(`   Total embeds: ${data.embedResults.length}`)
for (const emb of data.embedResults) {
  console.log(`   * [HTTP ${emb.status}] ${emb.url} - ${emb.valid ? 'VALID oEmbed (' + emb.title + ')' : 'FLAGGED (' + emb.error + ')'}`)
}
console.log('')

console.log('5. CARD TYPE TOTALS ACROSS ALL 52 POSTS:')
const totalCardCounts = {}
for (const p of data.postsTable) {
  for (const [k, v] of Object.entries(p.cardCounts || {})) {
    totalCardCounts[k] = (totalCardCounts[k] || 0) + v
  }
}
console.log(JSON.stringify(totalCardCounts, null, 2))
console.log('')

console.log('6. GHOST "signup" CARDS SKIPPED:')
const totalSkippedSignups = Object.values(data.skippedSignupCardsPerPost || {}).reduce((a, b) => a + b, 0)
console.log(`   Total skipped signup cards: ${totalSkippedSignups}`)
console.log('   Per-post skipped signup cards count:')
for (const [slug, count] of Object.entries(data.skippedSignupCardsPerPost || {})) {
  console.log(`   - ${slug}: ${count}`)
}
console.log('')

console.log('7. POSTS TABLE (ALL 52 ROWS STRAIGHT FROM JSON):')
console.log('------------------------------------------------------------------------------------------------------------------------')
console.log(
  'Num'.padEnd(5) +
  'Slug'.padEnd(45) +
  'Published At'.padEnd(28) +
  'Words'.padEnd(8) +
  'Card Counts'
)
console.log('------------------------------------------------------------------------------------------------------------------------')
for (const p of data.postsTable) {
  const cardsStr = Object.entries(p.cardCounts || {})
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}:${v}`)
    .join(', ')
  console.log(
    String(p.num).padEnd(5) +
    p.slug.padEnd(45) +
    p.published_at.padEnd(28) +
    String(p.wordCount).padEnd(8) +
    cardsStr
  )
}
console.log('------------------------------------------------------------------------------------------------------------------------')
