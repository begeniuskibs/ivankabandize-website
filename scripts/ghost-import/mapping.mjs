// Approved mapping for Ghost importer batch 0
// Streams in database: random_thoughts, structured_thoughts, tools_for_thought

export const APPROVED_MAPPINGS = [
  // 1-4
  { slug: 'fatherhood', stream: 'random_thoughts', tags: [], series: null },
  { slug: 'people-and-places', stream: 'random_thoughts', tags: [], series: null },
  { slug: 'did-it-count', stream: 'random_thoughts', tags: [], series: null },
  { slug: 'on-life-and-death', stream: 'random_thoughts', tags: [], series: null },
  // 5
  { slug: 'tools-that-have-triggered-my-growth-and-productivity', stream: 'tools_for_thought', tags: [], series: null },
  // 6
  { slug: 'starting-out-against-all-odds', stream: 'structured_thoughts', tags: ['Business'], series: null },
  // 7
  { slug: 'authentic-leadership', stream: 'random_thoughts', tags: ['Leadership'], series: null },
  // 8
  { slug: 'outgrow-your-implicit-bias', stream: 'random_thoughts', tags: [], series: null },
  // 9
  { slug: 'weekly-planning', stream: 'structured_thoughts', tags: ['Productivity'], series: null },
  // 10
  { slug: 'chatgpt-vs-notion-ai', stream: 'tools_for_thought', tags: ['Technology'], series: null },
  // 11
  { slug: 'how-i-plan-my-week', stream: 'structured_thoughts', tags: ['Productivity'], series: null },
  // 12
  { slug: 'fulfilling-exhaustion-finding-joy-in-purposeful-endeavors', stream: 'random_thoughts', tags: [], series: null },
  // 13
  { slug: 'leveraging-the-mckinsey-7s-framework-for-organizational-and-business-growth', stream: 'structured_thoughts', tags: ['Business'], series: null },
  // 14
  { slug: 'transforming-work-culture-a-biblical-perspective', stream: 'random_thoughts', tags: ['Faith'], series: null },
  // 15
  { slug: 'the-double-edged-sword-of-empathetic-leadership', stream: 'structured_thoughts', tags: ['Leadership'], series: null },
  // 16
  { slug: 'notion-charts-a-game-changer-for-data-visualization-in-notion', stream: 'tools_for_thought', tags: ['Notion'], series: null },
  // 17
  { slug: 'the-team-performance-curve-a-roadmap-for-team-leaders', stream: 'structured_thoughts', tags: ['Leadership'], series: null },
  // 18
  { slug: 'top-notion-updates-from-make-with-notion-2024', stream: 'tools_for_thought', tags: ['Notion'], series: null },
  // 19
  { slug: 'the-struggle-to-maintain-the-joyful-habits-that-renew-us', stream: 'random_thoughts', tags: ['Productivity'], series: null },
  // 20-48 (29 posts, series: 30in30, NO topic tag)
  { slug: 'building-social-capital', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'the-value-of-serving', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'embracing-lifelong-learning', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'focusing-on-the-big-rocks', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'unplug-often-embrace-solitude', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'building-healthy-habits', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'loving-giving-and-resilience-2', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'the-power-of-communication', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'the-feeling-of-i', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'stealing-like-an-artist', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'share-what-you-know', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'purchase-your-domain-name', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'learning-to-manage-money', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'generously-pay-it-forward', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'work-on-your-soft-skills', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'build-diverse-skillsets', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'you-are-not-a-fraud', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'play-the-long-game', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'learn-to-fail-forward', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'get-in-the-right-room', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'always-pursue-excellence', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'measure-what-matters', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'focus-less-is-more', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'work-life-harmony', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'set-healthy-boundaries', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'run-your-own-race', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'carry-your-own-weather', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'the-power-of-gratitude', stream: 'random_thoughts', tags: [], series: '30in30' },
  { slug: 'the-anchor-of-life', stream: 'random_thoughts', tags: [], series: '30in30' },
  // 49
  { slug: 'the-effective-annual-planning-framework', stream: 'structured_thoughts', tags: ['Productivity'], series: null },
  // 50
  { slug: 'a-letter-to-my-younger-self', stream: 'random_thoughts', tags: [], series: '30in30' },
  // Drafts
  { slug: 'on-pioneering-again', stream: 'random_thoughts', tags: [], series: null, isDraft: true },
  { slug: 'on-the-gain-and-the-gap', stream: 'random_thoughts', tags: [], series: null, isDraft: true },
]

export const EXCLUDED_SLUGS = [
  'a-first-step-prolonged-procrastination',
  'the-research-that-changed-everything',
  'welcome-to-my-space',
  'systems-over-goals',
  'apple-vision-pro-thoughts-impressions',
  'notion-weekly-planner',
  'the-ai-you-already-use',
  // Hub pages
  'structured-thoughts',
  'tools-for-thought',
  'random-thoughts',
  'books',
  // Other drafts and pages in Ghost export
  'coming-soon',
  'ivan-kabandize',
  'general-drafts-notes',
  'what-does-ai-chatgpt-have-to-say-about-no-code',
  'untitled',
]

export function validateMappingStats() {
  const published = APPROVED_MAPPINGS.filter(m => !m.isDraft)
  const drafts = APPROVED_MAPPINGS.filter(m => m.isDraft)
  
  const randomCount = published.filter(m => m.stream === 'random_thoughts').length
  const structuredCount = published.filter(m => m.stream === 'structured_thoughts').length
  const toolsCount = published.filter(m => m.stream === 'tools_for_thought').length
  const series30Count = published.filter(m => m.series === '30in30').length

  return {
    totalPublished: published.length,
    totalDrafts: drafts.length,
    totalCount: APPROVED_MAPPINGS.length,
    randomCount,
    structuredCount,
    toolsCount,
    series30Count,
  }
}

if (process.argv[1]?.endsWith('mapping.mjs')) {
  const stats = validateMappingStats()
  console.log('Mapping Stats:', stats)
}
