import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert'

console.log('Running test_article_card_previews.mjs...')

// 1. Check app/(site)/garden/page.tsx
const gardenPagePath = path.resolve('app/(site)/garden/page.tsx')
assert.ok(fs.existsSync(gardenPagePath), 'app/(site)/garden/page.tsx must exist')
const gardenPageCode = fs.readFileSync(gardenPagePath, 'utf8')

// Assert landing / articles query does NOT select 'content'
const selectMatch = gardenPageCode.match(/\.from\('posts'\)\s*\.select\(\s*['"`]([^'"`]+)['"`]/)
assert.ok(selectMatch, 'Could not find .from(\'posts\').select in app/(site)/garden/page.tsx')
const selectedFields = selectMatch[1].split(',').map((f) => f.trim().split('(')[0].trim())
assert.ok(
  !selectedFields.includes('content'),
  `app/(site)/garden/page.tsx must NOT select 'content' column (found fields: ${selectedFields.join(', ')})`
)
console.log('PASS: app/(site)/garden/page.tsx does not select content')

// Assert postsWithPreviews is passed to both views
assert.ok(
  gardenPageCode.includes('posts={postsWithPreviews}'),
  'app/(site)/garden/page.tsx must pass postsWithPreviews to GardenFeed'
)
assert.ok(
  gardenPageCode.includes('articles={postsWithPreviews}'),
  'app/(site)/garden/page.tsx must pass postsWithPreviews to GardenLandingA2'
)
console.log('PASS: app/(site)/garden/page.tsx passes postsWithPreviews to GardenFeed and GardenLandingA2')

// 2. Check lib/postTeaser.ts helper
const postTeaserPath = path.resolve('lib/postTeaser.ts')
assert.ok(fs.existsSync(postTeaserPath), 'lib/postTeaser.ts must exist')
const postTeaserCode = fs.readFileSync(postTeaserPath, 'utf8')

assert.ok(
  postTeaserCode.includes("import 'server-only'"),
  "lib/postTeaser.ts must include import 'server-only'"
)
assert.ok(
  postTeaserCode.includes('export async function getCardPreviews'),
  'lib/postTeaser.ts must export getCardPreviews'
)
assert.ok(
  postTeaserCode.includes("select('id, content')"),
  "getCardPreviews must select ONLY 'id, content'"
)
assert.ok(
  postTeaserCode.includes('Promise<Record<string, string>>'),
  'getCardPreviews must return Promise<Record<string, string>>'
)
console.log('PASS: lib/postTeaser.ts helper conforms to server - only and string return type contract')

// 3. Check PostCard.tsx (Articles view cards & existing usages)
const postCardPath = path.resolve('components/public/PostCard.tsx')
assert.ok(fs.existsSync(postCardPath), 'components/public/PostCard.tsx must exist')
const postCardCode = fs.readFileSync(postCardPath, 'utf8')

// Assert original constants and signature
assert.ok(
  postCardCode.includes('export const CARD_TITLE_LINES = 1'),
  'PostCard.tsx must export CARD_TITLE_LINES = 1 for backwards compatibility'
)
assert.ok(
  postCardCode.includes('showPreview = false'),
  'PostCard.tsx must default showPreview to false'
)

// Assert original classes are kept when showPreview is false
assert.ok(
  postCardCode.includes('pt-4 px-5 pb-5 flex-1 flex flex-col justify-center min-w-0'),
  'PostCard.tsx must keep original title container classes when showPreview is false'
)
assert.ok(
  postCardCode.includes('titleClass'),
  'PostCard.tsx must keep original titleClass when showPreview is false'
)
assert.ok(
  postCardCode.includes('text-[20px]'),
  'PostCard.tsx must keep original 20px title size'
)
assert.ok(
  postCardCode.includes('aspect-[16/9]'),
  'PostCard.tsx must render 16:9 thumbnail'
)

// Assert preview behavior when showPreview is true
assert.ok(
  postCardCode.includes('line-clamp-1'),
  'PostCard.tsx must support line-clamp-1 when showPreview is true'
)
assert.ok(
  postCardCode.includes('line-clamp-2'),
  'PostCard.tsx must support line-clamp-2 preview when showPreview is true'
)
console.log('PASS: components/public/PostCard.tsx preserves original classes when showPreview is false, applies line-clamp-1 and line-clamp-2 when true')

// 4. Check GardenFeed.tsx
const gardenFeedPath = path.resolve('components/public/GardenFeed.tsx')
assert.ok(fs.existsSync(gardenFeedPath), 'components/public/GardenFeed.tsx must exist')
const gardenFeedCode = fs.readFileSync(gardenFeedPath, 'utf8')
assert.ok(
  gardenFeedCode.includes('showPreview={showPreviews || currentFilter === \'all\'}'),
  'GardenFeed.tsx must pass showPreview only for Articles view'
)
console.log('PASS: components/public/GardenFeed.tsx passes showPreview only for Articles view')

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
