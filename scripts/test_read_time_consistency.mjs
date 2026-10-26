import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { calculateReadTime } from '../lib/readTime.ts'

console.log('Testing read time consistency with synthetic TipTap documents...')

// Baseline algorithm previously embedded inside ArticleView.tsx
function originalArticleViewCalculateReadTime(content, excerpt) {
  let text = excerpt || ''
  const extractText = (node) => {
    if (!node) return
    if (node.text) text += ' ' + node.text
    if (Array.isArray(node.content)) node.content.forEach(extractText)
  }
  if (content && typeof content === 'object') {
    extractText(content)
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

// 1. Verify ArticleView.tsx imports calculateReadTime from @/lib/readTime
const articleViewCode = fs.readFileSync(path.resolve('components/public/ArticleView.tsx'), 'utf8')
assert.ok(
  articleViewCode.includes("from '@/lib/readTime'"),
  'ArticleView.tsx must import calculateReadTime from @/lib/readTime'
)
assert.ok(
  articleViewCode.includes('calculateReadTime(post.content, post.excerpt)'),
  'ArticleView.tsx must call calculateReadTime(post.content, post.excerpt)'
)
console.log('PASS: ArticleView.tsx imports calculateReadTime from @/lib/readTime and uses it')

// 2. Verify lib/postTeaser.ts exports getCardMeta
const postTeaserCode = fs.readFileSync(path.resolve('lib/postTeaser.ts'), 'utf8')
assert.ok(
  postTeaserCode.includes('export async function getCardMeta'),
  'lib/postTeaser.ts must export getCardMeta'
)
assert.ok(
  postTeaserCode.includes("from './readTime.ts'") || postTeaserCode.includes("from './readTime'"),
  'lib/postTeaser.ts must import calculateReadTime from ./readTime'
)
console.log('PASS: lib/postTeaser.ts exports getCardMeta helper')

// Helper to create synthetic TipTap documents of arbitrary word count
function makeSyntheticDoc(wordCount) {
  const words = Array.from({ length: wordCount }, (_, i) => `term${i + 1}`).join(' ')
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: words,
          },
        ],
      },
    ],
  }
}

// 3. Test cases using synthetic TipTap documents
const testCases = [
  {
    name: '150-word document (under 1 minute)',
    content: makeSyntheticDoc(150),
    excerpt: null,
    expectedMinutes: 1,
  },
  {
    name: '450-word document (approx 2.25 minutes -> 3 minutes)',
    content: makeSyntheticDoc(450),
    excerpt: null,
    expectedMinutes: 3,
  },
  {
    name: '1300-word document (approx 6.5 minutes -> 7 minutes)',
    content: makeSyntheticDoc(1300),
    excerpt: null,
    expectedMinutes: 7,
  },
  {
    name: 'Empty content case (null content and null excerpt -> expect 1)',
    content: null,
    excerpt: null,
    expectedMinutes: 1,
  },
  {
    name: 'Empty doc object with empty excerpt (expect 1)',
    content: { type: 'doc', content: [] },
    excerpt: '',
    expectedMinutes: 1,
  },
  {
    name: 'Excerpt case (content with excerpt combined)',
    content: makeSyntheticDoc(350),
    excerpt: 'This is a custom excerpt adding ten extra test words here',
    expectedMinutes: 2, // 350 + 10 = 360 words -> ceil(360 / 200) = 2
  },
  {
    name: 'Excerpt only case (no content object)',
    content: null,
    excerpt: 'Short excerpt alone without content doc body',
    expectedMinutes: 1,
  },
]

console.log('\n--- Evaluating Synthetic TipTap Documents ---')

for (let i = 0; i < testCases.length; i++) {
  const tc = testCases[i]
  const expectedFromBaseline = originalArticleViewCalculateReadTime(tc.content, tc.excerpt)
  const actual = calculateReadTime(tc.content, tc.excerpt)

  assert.strictEqual(
    actual,
    expectedFromBaseline,
    `Mismatch for "${tc.name}": actual ${actual} !== baseline ${expectedFromBaseline}`
  )
  assert.strictEqual(
    actual,
    tc.expectedMinutes,
    `Mismatch for "${tc.name}": actual ${actual} !== expected ${tc.expectedMinutes}`
  )

  console.log(`Case ${i + 1}: ${tc.name}`)
  console.log(`  Result: ${actual} min read (matches baseline: ${expectedFromBaseline})`)
}

console.log('\nAll synthetic TipTap document assertions passed successfully.')
