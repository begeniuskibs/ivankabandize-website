// Restore original Ghost published_at dates for imported draft posts
// Default mode: Dry run (no mutations)
// Apply mode: node scripts/publish-readiness/restore-dates.mjs --apply
//   (requires CONFIRM_PUBLISH_READINESS=yes in environment)
// Restore mode: node scripts/publish-readiness/restore-dates.mjs --restore <backup-file>
// House style: spaced hyphen only

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

const SOURCE_REPORT_PATH = path.resolve('scripts/ghost-import/preflight-report.json')

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

export function loadGhostSourceData() {
  if (!fs.existsSync(SOURCE_REPORT_PATH)) {
    throw new Error(`Source report not found at ${SOURCE_REPORT_PATH}`)
  }
  const raw = fs.readFileSync(SOURCE_REPORT_PATH, 'utf8')
  const data = JSON.parse(raw)
  if (!Array.isArray(data.postsTable)) {
    throw new Error('Invalid preflight-report.json: postsTable array missing')
  }
  return data.postsTable
}

export function buildPlan(sourceEntries, dbPosts) {
  const dbBySlug = new Map()
  for (const post of dbPosts) {
    dbBySlug.set(post.slug, post)
  }

  const rows = []
  const unmatchedSource = []

  for (const entry of sourceEntries) {
    const dbPost = dbBySlug.get(entry.slug)
    if (!dbPost) {
      unmatchedSource.push(entry.slug)
      continue
    }

    const currentPublishedAt = dbPost.published_at || null
    let originalDate = null
    if (entry.published_at && entry.published_at !== 'draft (no date)') {
      originalDate = new Date(entry.published_at).toISOString()
    }

    let action = 'no source'
    if (!originalDate) {
      action = 'no source'
    } else if (currentPublishedAt) {
      const currentTime = new Date(currentPublishedAt).getTime()
      const originalTime = new Date(originalDate).getTime()
      if (currentTime === originalTime) {
        action = 'already correct'
      } else {
        action = 'set'
      }
    } else {
      action = 'set'
    }

    rows.push({
      slug: entry.slug,
      currentPublishedAt,
      originalDate,
      action,
      dbPost,
    })
  }

  return { rows, unmatchedSource }
}

function printAsciiTable(rows) {
  const header = ['slug', 'current published_at', 'original date', 'action']
  const formatted = rows.map((r) => [
    r.slug,
    r.currentPublishedAt || 'null',
    r.originalDate || 'null',
    r.action,
  ])

  const colWidths = [
    Math.max(header[0].length, ...formatted.map((f) => f[0].length)),
    Math.max(header[1].length, ...formatted.map((f) => f[1].length)),
    Math.max(header[2].length, ...formatted.map((f) => f[2].length)),
    Math.max(header[3].length, ...formatted.map((f) => f[3].length)),
  ]

  const sep = colWidths.map((w) => '-'.repeat(w + 2)).join('+')
  const formatRow = (cols) =>
    cols.map((c, i) => ` ${c.padEnd(colWidths[i])} `).join('|')

  console.log(formatRow(header))
  console.log(sep)
  for (const f of formatted) {
    console.log(formatRow(f))
  }
}

async function handleRestore(supabase, backupFile) {
  const resolved = path.resolve(backupFile)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Backup file not found: ${resolved}`)
  }
  const raw = fs.readFileSync(resolved, 'utf8')
  const backup = JSON.parse(raw)
  if (!Array.isArray(backup.posts)) {
    throw new Error('Invalid backup file structure: posts array missing')
  }

  console.log(`Restoring ${backup.posts.length} posts from backup: ${resolved}`)
  for (const post of backup.posts) {
    const { error } = await supabase
      .from('posts')
      .update({ published_at: post.published_at })
      .eq('id', post.id)

    if (error) {
      throw new Error(`Failed to restore post ${post.slug}: ${error.message}`)
    }
  }
  console.log('Restore completed successfully.')
}

async function main() {
  const args = process.argv.slice(2)
  const isApply = args.includes('--apply')
  const restoreIdx = args.indexOf('--restore')
  const isRestore = restoreIdx !== -1

  const supabase = getSupabaseClient()

  if (isRestore) {
    const backupFile = args[restoreIdx + 1]
    if (!backupFile) {
      console.error('Error: --restore requires a path to a backup file')
      process.exit(1)
    }
    await handleRestore(supabase, backupFile)
    return
  }

  const sourceEntries = loadGhostSourceData()
  const slugs = sourceEntries.map((e) => e.slug)

  const { data: dbPosts, error: fetchError } = await supabase
    .from('posts')
    .select('id, slug, title, publish_status, visibility, content, published_at')
    .in('slug', slugs)
    .order('slug')

  if (fetchError) {
    throw new Error(`Failed to fetch posts from database: ${fetchError.message}`)
  }

  const { rows, unmatchedSource } = buildPlan(sourceEntries, dbPosts || [])

  console.log('=== GHOST ORIGINAL DATES RESTORATION PLAN ===')
  console.log(`Source file: scripts/ghost-import/preflight-report.json`)
  console.log(`Source field: postsTable[].published_at`)
  console.log(`Total source posts: ${sourceEntries.length}`)
  console.log(`Matched database posts: ${rows.length}`)
  console.log(`Unmatched source posts: ${unmatchedSource.length}`)
  if (unmatchedSource.length > 0) {
    console.log(`Unmatched slugs: ${unmatchedSource.join(', ')}`)
  }
  console.log('')

  printAsciiTable(rows)

  const counts = {
    total: rows.length,
    set: rows.filter((r) => r.action === 'set').length,
    alreadyCorrect: rows.filter((r) => r.action === 'already correct').length,
    noSource: rows.filter((r) => r.action === 'no source').length,
  }

  console.log('')
  console.log(
    `Summary: Total=${counts.total} | Set=${counts.set} | Already Correct=${counts.alreadyCorrect} | No Source=${counts.noSource}`
  )

  if (!isApply) {
    console.log('\nDRY RUN MODE: Zero database mutations made.')
    console.log('To apply changes, run with: --apply and CONFIRM_PUBLISH_READINESS=yes')
    return
  }

  // Apply mode safety checks
  if (process.env.CONFIRM_PUBLISH_READINESS !== 'yes') {
    console.error(
      '\nSAFETY BLOCK: CONFIRM_PUBLISH_READINESS=yes required in environment to apply changes.'
    )
    process.exit(1)
  }

  const backupData = {
    timestamp: new Date().toISOString(),
    posts: rows.map((r) => ({
      id: r.dbPost.id,
      slug: r.slug,
      publish_status: r.dbPost.publish_status,
      visibility: r.dbPost.visibility,
      published_at: r.dbPost.published_at,
    })),
  }

  const backupFilePath = path.join(
    os.tmpdir(),
    `publish-readiness-backup-${Date.now()}.json`
  )
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8')
  console.log(`\nBackup written before mutations: ${backupFilePath}`)

  const toSet = rows.filter((r) => r.action === 'set')
  console.log(`Applying updates to ${toSet.length} posts...`)

  for (const item of toSet) {
    // Only published_at is modified - publish_status, visibility, content are left untouched
    const { error: updateError } = await supabase
      .from('posts')
      .update({ published_at: item.originalDate })
      .eq('id', item.dbPost.id)
      .eq('publish_status', 'draft') // Safety guardrail: post must remain draft

    if (updateError) {
      throw new Error(`Failed to update ${item.slug}: ${updateError.message}`)
    }
  }

  console.log('Application completed successfully.')
}

const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
