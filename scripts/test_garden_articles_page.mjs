import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

console.log('Running test_garden_articles_page.mjs...\n')

// 1. Assert component file exists
const componentPath = path.resolve('components/public/GardenArticlesView.tsx')
assert.ok(fs.existsSync(componentPath), 'GardenArticlesView.tsx must exist')
const componentCode = fs.readFileSync(componentPath, 'utf8')
console.log('PASS: components/public/GardenArticlesView.tsx exists')

// 2. Assert references /garden-heroes/articles.jpg
assert.ok(
  componentCode.includes('/garden-heroes/articles.jpg'),
  'GardenArticlesView.tsx must reference /garden-heroes/articles.jpg'
)
console.log('PASS: /garden-heroes/articles.jpg is referenced')

// 3. Assert contains the four stream pill labels
const streamLabels = [
  'All',
  'Random Thoughts',
  'Structured Thoughts',
  'Tools for Thought',
]

for (const label of streamLabels) {
  assert.ok(
    componentCode.includes(label),
    `GardenArticlesView.tsx must contain stream pill label: "${label}"`
  )
}
console.log('PASS: All four stream pill labels are present')

// 3b. Assert short pill labels and mobile/desktop markup
const shortStreamLabels = ['All', 'Random', 'Structured', 'Tools']
for (const label of shortStreamLabels) {
  assert.ok(
    componentCode.includes(label),
    `GardenArticlesView.tsx must contain short stream pill label: "${label}"`
  )
}
assert.ok(
  componentCode.includes('className="md:hidden"'),
  'GardenArticlesView.tsx must render short pill labels with md:hidden'
)
assert.ok(
  componentCode.includes('className="hidden md:inline"'),
  'GardenArticlesView.tsx must render full pill labels with hidden md:inline'
)
assert.ok(
  componentCode.includes('aria-label={pill.label}'),
  'GardenArticlesView.tsx stream pills must have aria-label with full name'
)
console.log('PASS: Short and full stream pill labels and aria-labels verified')

// 3c. Assert mobile back link
assert.ok(
  componentCode.includes('href="/garden"'),
  'GardenArticlesView.tsx must link back to /garden'
)
assert.ok(
  componentCode.includes('href="/garden?view=articles"'),
  'GardenArticlesView.tsx must link back to /garden?view=articles'
)
assert.ok(
  componentCode.includes('The Garden') && componentCode.includes('Articles'),
  'GardenArticlesView.tsx must have "The Garden" and "Articles" mobile back link text'
)
assert.ok(
  componentCode.includes('<ArrowLeft') && componentCode.includes('group-hover:-translate-x-1'),
  'GardenArticlesView.tsx must use ArrowLeft with group-hover:-translate-x-1 for mobile back link'
)
console.log('PASS: Mobile back link verified')

// 3d. Assert hero mobile text sizes, photo strip height, and series arrow
assert.ok(
  componentCode.includes('text-[32px]'),
  'GardenArticlesView.tsx must use text-[32px] for mobile hero title'
)
assert.ok(
  componentCode.includes('text-[15px]'),
  'GardenArticlesView.tsx must use text-[15px] for mobile hero description'
)
assert.ok(
  componentCode.includes('h-[120px]'),
  'GardenArticlesView.tsx must use h-[120px] for mobile photo strip'
)
assert.ok(
  componentCode.includes('<ArrowRight') && componentCode.includes('group-hover:translate-x-1'),
  'GardenArticlesView.tsx must use ArrowRight with group-hover:translate-x-1 for series cards'
)
assert.ok(
  !componentCode.includes('Explore series →') && !componentCode.includes('Explore series ->'),
  'GardenArticlesView.tsx must not contain text arrows in explore series link'
)
console.log('PASS: Hero mobile polish and lucide arrows verified')

// 4. Assert contains "Load more articles"
assert.ok(
  componentCode.includes('Load more articles'),
  'GardenArticlesView.tsx must contain "Load more articles"'
)
console.log('PASS: "Load more articles" button text is present')

// 5. Assert contains "SERIES - READ IN ORDER"
assert.ok(
  componentCode.includes('SERIES - READ IN ORDER'),
  'GardenArticlesView.tsx must contain "SERIES - READ IN ORDER"'
)
console.log('PASS: "SERIES - READ IN ORDER" label is present')

// 6. Assert uses PostCard
assert.ok(
  componentCode.includes('import PostCard') || componentCode.includes('from \'./PostCard\''),
  'GardenArticlesView.tsx must import PostCard'
)
assert.ok(
  componentCode.includes('<PostCard'),
  'GardenArticlesView.tsx must render <PostCard'
)
console.log('PASS: PostCard component is imported and used')

// 7. Assert links to /garden/series/
assert.ok(
  componentCode.includes('/garden/series/'),
  'GardenArticlesView.tsx must link to /garden/series/'
)
console.log('PASS: Links to /garden/series/ are present')

// 8. Assert no "Unsplash" or "Photo by" text in the component
assert.ok(
  !componentCode.toLowerCase().includes('unsplash'),
  'GardenArticlesView.tsx must not contain "Unsplash" text'
)
assert.ok(
  !componentCode.toLowerCase().includes('photo by'),
  'GardenArticlesView.tsx must not contain "Photo by" text'
)
console.log('PASS: No "Unsplash" or "Photo by" text present')

// 9. Assert page.tsx does not select the content column in the view=articles branch
const pagePath = path.resolve('app/(site)/garden/page.tsx')
assert.ok(fs.existsSync(pagePath), 'app/(site)/garden/page.tsx must exist')
const pageCode = fs.readFileSync(pagePath, 'utf8')

const isViewAllArticlesIndex = pageCode.indexOf('if (isViewAllArticles)')
assert.ok(isViewAllArticlesIndex !== -1, 'app/(site)/garden/page.tsx must contain isViewAllArticles branch')

const articlesBranchCode = pageCode.slice(isViewAllArticlesIndex)
const contentSelectMatches = [
  '.select(\'content',
  ', content,',
  ', content ',
  ',content,',
  'posts.content',
]

for (const pattern of contentSelectMatches) {
  assert.ok(
    !articlesBranchCode.includes(pattern),
    `isViewAllArticles branch must not select content column (found pattern: "${pattern}")`
  )
}
console.log('PASS: page.tsx does not select content column in the view=articles branch')

// 10. Assert components/public/GardenFeed.tsx and PostCard.tsx are unchanged versus origin/main
try {
  execSync('git diff --quiet origin/main -- components/public/GardenFeed.tsx components/public/PostCard.tsx', {
    stdio: 'inherit',
  })
  console.log('PASS: GardenFeed.tsx and PostCard.tsx are unchanged versus origin/main')
} catch {
  assert.fail('GardenFeed.tsx and PostCard.tsx must remain unchanged versus origin/main')
}

// 11. Assert STREAM_HEROES entries (all four eyebrows and titles)
assert.ok(
  componentCode.includes('STREAM_HEROES'),
  'GardenArticlesView.tsx must define STREAM_HEROES'
)

const streamHeroesExpected = [
  { key: 'all', title: 'Articles' },
  { key: 'random_thoughts', eyebrow: 'Sparks & Observations', title: 'Random Thoughts' },
  { key: 'structured_thoughts', eyebrow: 'Essays & Deep Dives', title: 'Structured Thoughts' },
  { key: 'tools_for_thought', eyebrow: 'Systems & Workflows', title: 'Tools for Thought' },
]

for (const item of streamHeroesExpected) {
  assert.ok(
    componentCode.includes(item.title),
    `STREAM_HEROES must include title "${item.title}"`
  )
  if (item.eyebrow) {
    assert.ok(
      componentCode.includes(item.eyebrow),
      `STREAM_HEROES must include eyebrow "${item.eyebrow}"`
    )
  }
}
console.log('PASS: STREAM_HEROES has all four eyebrows and titles')

// 12. Assert series back link in app/(site)/garden/series/[slug]/page.tsx
const seriesSlugPagePath = path.resolve('app/(site)/garden/series/[slug]/page.tsx')
assert.ok(fs.existsSync(seriesSlugPagePath), 'series/[slug]/page.tsx must exist')
const seriesSlugCode = fs.readFileSync(seriesSlugPagePath, 'utf8')

assert.ok(
  seriesSlugCode.includes('href="/garden?view=articles"'),
  'series/[slug]/page.tsx back link href must be "/garden?view=articles"'
)
assert.ok(
  seriesSlugCode.includes('Back to Articles'),
  'series/[slug]/page.tsx back link text must include "Back to Articles"'
)
console.log('PASS: series/[slug]/page.tsx back link text and href verified')

// 13. Assert absence of "md:hidden bg-[#FEF1ED]/85" or "bg-[#FEF1ED]/85"
assert.ok(
  !componentCode.includes('bg-[#FEF1ED]/85'),
  'GardenArticlesView.tsx must not contain "bg-[#FEF1ED]/85"'
)
assert.ok(
  !componentCode.includes('md:hidden absolute inset-0 pointer-events-none bg-[#FEF1ED]/85'),
  'GardenArticlesView.tsx must remove the md:hidden 85% cream overlay'
)
console.log('PASS: 85% cream overlay is absent')

// 14. Assert series page header image full-bleed classes
assert.ok(
  seriesSlugCode.includes('w-screen relative left-1/2 -translate-x-1/2'),
  'series/[slug]/page.tsx header image block must break out with w-screen full-bleed classes'
)
assert.ok(
  seriesSlugCode.includes('overflow-x-clip'),
  'series/[slug]/page.tsx page wrapper must have overflow-x-clip'
)
console.log('PASS: series/[slug]/page.tsx header image is full-bleed with w-screen and overflow-x-clip')

// 15. Assert old thumbnail markup is back in GardenArticlesView.tsx
assert.ok(
  componentCode.includes('w-[120px] min-w-[120px] max-w-[120px]'),
  'GardenArticlesView.tsx series card must have 120px left thumbnail markup'
)
console.log('PASS: Old 120px thumbnail markup is present')

// 16. Assert dark gradient overlay exists in GardenArticlesView.tsx
assert.ok(
  componentCode.includes('from-[#232536] via-[#232536]/80 to-[#232536]/55'),
  'GardenArticlesView.tsx must have "from-[#232536] via-[#232536]/80 to-[#232536]/55" overlay'
)
console.log('PASS: Dark gradient overlay is present')

// 17. Assert old light gradient string is gone from GardenArticlesView.tsx
assert.ok(
  !componentCode.includes('#FEF1ED 30%'),
  'GardenArticlesView.tsx must not contain old light gradient "#FEF1ED 30%"'
)
console.log('PASS: Old light gradient "#FEF1ED 30%" is gone')

// 18. Assert eyebrow is rendered inside description paragraph with text-[#F7C55C]
assert.ok(
  componentCode.includes('text-[#F7C55C]'),
  'GardenArticlesView.tsx must render eyebrow with text-[#F7C55C]'
)
assert.ok(
  componentCode.includes('{currentHero.eyebrow}:'),
  'GardenArticlesView.tsx must render eyebrow followed by a colon inside the description'
)
console.log('PASS: Eyebrow rendered inside description paragraph with text-[#F7C55C]')

// 19. Assert no em or en dashes in the changed files
const changedFilesToCheck = [
  'components/public/GardenArticlesView.tsx',
  'app/(site)/garden/page.tsx',
  'app/(site)/garden/series/[slug]/page.tsx',
  'scripts/test_garden_articles_page.mjs',
]

const dashRegex = /[\u2013\u2014]/

for (const relPath of changedFilesToCheck) {
  const fullPath = path.resolve(relPath)
  assert.ok(fs.existsSync(fullPath), `File ${relPath} must exist`)
  const content = fs.readFileSync(fullPath, 'utf8')
  const match = content.match(dashRegex)
  assert.ok(
    !match,
    `File ${relPath} contains an em dash or en dash. House style requires spaced hyphen " - " instead.`
  )
}
console.log('PASS: No em or en dashes found in changed files')

console.log('\nAll garden articles page assertions passed successfully.')

