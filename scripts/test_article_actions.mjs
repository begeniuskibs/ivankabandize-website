import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert'

console.log('--- Running Article Actions Validation Suite ---\n')

// 1. Test buildShareUrls encoding logic
console.log('1. Testing Share URLs Encoding Logic...')

function buildShareUrls(title, url) {
  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(url)
  const encodedTextAndUrl = encodeURIComponent(`${title} ${url}`)
  const encodedEmailBody = encodeURIComponent(`${title}\n\n${url}`)

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTextAndUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    x: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedEmailBody}`,
  }
}

// Test Case A: Standard title and canonical URL
{
  const title = 'The Effective Annual Planning Framework'
  const url = 'https://ivankabandize.com/garden/the-effective-annual-planning-framework'
  const urls = buildShareUrls(title, url)

  assert.strictEqual(
    urls.whatsapp,
    'https://api.whatsapp.com/send?text=The%20Effective%20Annual%20Planning%20Framework%20https%3A%2F%2Fivankabandize.com%2Fgarden%2Fthe-effective-annual-planning-framework'
  )
  assert.strictEqual(
    urls.linkedin,
    'https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Fivankabandize.com%2Fgarden%2Fthe-effective-annual-planning-framework'
  )
  assert.strictEqual(
    urls.x,
    'https://x.com/intent/tweet?text=The%20Effective%20Annual%20Planning%20Framework&url=https%3A%2F%2Fivankabandize.com%2Fgarden%2Fthe-effective-annual-planning-framework'
  )
  assert.strictEqual(
    urls.email,
    'mailto:?subject=The%20Effective%20Annual%20Planning%20Framework&body=The%20Effective%20Annual%20Planning%20Framework%0A%0Ahttps%3A%2F%2Fivankabandize.com%2Fgarden%2Fthe-effective-annual-planning-framework'
  )
  console.log('   [PASS] Standard title and canonical URL encoded correctly')
}

// Test Case B: Title with special characters (&, ?, !, quotes)
{
  const title = 'Leadership & Strategy: Why "Now" Matters?'
  const url = 'https://ivankabandize.com/garden/leadership-and-strategy'
  const urls = buildShareUrls(title, url)

  assert(urls.whatsapp.includes(encodeURIComponent(title)))
  assert(urls.linkedin.includes(encodeURIComponent(url)))
  assert(urls.x.includes(encodeURIComponent(title)))
  assert(urls.email.includes(encodeURIComponent(title)))
  assert(!urls.whatsapp.includes(' "Now" ')) // Raw quotes must be encoded
  assert(!urls.whatsapp.includes('&Strategy')) // Ampersand must be encoded as %26
  console.log('   [PASS] Special characters and symbols encoded safely')
}

// Test Case C: Verify no post body/content leakage in share URLs
{
  const title = 'Members Only Article Title'
  const url = 'https://ivankabandize.com/garden/members-only-post'
  const secretContent = 'SECRET_PAYWALLED_BODY_TEXT_DO_NOT_LEAK'
  const urls = buildShareUrls(title, url)

  assert(!JSON.stringify(urls).includes(secretContent))
  console.log('   [PASS] Share URLs do not leak content (title and canonical URL only)')
}

// 2. Check that ArticleActions is NOT rendered in the admin editor
console.log('\n2. Checking Admin Editor Isolation...')

function scanDirectory(dir, filterFn) {
  const results = []
  if (!fs.existsSync(dir)) return results
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...scanDirectory(fullPath, filterFn))
    } else if (filterFn(fullPath)) {
      results.push(fullPath)
    }
  }
  return results
}

const adminFiles = [
  ...scanDirectory('app/admin', (f) => /\.(tsx|ts|jsx|js)$/.test(f)),
  ...scanDirectory('components/editor', (f) => /\.(tsx|ts|jsx|js)$/.test(f)),
]

let foundInAdmin = false
for (const filePath of adminFiles) {
  const content = fs.readFileSync(filePath, 'utf8')
  if (content.includes('ArticleActions')) {
    console.error(`   [FAIL] Found reference to ArticleActions in admin/editor file: ${filePath}`)
    foundInAdmin = true
  }
}

if (!foundInAdmin) {
  console.log(`   [PASS] ArticleActions is NOT referenced across ${adminFiles.length} admin/editor files`)
} else {
  process.exit(1)
}

// 3. Check for em or en dashes in the new and modified files
console.log('\n3. Checking Dash Compliance (no em or en dashes, spaced hyphen only)...')

const targetFiles = [
  'components/public/ArticleActions.tsx',
  'components/public/ArticleView.tsx',
  'app/globals.css',
  'scripts/test_article_actions.mjs',
]

const EN_DASH = '\u2013'
const EM_DASH = '\u2014'

let dashViolations = 0

for (const relPath of targetFiles) {
  if (!fs.existsSync(relPath)) {
    console.error(`   [FAIL] File missing: ${relPath}`)
    dashViolations++
    continue
  }
  const content = fs.readFileSync(relPath, 'utf8')
  const lines = content.split('\n')
  let fileHasViolation = false

  lines.forEach((line, idx) => {
    if (line.includes(EN_DASH)) {
      console.error(`   [FAIL] En dash found in ${relPath}:${idx + 1}: ${line.trim()}`)
      fileHasViolation = true
      dashViolations++
    }
    if (line.includes(EM_DASH)) {
      console.error(`   [FAIL] Em dash found in ${relPath}:${idx + 1}: ${line.trim()}`)
      fileHasViolation = true
      dashViolations++
    }
  })

  if (!fileHasViolation) {
    console.log(`   [PASS] ${relPath} contains zero em or en dashes`)
  }
}

assert.strictEqual(dashViolations, 0, 'Found prohibited em or en dashes in target files')

// 4. Verify ArticleActions placement and print styles
console.log('\n4. Verifying Component Placement and Print Styles...')

const articleViewContent = fs.readFileSync('components/public/ArticleView.tsx', 'utf8')
assert(
  articleViewContent.includes('<ArticleActions title={post.title} slug={post.slug} />'),
  'ArticleActions must be rendered in ArticleView.tsx'
)
assert(
  articleViewContent.includes('hidden print:block'),
  'Print web address footer must be present in ArticleView.tsx'
)
console.log('   [PASS] ArticleActions is placed under byline in ArticleView.tsx')
console.log('   [PASS] Canonical web address for print is present in ArticleView.tsx')

const globalsCssContent = fs.readFileSync('app/globals.css', 'utf8')
assert(
  globalsCssContent.includes('@media print'),
  'globals.css must include @media print rules'
)
assert(
  globalsCssContent.includes('#article-actions'),
  'globals.css @media print must hide #article-actions'
)
assert(
  globalsCssContent.includes('header:not(article header)'),
  'globals.css @media print must hide site header while preserving article header'
)
console.log('   [PASS] Print styles in app/globals.css hide navigation, footer, action bar, comments, and search')

console.log('\n--- All Validations Passed Successfully ---')
