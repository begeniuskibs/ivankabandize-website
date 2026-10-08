// Ghost Importer for ivankabandize.com
// Supports --dry-run (default), --apply (requires IMPORT_CONFIRM=yes), --only <slug,slug>, --batch <n>
// Reads credentials from .env.local at runtime - never logs or hardcodes secrets

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { APPROVED_MAPPINGS, EXCLUDED_SLUGS } from './mapping.mjs'
import { convertGhostPostToTipTap } from './converter.mjs'
import { isGhostMedia, uploadMediaToSupabase, toAbsoluteGhostMediaUrl } from './rehost.mjs'

const LOG_FILE = path.resolve('scripts/ghost-import/import.log')

function log(message, { consoleLog = true } = {}) {
  const timestamp = new Date().toISOString()
  const formatted = `[${timestamp}] ${message}`
  if (consoleLog) {
    console.log(formatted)
  }
  fs.appendFileSync(LOG_FILE, `${formatted}\n`, 'utf8')
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

export function parseArgs(argv) {
  const args = argv.slice(2)
  const isApply = args.includes('--apply')

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

  return { isDryRun: !isApply, isApply, onlySlugs, batchSize }
}

export async function runImporter({
  exportFilePath = 'C:/Users/ivan.kabandize/ghost-export/begenius-thoughts.ghost.2026-09-21-17-50-28.json',
  isDryRun = true,
  onlySlugs = null,
  batchSize = null,
} = {}) {
  // Clear or init log file
  fs.writeFileSync(LOG_FILE, `=== GHOST IMPORTER RUN: ${new Date().toISOString()} ===\nMode: ${isDryRun ? 'DRY-RUN' : 'APPLY'}\n\n`, 'utf8')

  log(`Starting Ghost Importer (Mode: ${isDryRun ? 'DRY-RUN (read-only)' : 'APPLY (live writes)'})`)

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

  // 1. Fetch DB baseline state
  log('Fetching database baseline state...')
  const { data: existingPosts, error: postsErr } = await supabase.from('posts').select('id, slug, title')
  if (postsErr) throw new Error(`Failed to query existing posts: ${postsErr.message}`)
  const existingPostSlugs = new Set((existingPosts || []).map(p => p.slug))
  log(`Found ${existingPostSlugs.size} existing posts in database.`)

  const { data: existingTags, error: tagsErr } = await supabase.from('tags').select('id, name, slug')
  if (tagsErr) throw new Error(`Failed to query existing tags: ${tagsErr.message}`)
  const tagMapByName = new Map((existingTags || []).map(t => [t.name.toLowerCase(), t]))
  log(`Found ${tagMapByName.size} existing tags in database.`)

  const { data: existingSeries, error: seriesErr } = await supabase.from('series').select('id, title, slug')
  if (seriesErr) throw new Error(`Failed to query existing series: ${seriesErr.message}`)
  const seriesMapBySlug = new Map((existingSeries || []).map(s => [s.slug.toLowerCase(), s]))
  const series30in30 = seriesMapBySlug.get('30in30')
  if (!series30in30) {
    throw new Error("Series '30in30' not found in database! Expected it to exist.")
  }
  log(`Found series '30in30' (ID: ${series30in30.id}).`)

  // Find author_id
  const { data: users, error: usersErr } = await supabase.from('users').select('id, email').limit(1)
  if (usersErr || !users || users.length === 0) {
    throw new Error(`Failed to resolve owner author_id from users: ${usersErr?.message}`)
  }
  const authorId = users[0].id
  log(`Resolved author_id for posts: ${authorId}`)

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

  // 4. In APPLY mode, create missing topic tags first
  const neededTagNames = ['Business', 'Leadership', 'Faith']
  if (!isDryRun) {
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

    if (existingPostSlugs.has(slug)) {
      log(`IDEMPOTENCY: Post with slug '${slug}' already exists in database. Skipping.`)
      results.skippedExisting++
      results.items.push({ slug, status: 'skipped_existing' })
      continue
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

    const title = ghostPost.title
    const publishedAt = ghostPost.published_at || null
    const excerpt = ghostPost.custom_excerpt || ghostPost.excerpt || null
    const featuredImageUrl = ghostPost.feature_image
      ? (mediaUrlMap.get(ghostPost.feature_image) || toAbsoluteGhostMediaUrl(ghostPost.feature_image))
      : null

    const seriesId = mapping.series === '30in30' ? series30in30.id : null
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
          content: conversion.doc,
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

    results.processed++
  }

  log(`\n=== IMPORTER RUN COMPLETE ===`)
  log(`Total processed: ${results.processed}`)
  log(`Succeeded/Validated: ${results.succeeded}`)
  log(`Skipped existing: ${results.skippedExisting}`)
  log(`Failed: ${results.failed}`)

  return results
}

// Standalone execution
if (process.argv[1]?.endsWith('importer.mjs')) {
  const { isDryRun, onlySlugs, batchSize } = parseArgs(process.argv)
  runImporter({ isDryRun, onlySlugs, batchSize })
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Importer failed:', err.message)
      process.exit(1)
    })
}
