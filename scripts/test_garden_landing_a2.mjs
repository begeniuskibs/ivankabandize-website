import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'

function runStaticChecks() {
  console.log('=== TEST GARDEN LANDING A2: STATIC VALIDATION SUITE ===\n')

  const landingPath = path.resolve('app/(site)/garden/page.tsx')
  const componentPath = path.resolve('components/public/GardenLandingA2.tsx')
  const scriptPath = path.resolve('scripts/test_garden_landing_a2.mjs')

  assert.ok(fs.existsSync(landingPath), 'app/(site)/garden/page.tsx must exist')
  assert.ok(fs.existsSync(componentPath), 'components/public/GardenLandingA2.tsx must exist')

  const landingContent = fs.readFileSync(landingPath, 'utf8')
  const componentContent = fs.readFileSync(componentPath, 'utf8')

  // 1. Four Category Titles Present
  console.log('--- 1. Testing Four Category Titles Present ---')
  const expectedTitles = [
    'Articles',
    'Curated Library',
    'Report Digests',
    'Resources',
  ]
  for (const title of expectedTitles) {
    const hasTitle = componentContent.includes(title)
    console.log(`[PASS] Category title present: "${title}"`)
    assert.ok(hasTitle, `Category title "${title}" must be present in GardenLandingA2.tsx`)
  }

  // 2. Colours Present
  console.log('\n--- 2. Testing Colour Palette Tokens ---')
  const expectedColours = [
    // Articles coral
    '#FEF1ED',
    '#F7D6CC',
    '#EF5B45',
    '#CF3F29',
    // Curated Library teal
    '#EAF6F4',
    '#C5E4E0',
    '#1B7F7A',
    // Report Digests gold
    '#FBF4E4',
    '#EFDFB8',
    '#A97B1A',
    // Resources slate
    '#EEEFF6',
    '#D5D8E8',
    '#5C5F73',
  ]
  for (const color of expectedColours) {
    const hasColor = componentContent.includes(color)
    console.log(`[PASS] Colour present: ${color}`)
    assert.ok(hasColor, `Colour ${color} must be present in GardenLandingA2.tsx`)
  }

  // 3. line-clamp-2 Used
  console.log('\n--- 3. Testing line-clamp-2 Usage ---')
  const hasLineClamp2 = componentContent.includes('line-clamp-2')
  console.log(`[PASS] line-clamp-2 found in component`)
  assert.ok(hasLineClamp2, 'line-clamp-2 must be used in GardenLandingA2.tsx')

  // 4. No posts.content in Landing Queries
  console.log('\n--- 4. Testing No posts.content in Landing Queries ---')
  const hasPostsContent =
    landingContent.includes('.select(\'content') ||
    landingContent.includes(', content,') ||
    landingContent.includes(', content ') ||
    landingContent.includes(',content,') ||
    landingContent.includes('posts.content')
  console.log(`[PASS] No posts.content selected in landing queries`)
  assert.ok(!hasPostsContent, 'posts.content must NOT be queried in app/(site)/garden/page.tsx')

  // 5. Library Card Has No Description or Preview Text
  console.log('\n--- 5. Testing Library Card Has No Description ---')
  const librarySection = componentContent.slice(
    componentContent.indexOf('id="library"'),
    componentContent.indexOf('id="digests-and-resources"')
  )
  const hasDescriptionInLibrary =
    librarySection.includes('recommendation_note') ||
    librarySection.includes('item.description') ||
    librarySection.includes('preview')
  console.log(`[PASS] Library card has no description or preview text`)
  assert.ok(!hasDescriptionInLibrary, 'Library card in GardenLandingA2.tsx must not render description or recommendation_note')

  // 6. 3D Icons & License Files
  console.log('\n--- 6. Testing 3D Icons and Card Art Files ---')
  const expectedFiles = [
    'public/garden-icons-3d/articles.svg',
    'public/garden-icons-3d/library.svg',
    'public/garden-icons-3d/digests.svg',
    'public/garden-icons-3d/resources.svg',
    'public/garden-card-art/articles.svg',
    'public/garden-card-art/library.svg',
    'public/garden-card-art/digests.svg',
    'public/garden-card-art/resources.svg',
  ]
  for (const file of expectedFiles) {
    const fullPath = path.resolve(file)
    assert.ok(fs.existsSync(fullPath), `Expected icon or card art file ${file} must exist`)
    const stats = fs.statSync(fullPath)
    assert.ok(stats.size > 0, `File ${file} must not be empty`)
    console.log(`[PASS] File verified: ${file} (${stats.size} bytes)`)
  }

  // 7. Check for Em Dash or En Dash in Changed Files
  console.log('\n--- 7. Testing Absence of Em/En Dashes in Changed Files ---')
  const changedFiles = [landingPath, componentPath, scriptPath]
  const emDashRegex = /[\u2013\u2014]/
  for (const filePath of changedFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    const match = content.match(emDashRegex)
    const relName = path.relative(process.cwd(), filePath)
    assert.ok(!match, `File ${relName} must not contain em or en dashes`)
    console.log(`[PASS] No em or en dashes in ${relName}`)
  }

  console.log('\n=== ALL STATIC CHECKS PASSED SUCCESSFULLY ===')
}

runStaticChecks()
