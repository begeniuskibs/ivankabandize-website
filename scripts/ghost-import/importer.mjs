// Ghost Importer for ivankabandize.com
// Supports --dry-run (default), --apply (requires IMPORT_CONFIRM=yes), --only <slug,slug>, --batch <n>
// Reads credentials from .env.local at runtime - never logs or hardcodes secrets

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { APPROVED_MAPPINGS, EXCLUDED_SLUGS } from './mapping.mjs'
import { convertGhostPostToTipTap } from './converter.mjs'
import { isGhostMedia, uploadMediaToSupabase, toAbsoluteGhostMediaUrl, getStorageObjectName } from './rehost.mjs'
import { validateDocSchema } from './editorSchema.mjs'

const LOG_FILE = path.resolve('scripts/ghost-import/import.log')

function log(message, { consoleLog = true } = {}) {
  const timestamp = new Date().toISOString()
  const formatted = `[${timestamp}] ${message}`
  if (consoleLog) {
    console.log(formatted)
  }
  fs.appendFileSync(LOG_FILE, `${formatted}\n`, 'utf8')
}

export function countWords(doc) {
  let count = 0
  function scan(n) {
    if (!n) return
    if (n.type === 'text' && typeof n.text === 'string') {
      const words = n.text.trim().split(/\s+/).filter(Boolean)
      count += words.length
    }
    if (n.content && Array.isArray(n.content)) {
      n.content.forEach(scan)
    }
  }
  scan(doc)
  return count
}

export function backupPostContent(slug, content) {
  const backupDir = path.resolve('scripts/ghost-import/backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }
  const isoTimestamp = new Date().toISOString().replace(/:/g, '-')
  const fileName = `${slug}-${isoTimestamp}.json`
  const filePath = path.join(backupDir, fileName)
  fs.writeFileSync(filePath, JSON.stringify(content ?? {}, null, 2), 'utf8')
  log(`Backup created: ${filePath}`)
  return filePath
}

export function buildPostContent(ghostPost, conversion) {
  const content = { ...conversion.doc }
  if (ghostPost.feature_image_caption) {
    content.featured_image_caption = ghostPost.feature_image_caption
  }
  return content
}

function loadEnvLocal() {
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) return {}
  const content = fs.readFileSync(envPath, 'utf8')
  const env = {}
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
  }
  return env
}

export function getSrcBasename(url) {
  if (!url) return ''
  const clean = String(url).split('?')[0].split('#')[0].replace(/\\/g, '/')
  const lastSlash = clean.lastIndexOf('/')
  return lastSlash !== -1 ? clean.slice(lastSlash + 1) : clean
}

export function hasMarkdownLink(text) {
  return typeof text === 'string' && /\[([^\]]+)\]\(([^)\s]+)\)/.test(text)
}

export function findMatchingMediaNode(convertedSrc, candidateNodes, getCandidateSrc, isVideo = false) {
  if (!convertedSrc || !Array.isArray(candidateNodes) || candidateNodes.length === 0) {
    return null
  }

  const expectedObjectName = getStorageObjectName(convertedSrc, isVideo)

  // 1. Primary match: DB node src ends with expected storage object name
  if (expectedObjectName) {
    const exactMatches = candidateNodes.filter(node => {
      const src = getCandidateSrc(node)
      if (!src) return false
      const clean = String(src).split('?')[0].split('#')[0]
      return clean.endsWith('/' + expectedObjectName) || clean.endsWith(expectedObjectName)
    })
    if (exactMatches.length === 1) {
      return exactMatches[0]
    }
  }

  // 2. Fallback: DB basename ends with "-" + converted basename AND exactly one DB candidate qualifies
  const cBase = getSrcBasename(convertedSrc)
  if (cBase) {
    const suffix = '-' + cBase.toLowerCase()
    const fallbackMatches = candidateNodes.filter(node => {
      const src = getCandidateSrc(node)
      if (!src) return false
      const dbBase = getSrcBasename(src).toLowerCase()
      return dbBase.endsWith(suffix)
    })
    if (fallbackMatches.length === 1) {
      return fallbackMatches[0]
    }
  }

  // 0 or >1 candidates: do NOT guess: report as UNMATCHED
  return null
}

export function collectMediaNodes(rootNode) {
  const imageNodes = []
  const videoNodes = []
  const galleryNodes = []

  function walk(node) {
    if (!node) return
    if (node.type === 'image') imageNodes.push(node)
    else if (node.type === 'video') videoNodes.push(node)
    else if (node.type === 'gallery') galleryNodes.push(node)
    if (Array.isArray(node.content)) {
      node.content.forEach(walk)
    }
  }
  walk(rootNode)
  return { imageNodes, videoNodes, galleryNodes }
}

export function patchDocCaptions({ convertedDoc, dbDoc, slug }) {
  const convertedMedia = collectMediaNodes(convertedDoc)
  const dbMedia = collectMediaNodes(dbDoc)

  const changes = []
  const unmatched = []

  // 1. Match image nodes by attrs.src
  for (const cImg of convertedMedia.imageNodes) {
    const cCap = cImg.attrs?.caption
    if (hasMarkdownLink(cCap)) {
      const cSrc = cImg.attrs?.src
      const cBase = getSrcBasename(cSrc)
      const match = findMatchingMediaNode(cSrc, dbMedia.imageNodes, n => n.attrs?.src, false)

      if (match) {
        const oldCap = match.attrs?.caption ?? null
        if (oldCap !== cCap) {
          changes.push({
            slug,
            nodeType: 'image',
            srcBasename: cBase,
            oldCaption: oldCap,
            newCaption: cCap,
            apply: () => {
              if (!match.attrs) match.attrs = {}
              match.attrs.caption = cCap
            },
          })
        }
      } else {
        unmatched.push({
          slug,
          nodeType: 'image',
          srcBasename: cBase,
          caption: cCap,
        })
      }
    }
  }

  // 2. Match video nodes by url/src
  for (const cVid of convertedMedia.videoNodes) {
    const cCap = cVid.attrs?.caption
    if (hasMarkdownLink(cCap)) {
      const cSrc = cVid.attrs?.url || cVid.attrs?.src
      const cBase = getSrcBasename(cSrc)
      const match = findMatchingMediaNode(cVid.attrs?.url || cVid.attrs?.src, dbMedia.videoNodes, n => n.attrs?.url || n.attrs?.src, true)

      if (match) {
        const oldCap = match.attrs?.caption ?? null
        if (oldCap !== cCap) {
          changes.push({
            slug,
            nodeType: 'video',
            srcBasename: cBase,
            oldCaption: oldCap,
            newCaption: cCap,
            apply: () => {
              if (!match.attrs) match.attrs = {}
              match.attrs.caption = cCap
            },
          })
        }
      } else {
        unmatched.push({
          slug,
          nodeType: 'video',
          srcBasename: cBase,
          caption: cCap,
        })
      }
    }
  }

  // 3. Match gallery nodes and gallery images
  for (const cGal of convertedMedia.galleryNodes) {
    let matchGal = dbMedia.galleryNodes.find(dbGal => {
      return (cGal.attrs?.images || []).some(cImg => {
        const cSrc = cImg.src || cImg.url
        return Boolean(findMatchingMediaNode(cSrc, dbGal.attrs?.images || [], img => img.src || img.url, false))
      })
    })

    if (!matchGal && convertedMedia.galleryNodes.length === 1 && dbMedia.galleryNodes.length === 1) {
      matchGal = dbMedia.galleryNodes[0]
    }

    const firstBase = (cGal.attrs?.images || []).map(i => getSrcBasename(i.src || i.url))[0] || 'gallery'

    // Card-level gallery caption
    const cCap = cGal.attrs?.caption
    if (hasMarkdownLink(cCap)) {
      if (matchGal) {
        const oldCap = matchGal.attrs?.caption ?? null
        if (oldCap !== cCap) {
          changes.push({
            slug,
            nodeType: 'gallery',
            srcBasename: firstBase,
            oldCaption: oldCap,
            newCaption: cCap,
            apply: () => {
              if (!matchGal.attrs) matchGal.attrs = {}
              matchGal.attrs.caption = cCap
            },
          })
        }
      } else {
        unmatched.push({
          slug,
          nodeType: 'gallery',
          srcBasename: firstBase,
          caption: cCap,
        })
      }
    }

    // Per-image captions inside gallery
    for (const cImg of cGal.attrs?.images || []) {
      const cImgCap = cImg.caption
      if (hasMarkdownLink(cImgCap)) {
        const cImgBase = getSrcBasename(cImg.src || cImg.url)
        let matchedImg = null
        if (matchGal && Array.isArray(matchGal.attrs?.images)) {
          matchedImg = findMatchingMediaNode(cImg.src || cImg.url, matchGal.attrs.images, img => img.src || img.url, false)
        }
        if (matchedImg) {
          const oldCap = matchedImg.caption ?? ''
          if (oldCap !== cImgCap) {
            changes.push({
              slug,
              nodeType: 'gallery (per-image)',
              srcBasename: cImgBase,
              oldCaption: oldCap,
              newCaption: cImgCap,
              apply: () => {
                matchedImg.caption = cImgCap
              },
            })
          }
        } else {
          unmatched.push({
            slug,
            nodeType: 'gallery (per-image)',
            srcBasename: cImgBase,
            caption: cImgCap,
          })
        }
      }
    }
  }

  return { changes, unmatched }
}

export async function runPatchCaptions({
  supabase,
  exportFilePath = 'C:/Users/ivan.kabandize/ghost-export/begenius-thoughts.ghost.2026-09-21-17-50-28.json',
  isDryRun = true,
  onlySlugs = null,
} = {}) {
  if (!onlySlugs || onlySlugs.length === 0) {
    throw new Error('--patch-captions requires --only <slug,slug>')
  }

  log(`Running --patch-captions (Mode: ${isDryRun ? 'DRY-RUN (read-only)' : 'APPLY (live writes)'}) for slugs: ${onlySlugs.join(', ')}`)

  // 1. Fetch target posts from DB
  const { data: dbPosts, error: dbErr } = await supabase
    .from('posts')
    .select('id, slug, content')
    .in('slug', onlySlugs)

  if (dbErr) {
    throw new Error(`Failed to query posts from DB: ${dbErr.message}`)
  }

  const existingPostBySlug = new Map((dbPosts || []).map(p => [p.slug.toLowerCase(), p]))

  // 2. Load Ghost export
  if (!fs.existsSync(exportFilePath)) {
    throw new Error(`Export file not found at: ${exportFilePath}`)
  }
  const exportData = JSON.parse(fs.readFileSync(exportFilePath, 'utf8'))
  const rawPosts = exportData.db[0].data.posts || []

  const ghostPostBySlug = new Map()
  const ghostPostByUuid = new Map()
  const allGhostSlugs = new Set()
  for (const p of rawPosts) {
    if (p.slug) {
      ghostPostBySlug.set(p.slug.toLowerCase(), p)
      allGhostSlugs.add(p.slug.toLowerCase())
    }
    if (p.uuid && p.slug) {
      ghostPostByUuid.set(p.uuid, p.slug.toLowerCase())
    }
  }

  const results = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    changesTotal: 0,
    unmatchedTotal: 0,
    items: [],
  }

  for (const slug of onlySlugs) {
    const slugLower = slug.toLowerCase()
    log(`\n--- Checking caption patch for: ${slug} ---`)

    const existingRow = existingPostBySlug.get(slugLower)
    if (!existingRow) {
      log(`Post '${slug}' does not exist in DB. Skipping.`)
      results.items.push({ slug, status: 'skipped_not_in_db' })
      continue
    }

    const ghostPost = ghostPostBySlug.get(slugLower)
    if (!ghostPost) {
      log(`Post '${slug}' not found in Ghost export. Skipping.`)
      results.items.push({ slug, status: 'skipped_not_in_export' })
      continue
    }

    // Re-convert ghost post to TipTap
    const conversion = convertGhostPostToTipTap(ghostPost, {
      uuidToSlugMap: ghostPostByUuid,
      allGhostSlugs,
    })

    const convertedDoc = conversion.doc
    const dbDoc = structuredClone(existingRow.content || { type: 'doc', content: [] })

    const { changes, unmatched } = patchDocCaptions({
      convertedDoc,
      dbDoc,
      slug,
    })

    // Print dry-run diffs
    if (changes.length > 0) {
      log(`Changes detected for '${slug}' (${changes.length}):`)
      for (const ch of changes) {
        log(`  [CHANGE] Slug: ${ch.slug} | Node: ${ch.nodeType} | Basename: ${ch.srcBasename}`)
        log(`    Old: ${JSON.stringify(ch.oldCaption)}`)
        log(`    New: ${JSON.stringify(ch.newCaption)}`)
      }
    } else {
      log(`No caption link changes needed for '${slug}'.`)
    }

    if (unmatched.length > 0) {
      log(`Unmatched captions with links for '${slug}' (${unmatched.length}):`)
      for (const um of unmatched) {
        log(`  [UNMATCHED] Slug: ${um.slug} | Node: ${um.nodeType} | Basename: ${um.srcBasename}`)
        log(`    Caption: ${JSON.stringify(um.caption)}`)
      }
    }

    results.changesTotal += changes.length
    results.unmatchedTotal += unmatched.length

    // Live update if not dry-run
    if (!isDryRun && changes.length > 0) {
      const backupPath = backupPostContent(slug, existingRow)
      for (const ch of changes) {
        ch.apply()
      }

      const { error: updateErr } = await supabase
        .from('posts')
        .update({
          content: dbDoc,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRow.id)

      if (updateErr) {
        log(`ERROR updating post ${slug}: ${updateErr.message}`)
        results.failed++
        results.items.push({ slug, status: 'error', error: updateErr.message })
        continue
      }

      log(`Successfully patched captions for '${slug}' (ID: ${existingRow.id}). Backup: ${backupPath}`)
      results.succeeded++
      results.items.push({ slug, status: 'patched', changesCount: changes.length, backupPath })
    } else {
      results.succeeded++
      results.items.push({
        slug,
        status: isDryRun ? 'dry_run_validated' : 'no_changes',
        changesCount: changes.length,
        unmatchedCount: unmatched.length,
      })
    }

    results.processed++
  }

  log(`\n=== PATCH-CAPTIONS COMPLETE ===`)
  log(`Total processed: ${results.processed}`)
  log(`Total changes: ${results.changesTotal}`)
  log(`Total unmatched: ${results.unmatchedTotal}`)
  log(`Succeeded/Validated: ${results.succeeded}`)
  log(`Failed: ${results.failed}`)

  return results
}

export function parseArgs(argv) {
  const args = argv.slice(2)
  const isApply = args.includes('--apply')
  const isUpdateContent = args.includes('--update-content')
  const isPatchCaptions = args.includes('--patch-captions')

  let onlySlugs = null
  const onlyIdx = args.indexOf('--only')
  if (onlyIdx !== -1 && args[onlyIdx + 1]) {
    onlySlugs = args[onlyIdx + 1].split(',').map(s => s.trim().toLowerCase())
  }

  let batchSize = null
  const batchIdx = args.indexOf('--batch')
  if (batchIdx !== -1 && args[batchIdx + 1]) {
    batchSize = parseInt(args[batchIdx + 1], 10)
  }

  return { isDryRun: !isApply, isApply, isUpdateContent, isPatchCaptions, onlySlugs, batchSize }
}

export async function runImporter({
  exportFilePath = 'C:/Users/ivan.kabandize/ghost-export/begenius-thoughts.ghost.2026-09-21-17-50-28.json',
  isDryRun = true,
  isUpdateContent = false,
  isPatchCaptions = false,
  onlySlugs = null,
  batchSize = null,
} = {}) {
  // Clear or init log file
  fs.writeFileSync(
    LOG_FILE,
    `=== GHOST IMPORTER RUN: ${new Date().toISOString()} ===\nMode: ${isDryRun ? 'DRY-RUN' : 'APPLY'}${isUpdateContent ? ' (UPDATE-CONTENT)' : ''}${isPatchCaptions ? ' (PATCH-CAPTIONS)' : ''}\n\n`,
    'utf8'
  )

  log(
    `Starting Ghost Importer (Mode: ${isDryRun ? 'DRY-RUN (read-only)' : 'APPLY (live writes)'}${isUpdateContent ? ', UPDATE-CONTENT' : ''}${isPatchCaptions ? ', PATCH-CAPTIONS' : ''})`
  )

  if (!isDryRun) {
    if (process.env.IMPORT_CONFIRM !== 'yes') {
      const errMsg = 'SAFETY ERROR: Live writes require BOTH --apply flag AND environment variable IMPORT_CONFIRM=yes. Aborting.'
      log(errMsg)
      throw new Error(errMsg)
    }
  }

  // Load environment variables safely
  const localEnv = loadEnvLocal()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment or .env.local')
  }

  // In dry run, service role key is optional if we only do reads, but if present we use it to check existing DB state
  const supabaseKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseKey) {
    throw new Error('Missing Supabase key in environment or .env.local')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (isPatchCaptions) {
    return await runPatchCaptions({
      supabase,
      exportFilePath,
      isDryRun,
      onlySlugs,
    })
  }

  // 1. Fetch DB baseline state
  log('Fetching database baseline state...')
  const { data: existingPosts, error: postsErr } = await supabase.from('posts').select('id, slug, title, content')
  if (postsErr) throw new Error(`Failed to query existing posts: ${postsErr.message}`)
  const existingPostBySlug = new Map((existingPosts || []).map(p => [p.slug.toLowerCase(), p]))
  const existingPostSlugs = new Set((existingPosts || []).map(p => p.slug.toLowerCase()))
  log(`Found ${existingPostSlugs.size} existing posts in database.`)

  const { data: existingTags, error: tagsErr } = await supabase.from('tags').select('id, name, slug')
  if (tagsErr) throw new Error(`Failed to query existing tags: ${tagsErr.message}`)
  const tagMapByName = new Map((existingTags || []).map(t => [t.name.toLowerCase(), t]))
  log(`Found ${tagMapByName.size} existing tags in database.`)

  let series30in30 = null
  let authorId = null
  if (!isUpdateContent) {
    const { data: existingSeries, error: seriesErr } = await supabase.from('series').select('id, title, slug')
    if (seriesErr) throw new Error(`Failed to query existing series: ${seriesErr.message}`)
    const seriesMapBySlug = new Map((existingSeries || []).map(s => [s.slug.toLowerCase(), s]))
    series30in30 = seriesMapBySlug.get('30in30')
    if (!series30in30) {
      throw new Error("Series '30in30' not found in database! Expected it to exist.")
    }
    log(`Found series '30in30' (ID: ${series30in30.id}).`)

    // Find author_id
    const { data: users, error: usersErr } = await supabase.from('users').select('id, email').limit(1)
    if (usersErr || !users || users.length === 0) {
      throw new Error(`Failed to resolve owner author_id from users: ${usersErr?.message}`)
    }
    authorId = users[0].id
    log(`Resolved author_id for posts: ${authorId}`)
  }

  // 2. Load Ghost export
  log(`Loading Ghost export from: ${exportFilePath}`)
  if (!fs.existsSync(exportFilePath)) {
    throw new Error(`Export file not found at: ${exportFilePath}`)
  }
  const exportData = JSON.parse(fs.readFileSync(exportFilePath, 'utf8'))
  const rawPosts = exportData.db[0].data.posts || []
  log(`Loaded ${rawPosts.length} total posts/pages from Ghost export.`)

  // Build Ghost lookups
  const ghostPostBySlug = new Map()
  const ghostPostByUuid = new Map()
  const allGhostSlugs = new Set()
  for (const p of rawPosts) {
    if (p.slug) {
      ghostPostBySlug.set(p.slug, p)
      allGhostSlugs.add(p.slug)
    }
    if (p.uuid && p.slug) {
      ghostPostByUuid.set(p.uuid, p.slug)
    }
  }

  // 3. Filter and sort target posts by Ghost published_at ascending (drafts come last)
  let targetMappings = [...APPROVED_MAPPINGS]

  targetMappings.sort((a, b) => {
    const postA = ghostPostBySlug.get(a.slug)
    const postB = ghostPostBySlug.get(b.slug)
    const timeA = postA?.published_at ? new Date(postA.published_at).getTime() : Infinity
    const timeB = postB?.published_at ? new Date(postB.published_at).getTime() : Infinity
    return timeA - timeB
  })

  if (onlySlugs && onlySlugs.length > 0) {
    targetMappings = targetMappings.filter(m => onlySlugs.includes(m.slug.toLowerCase()))
    log(`Filtered by --only to ${targetMappings.length} posts.`)
  }
  if (batchSize && batchSize > 0) {
    targetMappings = targetMappings.slice(0, batchSize)
    log(`Limited by --batch to ${targetMappings.length} posts (by published_at ascending).`)
  }

  log(`Target posts to process in this run: ${targetMappings.length}`)

  // 4. In APPLY mode, create missing topic tags first (insert mode only)
  const neededTagNames = ['Business', 'Leadership', 'Faith']
  if (!isDryRun && !isUpdateContent) {
    for (const tagName of neededTagNames) {
      if (!tagMapByName.has(tagName.toLowerCase())) {
        log(`Creating missing topic tag '${tagName}'...`)
        const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const { data: newTag, error: createTagErr } = await supabase
          .from('tags')
          .insert({ name: tagName, slug, is_internal: false })
          .select()
          .single()
        if (createTagErr) {
          throw new Error(`Failed to create tag ${tagName}: ${createTagErr.message}`)
        }
        tagMapByName.set(tagName.toLowerCase(), newTag)
        log(`Created tag '${tagName}' (ID: ${newTag.id}).`)
      }
    }
  }

  // 5. Process each post
  const results = {
    processed: 0,
    skippedExisting: 0,
    skippedMissingDb: 0,
    succeeded: 0,
    failed: 0,
    items: [],
  }

  for (let i = 0; i < targetMappings.length; i++) {
    const mapping = targetMappings[i]
    const slug = mapping.slug
    log(`\n--- [${i + 1}/${targetMappings.length}] Processing: ${slug} ---`)

    if (EXCLUDED_SLUGS.includes(slug)) {
      log(`SKIPPED: ${slug} is on the EXCLUDED list.`)
      continue
    }

    if (isUpdateContent) {
      if (!existingPostBySlug.has(slug.toLowerCase())) {
        log(`UPDATE-CONTENT: Post with slug '${slug}' does not exist in database. Skipping.`)
        results.skippedMissingDb++
        results.items.push({ slug, status: 'skipped_not_in_database' })
        continue
      }
    } else {
      if (existingPostSlugs.has(slug.toLowerCase())) {
        log(`IDEMPOTENCY: Post with slug '${slug}' already exists in database. Skipping.`)
        results.skippedExisting++
        results.items.push({ slug, status: 'skipped_existing' })
        continue
      }
    }

    const ghostPost = ghostPostBySlug.get(slug)
    if (!ghostPost) {
      log(`ERROR: Post with slug '${slug}' not found in Ghost export!`)
      results.failed++
      results.items.push({ slug, status: 'not_found_in_export' })
      continue
    }

    // Convert media URLs for this post
    const mediaUrlMap = new Map()

    // Collect Ghost media from feature_image and content
    const postGhostMediaUrls = []
    if (ghostPost.feature_image && isGhostMedia(ghostPost.feature_image)) {
      postGhostMediaUrls.push({ url: ghostPost.feature_image, bucket: 'post-images' })
    }

    // Extract media from Lexical / Mobiledoc to re-host
    if (ghostPost.lexical) {
      try {
        const lex = typeof ghostPost.lexical === 'string' ? JSON.parse(ghostPost.lexical) : ghostPost.lexical
        function extractLexMedia(n) {
          if (!n) return
          if (n.type === 'image' && isGhostMedia(n.src)) {
            postGhostMediaUrls.push({ url: n.src, bucket: 'post-images' })
          }
          if (n.type === 'video' && isGhostMedia(n.src)) {
            postGhostMediaUrls.push({ url: n.src, bucket: 'post-videos' })
          }
          if (n.type === 'gallery' && Array.isArray(n.images)) {
            for (const img of n.images) {
              if (isGhostMedia(img.src)) postGhostMediaUrls.push({ url: img.src, bucket: 'post-images' })
            }
          }
          if (n.type === 'bookmark') {
            if (isGhostMedia(n.metadata?.thumbnail)) postGhostMediaUrls.push({ url: n.metadata.thumbnail, bucket: 'post-images' })
            if (isGhostMedia(n.metadata?.icon)) postGhostMediaUrls.push({ url: n.metadata.icon, bucket: 'post-images' })
          }
          if (n.children) n.children.forEach(extractLexMedia)
        }
        extractLexMedia(lex.root)
      } catch (err) {
        log(`Warning: Failed to parse lexical for media extraction: ${err.message}`)
      }
    }

    if (ghostPost.mobiledoc) {
      try {
        const doc = typeof ghostPost.mobiledoc === 'string' ? JSON.parse(ghostPost.mobiledoc) : ghostPost.mobiledoc
        if (doc.cards) {
          for (const card of doc.cards) {
            const [cType, cPayload] = card
            if (cType === 'image' && isGhostMedia(cPayload?.src)) {
              postGhostMediaUrls.push({ url: cPayload.src, bucket: 'post-images' })
            }
            if (cType === 'gallery' && Array.isArray(cPayload?.images)) {
              for (const img of cPayload.images) {
                if (isGhostMedia(img.src)) postGhostMediaUrls.push({ url: img.src, bucket: 'post-images' })
              }
            }
            if (cType === 'bookmark') {
              if (isGhostMedia(cPayload?.metadata?.thumbnail)) postGhostMediaUrls.push({ url: cPayload.metadata.thumbnail, bucket: 'post-images' })
              if (isGhostMedia(cPayload?.metadata?.icon)) postGhostMediaUrls.push({ url: cPayload.metadata.icon, bucket: 'post-images' })
            }
          }
        }
      } catch (err) {
        log(`Warning: Failed to parse mobiledoc for media extraction: ${err.message}`)
      }
    }

    // Re-host media
    log(`Post has ${postGhostMediaUrls.length} media items pointing to Ghost storage.`)
    for (const item of postGhostMediaUrls) {
      try {
        const uploadRes = await uploadMediaToSupabase({
          supabase,
          rawUrl: item.url,
          bucket: item.bucket,
          dryRun: isDryRun,
        })
        mediaUrlMap.set(item.url, uploadRes.publicUrl)
      } catch (uploadErr) {
        log(`Media re-host error for ${item.url}: ${uploadErr.message}`)
      }
    }

    // Convert content to TipTap doc
    const conversion = convertGhostPostToTipTap(ghostPost, {
      uuidToSlugMap: ghostPostByUuid,
      allGhostSlugs,
      mediaUrlMap,
    })

    const newContent = buildPostContent(ghostPost, conversion)

    if (isUpdateContent) {
      const existingRow = existingPostBySlug.get(slug.toLowerCase())
      const existingDoc = existingRow?.content
      const existingNodeCount = Array.isArray(existingDoc?.content) ? existingDoc.content.length : 0
      const newNodeCount = Array.isArray(newContent?.content) ? newContent.content.length : 0
      const newWordCount = countWords(newContent)
      const schemaCheck = validateDocSchema(newContent)
      const schemaResult = schemaCheck.valid ? 'PASS' : `FAIL: ${schemaCheck.error}`

      if (isDryRun) {
        log(`[DRY-RUN UPDATE-CONTENT] Slug: ${slug}`)
        log(`  Existing top-level node count: ${existingNodeCount}`)
        log(`  New top-level node count: ${newNodeCount}`)
        log(`  New word count: ${newWordCount}`)
        log(`  Editor schema check: ${schemaResult}`)

        results.succeeded++
        results.items.push({
          slug,
          status: 'dry_run_update_validated',
          existingNodeCount,
          newNodeCount,
          newWordCount,
          schemaValid: schemaCheck.valid,
        })
      } else {
        // Live Update
        const backupPath = backupPostContent(slug, existingRow?.content)

        const { error: updateErr } = await supabase
          .from('posts')
          .update({
            content: newContent,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingRow.id)

        if (updateErr) {
          log(`ERROR updating post ${slug}: ${updateErr.message}`)
          results.failed++
          results.items.push({ slug, status: 'error', error: updateErr.message })
          continue
        }

        log(`Updated post '${slug}' (ID: ${existingRow.id}). Backup saved: ${backupPath}`)
        results.succeeded++
        results.items.push({ slug, status: 'updated', id: existingRow.id, backupPath })
      }
    } else {
      const title = ghostPost.title
      const publishedAt = ghostPost.published_at || null
      const excerpt = ghostPost.custom_excerpt || ghostPost.excerpt || null
      const featuredImageUrl = ghostPost.feature_image
        ? (mediaUrlMap.get(ghostPost.feature_image) || toAbsoluteGhostMediaUrl(ghostPost.feature_image))
        : null

      const seriesId = mapping.series === '30in30' && series30in30 ? series30in30.id : null
      const targetTagIds = (mapping.tags || [])
        .map(tName => tagMapByName.get(tName.toLowerCase())?.id)
        .filter(Boolean)

      log(`Metadata: Title="${title}", Stream=${mapping.stream}, Series=${mapping.series || 'none'}, Tags=[${mapping.tags.join(', ')}], PublishedAt=${publishedAt}`)
      log(`TipTap conversion: Format=${conversion.format}, Nodes=${conversion.doc.content?.length || 0}`)

      if (!isDryRun) {
        // Live Insert
        const { data: newPost, error: insertErr } = await supabase
          .from('posts')
          .insert({
            title,
            slug,
            excerpt,
            content: newContent,
            featured_image_url: featuredImageUrl,
            header_image_width: 'standard',
            visibility: 'public',
            publish_status: 'draft',
            content_type: mapping.stream,
            series_id: seriesId,
            published_at: publishedAt,
            author_id: authorId,
          })
          .select()
          .single()

        if (insertErr) {
          log(`ERROR inserting post ${slug}: ${insertErr.message}`)
          results.failed++
          results.items.push({ slug, status: 'error', error: insertErr.message })
          continue
        }

        log(`Inserted post '${slug}' (ID: ${newPost.id}).`)

        // Link tags
        if (targetTagIds.length > 0) {
          const postTagsData = targetTagIds.map(tagId => ({
            post_id: newPost.id,
            tag_id: tagId,
          }))
          const { error: ptErr } = await supabase.from('post_tags').insert(postTagsData)
          if (ptErr) {
            log(`Warning: Failed to attach post_tags for ${slug}: ${ptErr.message}`)
          } else {
            log(`Attached ${postTagsData.length} tags to post.`)
          }
        }

        results.succeeded++
        results.items.push({ slug, status: 'imported', id: newPost.id })
      } else {
        // Dry run simulation
        results.succeeded++
        results.items.push({
          slug,
          status: 'dry_run_validated',
          title,
          stream: mapping.stream,
          series: mapping.series,
          tags: mapping.tags,
          tagIds: targetTagIds,
          seriesId,
          nodeCount: conversion.doc.content?.length || 0,
        })
      }
    }

    results.processed++
  }

  log(`\n=== IMPORTER RUN COMPLETE ===`)
  log(`Total processed: ${results.processed}`)
  log(`Succeeded/Validated: ${results.succeeded}`)
  if (isUpdateContent) {
    log(`Skipped missing from DB: ${results.skippedMissingDb}`)
  } else {
    log(`Skipped existing: ${results.skippedExisting}`)
  }
  log(`Failed: ${results.failed}`)

  return results
}

// Standalone execution
if (process.argv[1]?.endsWith('importer.mjs')) {
  const { isDryRun, isUpdateContent, isPatchCaptions, onlySlugs, batchSize } = parseArgs(process.argv)
  runImporter({ isDryRun, isUpdateContent, isPatchCaptions, onlySlugs, batchSize })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Importer failed:', err.message)
      process.exit(1)
    })
}
