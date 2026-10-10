// Offline Unit Tests for Storage Cleanup Script
// No network requests, no Supabase client connection required.

import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import {
  isReferenced,
  extractReferencedNames,
  applyAgeFilter,
  applyKeepList,
  parseKeepList,
  buildTrashPath,
  filterNonTrashObjects,
  classifyObject,
  planRestore,
  enforceMaxGuard,
} from './storage-cleanup/trash-unreferenced.mjs'

console.log('=== OFFLINE UNIT TESTS: STORAGE CLEANUP LOGIC ===\n')

// ----------------------------------------------------------------------------
// (a) Name with spaces referenced only as %20-encoded is detected as referenced
// ----------------------------------------------------------------------------
{
  const objectName = 'my test image.png'
  const corpus = 'Check this out: https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/public/post-images/my%20test%20image.png'
  const referenced = isReferenced(objectName, corpus)
  assert.strictEqual(referenced, true, '(a) Name with spaces referenced as %20 must be detected as referenced')
  console.log('PASS: (a) name with spaces referenced only as %20-encoded is detected as referenced')
}

// ----------------------------------------------------------------------------
// (b) Name referenced only inside a JSON string is detected
// ----------------------------------------------------------------------------
{
  const objectName = 'nested-graphic-123.jpg'
  const rawRow = {
    id: 'e6988bf2-11a3-485a-8b1b-944a95efbc78',
    slug: 'deeply-nested-post',
    content: {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            src: 'https://example.com/storage/v1/object/public/post-images/nested-graphic-123.jpg',
            caption: 'Diagram',
          },
        },
      ],
    },
  }
  const corpus = JSON.stringify(rawRow)
  const referenced = isReferenced(objectName, corpus)
  assert.strictEqual(referenced, true, '(b) Name inside JSON string must be detected as referenced')
  console.log('PASS: (b) name referenced only inside a JSON string is detected')
}

// ----------------------------------------------------------------------------
// (c) Unreferenced old object becomes a candidate
// ----------------------------------------------------------------------------
{
  const now = new Date('2026-10-10T12:00:00.000Z')
  const oldDate = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString() // 48 hours old

  const oldUnreferencedObject = {
    name: 'stale-orphan-photo.png',
    size: 20480,
    created_at: oldDate,
  }

  const emptyCorpus = 'Some unrelated database text mentioning unrelated assets'
  const keepSet = new Set()

  const classified = classifyObject(oldUnreferencedObject, emptyCorpus, keepSet, 24, now)
  assert.strictEqual(classified.status, 'CANDIDATE', '(c) Unreferenced old object must be classified as CANDIDATE')

  const ageCheck = applyAgeFilter([oldUnreferencedObject], 24, now)
  assert.strictEqual(ageCheck.length, 1, '(c) applyAgeFilter must keep old object in candidate list')
  console.log('PASS: (c) unreferenced old object becomes a candidate')
}

// ----------------------------------------------------------------------------
// (d) Unreferenced object younger than the age threshold is skipped
// ----------------------------------------------------------------------------
{
  const now = new Date('2026-10-10T12:00:00.000Z')
  const recentDate = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours old

  const youngObject = {
    name: 'just-uploaded-photo.png',
    size: 15360,
    created_at: recentDate,
  }

  const emptyCorpus = 'Unrelated text'
  const keepSet = new Set()

  const classified = classifyObject(youngObject, emptyCorpus, keepSet, 24, now)
  assert.strictEqual(classified.status, 'TOO_RECENT', '(d) Recent unreferenced object must be marked TOO_RECENT')

  const ageCheck = applyAgeFilter([youngObject], 24, now)
  assert.strictEqual(ageCheck.length, 0, '(d) applyAgeFilter must return 0 older candidates')
  assert.strictEqual(ageCheck.tooRecent.length, 1, '(d) applyAgeFilter must include young object in tooRecent')
  console.log('PASS: (d) unreferenced object younger than the age threshold is skipped')
}

// ----------------------------------------------------------------------------
// (e) Keep-list object is never a candidate
// ----------------------------------------------------------------------------
{
  const now = new Date('2026-10-10T12:00:00.000Z')
  const oldDate = new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString() // 72 hours old

  const protectedObject = {
    name: 'special-hero-cover.jpg',
    size: 102400,
    created_at: oldDate,
  }

  const emptyCorpus = 'Unrelated text'
  const keepListRaw = `
    # Critical static assets
    special-hero-cover.jpg
    another-asset.png
  `
  const keepSet = parseKeepList(keepListRaw)
  assert.strictEqual(keepSet.has('special-hero-cover.jpg'), true)

  const classified = classifyObject(protectedObject, emptyCorpus, keepSet, 24, now)
  assert.strictEqual(classified.status, 'KEPT', '(e) Keep-list object must be marked KEPT, not CANDIDATE')

  const keptResult = applyKeepList([protectedObject], keepSet)
  assert.strictEqual(keptResult.length, 0, '(e) Remaining candidates must be empty')
  assert.strictEqual(keptResult.kept.length, 1, '(e) Kept list must contain the protected object')
  console.log('PASS: (e) keep-list object is never a candidate')
}

// ----------------------------------------------------------------------------
// (f) Objects under _trash/ are excluded from listing
// ----------------------------------------------------------------------------
{
  const objects = [
    { name: 'active-image.png' },
    { name: '_trash/trashed-image-1.png' },
    { name: '_trash/subfolder/trashed-image-2.png' },
    { name: '_trash' },
    { name: 'videos/active-video.mp4' },
  ]

  const filtered = filterNonTrashObjects(objects)
  const remainingNames = filtered.map(o => o.name)

  assert.deepStrictEqual(
    remainingNames,
    ['active-image.png', 'videos/active-video.mp4'],
    '(f) Only non-trash objects should remain after filterNonTrashObjects'
  )
  console.log('PASS: (f) objects under _trash/ are excluded from listing')
}

// ----------------------------------------------------------------------------
// (g) buildTrashPath('abc.png') === '_trash/abc.png'
// ----------------------------------------------------------------------------
{
  const result = buildTrashPath('abc.png')
  assert.strictEqual(result, '_trash/abc.png', "(g) buildTrashPath('abc.png') must equal '_trash/abc.png'")

  const nested = buildTrashPath('sub/dir/photo.png')
  assert.strictEqual(nested, '_trash/sub/dir/photo.png', '(g) buildTrashPath on nested paths should prepend _trash/')
  console.log("PASS: (g) buildTrashPath('abc.png') === '_trash/abc.png'")
}

// ----------------------------------------------------------------------------
// (h) planRestore refuses to overwrite an existing destination
// ----------------------------------------------------------------------------
{
  const manifestItems = [
    { bucket: 'post-images', name: 'already-existing.png', trashPath: '_trash/already-existing.png' },
    { bucket: 'post-images', name: 'ready-to-restore.png', trashPath: '_trash/ready-to-restore.png' },
  ]

  const existingDestinations = new Set(['already-existing.png'])

  const plan = planRestore(manifestItems, existingDestinations)

  assert.strictEqual(plan.length, 1, '(h) planRestore must only schedule non-colliding items')
  assert.strictEqual(plan[0].to, 'ready-to-restore.png', '(h) Ready item destination must match')

  assert.strictEqual(plan.skipped.length, 1, '(h) planRestore must record skipped colliding items')
  assert.strictEqual(plan.skipped[0].destPath, 'already-existing.png', '(h) Colliding destination must be skipped')
  assert.strictEqual(plan.skipped[0].reason, 'destination_exists', '(h) Skip reason must be destination_exists')
  console.log('PASS: (h) planRestore refuses to overwrite an existing destination')
}

// ----------------------------------------------------------------------------
// (i) enforceMaxGuard blocks 81 candidates with default max and allows with --max 100
// ----------------------------------------------------------------------------
{
  assert.throws(
    () => enforceMaxGuard(81),
    /exceeds maximum threshold/i,
    '(i) enforceMaxGuard(81) with default 80 must throw an error'
  )

  const allowed = enforceMaxGuard(81, 100)
  assert.strictEqual(allowed.allowed, true, '(i) enforceMaxGuard(81, 100) must return allowed: true')
  console.log('PASS: (i) enforceMaxGuard blocks 81 candidates with default max and allows with --max 100')
}

// ----------------------------------------------------------------------------
// (j) Grep-style test that the script source contains no `.remove(` call
// ----------------------------------------------------------------------------
{
  const scriptPath = path.resolve('scripts/storage-cleanup/trash-unreferenced.mjs')
  const source = fs.readFileSync(scriptPath, 'utf8')

  const containsRemoveCall = source.includes('.remove(')
  assert.strictEqual(containsRemoveCall, false, '(j) Script source must not contain any .remove( call')
  console.log('PASS: (j) grep-style test confirms the script source contains no .remove( call')
}

console.log('\n========================================')
console.log('ALL 10 OFFLINE UNIT TESTS PASSED!')
console.log('========================================')
