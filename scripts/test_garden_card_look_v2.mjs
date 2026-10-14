import fs from 'node:fs'
import path from 'node:path'
import assert from 'node:assert'

console.log('Running test_garden_card_look_v2.mjs...')

const landingComponentPath = path.resolve('components/public/GardenLandingA2.tsx')
assert.ok(fs.existsSync(landingComponentPath), 'GardenLandingA2.tsx must exist')
const landingCode = fs.readFileSync(landingComponentPath, 'utf8')

// 1. Assert four svg art paths are referenced
const expectedArtPaths = [
  '/garden-card-art/articles.svg',
  '/garden-card-art/library.svg',
  '/garden-card-art/digests.svg',
  '/garden-card-art/resources.svg',
]

for (const artPath of expectedArtPaths) {
  assert.ok(
    landingCode.includes(artPath),
    `GardenLandingA2.tsx must reference background art: ${artPath}`
  )
}
console.log('PASS: All 4 svg card art paths are referenced')

// 2. Assert four svg 3D icon paths are referenced
const expectedIconPaths = [
  '/garden-icons-3d/articles.svg',
  '/garden-icons-3d/library.svg',
  '/garden-icons-3d/digests.svg',
  '/garden-icons-3d/resources.svg',
]

for (const iconPath of expectedIconPaths) {
  assert.ok(
    landingCode.includes(iconPath),
    `GardenLandingA2.tsx must reference 3D icon: ${iconPath}`
  )
}
console.log('PASS: All 4 svg 3D icon paths are referenced')

// 3. Assert the two link targets remain
assert.ok(
  landingCode.includes('href="/garden?view=articles"'),
  'GardenLandingA2.tsx must link to /garden?view=articles'
)
assert.ok(
  landingCode.includes('href="/library"'),
  'GardenLandingA2.tsx must link to /library'
)
console.log('PASS: Both link targets (/garden?view=articles, /library) remain intact')

// 4. Assert no .png from garden-icons remains referenced
assert.ok(
  !landingCode.includes('/garden-icons/'),
  'GardenLandingA2.tsx must not reference old /garden-icons/ path'
)
assert.ok(
  !landingCode.includes('.png'),
  'GardenLandingA2.tsx must not reference any .png icon files for category cards'
)
console.log('PASS: No old garden-icons .png files remain referenced')

// 5. Assert backdrop-blur is used
assert.ok(
  landingCode.includes('backdrop-blur'),
  'GardenLandingA2.tsx must use backdrop-blur for frosted glass elements'
)
console.log('PASS: backdrop-blur is used for frosted glass tile and plate')

// 6. Assert all 12 assets exist on disk and are non-empty
const allAssets = [
  'public/garden-card-art/articles.svg',
  'public/garden-card-art/library.svg',
  'public/garden-card-art/digests.svg',
  'public/garden-card-art/resources.svg',
  'public/garden-icons-3d/articles.svg',
  'public/garden-icons-3d/library.svg',
  'public/garden-icons-3d/digests.svg',
  'public/garden-icons-3d/resources.svg',
  'public/garden-heroes/articles.jpg',
  'public/garden-heroes/library.jpg',
  'public/garden-heroes/digests.jpg',
  'public/garden-heroes/resources.jpg',
]

for (const asset of allAssets) {
  const assetPath = path.resolve(asset)
  assert.ok(fs.existsSync(assetPath), `Asset file ${asset} must exist on disk`)
  const stat = fs.statSync(assetPath)
  assert.ok(stat.size > 0, `Asset file ${asset} must not be empty`)
}
console.log('PASS: All 12 asset files exist on disk and are non-empty')

// 7. Check House Style: No em dashes (\u2014) or en dashes (\u2013)
const filesToCheck = [
  'components/public/GardenLandingA2.tsx',
  'scripts/test_garden_card_look_v2.mjs',
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

console.log('\nAll garden card look V2 assertions passed successfully.')
