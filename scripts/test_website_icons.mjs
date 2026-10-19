import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('--- Testing Website Icons & SVG Safety ---')

let passed = true

// 1. Assert every file in public/icons/3d exists and is referenced somewhere or listed as spare
const icons3dDir = path.join(projectRoot, 'public', 'icons', '3d')
if (!fs.existsSync(icons3dDir)) {
  console.error('FAIL: Directory public/icons/3d does not exist')
  process.exit(1)
}

const icons3dFiles = fs.readdirSync(icons3dDir).filter((f) => f.endsWith('.svg'))
if (icons3dFiles.length !== 24) {
  console.error(`FAIL: Expected 24 3D icons, found ${icons3dFiles.length}`)
  passed = false
}

// Approved spares list for 3D icons not currently referenced in public copy
const approvedSpares = new Set([
  'link.svg',
  'print.svg',
  'share.svg',
  'sparkle.svg',
])

function walkFiles(dir, extensions) {
  let results = []
  if (!fs.existsSync(dir)) return results
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath, extensions))
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

const codeFiles = [
  ...walkFiles(path.join(projectRoot, 'app'), ['.tsx', '.ts']),
  ...walkFiles(path.join(projectRoot, 'components'), ['.tsx', '.ts']),
]

const allCodeContent = codeFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n')

for (const icon of icons3dFiles) {
  const isReferenced = allCodeContent.includes(`/icons/3d/${icon}`)
  const isSpare = approvedSpares.has(icon)
  if (!isReferenced && !isSpare) {
    console.error(`FAIL: Icon ${icon} is neither referenced in code nor listed as spare`)
    passed = false
  }
}
console.log(`PASS: All ${icons3dFiles.length} 3D icons exist and are referenced or approved spares.`)

// 2. Assert components/icons exports the listed icons
const expectedInterfaceIcons = [
  'chevron',
  'menu',
  'close',
  'search',
  'check',
  'mail',
  'link',
  'share',
  'comment',
  'print',
  'save',
  'open-in-new-tab',
  'download',
  'loading',
]

const iconsModulePath = path.join(projectRoot, 'components', 'icons', 'index.ts')
if (!fs.existsSync(iconsModulePath)) {
  console.error('FAIL: components/icons/index.ts does not exist')
  process.exit(1)
}

const iconsIndexContent = fs.readFileSync(iconsModulePath, 'utf8')
for (const iconName of expectedInterfaceIcons) {
  const hasNamedExport =
    iconsIndexContent.includes(`as ${iconName}`) ||
    iconsIndexContent.includes(`as '${iconName}'`) ||
    iconsIndexContent.includes(`as "${iconName}"`)
  if (!hasNamedExport) {
    console.error(`FAIL: components/icons does not export icon '${iconName}'`)
    passed = false
  }
}
console.log(`PASS: components/icons exports all ${expectedInterfaceIcons.length} listed interface icons.`)

// 3. Assert no Extended_Pictographic emoji remain in public-site .tsx files except explicit allowlist
const publicDirs = [
  path.join(projectRoot, 'app', '(site)'),
  path.join(projectRoot, 'components', 'public'),
  path.join(projectRoot, 'components', 'auth'),
  path.join(projectRoot, 'components', 'layout'),
]

const publicTsxFiles = publicDirs.flatMap((d) => walkFiles(d, ['.tsx']))

// Explicit allowlist of permissible emojis/pictographs on the public site
const allowlist = [
  {
    file: 'components/public/Footer.tsx',
    emoji: '©',
    reason: 'Standard copyright notice symbol in footer',
  },
  {
    file: 'components/public/GardenFeed.tsx',
    emoji: '↗',
    reason: 'North-east arrow indicator in external link text (Visit ↗)',
  },
  {
    file: 'app/(site)/now/page.tsx',
    emoji: '📻',
    reason: 'Radio emoji for Power FM radio entry - no clear match in icon set, left unchanged per prompt rule',
  },
]

console.log('--- Explicit Allowlist of Emojis/Symbols ---')
for (const item of allowlist) {
  console.log(`  - [${item.emoji}] in ${item.file}: ${item.reason}`)
}

const emojiRegex = /\p{Extended_Pictographic}/u

let unexpectedEmojis = 0
for (const file of publicTsxFiles) {
  const relPath = path.relative(projectRoot, file).replace(/\\/g, '/')
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line, idx) => {
    const matches = line.match(new RegExp(emojiRegex.source, 'gu'))
    if (matches) {
      for (const m of matches) {
        const allowed = allowlist.some(
          (a) => relPath === a.file && m === a.emoji
        )
        if (!allowed) {
          console.error(`FAIL: Unexpected emoji [${m}] in ${relPath}:${idx + 1} -> ${line.trim()}`)
          unexpectedEmojis++
          passed = false
        }
      }
    }
  })
}

if (unexpectedEmojis === 0) {
  console.log('PASS: No unapproved emojis found in public-site .tsx files.')
}

// 4. Assert SVG safety scan passes (no script, foreignObject, event handler attributes, or external hrefs)
const forbiddenSvgPatterns = [
  { name: '<script>', regex: /<script[\s>]/i },
  { name: '<foreignObject>', regex: /<foreignObject[\s>]/i },
  { name: 'event handler (e.g., onload, onclick)', regex: /\son\w+\s*=/i },
  { name: 'external href (http:// or https://)', regex: /href\s*=\s*['"]https?:\/\//i },
]

const svgScanDirs = [icons3dDir, path.join(projectRoot, 'components', 'icons')]
const svgFilesToScan = svgScanDirs.flatMap((d) => walkFiles(d, ['.svg', '.tsx', '.ts']))

let svgSafetyFailures = 0
for (const file of svgFilesToScan) {
  const content = fs.readFileSync(file, 'utf8')
  for (const pat of forbiddenSvgPatterns) {
    if (pat.regex.test(content)) {
      console.error(`FAIL SVG SAFETY: ${file} matches ${pat.name}`)
      svgSafetyFailures++
      passed = false
    }
  }
}

if (svgSafetyFailures === 0) {
  console.log(`PASS: SVG safety scan passed for all ${svgFilesToScan.length} scanned icon files.`)
}

// 5. Assert the four home card icons exist in app/(site)/page.tsx
const homePagePath = path.join(projectRoot, 'app', '(site)', 'page.tsx')
const homePageContent = fs.readFileSync(homePagePath, 'utf8')
const expectedHomeCardIcons = [
  '/icons/3d/building-blocks.svg',
  '/icons/3d/gear.svg',
  '/icons/3d/compass.svg',
  '/icons/3d/robot.svg',
]

for (const iconPath of expectedHomeCardIcons) {
  if (!homePageContent.includes(iconPath)) {
    console.error(`FAIL: Home page does not contain expected card icon: ${iconPath}`)
    passed = false
  }
}
console.log('PASS: All four home card 3D icons exist in app/(site)/page.tsx.')

// 6. Assert removed frame class patterns are gone from target files
const removedFrameChecks = [
  {
    file: 'app/(site)/workwithme/page.tsx',
    pattern: /w-14\s+h-14\s+rounded-2xl\s+bg-white/,
    desc: 'w-14 h-14 rounded-2xl bg-white on icon tiles',
  },
  {
    file: 'app/(site)/me/page.tsx',
    pattern: /w-14\s+h-14\s+rounded-2xl\s+bg-white/,
    desc: 'w-14 h-14 rounded-2xl bg-white on icon tiles',
  },
  {
    file: 'app/(site)/me/page.tsx',
    pattern: /w-10\s+h-10\s+rounded-xl/,
    desc: 'w-10 h-10 rounded-xl on small tinted squares',
  },
  {
    file: 'app/(site)/forgot-password/ForgotPasswordClient.tsx',
    pattern: /w-16\s+h-16\s+rounded-full\s+bg-\[#FDF0EE\]/,
    desc: 'w-16 h-16 rounded-full bg-[#FDF0EE] circle',
  },
  {
    file: 'app/(site)/auth/reset-password/page.tsx',
    pattern: /w-16\s+h-16\s+rounded-full\s+bg-\[#FDF0EE\]/,
    desc: 'w-16 h-16 rounded-full bg-[#FDF0EE] circle',
  },
  {
    file: 'components/auth/SlidingAuthCard.tsx',
    pattern: /w-16\s+h-16\s+rounded-full\s+bg-\[#FDF0EE\]/,
    desc: 'w-16 h-16 rounded-full bg-[#FDF0EE] circle',
  },
]

for (const check of removedFrameChecks) {
  const filePath = path.join(projectRoot, check.file)
  const content = fs.readFileSync(filePath, 'utf8')
  if (check.pattern.test(content)) {
    console.error(`FAIL: ${check.file} still contains removed frame pattern: ${check.desc}`)
    passed = false
  }
}
console.log('PASS: All removed frame patterns are completely gone from target files.')

// 7. Assert no entity-encoded emoji remain outside the printed allowlist
const entityEmojiRegex = /&#(?:x[0-9a-fA-F]+|\d+);/g
const entityAllowlist = [
  {
    file: 'app/(site)/page.tsx',
    entity: '&#128075;',
    reason: "Waving hand on Hey Friends and Let's Talk CTA button",
  },
  {
    file: 'app/(site)/workwithme/page.tsx',
    entity: '&#128075;',
    reason: "Waving hand on Let's Talk CTA button",
  },
  {
    file: 'app/(site)/me/page.tsx',
    entity: '&#128075;',
    reason: "Waving hand on Let's Talk CTA button",
  },
]

console.log('--- Explicit Allowlist of Entity Emojis ---')
for (const item of entityAllowlist) {
  console.log(`  - [${item.entity}] in ${item.file}: ${item.reason}`)
}

let unexpectedEntities = 0
for (const file of publicTsxFiles) {
  const relPath = path.relative(projectRoot, file).replace(/\\/g, '/')
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line, idx) => {
    const matches = line.match(entityEmojiRegex)
    if (matches) {
      for (const m of matches) {
        const allowed = entityAllowlist.some(
          (a) => relPath === a.file && m === a.entity
        )
        if (!allowed) {
          console.error(`FAIL: Unexpected entity emoji [${m}] in ${relPath}:${idx + 1} -> ${line.trim()}`)
          unexpectedEntities++
          passed = false
        }
      }
    }
  })
}

if (unexpectedEntities === 0) {
  console.log('PASS: No unapproved entity-encoded emojis found in public-site .tsx files.')
}

if (!passed) {
  console.error('\nFAIL: Website icon assertions failed.')
  process.exit(1)
}

console.log('\nALL WEBSITE ICON TESTS PASSED.')
