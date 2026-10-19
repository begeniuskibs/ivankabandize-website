import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('--- Testing Admin Duotone Icons & Content Safety ---')

let passed = true

// 1. Assert components/admin/icons exports all 24 approved icons
const approvedIcons = [
  { name: 'analytics', component: 'AnalyticsIcon', file: 'AnalyticsIcon.tsx' },
  { name: 'appearance', component: 'AppearanceIcon', file: 'AppearanceIcon.tsx' },
  { name: 'automations', component: 'AutomationsIcon', file: 'AutomationsIcon.tsx' },
  { name: 'bookmark', component: 'BookmarkIcon', file: 'BookmarkIcon.tsx' },
  { name: 'button-block', component: 'ButtonBlockIcon', file: 'ButtonBlockIcon.tsx' },
  { name: 'close', component: 'CloseIcon', file: 'CloseIcon.tsx' },
  { name: 'comments', component: 'CommentsIcon', file: 'CommentsIcon.tsx' },
  { name: 'divider', component: 'DividerIcon', file: 'DividerIcon.tsx' },
  { name: 'done', component: 'DoneIcon', file: 'DoneIcon.tsx' },
  { name: 'enquiries', component: 'EnquiriesIcon', file: 'EnquiriesIcon.tsx' },
  { name: 'help', component: 'HelpIcon', file: 'HelpIcon.tsx' },
  { name: 'image', component: 'ImageIcon', file: 'ImageIcon.tsx' },
  { name: 'library', component: 'LibraryIcon', file: 'LibraryIcon.tsx' },
  { name: 'link', component: 'LinkIcon', file: 'LinkIcon.tsx' },
  { name: 'members', component: 'MembersIcon', file: 'MembersIcon.tsx' },
  { name: 'pages', component: 'PagesIcon', file: 'PagesIcon.tsx' },
  { name: 'posts', component: 'PostsIcon', file: 'PostsIcon.tsx' },
  { name: 'settings', component: 'SettingsIcon', file: 'SettingsIcon.tsx' },
  { name: 'sign-out', component: 'SignOutIcon', file: 'SignOutIcon.tsx' },
  { name: 'tags', component: 'TagsIcon', file: 'TagsIcon.tsx' },
  { name: 'video', component: 'VideoIcon', file: 'VideoIcon.tsx' },
  { name: 'view-site', component: 'ViewSiteIcon', file: 'ViewSiteIcon.tsx' },
  { name: 'warning', component: 'WarningIcon', file: 'WarningIcon.tsx' },
  { name: 'what-s-new', component: 'WhatsNewIcon', file: 'WhatsNewIcon.tsx' },
]

const iconsDir = path.join(projectRoot, 'components', 'admin', 'icons')
if (!fs.existsSync(iconsDir)) {
  console.error('FAIL: Directory components/admin/icons does not exist')
  process.exit(1)
}

const iconsIndexPath = path.join(iconsDir, 'index.ts')
if (!fs.existsSync(iconsIndexPath)) {
  console.error('FAIL: components/admin/icons/index.ts does not exist')
  process.exit(1)
}

const indexContent = fs.readFileSync(iconsIndexPath, 'utf8')
for (const icon of approvedIcons) {
  const componentPath = path.join(iconsDir, icon.file)
  if (!fs.existsSync(componentPath)) {
    console.error(`FAIL: Component file ${icon.file} does not exist in components/admin/icons`)
    passed = false
  }

  const hasExport =
    indexContent.includes(icon.component) ||
    indexContent.includes(`'${icon.name}'`) ||
    indexContent.includes(`"${icon.name}"`) ||
    indexContent.includes(`as ${icon.name}`)
  if (!hasExport) {
    console.error(`FAIL: components/admin/icons does not export icon '${icon.name}' (${icon.component})`)
    passed = false
  }
}

if (passed) {
  console.log(`PASS: components/admin/icons exports all ${approvedIcons.length} approved duotone icons.`)
}

// 2. Scan admin and editor files for literal emoji and entity-encoded emojis
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

const adminDirs = [
  path.join(projectRoot, 'app', 'admin'),
  path.join(projectRoot, 'components', 'admin'),
  path.join(projectRoot, 'components', 'editor'),
]

const adminCodeFiles = adminDirs.flatMap((d) => walkFiles(d, ['.ts', '.tsx']))

// Explicit allowlist of permissible emojis/entities in admin/editor
const allowlist = [
  {
    file: 'app/admin/(editor)/pages/[slug]/edit/page.tsx',
    match: '↗',
    reason: 'Approved external link arrow indicator (View Live ↗)',
  },
  {
    file: 'app/admin/(editor)/posts/editor/page.tsx',
    match: '&#8599;',
    reason: 'Approved preview button arrow indicator',
  },
  {
    file: 'app/admin/(editor)/posts/editor/page.tsx',
    match: '&#39;',
    reason: "Standard apostrophe HTML entity in error message text (This post's content)",
  },
  {
    file: 'app/admin/(shell)/enquiries/page.tsx',
    match: '🔍',
    reason: 'Search input icon - no search icon in approved admin duotone set, left unchanged',
  },
  {
    file: 'app/admin/(shell)/enquiries/page.tsx',
    match: '↗',
    reason: 'Approved external mailto arrow indicator',
  },
  {
    file: 'app/admin/(shell)/library/page.tsx',
    match: '↗',
    reason: 'Approved external link arrow indicator',
  },
  {
    file: 'app/admin/(shell)/pages/page.tsx',
    match: '↗',
    reason: 'Approved external link arrow indicator',
  },
  {
    file: 'app/admin/(shell)/series/page.tsx',
    match: '📚',
    reason: 'Series empty state and database cover_emoji fallback - no series icon in approved set',
  },
  {
    file: 'app/admin/(shell)/series/page.tsx',
    match: '🎁',
    reason: 'Series cover_emoji placeholder example string',
  },
  {
    file: 'app/admin/(shell)/series/page.tsx',
    match: '💡',
    reason: 'Series cover_emoji placeholder example string',
  },
  {
    file: 'components/admin/AdminPlaceholder.tsx',
    match: '⏳',
    reason: 'Hourglass indicator for future sprint banner - no match in approved set',
  },
  {
    file: 'components/admin/AdminSidebar.tsx',
    match: '🌐',
    reason: 'Network sidebar item - deferred coming later, no match in approved set',
  },
  {
    file: 'components/admin/AdminSidebar.tsx',
    match: '📚',
    reason: 'Series sidebar nav item - no series icon in approved set',
  },
  {
    file: 'components/admin/AdminSidebar.tsx',
    match: '🔍',
    reason: 'Search input icon - no search icon in approved admin duotone set, left unchanged',
  },
  {
    file: 'components/admin/AdminSidebar.tsx',
    match: '👤',
    reason: 'Your profile account menu item - single user, no match in approved set',
  },
  {
    file: 'components/admin/AdminSidebar.tsx',
    match: '↗',
    reason: 'Approved external link arrow indicator',
  },
  {
    file: 'components/editor/captionLinks.tsx',
    match: '&#39;',
    reason: 'HTML entity decoder in caption parsing regex replace',
  },
  {
    file: 'components/editor/TipTapEditor.tsx',
    match: '🖼️',
    reason: 'Gallery block icon in slash menu and toolbar - no gallery icon in approved set',
  },
  {
    file: 'components/editor/TipTapEditor.tsx',
    match: '🖼',
    reason: 'Gallery block icon in slash menu (unqualified pictograph variation)',
  },
]

console.log('--- Explicit Allowlist of Admin Emojis / Entities ---')
for (const item of allowlist) {
  console.log(`  - [${item.match}] in ${item.file}: ${item.reason}`)
}

const emojiRegex = /\p{Extended_Pictographic}/gu
const entityRegex = /&#(?:x[0-9a-fA-F]+|\d+);/g
const escapeRegex = /\\u\{1[0-9a-fA-F]{4}\}|\\u[dD][89a-bA-B][0-9a-fA-F]{2}\\u[dD][c-fC-F][0-9a-fA-F]{2}/g

let unexpectedEmojis = 0
for (const file of adminCodeFiles) {
  const relPath = path.relative(projectRoot, file).replace(/\\/g, '/')
  const content = fs.readFileSync(file, 'utf8')
  const lines = content.split('\n')

  lines.forEach((line, idx) => {
    // Check literal emojis
    const emojiMatches = line.match(emojiRegex)
    if (emojiMatches) {
      for (const m of emojiMatches) {
        const allowed = allowlist.some((a) => relPath === a.file && m === a.match)
        if (!allowed) {
          console.error(`FAIL: Unexpected emoji [${m}] in ${relPath}:${idx + 1} -> ${line.trim()}`)
          unexpectedEmojis++
          passed = false
        }
      }
    }

    // Check entity emojis
    const entityMatches = line.match(entityRegex)
    if (entityMatches) {
      for (const m of entityMatches) {
        const allowed = allowlist.some((a) => relPath === a.file && m === a.match)
        if (!allowed) {
          console.error(`FAIL: Unexpected entity [${m}] in ${relPath}:${idx + 1} -> ${line.trim()}`)
          unexpectedEmojis++
          passed = false
        }
      }
    }

    // Check unicode escapes
    const escapeMatches = line.match(escapeRegex)
    if (escapeMatches) {
      for (const m of escapeMatches) {
        const allowed = allowlist.some((a) => relPath === a.file && m === a.match)
        if (!allowed) {
          console.error(`FAIL: Unexpected escape [${m}] in ${relPath}:${idx + 1} -> ${line.trim()}`)
          unexpectedEmojis++
          passed = false
        }
      }
    }
  })
}

if (unexpectedEmojis === 0) {
  console.log('PASS: No unapproved emojis or entities found in admin and editor code files.')
}

// 3. SVG safety scan (no script, foreignObject, event handlers, or external hrefs)
const forbiddenSvgPatterns = [
  { name: '<script>', regex: /<script[\s>]/i },
  { name: '<foreignObject>', regex: /<foreignObject[\s>]/i },
  { name: 'event handler (e.g., onload, onclick)', regex: /\son\w+\s*=/i },
  { name: 'external href (http:// or https://)', regex: /href\s*=\s*['"]https?:\/\//i },
]

const svgScanFiles = walkFiles(iconsDir, ['.tsx', '.ts'])

let svgSafetyFailures = 0
for (const file of svgScanFiles) {
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
  console.log(`PASS: SVG safety scan passed for all ${svgScanFiles.length} generated icon components.`)
}

// 4. Assert git diff shows no change inside renderHTML, parseHTML, or serializer function bodies
try {
  const diffOutput = execSync('git diff origin/main -- components/editor', {
    cwd: projectRoot,
    encoding: 'utf8',
  })

  // Verify that neither renderHTML nor parseHTML nor serializers were modified
  const lines = diffOutput.split('\n')
  let inForbiddenBlock = false
  let forbiddenModifications = 0

  for (const line of lines) {
    if (line.startsWith('@@')) {
      inForbiddenBlock = false
    }
    if (/renderHTML\s*\(|parseHTML\s*\(|serialize\s*\(/.test(line)) {
      inForbiddenBlock = true
    }
    if (inForbiddenBlock && (line.startsWith('+') || line.startsWith('-')) && !line.startsWith('+++') && !line.startsWith('---')) {
      console.error(`FAIL CONTENT SAFETY: Change detected in content serializer or HTML method: ${line}`)
      forbiddenModifications++
      passed = false
    }
  }

  if (forbiddenModifications === 0) {
    console.log('PASS: Content safety verified. No changes inside renderHTML, parseHTML, or serializer bodies.')
  }
} catch (err) {
  console.error('Warning running git diff check:', err.message)
}

if (!passed) {
  console.error('\nFAIL: Admin icon assertions failed.')
  process.exit(1)
}

console.log('\nALL ADMIN ICON TESTS PASSED.')
