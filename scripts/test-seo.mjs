const BASE_URL = process.argv[2] || 'http://localhost:3000'

async function run() {
  console.log(`========================================`)
  console.log(`RUNNING SEO VERIFICATION ON: ${BASE_URL}`)
  console.log(`========================================`)

  // 1. Check Homepage RSS Link Tags
  const homeRes = await fetch(`${BASE_URL}/`)
  const homeHtml = await homeRes.text()
  const rssLinkMatches = homeHtml.match(/<link[^>]*rel=["']alternate["'][^>]*type=["']application\/rss\+xml["'][^>]*>/gi) || []
  console.log(`HOMEPAGE RSS LINK TAG COUNT: ${rssLinkMatches.length}`)
  if (rssLinkMatches.length === 1) {
    console.log(`RSS LINK TAG: ${rssLinkMatches[0]}`)
  } else {
    console.log(`WARNING: Expected exactly 1 RSS link tag, found ${rssLinkMatches.length}`)
  }

  // 2. Check /sitemap.xml
  const sitemapRes = await fetch(`${BASE_URL}/sitemap.xml`)
  const sitemapXml = await sitemapRes.text()
  const sitemapUrlCount = (sitemapXml.match(/<url>/g) || []).length
  console.log(`\nSITEMAP URL COUNT: ${sitemapUrlCount}`)

  // Known draft slugs in database to verify exclusion
  const sampleDrafts = [
    'welcome-to-my-space',
    'embracing-lifelong-learning',
    'focusing-on-the-big-rocks',
    'unplug-often-embrace-solitude',
    'systems-over-goals'
  ]
  const foundDrafts = sampleDrafts.filter(slug => sitemapXml.includes(slug))
  console.log(`DRAFT SLUGS IN SITEMAP: ${foundDrafts.length} (${foundDrafts.join(', ') || 'none'})`)

  const excludedPaths = ['/admin', '/preview', '/api', '/login', '/signup', '/auth']
  const foundExcluded = excludedPaths.filter(p => sitemapXml.includes(p))
  console.log(`EXCLUDED PATHS IN SITEMAP: ${foundExcluded.length} (${foundExcluded.join(', ') || 'none'})`)

function decodeEntities(str) {
  return (str || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
}

  // 3. Check /feed.xml
  const feedRes = await fetch(`${BASE_URL}/feed.xml`)
  const feedXml = await feedRes.text()

  console.log(`\n=== FEED.XML FIRST 30 LINES ===`)
  console.log(feedXml.split('\n').slice(0, 30).join('\n'))

  const descriptions = [...feedXml.matchAll(/<description>([\s\S]*?)<\/description>/g)].map(m => m[1])
  // Channel description is item 0, item descriptions are slice(1)
  const itemDescriptions = descriptions.slice(1)
  const emptyItemDescCount = itemDescriptions.filter(d => !d || d.trim().length === 0).length
  const over160ItemDesc = itemDescriptions.filter(d => decodeEntities(d).trim().length > 160)

  console.log(`\nFEED ITEMS COUNT: ${itemDescriptions.length}`)
  console.log(`FEED EMPTY DESCRIPTIONS COUNT: ${emptyItemDescCount}`)
  console.log(`FEED DESCRIPTIONS > 160 CHARS: ${over160ItemDesc.length}`)
  if (over160ItemDesc.length > 0) {
    console.log(`LONGEST ITEM DESCRIPTION (${decodeEntities(over160ItemDesc[0]).length} chars): ${over160ItemDesc[0]}`)
  }

  // 4. Check specific article meta descriptions
  const targetArticles = [
    '/garden/the-research-that-changed-everything',
    '/garden/the-ai-you-already-use',
    '/garden/a-first-step-prolonged-procrastination'
  ]

  console.log(`\n=== ARTICLE META DESCRIPTIONS ===`)
  for (const path of targetArticles) {
    const res = await fetch(`${BASE_URL}${path}`)
    const html = await res.text()
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i)
    const rawDesc = descMatch ? descMatch[1] : '(none)'
    const desc = decodeEntities(rawDesc)
    console.log(`PATH: ${path}`)
    console.log(`DESCRIPTION (${desc.length} chars): ${desc}`)
    console.log(`UNDER 160 CHARS: ${desc.length <= 160 ? 'yes' : 'no'}`)
  }

  // 5. Check non-public post robots tag (draft / non-public post)
  console.log(`\n=== NON-PUBLIC / DRAFT POST ROBOTS TAG ===`)
  const draftPath = '/garden/welcome-to-my-space'
  const draftRes = await fetch(`${BASE_URL}${draftPath}`)
  const draftHtml = await draftRes.text()
  const draftRobotsMatch = draftHtml.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i) ||
                           draftHtml.match(/<meta\s+content=["']([^"']*)["']\s+name=["']robots["']/i)
  console.log(`PATH: ${draftPath} (status: ${draftRes.status})`)
  console.log(`ROBOTS: ${draftRobotsMatch ? draftRobotsMatch[1] : '(none)'}`)
  console.log(`HAS NOINDEX: ${draftRobotsMatch && draftRobotsMatch[1].includes('noindex') ? 'yes' : 'no'}`)

  // 6. Check login robots tag
  console.log(`\n=== LOGIN PAGE ROBOTS TAG ===`)
  const loginRes = await fetch(`${BASE_URL}/login`)
  const loginHtml = await loginRes.text()
  const loginRobotsMatch = loginHtml.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i) ||
                           loginHtml.match(/<meta\s+content=["']([^"']*)["']\s+name=["']robots["']/i)
  console.log(`PATH: /login (status: ${loginRes.status})`)
  console.log(`ROBOTS: ${loginRobotsMatch ? loginRobotsMatch[1] : '(none)'}`)
}

run().catch(console.error)
