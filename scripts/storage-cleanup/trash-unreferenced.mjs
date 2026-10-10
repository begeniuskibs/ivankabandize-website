// Storage Cleanup: Trash Unreferenced Objects
// NOTE: Permanent deletion (purging) is intentionally NOT implemented in this script.
// Permanent deletion is a separate, later, explicitly approved step.
// All cleanup operations move unreferenced objects to the '_trash/' prefix for safe recovery.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

export const BUCKETS = ['post-images', 'post-videos']

// ============================================================================
// 1. ENVIRONMENT & CONFIGURATION
// ============================================================================

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
  const localEnv = loadEnvLocal()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || localEnv.SUPABASE_SERVICE_ROLE_KEY
  const supabaseKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || localEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment or .env.local')
  }
  if (!supabaseKey) {
    throw new Error('Missing Supabase key in environment or .env.local')
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

// ============================================================================
// 2. PURE LOGIC (TESTABLE OFFLINE)
// ============================================================================

export function buildTrashPath(name) {
  if (!name || typeof name !== 'string') return ''
  const clean = name.replace(/^\/+/, '')
  return `_trash/${clean}`
}

export function isTrashPath(name) {
  if (!name || typeof name !== 'string') return false
  const clean = name.replace(/^\/+/, '')
  return clean === '_trash' || clean.startsWith('_trash/')
}

export function filterNonTrashObjects(objects) {
  if (!Array.isArray(objects)) return []
  return objects.filter(obj => {
    const name = typeof obj === 'string' ? obj : obj?.name
    return !isTrashPath(name)
  })
}

export function getNameVariants(name) {
  if (!name || typeof name !== 'string') return []
  const variants = new Set()
  variants.add(name)

  try {
    variants.add(decodeURIComponent(name))
  } catch {}

  try {
    variants.add(encodeURIComponent(name))
  } catch {}

  try {
    variants.add(encodeURI(name))
  } catch {}

  variants.add(name.replace(/ /g, '%20'))
  variants.add(name.replace(/%20/g, ' '))

  if (name.includes('/')) {
    const parts = name.split('/')
    variants.add(parts.map(p => encodeURIComponent(p)).join('/'))
    const basename = parts[parts.length - 1]
    if (basename) {
      variants.add(basename)
      try { variants.add(decodeURIComponent(basename)) } catch {}
      try { variants.add(encodeURIComponent(basename)) } catch {}
      variants.add(basename.replace(/ /g, '%20'))
      variants.add(basename.replace(/%20/g, ' '))
    }
  }

  return Array.from(variants).filter(v => v && v.length > 0)
}

export function isReferenced(name, corpus) {
  if (!name) return false
  const variants = getNameVariants(name)

  if (typeof corpus === 'string') {
    return variants.some(v => corpus.includes(v))
  }

  if (corpus instanceof Set) {
    for (const v of variants) {
      if (corpus.has(v)) return true
    }
    for (const item of corpus) {
      if (typeof item === 'string' && variants.some(v => item.includes(v))) {
        return true
      }
    }
    return false
  }

  if (Array.isArray(corpus)) {
    return corpus.some(item => {
      if (typeof item === 'string') {
        return variants.some(v => item.includes(v))
      }
      return false
    })
  }

  return false
}

export function extractReferencedNames(candidateNames, corpus) {
  const referenced = new Set()
  for (const item of candidateNames) {
    const name = typeof item === 'string' ? item : item?.name
    if (name && isReferenced(name, corpus)) {
      referenced.add(name)
    }
  }
  return referenced
}

export function parseKeepList(keepItems) {
  const set = new Set()
  if (!keepItems) return set

  if (typeof keepItems === 'string') {
    for (const line of keepItems.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      set.add(trimmed)
    }
    return set
  }

  if (Array.isArray(keepItems) || keepItems instanceof Set) {
    for (const item of keepItems) {
      if (typeof item === 'string') {
        const trimmed = item.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        set.add(trimmed)
      }
    }
  }

  return set
}

export function parseKeepFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) {
    throw new Error(`Keep file not found: ${filePath}`)
  }
  const content = fs.readFileSync(filePath, 'utf8')
  return parseKeepList(content)
}

export function applyKeepList(objects, keepList) {
  const keepSet = keepList instanceof Set ? keepList : parseKeepList(keepList)
  const remaining = []
  const kept = []

  for (const obj of objects) {
    const name = typeof obj === 'string' ? obj : obj?.name
    if (keepSet.has(name)) {
      kept.push(obj)
    } else {
      remaining.push(obj)
    }
  }

  remaining.kept = kept
  remaining.remaining = remaining
  return remaining
}

export function applyAgeFilter(objects, minAgeHours = 24, now = new Date()) {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime()
  const minAgeMs = Number(minAgeHours) * 60 * 60 * 1000
  const older = []
  const tooRecent = []

  for (const obj of objects) {
    const createdMs = new Date(obj.created_at).getTime()
    if (Number.isNaN(createdMs) || (nowMs - createdMs) >= minAgeMs) {
      older.push(obj)
    } else {
      tooRecent.push(obj)
    }
  }

  older.older = older
  older.tooRecent = tooRecent
  return older
}

export function classifyObject(obj, corpus, keepSet, minAgeHours = 24, now = new Date()) {
  const name = typeof obj === 'string' ? obj : obj.name

  if (isReferenced(name, corpus)) {
    return { ...obj, status: 'REFERENCED', reason: 'Found in DB or repo text references' }
  }

  if (keepSet && keepSet.has(name)) {
    return { ...obj, status: 'KEPT', reason: 'Matched keep list' }
  }

  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime()
  const createdMs = new Date(obj.created_at).getTime()
  const minAgeMs = Number(minAgeHours) * 60 * 60 * 1000
  const isOlder = Number.isNaN(createdMs) || (nowMs - createdMs) >= minAgeMs

  if (!isOlder) {
    return { ...obj, status: 'TOO_RECENT', reason: `Created within the last ${minAgeHours} hours` }
  }

  return { ...obj, status: 'CANDIDATE', reason: 'Unreferenced and older than threshold' }
}

export function planRestore(manifestItems, existingDestinations = []) {
  const existingSet = existingDestinations instanceof Set
    ? existingDestinations
    : new Set(
        Array.isArray(existingDestinations)
          ? existingDestinations.map(d => (typeof d === 'string' ? d : d?.name))
          : []
      )

  const toRestore = []
  const skipped = []

  for (const item of (manifestItems || [])) {
    const originalName = item.originalName || item.name?.replace(/^_trash\//, '') || item.name
    const trashPath = item.trashPath || (item.name?.startsWith('_trash/') ? item.name : buildTrashPath(item.name))
    const destPath = originalName

    if (existingSet.has(destPath)) {
      skipped.push({
        ...item,
        destPath,
        trashPath,
        reason: 'destination_exists',
        message: `Destination ${destPath} already exists in bucket`,
      })
    } else {
      toRestore.push({
        ...item,
        destPath,
        trashPath,
        bucket: item.bucket,
        action: 'move',
        from: trashPath,
        to: destPath,
      })
    }
  }

  toRestore.toRestore = toRestore
  toRestore.skipped = skipped
  return toRestore
}

export function enforceMaxGuard(candidateCount, maxGuard = 80) {
  const count = Number(candidateCount)
  const max = Number(maxGuard)
  if (count > max) {
    const err = new Error(`Candidate count (${count}) exceeds maximum threshold of ${max}. Pass a higher --max if intended.`)
    err.allowed = false
    err.candidateCount = count
    err.maxGuard = max
    throw err
  }
  return { allowed: true, candidateCount: count, maxGuard: max }
}

// ============================================================================
// 3. STORAGE & DATABASE GATHERING
// ============================================================================

export async function listBucketObjectsRecursive(supabase, bucket, prefix = '') {
  const allObjects = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) {
      throw new Error(`Failed to list objects in bucket "${bucket}" (prefix: "${prefix}"): ${error.message}`)
    }

    if (!data || data.length === 0) break

    for (const item of data) {
      if (item.name === '_trash') continue
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name
      if (fullPath.startsWith('_trash/')) continue

      // Folder detection in Supabase Storage: id is null or metadata is null
      if (item.id === null || !item.metadata) {
        const subObjects = await listBucketObjectsRecursive(supabase, bucket, fullPath)
        allObjects.push(...subObjects)
      } else {
        allObjects.push({
          bucket,
          name: fullPath,
          size: item.metadata?.size ?? item.size ?? 0,
          created_at: item.created_at || item.updated_at || new Date().toISOString(),
        })
      }
    }

    if (data.length < limit) break
    offset += limit
  }

  return allObjects
}

export async function fetchDatabaseCorpus(supabase) {
  const tables = [
    'posts',
    'pages',
    'library_items',
    'series',
    'tags',
    'users',
    'members',
    'now_entries',
    'newsletters',
    'inquiries',
  ]

  const rows = []
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        console.warn(`[WARN] Could not select from ${table}: ${error.message}`)
        continue
      }
      if (Array.isArray(data)) {
        for (const row of data) {
          rows.push(JSON.stringify(row))
        }
      }
    } catch (err) {
      console.warn(`[WARN] Error querying table ${table}: ${err.message}`)
    }
  }

  return rows.join('\n')
}

export function scanRepoTextCorpus(repoRoot = process.cwd()) {
  const targetDirs = ['app', 'components', 'lib', 'public', 'scripts']
  const excludePatterns = [
    'node_modules',
    '.next',
    path.normalize('scripts/ghost-import/backups'),
    path.normalize('scripts/storage-cleanup/manifests'),
    '.git',
  ]
  const repoTexts = []

  function walk(dir) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.relative(repoRoot, fullPath)
      if (excludePatterns.some(pattern => relativePath.includes(pattern))) {
        continue
      }
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        const textExts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.json', '.md', '.css', '.html', '.svg', '.txt', '.yaml', '.yml']
        if (textExts.includes(ext) || entry.name.startsWith('.env')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8')
            repoTexts.push(content)
          } catch {}
        }
      }
    }
  }

  for (const d of targetDirs) {
    walk(path.join(repoRoot, d))
  }

  return repoTexts.join('\n')
}

export async function buildFullCorpus(supabase, repoRoot = process.cwd()) {
  const dbCorpus = await fetchDatabaseCorpus(supabase)
  const repoCorpus = scanRepoTextCorpus(repoRoot)
  return `${dbCorpus}\n${repoCorpus}`
}

// ============================================================================
// 4. CLI ARGUMENT PARSER
// ============================================================================

export function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    apply: false,
    minAgeHours: 24,
    maxGuard: 80,
    keep: [],
    keepFile: null,
    restoreManifest: null,
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--apply') {
      options.apply = true
    } else if (arg === '--min-age-hours' && i + 1 < argv.length) {
      options.minAgeHours = parseFloat(argv[++i])
    } else if (arg.startsWith('--min-age-hours=')) {
      options.minAgeHours = parseFloat(arg.split('=')[1])
    } else if (arg === '--max' && i + 1 < argv.length) {
      options.maxGuard = parseInt(argv[++i], 10)
    } else if (arg.startsWith('--max=')) {
      options.maxGuard = parseInt(arg.split('=')[1], 10)
    } else if (arg === '--keep' && i + 1 < argv.length) {
      options.keep.push(argv[++i])
    } else if (arg.startsWith('--keep=')) {
      options.keep.push(arg.split('=')[1])
    } else if (arg === '--keep-file' && i + 1 < argv.length) {
      options.keepFile = argv[++i]
    } else if (arg.startsWith('--keep-file=')) {
      options.keepFile = arg.split('=')[1]
    } else if (arg === '--restore' && i + 1 < argv.length) {
      options.restoreManifest = argv[++i]
    } else if (arg.startsWith('--restore=')) {
      options.restoreManifest = arg.split('=')[1]
    }
  }

  return options
}

// ============================================================================
// 5. RESTORE ROUTINE
// ============================================================================

export async function runRestore({ supabase, manifestPath, isApply }) {
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest file not found: ${manifestPath}`)
  }

  const manifestContent = fs.readFileSync(manifestPath, 'utf8')
  const manifest = JSON.parse(manifestContent)
  const items = manifest.candidates || manifest.items || manifest.moved || []

  console.log(`\n=== RESTORE WORKFLOW (${isApply ? 'APPLY' : 'DRY RUN'}) ===`)
  console.log(`Loaded ${items.length} items from manifest: ${manifestPath}`)

  if (isApply && process.env.CLEANUP_CONFIRM !== 'yes') {
    throw new Error(
      `--apply requires environment variable CLEANUP_CONFIRM=yes.\n` +
      `Run with:\n  $env:CLEANUP_CONFIRM='yes'; node scripts/storage-cleanup/trash-unreferenced.mjs --restore "${manifestPath}" --apply`
    )
  }

  const results = []
  for (const bucket of BUCKETS) {
    const bucketItems = items.filter(i => i.bucket === bucket)
    if (bucketItems.length === 0) continue

    const existingInBucket = await listBucketObjectsRecursive(supabase, bucket)
    const existingDestSet = new Set(existingInBucket.map(o => o.name))

    const planned = planRestore(bucketItems, existingDestSet)

    console.log(`\nBucket: ${bucket}`)
    console.log(`  Items to restore: ${planned.length}`)
    console.log(`  Skipped (destination exists): ${planned.skipped.length}`)

    for (const item of planned.skipped) {
      console.log(`  [SKIP] ${item.trashPath} -> ${item.destPath} (${item.message})`)
      results.push({ ...item, status: 'skipped' })
    }

    for (const item of planned) {
      if (!isApply) {
        console.log(`  [DRY-RUN MOVE] ${item.trashPath} -> ${item.destPath}`)
        results.push({ ...item, status: 'dry-run' })
      } else {
        console.log(`  [RESTORING] ${item.trashPath} -> ${item.destPath}`)
        const { error } = await supabase.storage.from(bucket).move(item.trashPath, item.destPath)
        if (error) {
          console.error(`  [FAILED] ${item.trashPath}: ${error.message}`)
          results.push({ ...item, status: 'failed', error: error.message })
        } else {
          // Verify with HEAD request
          const publicUrl = supabase.storage.from(bucket).getPublicUrl(item.destPath).data.publicUrl
          let verifyOk = false
          try {
            const headRes = await fetch(publicUrl, { method: 'HEAD' })
            verifyOk = headRes.status === 200
          } catch {}

          if (verifyOk) {
            console.log(`  [VERIFIED] ${item.destPath} is accessible (200 OK)`)
            results.push({ ...item, status: 'restored', verify: 'ok' })
          } else {
            console.warn(`  [WARNING] Move succeeded but HEAD verification failed for ${item.destPath}`)
            results.push({ ...item, status: 'restored', verify: 'failed' })
          }
        }
      }
    }
  }

  console.log(`\nRestore complete. Processed ${results.length} items.`)
  return results
}

// ============================================================================
// 6. MAIN CLEANUP ROUTINE
// ============================================================================

export async function runCleanup(options = {}) {
  const {
    apply: isApply = false,
    minAgeHours = 24,
    maxGuard = 80,
    keep = [],
    keepFile = null,
    restoreManifest = null,
  } = options

  const supabase = getSupabaseClient()

  if (restoreManifest) {
    return await runRestore({
      supabase,
      manifestPath: restoreManifest,
      isApply,
    })
  }

  console.log(`\n=== STORAGE CLEANUP: TRASH UNREFERENCED OBJECTS ===`)
  console.log(`Mode: ${isApply ? 'APPLY (LIVE MOVE)' : 'DRY RUN (READ-ONLY)'}`)
  console.log(`Min age: ${minAgeHours} hours`)
  console.log(`Max candidates guard: ${maxGuard}`)

  if (isApply && process.env.CLEANUP_CONFIRM !== 'yes') {
    throw new Error(
      `--apply requires environment variable CLEANUP_CONFIRM=yes.\n` +
      `To apply changes on Windows PowerShell, run:\n` +
      `  $env:CLEANUP_CONFIRM='yes'; node scripts/storage-cleanup/trash-unreferenced.mjs --apply`
    )
  }

  // 1. Build Keep List
  const keepSet = new Set(keep)
  if (keepFile) {
    const fileSet = parseKeepFile(keepFile)
    for (const item of fileSet) keepSet.add(item)
  }
  if (keepSet.size > 0) {
    console.log(`Keep list size: ${keepSet.size} entries`)
  }

  // 2. Fetch Reference Corpus
  console.log('Building reference corpus (database rows + repo source files)...')
  const corpus = await buildFullCorpus(supabase)
  console.log(`Reference corpus built (${corpus.length} characters)`)

  // 3. List All Storage Objects (excluding _trash/)
  console.log('Listing objects in storage buckets...')
  const bucketObjects = {}
  for (const bucket of BUCKETS) {
    const objects = await listBucketObjectsRecursive(supabase, bucket)
    bucketObjects[bucket] = filterNonTrashObjects(objects)
    console.log(`Bucket "${bucket}": ${bucketObjects[bucket].length} non-trash objects found`)
  }

  // 4. Classify Objects
  const now = new Date()
  const classification = {
    REFERENCED: [],
    KEPT: [],
    TOO_RECENT: [],
    CANDIDATE: [],
  }

  for (const bucket of BUCKETS) {
    for (const obj of bucketObjects[bucket]) {
      const classified = classifyObject(obj, corpus, keepSet, minAgeHours, now)
      classification[classified.status].push(classified)
    }
  }

  // 5. Output Summary Table & Totals
  console.log('\n--- CLASSIFICATION SUMMARY ---')
  console.log(`REFERENCED objects : ${classification.REFERENCED.length}`)
  console.log(`KEPT objects       : ${classification.KEPT.length}`)
  console.log(`TOO_RECENT objects : ${classification.TOO_RECENT.length}`)
  console.log(`CANDIDATE objects  : ${classification.CANDIDATE.length}`)

  console.log('\n--- TOTALS BY BUCKET ---')
  for (const bucket of BUCKETS) {
    const all = bucketObjects[bucket]
    const candidates = classification.CANDIDATE.filter(c => c.bucket === bucket)
    const allBytes = all.reduce((sum, o) => sum + (o.size || 0), 0)
    const candBytes = candidates.reduce((sum, o) => sum + (o.size || 0), 0)
    console.log(`Bucket [${bucket}]:`)
    console.log(`  Total objects      : ${all.length} (${(allBytes / 1024 / 1024).toFixed(2)} MB)`)
    console.log(`  Candidate objects  : ${candidates.length} (${(candBytes / 1024 / 1024).toFixed(2)} MB)`)
  }

  if (classification.CANDIDATE.length > 0) {
    console.log('\n--- CANDIDATE OBJECTS ---')
    console.table(
      classification.CANDIDATE.map(c => ({
        bucket: c.bucket,
        name: c.name,
        size: `${(c.size / 1024).toFixed(1)} KB`,
        created_at: c.created_at,
        trash_path: buildTrashPath(c.name),
      }))
    )
  } else {
    console.log('\nNo unreferenced candidate objects found.')
  }

  // 6. Write Manifest to OS Temp Directory (NEVER to repo)
  const isoTimestamp = new Date().toISOString().replace(/:/g, '-')
  const manifestFileName = `trash-manifest-${isoTimestamp}.json`
  const manifestPath = path.join(os.tmpdir(), manifestFileName)

  const manifestData = {
    timestamp: new Date().toISOString(),
    mode: isApply ? 'apply' : 'dry-run',
    parameters: {
      minAgeHours,
      maxGuard,
      keep: Array.from(keepSet),
    },
    counts: {
      referenced: classification.REFERENCED.length,
      kept: classification.KEPT.length,
      tooRecent: classification.TOO_RECENT.length,
      candidates: classification.CANDIDATE.length,
    },
    candidates: classification.CANDIDATE.map(c => ({
      bucket: c.bucket,
      name: c.name,
      size: c.size,
      created_at: c.created_at,
      trashPath: buildTrashPath(c.name),
    })),
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8')
  console.log(`\nManifest written to OS temp directory:\n  ${manifestPath}`)

  // 7. Apply Mode Execution
  if (!isApply) {
    console.log('\n[DRY RUN COMPLETE] No objects were moved.')
    console.log('To apply moves into _trash/, run with --apply and CLEANUP_CONFIRM=yes.')
    return manifestData
  }

  // Enforce Max Guard before applying
  enforceMaxGuard(classification.CANDIDATE.length, maxGuard)

  console.log('\n=== EXECUTING MOVES TO _TRASH/ ===')
  let consecutiveFailures = 0
  const candidateResults = []

  for (const candidate of classification.CANDIDATE) {
    const { bucket, name } = candidate
    const targetTrashPath = buildTrashPath(name)

    console.log(`Moving: [${bucket}] ${name} -> ${targetTrashPath}`)
    const { error } = await supabase.storage.from(bucket).move(name, targetTrashPath)

    if (error) {
      console.error(`  [FAILED] Move failed for ${name}: ${error.message}`)
      candidateResults.push({
        ...candidate,
        status: 'failed',
        error: error.message,
      })
      consecutiveFailures++
      if (consecutiveFailures >= 3) {
        console.error('\n[ABORT] 3 consecutive move failures encountered. Stopping cleanup.')
        break
      }
      continue
    }

    consecutiveFailures = 0

    // Post-move Verification:
    // 1. HEAD or list at new path shows object exists
    // 2. Old public URL no longer returns 200
    const newPublicUrl = supabase.storage.from(bucket).getPublicUrl(targetTrashPath).data.publicUrl
    const oldPublicUrl = supabase.storage.from(bucket).getPublicUrl(name).data.publicUrl

    let newUrlStatus = 0
    let oldUrlStatus = 0
    try {
      const [newRes, oldRes] = await Promise.all([
        fetch(newPublicUrl, { method: 'HEAD' }),
        fetch(oldPublicUrl, { method: 'HEAD' }),
      ])
      newUrlStatus = newRes.status
      oldUrlStatus = oldRes.status
    } catch (headErr) {
      console.warn(`  [WARN] HEAD check error: ${headErr.message}`)
    }

    const verified = (newUrlStatus === 200 && oldUrlStatus !== 200)

    if (verified) {
      console.log(`  [VERIFIED] Object at ${targetTrashPath} (new: ${newUrlStatus}, old: ${oldUrlStatus})`)
      candidateResults.push({
        ...candidate,
        status: 'moved',
        verify: 'ok',
        newUrlStatus,
        oldUrlStatus,
      })
    } else {
      console.warn(`  [VERIFY-FAILED] Move completed but verification unexpected: new=${newUrlStatus}, old=${oldUrlStatus}`)
      candidateResults.push({
        ...candidate,
        status: 'verify-failed',
        newUrlStatus,
        oldUrlStatus,
      })
    }
  }

  // Update manifest with execution results
  manifestData.results = candidateResults
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8')
  console.log(`\nUpdated manifest with execution results: ${manifestPath}`)

  const movedCount = candidateResults.filter(r => r.status === 'moved').length
  const failedCount = candidateResults.filter(r => r.status === 'failed').length
  const verifyFailedCount = candidateResults.filter(r => r.status === 'verify-failed').length

  console.log('\n--- FINAL EXECUTION SUMMARY ---')
  console.log(`Total Candidates : ${classification.CANDIDATE.length}`)
  console.log(`Moved Successfully: ${movedCount}`)
  console.log(`Move Failures    : ${failedCount}`)
  console.log(`Verify Warnings  : ${verifyFailedCount}`)

  return manifestData
}

// ============================================================================
// 7. CLI ENTRY POINT
// ============================================================================

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const options = parseArgs(process.argv.slice(2))
  runCleanup(options).catch(err => {
    console.error(`\n[FATAL ERROR] ${err.message}`)
    process.exit(1)
  })
}
