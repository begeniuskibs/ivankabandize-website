import fs from 'node:fs'

const exportPath = 'C:/Users/ivan.kabandize/ghost-export/begenius-thoughts.ghost.2026-09-21-17-50-28.json'
const raw = fs.readFileSync(exportPath, 'utf8')
const data = JSON.parse(raw)
const db = data.db[0].data

console.log('=== GHOST EXPORT BASELINE INSPECTION ===\n')

const posts = db.posts || []
const typeCounts = {}
const statusCounts = {}
const formatCounts = { lexical: 0, mobiledoc: 0, html: 0, other: 0 }

for (const p of posts) {
  typeCounts[p.type] = (typeCounts[p.type] || 0) + 1
  statusCounts[p.status] = (statusCounts[p.status] || 0) + 1
  if (p.lexical) formatCounts.lexical++
  else if (p.mobiledoc) formatCounts.mobiledoc++
  else if (p.html) formatCounts.html++
  else formatCounts.other++
}

console.log('Total items in export:', posts.length)
console.log('Type breakdown:', typeCounts)
console.log('Status breakdown:', statusCounts)
console.log('Format breakdown:', formatCounts)

const publishedPosts = posts.filter(p => p.type === 'post' && p.status === 'published')
const draftPosts = posts.filter(p => p.type === 'post' && p.status === 'draft')
const pages = posts.filter(p => p.type === 'page')

console.log(`\nPublished posts: ${publishedPosts.length}`)
console.log(`Draft posts: ${draftPosts.length}`)
console.log(`Pages: ${pages.length}`)

const approvedPublishedSlugs = [
  'fatherhood', 'people-and-places', 'did-it-count', 'on-life-and-death',
  'tools-that-have-triggered-my-growth-and-productivity', 'starting-out-against-all-odds',
  'authentic-leadership', 'outgrow-your-implicit-bias', 'weekly-planning',
  'chatgpt-vs-notion-ai', 'how-i-plan-my-week',
  'fulfilling-exhaustion-finding-joy-in-purposeful-endeavors',
  'leveraging-the-mckinsey-7s-framework-for-organizational-and-business-growth',
  'transforming-work-culture-a-biblical-perspective',
  'the-double-edged-sword-of-empathetic-leadership',
  'notion-charts-a-game-changer-for-data-visualization-in-notion',
  'the-team-performance-curve-a-roadmap-for-team-leaders',
  'top-notion-updates-from-make-with-notion-2024',
  'the-struggle-to-maintain-the-joyful-habits-that-renew-us',
  'building-social-capital', 'the-value-of-serving', 'embracing-lifelong-learning',
  'focusing-on-the-big-rocks', 'unplug-often-embrace-solitude', 'building-healthy-habits',
  'loving-giving-and-resilience-2', 'the-power-of-communication', 'the-feeling-of-i',
  'stealing-like-an-artist', 'share-what-you-know', 'purchase-your-domain-name',
  'learning-to-manage-money', 'generously-pay-it-forward', 'work-on-your-soft-skills',
  'build-diverse-skillsets', 'you-are-not-a-fraud', 'play-the-long-game',
  'learn-to-fail-forward', 'get-in-the-right-room', 'always-pursue-excellence',
  'measure-what-matters', 'focus-less-is-more', 'work-life-harmony',
  'set-healthy-boundaries', 'run-your-own-race', 'carry-your-own-weather',
  'the-power-of-gratitude', 'the-anchor-of-life',
  'the-effective-annual-planning-framework', 'a-letter-to-my-younger-self'
]

const approvedDraftSlugs = ['on-pioneering-again', 'on-the-gain-and-the-gap']
const allTargetSlugs = [...approvedPublishedSlugs, ...approvedDraftSlugs]

const postBySlug = new Map()
for (const p of posts) {
  postBySlug.set(p.slug, p)
}

const missing = allTargetSlugs.filter(slug => !postBySlug.has(slug))
console.log(`\nTarget posts (50 published + 2 drafts = 52 total):`)
console.log(`All 52 found in export: ${missing.length === 0}`)
if (missing.length > 0) {
  console.log('Missing slugs:', missing)
}

let targetLexical = 0
let targetMobiledoc = 0
for (const slug of allTargetSlugs) {
  const p = postBySlug.get(slug)
  if (p) {
    if (p.lexical) targetLexical++
    else if (p.mobiledoc) targetMobiledoc++
  }
}
console.log(`Target 52 posts formats: lexical = ${targetLexical}, mobiledoc = ${targetMobiledoc}`)
