import fs from 'node:fs'
import ts from 'typescript'
import { renderToStaticMarkup } from 'react-dom/server'
import { getSchema } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import { captionHtmlToText } from './ghost-import/converter.mjs'
import { editorSchema } from './ghost-import/editorSchema.mjs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const tsCode = fs.readFileSync('components/editor/captionLinks.tsx', 'utf8')
const jsCode = ts.transpileModule(tsCode, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText

const tempFile = path.resolve('components/editor/_temp_test_captionLinks.mjs')
fs.writeFileSync(tempFile, jsCode, 'utf8')
let renderCaption
let wrapSelectionAsLink
try {
  const mod = await import(pathToFileURL(tempFile).href)
  renderCaption = mod.renderCaption
  wrapSelectionAsLink = mod.wrapSelectionAsLink
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
  console.log()
}

console.log('=== TEST SUITE: TipTap editor schema caption survival (Step 3) ===\n')

// 3(a): Editor schema (with CustomImage) keeps caption
{
  const inputDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: 'https://x/y.png',
          alt: 'a',
          caption: 'Image from [Notion](https://notion.so/)',
        },
      },
    ],
  }
  const result = editorSchema.nodeFromJSON(inputDoc).toJSON()
  console.log('Test 3(a): CustomImage keeps caption:')
  console.log(JSON.stringify(result, null, 2))
  console.log(`  Caption preserved: ${result.content[0].attrs.caption === 'Image from [Notion](https://notion.so/)'}`)
  console.log()
}

// 3(b): Stock Image schema DROPS caption (proving the test detects the bug)
{
  const stockSchema = getSchema([
    StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    Image.configure({ allowBase64: true }),
  ])
  const inputDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: 'https://x/y.png',
          alt: 'a',
          caption: 'Image from [Notion](https://notion.so/)',
        },
      },
    ],
  }
  const result = stockSchema.nodeFromJSON(inputDoc).toJSON()
  console.log('Test 3(b): Stock Image drops caption (proving test detects the bug):')
  console.log(JSON.stringify(result, null, 2))
  console.log(`  Caption dropped: ${result.content[0].attrs.caption === undefined}`)
  console.log()
}

// 3(c): Image without caption round-trips unchanged (caption stays null / absent, no extra junk)
{
  const inputDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: 'https://x/y.png',
          alt: 'a',
        },
      },
    ],
  }
  const result = editorSchema.nodeFromJSON(inputDoc).toJSON()
  console.log('Test 3(c): Image without caption round-trips unchanged:')
  console.log(JSON.stringify(result, null, 2))
  console.log(`  Caption is null/absent: ${result.content[0].attrs.caption === null || result.content[0].attrs.caption === undefined}`)
  console.log()
}

console.log('=== TEST SUITE: patchDocCaptions plain-text restore & guards (Step 4) ===\n')

// 4(a): Plain-text caption restored when DB node has empty/missing caption
{
  const ghostUrl = 'https://begenius-thoughts.ghost.io/content/images/2022/photo-plain.png'
  const objName = getStorageObjectName(ghostUrl, false)
  const dbSrc = `https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/public/post-images/${objName}`

  const convertedDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: ghostUrl,
          caption: 'Sunset over Lake Victoria in Jinja',
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
          caption: null,
        },
      },
    ],
  }

  const { changes, unmatched } = patchDocCaptions({
    convertedDoc,
    dbDoc,
    slug: 'fixture-test-restore',
  })

  console.log('Test 4(a): Plain-text caption restored when DB caption is empty/missing')
  console.log(`  Changes count:        ${changes.length} (Expected: 1)`)
  console.log(`  Action label:         [${changes[0]?.actionType}] (Expected: [RESTORE])`)
  console.log(`  Old caption:          ${JSON.stringify(changes[0]?.oldCaption)}`)
  console.log(`  New caption:          ${JSON.stringify(changes[0]?.newCaption)}`)
  changes[0]?.apply()
  console.log(`  Applied to dbDoc:     ${dbDoc.content[0].attrs.caption}`)
  console.log()
}

// 4(b): Non-empty DB caption without link is left alone
{
  const ghostUrl = 'https://begenius-thoughts.ghost.io/content/images/2022/photo-edited.png'
  const objName = getStorageObjectName(ghostUrl, false)
  const dbSrc = `https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/public/post-images/${objName}`

  const convertedDoc = {
    type: 'doc',
    content: [
      {
        type: 'image',
        attrs: {
          src: ghostUrl,
          caption: 'Original ghost caption from export',
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
          caption: 'Custom edited DB caption that should NOT be overwritten',
        },
      },
    ],
  }

  const { changes, unmatched } = patchDocCaptions({
    convertedDoc,
    dbDoc,
    slug: 'fixture-test-left-alone',
  })

  console.log('Test 4(b): Non-empty DB caption without link is left alone')
  console.log(`  Changes count:        ${changes.length} (Expected: 0)`)
  console.log(`  DB caption untouched: ${dbDoc.content[0].attrs.caption}`)
  console.log()
}

console.log('=== TEST SUITE: Tolerant caption parsing & wrapSelectionAsLink ===\n')

// (a) renderCaption/regex accepts "[gcis] (https://x.org/)" and "[gcis](https://x.org/)"
{
  const inputWithSpace = 'Visit [gcis] (https://x.org/) for details'
  const inputWithoutSpace = 'Visit [gcis](https://x.org/) for details'

  const renderedWithSpace = renderToStaticMarkup(renderCaption(inputWithSpace))
  const renderedWithoutSpace = renderToStaticMarkup(renderCaption(inputWithoutSpace))

  console.log('Test (a): Tolerant parsing of whitespace between ] and (')
  console.log('  Input with space:   ', inputWithSpace)
  console.log('  Rendered:           ', renderedWithSpace)
  console.log('  Input without space:', inputWithoutSpace)
  console.log('  Rendered:           ', renderedWithoutSpace)

  const hasLinkWithSpace =
    renderedWithSpace.includes('<a href="https://x.org/"') && renderedWithSpace.includes('>gcis</a>')
  const hasLinkWithoutSpace =
    renderedWithoutSpace.includes('<a href="https://x.org/"') && renderedWithoutSpace.includes('>gcis</a>')

  console.log(`  With space parsed as link:    ${hasLinkWithSpace}`)
  console.log(`  Without space parsed as link: ${hasLinkWithoutSpace}`)
  if (!hasLinkWithSpace || !hasLinkWithoutSpace) {
    throw new Error('Test (a) failed: tolerant parsing did not produce link for both inputs')
  }
  console.log()
}

// (b) Disallowed URL (javascript:) stays plain text
{
  const inputDisallowed = 'Dangerous link: [click me] (javascript:alert(1)) here'
  const renderedDisallowed = renderCaption(inputDisallowed)
  const renderedStr =
    typeof renderedDisallowed === 'string' ? renderedDisallowed : renderToStaticMarkup(renderedDisallowed)

  console.log('Test (b): Disallowed URL stays plain text')
  console.log('  Input:   ', inputDisallowed)
  console.log('  Rendered:', renderedStr)
  const noAnchorTag = !renderedStr.includes('<a ')
  console.log(`  No anchor tag rendered: ${noAnchorTag}`)
  if (!noAnchorTag) {
    throw new Error('Test (b) failed: javascript: URL rendered an anchor tag')
  }
  console.log()
}

// (c) wrapSelectionAsLink pure function test cases
{
  console.log('Test (c): wrapSelectionAsLink pure function')

  // Normal case (middle of string)
  const normalText = 'Photo of sunset in Jinja'
  // 'sunset' is at index 9 to 15
  const normalWrap = wrapSelectionAsLink(normalText, 9, 15, 'https://example.com')
  console.log('  Normal case:')
  console.log('    Input:   ', normalText)
  console.log('    Wrapped: ', normalWrap)
  console.log(`    Matches expected: ${normalWrap === 'Photo of [sunset](https://example.com) in Jinja'}`)
  if (normalWrap !== 'Photo of [sunset](https://example.com) in Jinja') {
    throw new Error('Test (c) normal case failed')
  }

  // Start-of-string case
  const startText = 'Sunset in Jinja'
  // 'Sunset' is at index 0 to 6
  const startWrap = wrapSelectionAsLink(startText, 0, 6, 'https://example.com')
  console.log('  Start-of-string case:')
  console.log('    Input:   ', startText)
  console.log('    Wrapped: ', startWrap)
  console.log(`    Matches expected: ${startWrap === '[Sunset](https://example.com) in Jinja'}`)
  if (startWrap !== '[Sunset](https://example.com) in Jinja') {
    throw new Error('Test (c) start-of-string case failed')
  }

  // End-of-string case
  const endText = 'Photo of sunset'
  // 'sunset' is at index 9 to 15
  const endWrap = wrapSelectionAsLink(endText, 9, 15, 'https://example.com')
  console.log('  End-of-string case:')
  console.log('    Input:   ', endText)
  console.log('    Wrapped: ', endWrap)
  console.log(`    Matches expected: ${endWrap === 'Photo of [sunset](https://example.com)'}`)
  if (endWrap !== 'Photo of [sunset](https://example.com)') {
    throw new Error('Test (c) end-of-string case failed')
  }

  // Empty selection case (returns null)
  const emptyWrap = wrapSelectionAsLink(normalText, 5, 5, 'https://example.com')
  console.log('  Empty-selection case:')
  console.log('    Result:  ', emptyWrap)
  console.log(`    Returns null: ${emptyWrap === null}`)
  if (emptyWrap !== null) {
    throw new Error('Test (c) empty-selection case failed: expected null')
  }
  console.log()
}

console.log('=== TEST SUITE: Header Caption Link & Sanitization Tests ===\n')

// 1. Markdown link
{
  const input = 'Header photo by [Ivan Kabandize](https://example.com/ivan)'
  const rendered = renderToStaticMarkup(renderCaption(input))
  console.log('Test 1: Markdown link')
  console.log('  Input:    ', input)
  console.log('  Rendered: ', rendered)
  const hasAnchor = rendered.includes('<a href="https://example.com/ivan"')
  const hasText = rendered.includes('>Ivan Kabandize</a>')
  const hasRel = rendered.includes('rel="noopener noreferrer"')
  const hasTarget = rendered.includes('target="_blank"')
  console.log(`  Anchor rendered properly: ${hasAnchor && hasText && hasRel && hasTarget}`)
  if (!hasAnchor || !hasText || !hasRel || !hasTarget) {
    throw new Error('Test 1 failed: markdown link was not rendered properly')
  }
  console.log()
}

// 2. Spaced '] (' link
{
  const input = 'Header photo by [Ivan Kabandize] (https://example.com/ivan)'
  const rendered = renderToStaticMarkup(renderCaption(input))
  console.log('Test 2: Spaced "] (" link')
  console.log('  Input:    ', input)
  console.log('  Rendered: ', rendered)
  const hasAnchor = rendered.includes('<a href="https://example.com/ivan"')
  const hasText = rendered.includes('>Ivan Kabandize</a>')
  const hasRel = rendered.includes('rel="noopener noreferrer"')
  const hasTarget = rendered.includes('target="_blank"')
  console.log(`  Anchor rendered properly with space: ${hasAnchor && hasText && hasRel && hasTarget}`)
  if (!hasAnchor || !hasText || !hasRel || !hasTarget) {
    throw new Error('Test 2 failed: spaced "] (" link was not rendered properly')
  }
  console.log()
}

// 3. Legacy Unsplash HTML (anchor kept, script or onerror stripped)
{
  const inputLegacy =
    '<script>alert("xss")</script>Photo by <a href="https://unsplash.com/@ivan?utm_source=test&amp;utm_medium=referral" onerror="alert(1)" onclick="steal()">Ivan</a> on <a href="https://unsplash.com/?utm_source=test" target="_self">Unsplash</a><img src="x" onerror="alert(2)">'
  const rendered = renderToStaticMarkup(renderCaption(inputLegacy))
  console.log('Test 3: Legacy Unsplash HTML sanitization')
  console.log('  Input:    ', inputLegacy)
  console.log('  Rendered: ', rendered)

  const hasIvanAnchor =
    rendered.includes('<a href="https://unsplash.com/@ivan?utm_source=test&amp;utm_medium=referral"') &&
    rendered.includes('>Ivan</a>')
  const hasUnsplashAnchor =
    rendered.includes('<a href="https://unsplash.com/?utm_source=test"') && rendered.includes('>Unsplash</a>')
  const scriptStripped = !rendered.includes('script') && !rendered.includes('alert("xss")')
  const onerrorStripped =
    !rendered.includes('onerror') && !rendered.includes('alert(1)') && !rendered.includes('alert(2)')
  const onclickStripped = !rendered.includes('onclick') && !rendered.includes('steal')
  const imgStripped = !rendered.includes('<img')
  const safeRelAndTarget = rendered.includes('rel="noopener noreferrer"') && rendered.includes('target="_blank"')

  console.log(`  Anchor 1 kept:       ${hasIvanAnchor}`)
  console.log(`  Anchor 2 kept:       ${hasUnsplashAnchor}`)
  console.log(`  Script tag stripped: ${scriptStripped}`)
  console.log(`  Onerror stripped:    ${onerrorStripped}`)
  console.log(`  Onclick stripped:    ${onclickStripped}`)
  console.log(`  Img tag stripped:    ${imgStripped}`)
  console.log(`  Safe rel & target:   ${safeRelAndTarget}`)

  if (
    !hasIvanAnchor ||
    !hasUnsplashAnchor ||
    !scriptStripped ||
    !onerrorStripped ||
    !onclickStripped ||
    !imgStripped ||
    !safeRelAndTarget
  ) {
    throw new Error('Test 3 failed: legacy Unsplash HTML was not sanitized correctly')
  }
  console.log()
}

// 4. Empty caption
{
  console.log('Test 4: Empty caption handling')
  const emptyCases = ['', '   ', null, undefined]
  for (const val of emptyCases) {
    const res = renderCaption(val)
    console.log(`  Input [${val}]: result is null -> ${res === null}`)
    if (res !== null) {
      throw new Error(`Test 4 failed: expected null for empty input, got ${res}`)
    }
  }
  console.log()
}



