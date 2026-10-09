import fs from 'node:fs'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'
import { captionHtmlToText } from './ghost-import/converter.mjs'

import path from 'node:path'
import { pathToFileURL } from 'node:url'

const tsCode = fs.readFileSync('components/editor/captionLinks.tsx', 'utf8')
const jsCode = ts.transpileModule(tsCode, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText

const tempFile = path.resolve('components/editor/_temp_test_captionLinks.mjs')
fs.writeFileSync(tempFile, jsCode, 'utf8')
let renderCaption
try {
  const mod = await import(pathToFileURL(tempFile).href)
  renderCaption = mod.renderCaption
} finally {
  if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile)
}

console.log('=== TEST SUITE: renderCaption (react-dom/server) ===\n')

const renderCases = [
  { name: 'plain text', input: 'Just a plain caption without any links' },
  { name: 'one link', input: 'Image from [Notion](https://notion.so/)' },
  {
    name: 'two links',
    input: 'Designed by [Author](https://medium.com/@ivan) using [YouVersion](https://youversion.com/) resources',
  },
  { name: 'javascript: URL (must stay plain text)', input: 'Click [here](javascript:alert(1)) to see' },
  { name: 'internal "/garden/x" link', input: 'Read more at [my space](/garden/welcome-to-my-space)' },
]

for (const tc of renderCases) {
  const result = renderCaption(tc.input)
  const rendered = typeof result === 'string' ? result : renderToStaticMarkup(result)
  console.log(`Test: ${tc.name}`)
  console.log(`  Input:    ${tc.input}`)
  console.log(`  Rendered: ${rendered}`)
  console.log()
}

console.log('=== TEST SUITE: captionHtmlToText ===\n')

const uuidToSlugMap = new Map([['11111111-2222-3333-4444-555555555555', 'sample-post']])
const allGhostSlugs = new Set(['building-healthy-habits', 'sample-post'])

const convertCases = [
  {
    name: 'external link',
    input: 'Image from <a href="https://notion.so/" rel="noopener">Notion</a>',
  },
  {
    name: '__GHOST_URL__ link',
    input: 'Read more in <a href="__GHOST_URL__/building-healthy-habits/">Healthy Habits</a>',
  },
  {
    name: 'link with HTML entities',
    input: 'From <a href="https://example.com/?a=1&amp;b=2">Tom &amp; Jerry &quot;Show&quot;</a>',
  },
  {
    name: 'plain caption without links',
    input: '<p>A simple photo of <b>Lake Victoria</b> taken in 2022</p>',
  },
]

for (const tc of convertCases) {
  const result = captionHtmlToText(tc.input, uuidToSlugMap, allGhostSlugs)
  console.log(`Test: ${tc.name}`)
  console.log(`  Input:     ${tc.input}`)
  console.log(`  Converted: ${result}`)
  console.log()
}
