import fs from 'node:fs'
import { getSchema } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import CharacterCount from '@tiptap/extension-character-count'
import { Video, Gallery, YouTube, Bookmark, Button, Callout } from '@/components/editor/customNodes'
import { APPROVED_MAPPINGS } from './mapping.mjs'
import { convertGhostPostToTipTap } from './converter.mjs'

const EXPORT_FILE = 'C:/Users/ivan.kabandize/ghost-export/begenius-thoughts.ghost.2026-09-21-17-50-28.json'

const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Placeholder.configure({
    placeholder: 'Write something...',
  }),
  Link.configure({
    openOnClick: false,
    autolink: true,
    linkOnPaste: true,
    protocols: ['http', 'https', 'mailto', 'tel'],
    defaultProtocol: 'https',
  }),
  Image.configure({
    allowBase64: true,
  }),
  CharacterCount.configure(),
  Video,
  Gallery,
  YouTube,
  Bookmark,
  Button,
  Callout,
]

const schema = getSchema(extensions)

async function main() {
  console.log('=== TIPAP / PROSEMIRROR SCHEMA VALIDATION CHECK ===\n')

  const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'))
  const rawPosts = exportData.db[0].data.posts || []

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

  // Sort mappings by published_at ascending, drafts last
  const sortedMappings = [...APPROVED_MAPPINGS].sort((a, b) => {
    const postA = ghostPostBySlug.get(a.slug)
    const postB = ghostPostBySlug.get(b.slug)
    const timeA = postA?.published_at ? new Date(postA.published_at).getTime() : Infinity
    const timeB = postB?.published_at ? new Date(postB.published_at).getTime() : Infinity
    return timeA - timeB
  })

  let passCount = 0
  let failCount = 0
  const failures: { slug: string; error: string }[] = []

  for (const m of sortedMappings) {
    const post = ghostPostBySlug.get(m.slug)
    if (!post) {
      console.error(`Post missing: ${m.slug}`)
      continue
    }

    const { doc } = convertGhostPostToTipTap(post, {
      uuidToSlugMap: ghostPostByUuid,
      allGhostSlugs,
      mediaUrlMap: new Map(),
    })

    try {
      const pmNode = schema.nodeFromJSON(doc)
      pmNode.check()
      passCount++
      console.log(`PASS: ${m.slug}`)
    } catch (err: unknown) {
      failCount++
      const msg = err instanceof Error ? err.message : String(err)
      failures.push({ slug: m.slug, error: msg })
      console.log(`FAIL: ${m.slug} - ${msg}`)
    }
  }

  console.log(`\nSchema Validation Results: ${passCount} passed, ${failCount} failed.`)

  if (failCount > 0) {
    console.log('\n--- DETAILED FAILURES ---')
    for (const f of failures) {
      console.log(`[${f.slug}] -> ${f.error}`)
    }
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err)
  process.exit(1)
})
