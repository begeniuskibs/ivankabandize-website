// Step 5 - Dry-run test on three posts:
// 1. the-value-of-serving (bookmark chain)
// 2. top-notion-updates-from-make-with-notion-2024 (video, gallery, embed)
// 3. the-effective-annual-planning-framework (button)
// Saves JSON to scratch directory and proves it renders via TipTapRenderer without errors.

import fs from 'node:fs'
import path from 'node:path'
import React from 'react'
import ReactDOMServer from 'react-dom/server'
import TipTapRenderer from '@/components/editor/TipTapRenderer'
import { convertGhostPostToTipTap } from './converter.mjs'

const EXPORT_FILE = 'C:/Users/ivan.kabandize/ghost-export/begenius-thoughts.ghost.2026-09-21-17-50-28.json'
const SCRATCH_DIR = 'C:/Users/ivan.kabandize/.gemini/antigravity-ide/brain/7cb6651a-72c2-43c4-b983-16628c2a802d/scratch'

const TARGET_SLUGS = [
  'the-value-of-serving',
  'top-notion-updates-from-make-with-notion-2024',
  'the-effective-annual-planning-framework',
]

const KNOWN_RENDERER_NODES = new Set([
  'paragraph',
  'heading',
  'bulletList',
  'orderedList',
  'image',
  'video',
  'gallery',
  'youtube',
  'bookmark',
  'button',
  'callout',
  'blockquote',
  'codeBlock',
  'horizontalRule',
  'listItem',
  'text',
  'doc',
])

async function runTest() {
  console.log('=== STEP 5: DRY-RUN RENDER TEST ON 3 POSTS ===\n')

  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true })
  }

  const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'))
  const rawPosts = exportData.db[0].data.posts || []

  // Lookups
  const ghostPostBySlug = new Map()
  const ghostPostByUuid = new Map()
  const allGhostSlugs = new Set()
  for (const p of rawPosts) {
    if (p.slug) {
      ghostPostBySlug.set(p.slug, p)
      allGhostSlugs.add(p.slug)
    }
    if (p.uuid && p.slug) ghostPostByUuid.set(p.uuid, p.slug)
  }

  for (const slug of TARGET_SLUGS) {
    console.log(`\n======================================================`)
    console.log(`TESTING POST: ${slug}`)
    console.log(`======================================================`)

    const post = ghostPostBySlug.get(slug)
    if (!post) {
      throw new Error(`Post not found in export: ${slug}`)
    }

    // Convert content
    const { doc, format, unmappedCards } = convertGhostPostToTipTap(post, {
      uuidToSlugMap: ghostPostByUuid,
      allGhostSlugs,
      mediaUrlMap: new Map(),
    })

    // Write to scratch folder
    const scratchPath = path.join(SCRATCH_DIR, `${slug}.json`)
    fs.writeFileSync(scratchPath, JSON.stringify(doc, null, 2), 'utf8')
    console.log(`Saved converted JSON to scratch folder:`)
    console.log(`  -> ${scratchPath}`)

    // Inspect node types in converted document
    const nodeTypesFound = new Set<string>()
    const unknownNodes: string[] = []

    function scanNodes(n: any) {
      if (!n) return
      if (n.type) {
        nodeTypesFound.add(n.type)
        if (!KNOWN_RENDERER_NODES.has(n.type)) {
          unknownNodes.push(n.type)
        }
      }
      if (n.content && Array.isArray(n.content)) {
        n.content.forEach(scanNodes)
      }
    }
    scanNodes(doc)

    console.log(`Original format in Ghost: ${format}`)
    console.log(`Top-level nodes count: ${doc.content?.length || 0}`)
    console.log(`Node types found in document:`)
    console.log(`  ${Array.from(nodeTypesFound).sort().join(', ')}`)

    if (unknownNodes.length === 0) {
      console.log(`Unknown node type errors: NONE (0 errors)`)
    } else {
      console.error(`ERROR: Unknown node types detected: ${unknownNodes.join(', ')}`)
    }

    if (unmappedCards.length > 0) {
      console.log(`Unmapped cards (omitted from TipTap):`)
      unmappedCards.forEach(c => console.log(`  - ${c.type}: ${c.details}`))
    }

    // Prove rendering via TipTapRenderer
    console.log(`\nRendering through site's TipTapRenderer...`)
    try {
      const renderedHtml = ReactDOMServer.renderToStaticMarkup(<TipTapRenderer content={doc} />)
      console.log(`Renderer execution: SUCCESS`)
      console.log(`Rendered HTML length: ${renderedHtml.length} characters`)
      console.log(`Sample rendered HTML snippet (first 350 chars):`)
      console.log(`  ${renderedHtml.slice(0, 350)}...`)
    } catch (renderErr: any) {
      console.error(`RENDERER FAILURE for ${slug}:`, renderErr.message)
      throw renderErr
    }
  }

  console.log(`\n=== STEP 5: ALL 3 POSTS VALIDATED AND RENDERED SUCCESSFULLY ===\n`)
}

runTest().catch(err => {
  console.error('Test failed:', err)
  process.exit(1)
})
