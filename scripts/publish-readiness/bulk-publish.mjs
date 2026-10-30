// Bulk publish script for imported Ghost draft posts
// Default mode: Dry run (no mutations)
// Apply mode: CONFIRM_BULK_PUBLISH=yes node scripts/publish-readiness/bulk-publish.mjs --apply
// Restore mode (dry run): node scripts/publish-readiness/bulk-publish.mjs --restore <backup-file>
// Restore mode (apply): CONFIRM_BULK_PUBLISH=yes node scripts/publish-readiness/bulk-publish.mjs --restore <backup-file> --apply
// House style: spaced hyphen only

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

export const DEFAULT_EXCLUSION_PATTERNS = [
  'on-pioneering-again',
  'on-the-gain-and-the-gap',
]

export const EXPECTED_TARGET_COUNT = 47
export const BATCH_SIZE = 10

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
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1)
      }
      env[key] = val
    }
  }
  return env
}

export function getSupabaseClient() {
  const env = loadEnvLocal()
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
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

// Mirrors lib/resolvePublishedAt.ts so the exact same date resolution rule is shared
export function resolvePublishedAt({
  incomingPublishedAt,
  existingPublishedAt,
  publishStatus,
  now = new Date().toISOString(),
}) {
  const incoming =
    incomingPublishedAt && String(incomingPublishedAt).trim() !== ''
      ? String(incomingPublishedAt)
      : null

  const existing =
    existingPublishedAt && String(existingPublishedAt).trim() !== ''
      ? String(existingPublishedAt)
      : null

  if (publishStatus === 'scheduled') {
    return incoming || existing || null
  }

  if (publishStatus === 'published') {
    if (incoming) {
      return incoming
    }
    if (existing) {
      return existing
    }
    return now
  }

  if (!incoming && existing) {
    return existing
  }

  return incoming || null
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function matchExclusions(
  posts,
  exclusionBases = DEFAULT_EXCLUSION_PATTERNS
) {
  const draftPosts = posts.filter((p) => p.publish_status === 'draft')
  const excludedIds = new Set()
  const exclusionMatches = []

  for (const base of exclusionBases) {
    const exactMatches = draftPosts.filter((p) => p.slug === base)
    let matchedPosts = exactMatches
    let matchType = 'exact'

    if (exactMatches.length === 0) {
      const suffixRegex = new RegExp(`^${escapeRegExp(base)}-\\d+$`)
      matchedPosts = draftPosts.filter((p) => suffixRegex.test(p.slug))
      matchType = 'suffix'
    }

    if (matchedPosts.length === 0) {
      throw new Error(
        `STOP: Exclusion slug "${base}" matched 0 draft posts (expected exactly 1).`
      )
    }

    if (matchedPosts.length > 1) {
      const matchedSlugs = matchedPosts.map((p) => p.slug).join(', ')
      throw new Error(
        `STOP: Exclusion slug "${base}" matched ${matchedPosts.length} draft posts (${matchedSlugs}); expected exactly 1.`
      )
    }

    const matchedPost = matchedPosts[0]
    excludedIds.add(matchedPost.id)
    exclusionMatches.push({
      pattern: base,
      matchType,
      id: matchedPost.id,
      slug: matchedPost.slug,
      title: matchedPost.title,
      publish_status: matchedPost.publish_status,
      published_at: matchedPost.published_at || null,
    })
  }

  return { excludedIds, exclusionMatches }
}

export function validateTargetPost(post, nowIso = new Date().toISOString()) {
  const rawDate = post.published_at
  if (!rawDate || String(rawDate).trim() === '') {
    return {
      blocked: true,
      reason: 'published_at is null or empty',
    }
  }

  const pubTime = new Date(rawDate).getTime()
  const nowTime = new Date(nowIso).getTime()

  if (Number.isNaN(pubTime)) {
    return {
      blocked: true,
      reason: 'published_at is not a valid timestamp',
    }
  }

  if (pubTime > nowTime) {
    return {
      blocked: true,
      reason: `published_at (${rawDate}) is in the future`,
    }
  }

  const resolved = resolvePublishedAt({
    incomingPublishedAt: null,
    existingPublishedAt: rawDate,
    publishStatus: 'published',
    now: nowIso,
  })

  if (resolved !== rawDate) {
    return {
      blocked: true,
      reason: 'resolvePublishedAt did not preserve existing published_at',
    }
  }

  return {
    blocked: false,
    reason: null,
  }
}

export function buildBulkPublishPlan(
  dbPosts,
  {
    exclusionBases = DEFAULT_EXCLUSION_PATTERNS,
    expectedTargetCount = EXPECTED_TARGET_COUNT,
    now = new Date().toISOString(),
    enforceTargetCount = true,
  } = {}
) {
  const { excludedIds, exclusionMatches } = matchExclusions(
    dbPosts,
    exclusionBases
  )

  const rows = []
  const targetRows = []
  const blockedRows = []

  for (const post of dbPosts) {
    if (post.publish_status === 'published') {
      rows.push({
        id: post.id,
        slug: post.slug,
        title: post.title,
        currentStatus: post.publish_status,
        published_at: post.published_at || null,
        visibility: post.visibility,
        content_type: post.content_type,
        plannedStatus: 'published (unchanged)',
        category: 'already_published',
        blockReason: null,
      })
      continue
    }

    if (post.publish_status === 'draft' && excludedIds.has(post.id)) {
      rows.push({
        id: post.id,
        slug: post.slug,
        title: post.title,
        currentStatus: post.publish_status,
        published_at: post.published_at || null,
        visibility: post.visibility,
        content_type: post.content_type,
        plannedStatus: 'draft (excluded)',
        category: 'excluded_draft',
        blockReason: null,
      })
      continue
    }

    if (post.publish_status === 'draft') {
      const validation = validateTargetPost(post, now)
      if (validation.blocked) {
        const row = {
          id: post.id,
          slug: post.slug,
          title: post.title,
          currentStatus: post.publish_status,
          published_at: post.published_at || null,
          visibility: post.visibility,
          content_type: post.content_type,
          plannedStatus: `BLOCKED (${validation.reason})`,
          category: 'blocked',
          blockReason: validation.reason,
        }
        rows.push(row)
        blockedRows.push(row)
      } else {
        const row = {
          id: post.id,
          slug: post.slug,
          title: post.title,
          currentStatus: post.publish_status,
          published_at: post.published_at,
          visibility: post.visibility,
          content_type: post.content_type,
          plannedStatus: 'published (to publish)',
          category: 'target',
          blockReason: null,
        }
        rows.push(row)
        targetRows.push(row)
      }
      continue
    }

    rows.push({
      id: post.id,
      slug: post.slug,
      title: post.title,
      currentStatus: post.publish_status,
      published_at: post.published_at || null,
      visibility: post.visibility,
      content_type: post.content_type,
      plannedStatus: `${post.publish_status} (unchanged)`,
      category: 'other',
      blockReason: null,
    })
  }

  const candidateCount = targetRows.length + blockedRows.length
  if (enforceTargetCount && candidateCount !== expectedTargetCount) {
    const candidateSlugs = [...targetRows, ...blockedRows]
      .map((r) => r.slug)
      .join(', ')
    throw new Error(
      `STOP: Expected exactly ${expectedTargetCount} target draft posts after exclusions, but found ${candidateCount}. Candidate slugs: ${candidateSlugs}`
    )
  }

  const toPublish = targetRows.length
  const stayingDraft = rows.filter((r) => r.category === 'excluded_draft').length
  const alreadyPublished = rows.filter(
    (r) => r.category === 'already_published'
  ).length
  const blockedCount = blockedRows.length
  const totalPosts = dbPosts.length

  const counts = {
    totalPosts,
    toPublish,
    stayingDraft,
    alreadyPublished,
    blockedCount,
    expectedResultingPublished: alreadyPublished + toPublish,
    expectedResultingDraft: stayingDraft + blockedCount,
    expectedResultingTotal: totalPosts,
  }

  return {
    rows,
    exclusionMatches,
    blockedRows,
    targetRows,
    counts,
  }
}

function truncateText(str, maxLen) {
  const s = String(str ?? '')
  if (s.length <= maxLen) return s
  return s.slice(0, maxLen - 3) + '...'
}

function printAsciiTable(rows) {
  const header = [
    'slug',
    'title',
    'current status',
    'published_at',
    'visibility',
    'content_type',
    'planned status',
  ]

  const formatted = rows.map((r) => [
    r.slug,
    truncateText(r.title, 44),
    r.currentStatus,
    r.published_at || 'null',
    r.visibility || 'null',
    r.content_type || 'null',
    r.plannedStatus,
  ])

  const colWidths = header.map((h, i) =>
    Math.max(h.length, ...formatted.map((f) => f[i].length))
  )

  const sep = colWidths.map((w) => '-'.repeat(w + 2)).join('+')
  const formatRow = (cols) =>
    cols.map((c, i) => ` ${c.padEnd(colWidths[i])} `).join('|')

  console.log(formatRow(header))
  console.log(sep)
  for (const f of formatted) {
    console.log(formatRow(f))
  }
}

async function handleRestore(supabase, backupFile, isApply) {
  const resolved = path.resolve(backupFile)
  if (!fs.existsSync(resolved)) {
    throw new Error(`Backup file not found: ${resolved}`)
  }
  const raw = fs.readFileSync(resolved, 'utf8')
  const backup = JSON.parse(raw)
  if (!Array.isArray(backup.posts)) {
    throw new Error('Invalid backup file structure: posts array missing')
  }

  console.log('=== BULK PUBLISH RESTORE PLAN ===')
  console.log(`Backup file: ${resolved}`)
  console.log(`Backup timestamp: ${backup.timestamp || 'unknown'}`)
  console.log(`Posts in backup: ${backup.posts.length}`)

  if (!isApply) {
    console.log('\nRESTORE DRY RUN MODE: Zero database mutations made.')
    console.log(
      'To apply restore, run with: CONFIRM_BULK_PUBLISH=yes node scripts/publish-readiness/bulk-publish.mjs --restore <backup-file> --apply'
    )
    return
  }

  if (process.env.CONFIRM_BULK_PUBLISH !== 'yes') {
    console.error(
      '\nSAFETY BLOCK: CONFIRM_BULK_PUBLISH=yes required in environment to apply restore.'
    )
    process.exit(1)
  }

  console.log(`Restoring ${backup.posts.length} posts from backup...`)
  for (const post of backup.posts) {
    const { error } = await supabase
      .from('posts')
      .update({
        publish_status: post.publish_status,
        published_at: post.published_at,
      })
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
    if (!backupFile || backupFile.startsWith('--')) {
      console.error('Error: --restore requires a path to a backup file')
      process.exit(1)
    }
    await handleRestore(supabase, backupFile, isApply)
    return
  }

  const { data: dbPosts, error: fetchError } = await supabase
    .from('posts')
    .select(
      'id, slug, title, publish_status, published_at, visibility, content_type'
    )
    .order('slug', { ascending: true })
    .limit(1000)

  if (fetchError) {
    throw new Error(`Failed to fetch posts from database: ${fetchError.message}`)
  }

  const plan = buildBulkPublishPlan(dbPosts || [])
  const { rows, exclusionMatches, blockedRows, targetRows, counts } = plan

  console.log('=== BULK PUBLISH PLAN (GHOST IMPORTED DRAFTS) ===')
  console.log(
    'Note on updated_at: Database has no automatic updated_at trigger on posts, and this script does not touch updated_at manually. Only publish_status = "published" is written.'
  )
  console.log('')

  printAsciiTable(rows)

  console.log('\n--- Exclusion Matches (staying draft) ---')
  for (const ex of exclusionMatches) {
    console.log(
      `  - Pattern "${ex.pattern}" (${ex.matchType} match): slug="${ex.slug}" | title="${ex.title}" | status=${ex.publish_status} | published_at=${ex.published_at}`
    )
  }

  console.log('\n--- BLOCKED Rows ---')
  if (blockedRows.length === 0) {
    console.log('  None (0 blocked rows)')
  } else {
    for (const b of blockedRows) {
      console.log(
        `  - BLOCKED: slug="${b.slug}" | title="${b.title}" | published_at=${b.published_at} | reason=${b.blockReason}`
      )
    }
  }

  console.log('\n--- Summary ---')
  console.log(
    `${counts.toPublish} to publish, ${counts.stayingDraft} staying draft, ${counts.alreadyPublished} already published, ${counts.blockedCount} blocked`
  )
  console.log(
    `Resulting totals expected: ${counts.expectedResultingPublished} published, ${counts.expectedResultingDraft} draft, ${counts.expectedResultingTotal} posts`
  )

  if (!isApply) {
    console.log('\nDRY RUN MODE: Zero database mutations made.')
    console.log(
      'To apply changes, run with: CONFIRM_BULK_PUBLISH=yes node scripts/publish-readiness/bulk-publish.mjs --apply'
    )
    return
  }

  if (process.env.CONFIRM_BULK_PUBLISH !== 'yes') {
    console.error(
      '\nSAFETY BLOCK: CONFIRM_BULK_PUBLISH=yes required in environment to apply changes.'
    )
    process.exit(1)
  }

  if (blockedRows.length > 0) {
    console.error(
      `\nSAFETY BLOCK: Cannot apply because ${blockedRows.length} target post(s) are BLOCKED.`
    )
    process.exit(1)
  }

  if (targetRows.length !== EXPECTED_TARGET_COUNT) {
    console.error(
      `\nSAFETY BLOCK: Expected ${EXPECTED_TARGET_COUNT} target posts, got ${targetRows.length}.`
    )
    process.exit(1)
  }

  const backupData = {
    timestamp: new Date().toISOString(),
    posts: (dbPosts || []).map((p) => ({
      id: p.id,
      slug: p.slug,
      publish_status: p.publish_status,
      published_at: p.published_at,
    })),
  }

  const backupFilePath = path.join(
    os.tmpdir(),
    `bulk-publish-backup-${Date.now()}.json`
  )
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf8')
  console.log(`\nBackup of all ${backupData.posts.length} posts written before mutations: ${backupFilePath}`)

  console.log(
    `Publishing ${targetRows.length} posts in batches of ${BATCH_SIZE}...`
  )

  for (let i = 0; i < targetRows.length; i += BATCH_SIZE) {
    const batch = targetRows.slice(i, i + BATCH_SIZE)
    const batchIds = batch.map((r) => r.id)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1

    const { error: updateError } = await supabase
      .from('posts')
      .update({ publish_status: 'published' })
      .in('id', batchIds)
      .eq('publish_status', 'draft')

    if (updateError) {
      throw new Error(
        `Batch ${batchNum} update failed: ${updateError.message}`
      )
    }

    const { data: verifyRows, error: verifyError } = await supabase
      .from('posts')
      .select('id, slug, publish_status, published_at')
      .in('id', batchIds)

    if (verifyError) {
      throw new Error(
        `Batch ${batchNum} verification query failed: ${verifyError.message}`
      )
    }

    if (!verifyRows || verifyRows.length !== batch.length) {
      throw new Error(
        `Batch ${batchNum} verification count mismatch: expected ${batch.length}, got ${verifyRows ? verifyRows.length : 0}`
      )
    }

    const verifyById = new Map(verifyRows.map((v) => [v.id, v]))
    for (const expected of batch) {
      const actual = verifyById.get(expected.id)
      if (!actual) {
        throw new Error(
          `Batch ${batchNum} verification missing post id=${expected.id} (${expected.slug})`
        )
      }
      if (actual.publish_status !== 'published') {
        throw new Error(
          `Batch ${batchNum} verification status mismatch for ${expected.slug}: expected "published", got "${actual.publish_status}"`
        )
      }
      const expectedTime = new Date(expected.published_at).getTime()
      const actualTime = new Date(actual.published_at).getTime()
      if (expectedTime !== actualTime) {
        throw new Error(
          `Batch ${batchNum} verification published_at changed for ${expected.slug}: expected "${expected.published_at}", got "${actual.published_at}"`
        )
      }
    }

    console.log(
      `  Batch ${batchNum}: updated and verified ${batch.length} posts.`
    )
  }

  const { data: finalPosts, error: finalError } = await supabase
    .from('posts')
    .select('id, publish_status')
    .limit(1000)

  if (finalError) {
    throw new Error(`Final count check failed: ${finalError.message}`)
  }

  const finalPublished = (finalPosts || []).filter(
    (p) => p.publish_status === 'published'
  ).length
  const finalDraft = (finalPosts || []).filter(
    (p) => p.publish_status === 'draft'
  ).length
  const finalTotal = (finalPosts || []).length

  console.log(
    `\nFinal database counts: ${finalPublished} published, ${finalDraft} draft, ${finalTotal} total posts.`
  )
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
