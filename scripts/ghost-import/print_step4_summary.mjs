import fs from 'node:fs'

const data = JSON.parse(fs.readFileSync('scripts/ghost-import/preflight-report.json', 'utf8'))

console.log('================================================================================')
console.log('STEP 4 & 5 PREFLIGHT SUMMARY: REAL TOTALS DIRECTLY FROM preflight-report.json')
console.log('================================================================================\n')

console.log('1. SUMMARY FIGURES (DIRECTLY FROM JSON):')
console.log(`   - Total Target Posts: ${data.postsTable.length}`)
const publishedCount = data.postsTable.filter(p => !p.published_at.startsWith('draft')).length
const draftCount = data.postsTable.filter(p => p.published_at.startsWith('draft')).length
console.log(`     * Published: ${publishedCount}`)
console.log(`     * Drafts: ${draftCount}`)

console.log(`   - Total Unique Ghost Media Files to Re-host: ${data.mediaResults.length}`)
const mediaStatusCounts = {}
for (const m of data.mediaResults) {
  mediaStatusCounts[m.status] = (mediaStatusCounts[m.status] || 0) + 1
}
console.log(`     * Media HTTP Status Breakdown: ${JSON.stringify(mediaStatusCounts)}`)
console.log(`     * Media Files > 45 MB: ${data.mediaResults.filter(m => m.bucket === 'post-images' && m.bytes > 45 * 1024 * 1024).length}`)
console.log(`     * Video Files > 50 MB: ${data.mediaResults.filter(m => m.bucket === 'post-videos' && m.bytes > 50 * 1024 * 1024).length}`)

console.log(`   - Total Bookmarks Audited: ${data.bookmarkResults.length}`)
const internalBookmarks = data.bookmarkResults.filter(b => b.isInternal)
const externalBookmarks = data.bookmarkResults.filter(b => !b.isInternal)
console.log(`     * Internal Bookmarks: ${internalBookmarks.length}`)
console.log(`     * External Bookmarks: ${externalBookmarks.length}`)

console.log(`   - Total Embeds Audited: ${data.embedResults.length}`)
const validEmbeds = data.embedResults.filter(e => e.valid)
const deadEmbeds = data.embedResults.filter(e => !e.valid)
console.log(`     * Valid Embeds: ${validEmbeds.length}`)
console.log(`     * Dead/Flagged Embeds: ${deadEmbeds.length}`)

const deadExternalBookmarks = externalBookmarks.filter(b => b.status === 404 || b.status === 0)
console.log(`   - Dead Links (HTTP 404 or connection failures): ${deadEmbeds.length + deadExternalBookmarks.length}`)
console.log('')

console.log('2. DIFFERENCES FROM PREVIOUS REPORT:')
console.log('   - Embeds Status: Previously 1 dead embed (HTTP 403 on youtu.be/GhwkD0CDzXI in starting-out-against-all-odds).')
console.log('     Now replaced with https://www.youtube.com/shorts/j4IN263suvA which passed oEmbed (HTTP 200, "Failing Forward").')
console.log('     Valid embeds increased from 10 to 11. Dead/flagged embeds decreased from 1 to 0.')
console.log('   - Table Ordering: Changed from manual approved order to strict Ghost published_at ascending.')
console.log('     Post tools-that-have-triggered-my-growth-and-productivity (2022-02-28) moved to #4 (before on-life-and-death, 2022-08-10).')
console.log('     Post weekly-planning (2023-01-30) moved to #8 (before outgrow-your-implicit-bias, 2023-02-06).')
console.log('     Drafts on-pioneering-again and on-the-gain-and-the-gap remain at the very end (#51 and #52).\n')

console.log('3. INTERNAL BOOKMARKS WHOSE TARGET SLUG IS NOT AN IMPORTED PUBLISHED POST (STEP 5):')
const importedPublishedSlugs = new Set(data.postsTable.filter(p => !p.published_at.startsWith('draft')).map(p => p.slug))
const nonPublishedTargets = []

for (const post of data.postsTable) {
  for (const ib of post.internalBookmarks || []) {
    if (!importedPublishedSlugs.has(ib.targetSlug)) {
      nonPublishedTargets.push({
        sourcePost: post.slug,
        targetSlug: ib.targetSlug,
        rewrittenUrl: ib.rewrittenUrl,
        resolutionType: ib.resolutionType,
      })
    }
  }
}

if (nonPublishedTargets.length === 0) {
  console.log('   None found.')
} else {
  for (const item of nonPublishedTargets) {
    console.log(`   - Target: "${item.targetSlug}" (referenced by post "${item.sourcePost}") -> ${item.rewrittenUrl} [Type: ${item.resolutionType}]`)
  }
}
console.log('')

console.log('4. ALL 52 POSTS TABLE WITH WORD COUNTS & CARD COUNTS (ORDERED BY published_at ASCENDING):')
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
