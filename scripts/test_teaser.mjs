import assert from 'node:assert'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Ensure node runs with -C react-server so that 'server-only' can be imported in tests
if (!process.execArgv.some((arg) => arg.includes('react-server'))) {
  const currentScript = fileURLToPath(import.meta.url)
  const result = spawnSync(process.execPath, ['-C', 'react-server', currentScript, ...process.argv.slice(2)], {
    stdio: 'inherit',
  })
  process.exit(result.status ?? 0)
}

const {
  extractFirstParagraph,
  extractNodeText,
  isTeaserEligible,
} = await import('../lib/postTeaser.ts')

console.log('Running post teaser helper tests...')

// 1. extractNodeText helper
assert.strictEqual(extractNodeText(null), '', 'Null node returns empty string')
assert.strictEqual(extractNodeText({ text: 'Hello' }), 'Hello', 'Extracts simple text')
assert.strictEqual(
  extractNodeText({
    content: [{ text: 'Hello ' }, { text: 'world' }],
  }),
  'Hello world',
  'Extracts nested text'
)

// 2. extractFirstParagraph - empty doc cases
assert.strictEqual(extractFirstParagraph(null), null, 'Null doc returns null')
assert.strictEqual(extractFirstParagraph({}), null, 'Empty object returns null')
assert.strictEqual(extractFirstParagraph({ type: 'doc', content: [] }), null, 'Empty content array returns null')
assert.strictEqual(
  extractFirstParagraph({
    type: 'doc',
    content: [{ type: 'paragraph', content: [] }],
  }),
  null,
  'Paragraph without text returns null'
)
assert.strictEqual(
  extractFirstParagraph({
    type: 'doc',
    content: [{ type: 'paragraph', content: [{ type: 'text', text: '   \n  ' }] }],
  }),
  null,
  'Whitespace-only paragraph returns null'
)

// 3. extractFirstParagraph - heading-first doc
const headingFirstDoc = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'This is the Main Headline' }],
    },
    {
      type: 'heading',
      attrs: { level: 2 },
      content: [{ type: 'text', text: 'A Subtitle' }],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'First paragraph of the actual article content after headings.' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Second paragraph that must never leak.' },
      ],
    },
  ],
}
assert.strictEqual(
  extractFirstParagraph(headingFirstDoc),
  'First paragraph of the actual article content after headings.',
  'Extracts first paragraph in heading-first doc'
)

// 4. extractFirstParagraph - list-first doc
const listFirstDoc = {
  type: 'doc',
  content: [
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'text', text: 'Key takeaway bullet 1' }],
        },
        {
          type: 'listItem',
          content: [{ type: 'text', text: 'Key takeaway bullet 2' }],
        },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is the opening narrative paragraph following the bullet list.' },
      ],
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Third paragraph that should remain private.' },
      ],
    },
  ],
}
assert.strictEqual(
  extractFirstParagraph(listFirstDoc),
  'This is the opening narrative paragraph following the bullet list.',
  'Extracts first body paragraph in list-first doc'
)

// 4b. extractFirstParagraph - doc with only nested list paragraphs
const nestedOnlyDoc = {
  type: 'doc',
  content: [
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'First paragraph inside bullet list item.' }],
            },
          ],
        },
      ],
    },
  ],
}
assert.strictEqual(
  extractFirstParagraph(nestedOnlyDoc),
  'First paragraph inside bullet list item.',
  'Falls back to nested paragraph if no top-level paragraph exists'
)

// 5. isTeaserEligible - returns null / false for draft / scheduled / public
const pastDate = new Date(Date.now() - 3600000).toISOString()
const futureDate = new Date(Date.now() + 3600000).toISOString()

// Draft posts must never be eligible for teaser (404 as today)
assert.strictEqual(
  isTeaserEligible({
    publish_status: 'draft',
    published_at: pastDate,
    visibility: 'free',
  }),
  false,
  'Draft post is not eligible for teaser'
)

// Scheduled posts must never be eligible for teaser
assert.strictEqual(
  isTeaserEligible({
    publish_status: 'published',
    published_at: futureDate,
    visibility: 'free',
  }),
  false,
  'Scheduled post (future published_at) is not eligible for teaser'
)

// Public posts do NOT use the teaser path (served via full article path)
assert.strictEqual(
  isTeaserEligible({
    publish_status: 'published',
    published_at: pastDate,
    visibility: 'public',
  }),
  false,
  'Public post returns false for teaser eligibility (served normally)'
)

// Null / missing published_at
assert.strictEqual(
  isTeaserEligible({
    publish_status: 'published',
    published_at: null,
    visibility: 'free',
  }),
  false,
  'Post without published_at returns false'
)

// Members-only non-public published posts ARE eligible
assert.strictEqual(
  isTeaserEligible({
    publish_status: 'published',
    published_at: pastDate,
    visibility: 'free',
  }),
  true,
  'Published non-public (free) post is eligible for teaser'
)

assert.strictEqual(
  isTeaserEligible({
    publish_status: 'published',
    published_at: pastDate,
    visibility: 'paid',
  }),
  true,
  'Published non-public (paid) post is eligible for teaser'
)

assert.strictEqual(
  isTeaserEligible({
    publish_status: 'published',
    published_at: pastDate,
    visibility: 'comped',
  }),
  true,
  'Published non-public (comped) post is eligible for teaser'
)

console.log('✔ All post teaser helper tests passed successfully!')
