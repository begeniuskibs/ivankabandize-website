// Backfill Unsplash photographer credits for imported draft posts
// Modes:
//   Default: Dry run (zero mutations)
//   Apply: node scripts/caption-backfill/backfill-captions.mjs --apply (requires CONFIRM_CAPTION_BACKFILL=yes)
//   Restore: node scripts/caption-backfill/backfill-captions.mjs --restore <backup-file>
// House style: spaced hyphen only

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const PREFLIGHT_REPORT_PATH = path.resolve('scripts/ghost-import/preflight-report.json')

export function loadEnvLocal(envFilePath = '.env.local') {
  const envPath = path.resolve(envFilePath)
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

export function getSupabaseClient() {
  const env = loadEnvLocal()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials in environment or .env.local')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  })
}

// Scope check: Identify Unsplash images in featured_image_url (same rule as audit)
export function isUnsplashPost(post) {
  if (!post || !post.featured_image_url) return false
  const url = post.featured_image_url.toLowerCase()
  return url.includes('images.unsplash.com') || url.includes('unsplash')
}

// Check if existing caption already contains a photographer credit
export function hasPhotographerCredit(caption) {
  if (!caption || typeof caption !== 'string') return false
  const lower = caption.toLowerCase()
  return lower.includes('photo by') && lower.includes('unsplash')
}

// Format author name from slug or kebab-case (e.g. 'brett-jordan' -> 'Brett Jordan')
function formatAuthorName(raw) {
  if (!raw) return ''
  return raw
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Load preflight report media map for source credit lookups
export function loadPreflightMediaMap() {
  if (!fs.existsSync(PREFLIGHT_REPORT_PATH)) return new Map()
  try {
    const report = JSON.parse(fs.readFileSync(PREFLIGHT_REPORT_PATH, 'utf8'))
    const map = new Map()
    if (Array.isArray(report.mediaResults)) {
      for (const item of report.mediaResults) {
        if (item.post && item.context === 'feature_image') {
          map.set(item.post, item)
        }
      }
    }
    return map
  } catch (err) {
    console.error('Warning: could not parse preflight-report.json:', err.message)
    return new Map()
  }
}

// Extract credit from Ghost media results or repo source data
export function resolveCreditForPost(post, preflightMediaMap) {
  const mediaItem = preflightMediaMap.get(post.slug)
  if (mediaItem && mediaItem.rawUrl) {
    const rawUrl = mediaItem.rawUrl
    // Check for Ghost Unsplash filename format: <photographer>-<photoId>-unsplash.<ext>
    const match = rawUrl.match(/\/([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*)-[a-zA-Z0-9_-]+-unsplash\.(?:jpe?g|png|webp)/i)
    if (match && match[1]) {
      const author = formatAuthorName(match[1])
      if (author) {
        return {
          photographer: author,
          creditString: `Photo by ${author} on Unsplash`,
          source: 'scripts/ghost-import/preflight-report.json:mediaResults[].rawUrl',
        }
      }
    }
  }

  return {
    photographer: null,
    creditString: null,
    source: 'none',
  }
}

// Build backfill plan for all Unsplash draft posts
export function buildCaptionBackfillPlan(posts, preflightMediaMap) {
  const unsplashDraftPosts = posts
    .filter((p) => p.publish_status === 'draft' && isUnsplashPost(p))
    .sort((a, b) => a.slug.localeCompare(b.slug))

  const rows = []

  for (const post of unsplashDraftPosts) {
    const currentCaption = post.content?.featured_image_caption ?? null
    const alreadyCredited = hasPhotographerCredit(currentCaption)

    if (alreadyCredited) {
      rows.push({
        slug: post.slug,
        currentCaption,
        proposedCaption: currentCaption,
        creditSource: 'content.featured_image_caption',
        action: 'already has credit',
        post,
      })
      continue
    }

    const { creditString, source } = resolveCreditForPost(post, preflightMediaMap)

    if (!creditString) {
      rows.push({
        slug: post.slug,
        currentCaption,
        proposedCaption: null,
        creditSource: 'none',
        action: 'NO SOURCE',
        post,
      })
      continue
    }

    let proposedCaption = ''
    let action = 'set'

    if (currentCaption && currentCaption.trim() !== '') {
      // Keep existing caption and append credit with spaced hyphen
      proposedCaption = `${currentCaption.trim()} - ${creditString}`
      action = 'append'
    } else {
      proposedCaption = creditString
      action = 'set'
    }

    rows.push({
      slug: post.slug,
      currentCaption,
      proposedCaption,
      creditSource: source,
      action,
      post,
    })
  }

  return rows
}

export function printAsciiTable(rows) {
  const headers = ['slug', 'current caption', 'proposed caption', 'credit source (file and field)', 'action']
  const formatted = rows.map((r) => [
    r.slug,
    r.currentCaption || 'null',
    r.proposedCaption || 'null',
    r.creditSource,
    r.action,
  ])

  const colWidths = headers.map((h, i) => Math.max(h.length, ...formatted.map((row) => row[i].length)))

  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ')
  const dividerLine = colWidths.map((w) => '-'.repeat(w)).join('-+-')

  console.log(headerLine)
  console.log(dividerLine)
  for (const row of formatted) {
    console.log(row.map((cell, i) => cell.padEnd(colWidths[i])).join(' | '))
  }
}

export async function main() {
  const args = process.argv.slice(2)
  const isApply = args.includes('--apply')
  const restoreIdx = args.indexOf('--restore')
  const isRestore = restoreIdx !== -1 && Boolean(args[restoreIdx + 1])
  const restoreFile = isRestore ? args[restoreIdx + 1] : null

  const supabase = getSupabaseClient()

  // Handle Restore Mode
  if (isRestore) {
    console.log(`=== CAPTION BACKFILL: RESTORE MODE ===`)
    console.log(`Restoring from backup file: ${restoreFile}`)

    if (!fs.existsSync(restoreFile)) {
      throw new Error(`Backup file not found at ${restoreFile}`)
    }

    const backupData = JSON.parse(fs.readFileSync(restoreFile, 'utf8'))
    if (!Array.isArray(backupData.posts)) {
      throw new Error('Invalid backup file: posts array missing')
    }

    console.log(`Restoring ${backupData.posts.length} posts...`)
    for (const item of backupData.posts) {
      const { data: currentPost, error: fetchErr } = await supabase
        .from('posts')
        .select('id, content')
        .eq('id', item.id)
        .single()

      if (fetchErr || !currentPost) {
        throw new Error(`Failed to fetch post ${item.slug} (${item.id}): ${fetchErr?.message}`)
      }

      const mergedContent = {
        ...(currentPost.content || {}),
        featured_image_caption: item.previous_caption,
      }

      const { error: updateErr } = await supabase
        .from('posts')
        .update({ content: mergedContent })
        .eq('id', item.id)
        .eq('publish_status', 'draft')

      if (updateErr) {
        throw new Error(`Failed to restore post ${item.slug}: ${updateErr.message}`)
      }
    }

    console.log('Restore completed successfully.')
    return
  }

  // Fetch all draft posts
  const { data: posts, error: postsErr } = await supabase
    .from('posts')
    .select('id, title, slug, featured_image_url, content, publish_status, visibility, published_at')
    .eq('publish_status', 'draft')

  if (postsErr) {
    throw new Error(`Failed to fetch draft posts: ${postsErr.message}`)
  }

  const preflightMediaMap = loadPreflightMediaMap()
  const planRows = buildCaptionBackfillPlan(posts, preflightMediaMap)

  console.log('=== UNSPLASH CAPTION BACKFILL PLAN ===')
  console.log(`Total draft posts checked: ${posts.length}`)
  console.log(`Unsplash draft posts identified: ${planRows.length}\n`)

  printAsciiTable(planRows)

  const counts = {
    total: planRows.length,
    set: planRows.filter((r) => r.action === 'set').length,
    append: planRows.filter((r) => r.action === 'append').length,
    alreadyHasCredit: planRows.filter((r) => r.action === 'already has credit').length,
    noSource: planRows.filter((r) => r.action === 'NO SOURCE').length,
  }

  console.log('\nSummary: Total=' + counts.total + ' | Set=' + counts.set + ' | Append=' + counts.append + ' | Already Has Credit=' + counts.alreadyHasCredit + ' | No Source=' + counts.noSource)

  if (!isApply) {
    console.log('\nDRY RUN MODE: Zero database mutations made.')
    console.log('To apply changes, run with: --apply and CONFIRM_CAPTION_BACKFILL=yes')
    return
  }

  // Apply mode safety checks
  if (process.env.CONFIRM_CAPTION_BACKFILL !== 'yes') {
    console.error('\nSAFETY BLOCK: CONFIRM_CAPTION_BACKFILL=yes required in environment to apply changes.')
    process.exit(1)
  }

  const toUpdate = planRows.filter((r) => r.action === 'set' || r.action === 'append')
  if (toUpdate.length === 0) {
    console.log('\nNo updates required.')
    return
  }

  // Write backup file to os.tmpdir() BEFORE any writes
  const backupData = {
    timestamp: new Date().toISOString(),
    posts: toUpdate.map((r) => ({
      id: r.post.id,
      slug: r.slug,
      previous_caption: r.currentCaption,
    })),
  }

  const backupFilePath = path.join(
    os.tmpdir(),
    `caption-backfill-backup-${Date.now()}.json`
  )
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8')
  console.log(`\nBackup written before mutations: ${backupFilePath}`)

  console.log(`Applying updates to ${toUpdate.length} posts...`)
  for (const item of toUpdate) {
    const updatedContent = {
      ...(item.post.content || {}),
      featured_image_caption: item.proposedCaption,
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ content: updatedContent })
      .eq('id', item.post.id)
      .eq('publish_status', 'draft')

    if (updateError) {
      throw new Error(`Failed to update ${item.slug}: ${updateError.message}`)
    }
  }

  console.log('Application completed successfully.')
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMain) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
