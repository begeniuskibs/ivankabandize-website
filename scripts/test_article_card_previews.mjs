import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert'

console.log('Running test_article_card_previews.mjs...')

// Helper to assert that a file's RLS queries on posts do not select 'content'
function assertNoContentSelected(filePath) {
  assert.ok(fs.existsSync(filePath), `${filePath} must exist`)
  const code = fs.readFileSync(filePath, 'utf8')
  const selectMatches = [...code.matchAll(/\.from\(['"]posts['"]\)\s*\.select\(\s*['"`]([^'"`]+)['"`]/g)]
  assert.ok(selectMatches.length > 0, `Could not find .from('posts').select in ${filePath}`)
  for (const match of selectMatches) {
    const fields = match[1].split(',').map((f) => f.trim().split('(')[0].trim())
    assert.ok(
      !fields.includes('content'),
      `${filePath} must NOT select 'content' column in RLS queries (found fields: ${fields.join(', ')})`
    )
  }
}

// 1. Check all pages with article card feeds for no content column in RLS queries
const pagesToCheck = [
  'app/(site)/garden/page.tsx',
  'app/(site)/page.tsx',
  'app/(site)/garden/series/[slug]/page.tsx',
  'app/(site)/random-thoughts/page.tsx',
  'app/(site)/structured-thoughts/page.tsx',
  'app/(site)/tools-for-thought/page.tsx',
  'app/(site)/garden/topics/[slug]/page.tsx',
]

for (const relPath of pagesToCheck) {
  const fullPath = path.resolve(relPath)
  assertNoContentSelected(fullPath)
  const code = fs.readFileSync(fullPath, 'utf8')
  assert.ok(
    code.includes('getCardMeta'),
    `${relPath} must import and use getCardMeta`
  )
}
console.log('PASS: All article feed pages query posts without content and use getCardMeta')

// 2. Check lib/postTeaser.ts helper
const postTeaserPath = path.resolve('lib/postTeaser.ts')
assert.ok(fs.existsSync(postTeaserPath), 'lib/postTeaser.ts must exist')
const postTeaserCode = fs.readFileSync(postTeaserPath, 'utf8')

assert.ok(
  postTeaserCode.includes("import 'server-only'"),
  "lib/postTeaser.ts must include import 'server-only'"
)
assert.ok(
  postTeaserCode.includes('export async function getCardMeta'),
  'lib/postTeaser.ts must export getCardMeta'
)
assert.ok(
  postTeaserCode.includes("select('id, content')"),
  "getCardMeta must select ONLY 'id, content'"
)
assert.ok(
  postTeaserCode.includes('Promise<{ previews: Record<string, string>; readTimes: Record<string, number> }>'),
  'getCardMeta must return Promise<{ previews: Record<string, string>; readTimes: Record<string, number> }>'
)
console.log('PASS: lib/postTeaser.ts helper conforms to server - only and string/number return type contract')

// 3. Check PostCard.tsx (default showPreview = true, line clamps)
const postCardPath = path.resolve('components/public/PostCard.tsx')
assert.ok(fs.existsSync(postCardPath), 'components/public/PostCard.tsx must exist')
const postCardCode = fs.readFileSync(postCardPath, 'utf8')

assert.ok(
  postCardCode.includes('export const CARD_TITLE_LINES = 1'),
  'PostCard.tsx must export CARD_TITLE_LINES = 1 for backwards compatibility'
)
assert.ok(
  postCardCode.includes('showPreview = true'),
  'PostCard.tsx must default showPreview to true'
)
assert.ok(
  postCardCode.includes('line-clamp-1'),
  'PostCard.tsx must support line-clamp-1 title'
)
assert.ok(
  postCardCode.includes('line-clamp-2'),
  'PostCard.tsx must support line-clamp-2 preview'
)
assert.ok(
  postCardCode.includes('aspect-[16/9]'),
  'PostCard.tsx must render 16:9 thumbnail'
)
console.log('PASS: components/public/PostCard.tsx defaults showPreview = true and uses line-clamp-1 & line-clamp-2')

// 4. Check GardenFeed.tsx
const gardenFeedPath = path.resolve('components/public/GardenFeed.tsx')
assert.ok(fs.existsSync(gardenFeedPath), 'components/public/GardenFeed.tsx must exist')
const gardenFeedCode = fs.readFileSync(gardenFeedPath, 'utf8')
assert.ok(
  !gardenFeedCode.includes('showPreviews'),
  'GardenFeed.tsx should have showPreviews gating removed'
)
console.log('PASS: components/public/GardenFeed.tsx has showPreview gating removed')

// 5. Check GardenLandingA2.tsx (Landing page article cards)
const landingPath = path.resolve('components/public/GardenLandingA2.tsx')
assert.ok(fs.existsSync(landingPath), 'components/public/GardenLandingA2.tsx must exist')
const landingCode = fs.readFileSync(landingPath, 'utf8')

assert.ok(
  landingCode.includes('line-clamp-1'),
  'GardenLandingA2.tsx must use line-clamp-1 for article card title'
)
assert.ok(
  landingCode.includes('line-clamp-2'),
  'GardenLandingA2.tsx must use line-clamp-2 for article card preview'
)
console.log('PASS: components/public/GardenLandingA2.tsx uses line-clamp-1 and line-clamp-2')

// 6. Check House Style: No em dashes (\u2014) or en dashes (\u2013)
const filesToCheck = [
  'lib/postTeaser.ts',
  'components/public/PostCard.tsx',
  'components/public/GardenLandingA2.tsx',
  'components/public/GardenFeed.tsx',
  'app/(site)/garden/page.tsx',
  'app/(site)/page.tsx',
  'app/(site)/garden/series/[slug]/page.tsx',
  'app/(site)/random-thoughts/page.tsx',
  'app/(site)/structured-thoughts/page.tsx',
  'app/(site)/tools-for-thought/page.tsx',
  'app/(site)/garden/topics/[slug]/page.tsx',
  'scripts/test_article_card_previews.mjs',
]

for (const relPath of filesToCheck) {
  const fullPath = path.resolve(relPath)
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8')
    assert.ok(
      !content.includes('\u2013'),
      `File ${relPath} contains an en dash (\\u2013). House style requires spaced hyphen " - " instead.`
    )
    assert.ok(
      !content.includes('\u2014'),
      `File ${relPath} contains an em dash (\\u2014). House style requires spaced hyphen " - " instead.`
    )
  }
}
console.log('PASS: No em or en dashes found in any checked files')

console.log('\nAll article card preview assertions passed successfully.')
