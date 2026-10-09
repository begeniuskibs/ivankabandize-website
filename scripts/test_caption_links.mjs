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

console.log('=== TEST SUITE: patch-captions media matching & doc patching fixtures ===\n')

const { getStorageObjectName } = await import('./ghost-import/rehost.mjs')
const { findMatchingMediaNode, patchDocCaptions } = await import('./ghost-import/importer.mjs')

// (a) DB image node with rehosted src (ghost-<hash>-notion.png) and converted node with matching Ghost URL: must match
{
  const ghostUrl = 'https://begenius-thoughts.ghost.io/content/images/2022/09/notion.png'
  const objName = getStorageObjectName(ghostUrl, false)
  const dbSrc = `https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/public/post-images/${objName}`

  const convertedDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: ghostUrl,
          caption: 'Image from [Notion](https://notion.so/)',
        },
      },
    ],
  }
  const dbDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: dbSrc,
          caption: 'Image from Notion',
        },
      },
    ],
  }

  const { changes, unmatched } = patchDocCaptions({
    convertedDoc,
    dbDoc,
    slug: 'fixture-test-a',
  })

  console.log('Test (a): Rehosted storage URL matched to Ghost URL')
  console.log(`  Expected object name: ${objName}`)
  console.log(`  DB src:               ${dbSrc}`)
  console.log(`  Changes count:        ${changes.length} (Expected: 1)`)
  console.log(`  Unmatched count:      ${unmatched.length} (Expected: 0)`)
  if (changes[0]) {
    console.log(`  Matched node type:    ${changes[0].nodeType}`)
    console.log(`  Old caption:          ${changes[0].oldCaption}`)
    console.log(`  New caption:          ${changes[0].newCaption}`)
    changes[0].apply()
    console.log(`  Applied to dbDoc:     ${dbDoc.content[0].attrs.caption}`)
  }
  console.log()
}

// (b) Two DB images with same basename but different source URLs: chosen by hash, not basename
{
  const ghostUrl1 = 'https://begenius-thoughts.ghost.io/content/images/2021/01/diagram.png'
  const ghostUrl2 = 'https://begenius-thoughts.ghost.io/content/images/2023/05/diagram.png'
  const objName1 = getStorageObjectName(ghostUrl1, false)
  const objName2 = getStorageObjectName(ghostUrl2, false)

  const dbSrc1 = `https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/public/post-images/${objName1}`
  const dbSrc2 = `https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/public/post-images/${objName2}`

  const dbDoc = {
    type: 'doc',
    content: [
      { type: 'image', attrs: { src: dbSrc1, caption: 'Old Diagram 1' } },
      { type: 'image', attrs: { src: dbSrc2, caption: 'Old Diagram 2' } },
    ],
  }

  // Converted doc targets ONLY image 2 with a new link caption
  const convertedDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: ghostUrl2,
          caption: 'Updated [System Diagram](https://example.com/arch)',
        },
      },
    ],
  }

  const { changes, unmatched } = patchDocCaptions({
    convertedDoc,
    dbDoc,
    slug: 'fixture-test-b',
  })

  console.log('Test (b): Disambiguate two DB images with same basename by hash')
  console.log(`  ObjName 1 (Url 1):    ${objName1}`)
  console.log(`  ObjName 2 (Url 2):    ${objName2}`)
  console.log(`  Changes count:        ${changes.length} (Expected: 1)`)
  console.log(`  Unmatched count:      ${unmatched.length} (Expected: 0)`)
  if (changes[0]) {
    changes[0].apply()
    console.log(`  Image 1 caption:      ${dbDoc.content[0].attrs.caption} (Untouched: Old Diagram 1)`)
    console.log(`  Image 2 caption:      ${dbDoc.content[1].attrs.caption} (Updated: Link caption)`)
  }
  console.log()
}

// (c) No match: reported UNMATCHED, never guessed
{
  const convertedDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: 'https://begenius-thoughts.ghost.io/content/images/completely-unmatched-file.png',
          caption: 'Link caption for [Missing](https://example.com/missing)',
        },
      },
    ],
  }

  // DB doc has two images with different basenames, neither matches
  const dbDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: 'https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/public/post-images/ghost-abc123-existing1.png',
          caption: 'Existing 1',
        },
      },
      {
        type: 'image',
        attrs: {
          src: 'https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/public/post-images/ghost-def456-existing2.png',
          caption: 'Existing 2',
        },
      },
    ],
  }

  const { changes, unmatched } = patchDocCaptions({
    convertedDoc,
    dbDoc,
    slug: 'fixture-test-c',
  })

  console.log('Test (c): No match reported UNMATCHED, never guessed')
  console.log(`  Changes count:        ${changes.length} (Expected: 0)`)
  console.log(`  Unmatched count:      ${unmatched.length} (Expected: 1)`)
  if (unmatched[0]) {
    console.log(`  Unmatched node:       ${unmatched[0].nodeType}`)
    console.log(`  Unmatched caption:    ${unmatched[0].caption}`)
  }
  console.log()
}

// (d) Gallery with card-level caption: matched and only caption changes
{
  const img1 = 'https://begenius-thoughts.ghost.io/content/images/2022/beach1.jpg'
  const img2 = 'https://begenius-thoughts.ghost.io/content/images/2022/beach2.jpg'
  const dbSrc1 = `https://storage.supabase.co/post-images/${getStorageObjectName(img1)}`
  const dbSrc2 = `https://storage.supabase.co/post-images/${getStorageObjectName(img2)}`

  const convertedDoc = {
    type: 'doc',
    content: [
      {
        type: 'gallery',
        attrs: {
          images: [
            { url: img1, caption: 'Photo 1', width: 1200, height: 800 },
            { url: img2, caption: 'Photo 2', width: 1200, height: 800 },
          ],
          caption: 'Images of [Musana Camps](https://musanacamps.com/) beach and sunset',
        },
      },
    ],
  }

  const dbDoc = {
    type: 'doc',
    content: [
      {
        type: 'gallery',
        attrs: {
          images: [
            { url: dbSrc1, caption: 'Photo 1', width: 1200, height: 800 },
            { url: dbSrc2, caption: 'Photo 2', width: 1200, height: 800 },
          ],
          caption: 'Images of Musana Camps beach and sunset',
        },
      },
    ],
  }

  const originalImagesRef = dbDoc.content[0].attrs.images

  const { changes, unmatched } = patchDocCaptions({
    convertedDoc,
    dbDoc,
    slug: 'fixture-test-d',
  })

  console.log('Test (d): Gallery card-level caption matched and only caption changes')
  console.log(`  Changes count:        ${changes.length} (Expected: 1)`)
  console.log(`  Unmatched count:      ${unmatched.length} (Expected: 0)`)
  if (changes[0]) {
    console.log(`  Old caption:          ${changes[0].oldCaption}`)
    console.log(`  New caption:          ${changes[0].newCaption}`)
    changes[0].apply()
    console.log(`  Updated dbDoc caption:${dbDoc.content[0].attrs.caption}`)
    console.log(`  Images array preserved: ${dbDoc.content[0].attrs.images === originalImagesRef && dbDoc.content[0].attrs.images[0].url === dbSrc1}`)
  }
}

