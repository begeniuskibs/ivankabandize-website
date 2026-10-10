// scripts/retag/apply-topic-tags.mjs
// Apply topic tags to published posts (Additive only).
// Default mode is DRY RUN (read-only).
// Writes only when --apply is passed AND RETAG_CONFIRM=yes in environment.

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { loadEnvLocal, getSupabaseClient } from '../storage-cleanup/trash-unreferenced.mjs'

// ============================================================================
// 1. EMBEDDED TOPIC TAG MAPPING (slug -> tags[])
// ============================================================================

export const TOPIC_TAG_MAPPING = {
  // Leadership (15)
  'get-in-the-right-room': ['Leadership'],
  'play-the-long-game': ['Leadership'],
  'always-pursue-excellence': ['Leadership'],
  'build-diverse-skillsets': ['Leadership'],
  'work-on-your-soft-skills': ['Leadership'],
  'the-power-of-communication': ['Leadership'],
  'building-social-capital': ['Leadership'],
  'learn-to-fail-forward': ['Leadership'],
  'you-are-not-a-fraud': ['Leadership'],
  'share-what-you-know': ['Leadership'],
  'stealing-like-an-artist': ['Leadership'],
  'embracing-lifelong-learning': ['Leadership'],
  'generously-pay-it-forward': ['Leadership'],
  'the-value-of-serving': ['Leadership'],
  'outgrow-your-implicit-bias': ['Leadership'],

  // Productivity (8)
  'focusing-on-the-big-rocks': ['Productivity'],
  'measure-what-matters': ['Productivity'],
  'focus-less-is-more': ['Productivity'],
  'work-life-harmony': ['Productivity'],
  'set-healthy-boundaries': ['Productivity'],
  'building-healthy-habits': ['Productivity'],
  'unplug-often-embrace-solitude': ['Productivity'],
  'tools-that-have-triggered-my-growth-and-productivity': ['Productivity'],

  // Business (2)
  'purchase-your-domain-name': ['Business'],
  'learning-to-manage-money': ['Business'],

  // Faith (3)
  'the-anchor-of-life': ['Faith'],
  'the-power-of-gratitude': ['Faith'],
  'on-life-and-death': ['Faith'],

  // Life and Character (6)
  'loving-giving-and-resilience-2': ['Life and Character'],
  'run-your-own-race': ['Life and Character'],
  'carry-your-own-weather': ['Life and Character'],
  'a-letter-to-my-younger-self': ['Life and Character'],
  'fatherhood': ['Life and Character'],
  'fulfilling-exhaustion-finding-joy-in-purposeful-endeavors': ['Life and Character'],

  // Untagged on purpose (do not add) (3)
  'people-and-places': [],
  'did-it-count': [],
  'the-feeling-of-i': [],
}

export const STREAM_LABELS = {
  random_thoughts: 'Random Thoughts',
  structured_thoughts: 'Structured Thoughts',
  tools_for_thought: 'Tools for Thought',
}

// ============================================================================
// 2. PURE BUSINESS LOGIC (OFFLINE-TESTABLE)
// ============================================================================

/**
 * Validates integrity of TOPIC_TAG_MAPPING.
 */
export function validateMapping(mapping = TOPIC_TAG_MAPPING) {
  if (!mapping || typeof mapping !== 'object') {
    throw new Error('Mapping must be an object')
  }

  const seenSlugs = new Set()
  const tagToSlugs = new Map()

  for (const [slug, tags] of Object.entries(mapping)) {
    if (!slug || typeof slug !== 'string') {
      throw new Error(`Invalid slug: ${slug}`)
    }
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate slug in mapping: ${slug}`)
    }
    seenSlugs.add(slug)

    if (!Array.isArray(tags)) {
      throw new Error(`Tags for slug "${slug}" must be an array`)
    }

    for (const tag of tags) {
      if (!tag || typeof tag !== 'string') {
        throw new Error(`Invalid tag name "${tag}" for slug "${slug}"`)
      }
      if (!tagToSlugs.has(tag)) {
        tagToSlugs.set(tag, new Set())
      }
      tagToSlugs.get(tag).add(slug)
    }
  }

  // Ensure no slug belongs to multiple tags (except untagged)
  const slugCounts = new Map()
  for (const [tag, slugs] of tagToSlugs.entries()) {
    for (const slug of slugs) {
      slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1)
      if (slugCounts.get(slug) > 1) {
        throw new Error(`Slug "${slug}" appears across multiple tags!`)
      }
    }
  }

  return {
    totalSlugs: seenSlugs.size,
    taggedSlugs: Array.from(slugCounts.keys()).length,
    tagCategories: Array.from(tagToSlugs.keys()),
  }
}

/**
 * Computes the retag plan given current DB state and the mapping.
 */
export function computeRetagPlan({ posts = [], tags = [], postTags = [], mapping = TOPIC_TAG_MAPPING }) {
  const postsBySlug = new Map()
  for (const p of posts) {
    if (p.slug) postsBySlug.set(p.slug, p)
  }

  const tagsByName = new Map()
  const tagsById = new Map()
  for (const t of tags) {
    if (t.name) tagsByName.set(t.name.toLowerCase(), t)
    if (t.id) tagsById.set(t.id, t)
  }

  // Build existing tags per post
  // post_id -> Set of tag_names
  const existingTagsByPostId = new Map()
  const existingTagIdsByPostId = new Map()
  for (const pt of postTags) {
    if (!existingTagsByPostId.has(pt.post_id)) {
      existingTagsByPostId.set(pt.post_id, new Set())
      existingTagIdsByPostId.set(pt.post_id, new Set())
    }
    const tagObj = tagsById.get(pt.tag_id)
    if (tagObj) {
      existingTagsByPostId.get(pt.post_id).add(tagObj.name)
      existingTagIdsByPostId.get(pt.post_id).add(tagObj.id)
    }
  }

  const matchedPosts = []
  const unmatchedSlugs = []
  const draftPosts = []
  const pairsToAdd = []

  for (const [slug, targetTags] of Object.entries(mapping)) {
    const post = postsBySlug.get(slug)
    if (!post) {
      unmatchedSlugs.push(slug)
      continue
    }

    const isDraft = post.publish_status === 'draft'
    if (isDraft) {
      draftPosts.push(post)
    }

    const existingNames = Array.from(existingTagsByPostId.get(post.id) || [])
    const existingNamesLower = new Set(existingNames.map((n) => n.toLowerCase()))

    const tagsToAdd = []
    for (const targetTag of targetTags) {
      if (!existingNamesLower.has(targetTag.toLowerCase())) {
        tagsToAdd.push(targetTag)
        const tagObj = tagsByName.get(targetTag.toLowerCase())
        pairsToAdd.push({
          post_id: post.id,
          post_slug: post.slug,
          post_title: post.title,
          tag_name: targetTag,
          tag_id: tagObj?.id || null, // null if tag doesn't exist yet (e.g. Life and Character)
        })
      }
    }

    const finalTags = [...existingNames, ...tagsToAdd]

    matchedPosts.push({
      slug: post.slug,
      title: post.title,
      stream: STREAM_LABELS[post.content_type] || post.content_type || 'Unknown',
      raw_content_type: post.content_type,
      publish_status: post.publish_status,
      isDraft,
      existingTags: existingNames,
      tagsToAdd,
      finalTags,
    })
  }

  // Calculate per-tag post counts across all posts in database after the change
  const postCountsPerTag = new Map()
  for (const t of tags) {
    postCountsPerTag.set(t.name, {
      id: t.id,
      name: t.name,
      slug: t.slug,
      current: 0,
      added: 0,
      final: 0,
      isNew: false,
    })
  }

  // Count current assignments in postTags
  for (const pt of postTags) {
    const tagObj = tagsById.get(pt.tag_id)
    if (tagObj && postCountsPerTag.has(tagObj.name)) {
      postCountsPerTag.get(tagObj.name).current++
    }
  }

  // Add the planned additions
  for (const pair of pairsToAdd) {
    if (!postCountsPerTag.has(pair.tag_name)) {
      // Missing tag (e.g. Life and Character)
      postCountsPerTag.set(pair.tag_name, {
        id: null,
        name: pair.tag_name,
        slug: pair.tag_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        current: 0,
        added: 0,
        final: 0,
        isNew: true,
      })
    }
    postCountsPerTag.get(pair.tag_name).added++
  }

  for (const item of postCountsPerTag.values()) {
    item.final = item.current + item.added
  }

  return {
    matchedPosts,
    unmatchedSlugs,
    draftPosts,
    pairsToAdd,
    totalPairsToAdd: pairsToAdd.length,
    postCountsPerTag: Array.from(postCountsPerTag.values()).sort((a, b) => a.name.localeCompare(b.name)),
  }
}

/**
 * Builds pre-apply manifest data.
 * Pure function: constructs serializable manifest object.
 */
export function buildPreApplyManifest({ pairsToAdd = [], willCreateTag = false, timestamp = new Date().toISOString() }) {
  const plannedPairs = pairsToAdd.map((p) => ({
    post_id: p.post_id,
    post_slug: p.post_slug,
    tag_name: p.tag_name,
  }))

  return {
    timestamp,
    willCreateLifeAndCharacterTag: Boolean(willCreateTag),
    totalPlannedPairs: plannedPairs.length,
    plannedPairs,
  }
}

/**
 * Pure function: Determines whether a created tag can be safely deleted during restore.
 * Rule: Only delete if removeCreatedTagFlag is true, createdTagId is provided, and remainingPostTagsCount is 0.
 */
export function canDeleteCreatedTag({ createdTagId, remainingPostTagsCount, removeCreatedTagFlag }) {
  if (!removeCreatedTagFlag) return false
  if (!createdTagId) return false
  return remainingPostTagsCount === 0
}

/**
 * Formats table rows into clean markdown / ASCII format.
 */
export function formatTable(matchedPosts) {
  const headers = ['slug', 'title', 'stream', 'existing tags', 'tags to add', 'final tags']
  const rows = matchedPosts.map((p) => [
    p.slug,
    p.title,
    p.stream,
    p.existingTags.length > 0 ? p.existingTags.join(', ') : '(none)',
    p.tagsToAdd.length > 0 ? p.tagsToAdd.join(', ') : '(none)',
    p.finalTags.length > 0 ? p.finalTags.join(', ') : '(none)',
  ])

  const colWidths = headers.map((h, i) => {
    const maxVal = Math.max(h.length, ...rows.map((r) => r[i].length))
    return maxVal
  })

  function formatLine(cols) {
    return cols.map((col, i) => col.padEnd(colWidths[i])).join(' | ')
  }

  const separator = colWidths.map((w) => '-'.repeat(w)).join('-+-')

  const lines = [formatLine(headers), separator, ...rows.map((r) => formatLine(r))]
  return lines.join('\n')
}

// ============================================================================
// 3. EXECUTION WORKFLOW (--apply, --restore, default dry-run)
// ============================================================================

export async function run() {
  const args = process.argv.slice(2)
  const isApply = args.includes('--apply')
  const restoreIdx = args.indexOf('--restore')
  const isRestore = restoreIdx !== -1
  const restoreFilePath = isRestore ? args[restoreIdx + 1] : null
  const isRemoveCreatedTag = args.includes('--remove-created-tag')

  console.log('='.repeat(80))
  console.log('TOPIC TAGS RETAG SCRIPT')
  console.log('='.repeat(80))

  const supabase = getSupabaseClient()

  // --------------------------------------------------------------------------
  // HANDLE RESTORE
  // --------------------------------------------------------------------------
  if (isRestore) {
    if (!restoreFilePath) {
      console.error('Error: --restore requires a backup file path.')
      process.exit(1)
    }
    const resolvedPath = path.resolve(restoreFilePath)
    if (!fs.existsSync(resolvedPath)) {
      console.error(`Error: Backup file not found at ${resolvedPath}`)
      process.exit(1)
    }

    console.log(`\nMode: RESTORE from backup: ${resolvedPath}`)
    const backupData = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'))
    const { insertedJoinIds, createdTagId } = backupData

    if (!Array.isArray(insertedJoinIds) || insertedJoinIds.length === 0) {
      console.log('Backup contains no inserted join IDs to remove.')
      return
    }

    if (process.env.RETAG_CONFIRM !== 'yes') {
      console.error('Error: Restore requires env RETAG_CONFIRM=yes.')
      console.error('Example: $env:RETAG_CONFIRM=\'yes\'; node scripts/retag/apply-topic-tags.mjs --restore <file>')
      process.exit(1)
    }

    console.log(`Deleting ${insertedJoinIds.length} join rows added by this script...`)
    const { error: delError } = await supabase.from('post_tags').delete().in('id', insertedJoinIds)
    if (delError) {
      console.error('Failed to delete restored rows:', delError)
      process.exit(1)
    }

    console.log(`Successfully removed ${insertedJoinIds.length} join rows.`)

    // Handle --remove-created-tag flag: delete tag ONLY if remaining post_tags rows is 0
    if (isRemoveCreatedTag) {
      if (!createdTagId) {
        console.log('No createdTagId recorded in backup. Skipping tag removal.')
      } else {
        console.log(`Checking remaining post_tags rows for created tag (${createdTagId})...`)
        const { count, error: countErr } = await supabase
          .from('post_tags')
          .select('*', { count: 'exact', head: true })
          .eq('tag_id', createdTagId)

        if (countErr) {
          console.error('Failed to check remaining post_tags rows for created tag:', countErr)
          process.exit(1)
        }

        const remainingCount = count ?? 0
        const shouldDelete = canDeleteCreatedTag({
          createdTagId,
          remainingPostTagsCount: remainingCount,
          removeCreatedTagFlag: isRemoveCreatedTag,
        })

        if (shouldDelete) {
          console.log(`Tag has 0 remaining post_tags rows. Deleting created tag (${createdTagId})...`)
          const { error: delTagErr } = await supabase.from('tags').delete().eq('id', createdTagId)
          if (delTagErr) {
            console.error('Failed to delete created tag:', delTagErr)
            process.exit(1)
          }
          console.log(`Successfully deleted created tag (${createdTagId}).`)
        } else {
          console.log(`Created tag has ${remainingCount} remaining post_tags row(s). Skipping tag deletion (zero-rows rule).`)
        }
      }
    }

    return
  }

  // --------------------------------------------------------------------------
  // FETCH CURRENT DB STATE (READ-ONLY)
  // --------------------------------------------------------------------------
  console.log('\nFetching current tags, posts, and post_tags from database...')
  const [{ data: tags, error: tagsErr }, { data: posts, error: postsErr }, { data: postTags, error: ptErr }] =
    await Promise.all([
      supabase.from('tags').select('id, name, slug, is_internal').order('name'),
      supabase.from('posts').select('id, slug, title, content_type, publish_status').order('slug'),
      supabase.from('post_tags').select('id, post_id, tag_id'),
    ])

  if (tagsErr) throw new Error(`Failed to fetch tags: ${tagsErr.message}`)
  if (postsErr) throw new Error(`Failed to fetch posts: ${postsErr.message}`)
  if (ptErr) throw new Error(`Failed to fetch post_tags: ${ptErr.message}`)

  console.log(`Found ${tags.length} tags, ${posts.length} posts, ${postTags.length} post_tags in DB.`)

  // Compute plan
  const plan = computeRetagPlan({ posts, tags, postTags, mapping: TOPIC_TAG_MAPPING })

  // --------------------------------------------------------------------------
  // PRINT DRY RUN REPORT
  // --------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80))
  console.log('RETAG PLAN TABLE (slug | title | stream | existing tags | tags to add | final tags)')
  console.log('='.repeat(80))
  console.log(formatTable(plan.matchedPosts))

  console.log('\n' + '='.repeat(80))
  console.log('DRAFT POSTS REPORT (Found posts in draft status - reported, not skipped)')
  console.log('='.repeat(80))
  if (plan.draftPosts.length === 0) {
    console.log('(none)')
  } else {
    for (const d of plan.draftPosts) {
      console.log(`- ${d.slug} ("${d.title}") [status: ${d.publish_status}]`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('UNMATCHED SLUGS REPORT')
  console.log('='.repeat(80))
  if (plan.unmatchedSlugs.length === 0) {
    console.log('(none - all mapped slugs exist in database)')
  } else {
    for (const s of plan.unmatchedSlugs) {
      console.log(`- ${s} [NOT FOUND IN DB]`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('TOTALS SUMMARY')
  console.log('='.repeat(80))
  console.log(`Posts matched:        ${plan.matchedPosts.length}`)
  console.log(`Unmatched slugs:      ${plan.unmatchedSlugs.length}`)
  console.log(`Draft posts reported: ${plan.draftPosts.length}`)
  console.log(`Pairs to add:         ${plan.totalPairsToAdd}`)

  console.log('\nPer-tag post counts after the change (across entire database):')
  for (const t of plan.postCountsPerTag) {
    const diffStr = t.added > 0 ? ` (+${t.added})` : ''
    const newTagStr = t.isNew ? ' [TAG TO BE CREATED]' : ''
    console.log(`  - ${t.name.padEnd(25)}: ${String(t.final).padStart(2)} posts (current: ${t.current})${diffStr}${newTagStr}`)
  }

  // --------------------------------------------------------------------------
  // EXECUTE APPLY IF REQUESTED
  // --------------------------------------------------------------------------
  if (!isApply) {
    console.log('\n' + '='.repeat(80))
    console.log('DRY RUN COMPLETE: No changes were written to the database.')
    console.log('To apply changes: $env:RETAG_CONFIRM=\'yes\'; node scripts/retag/apply-topic-tags.mjs --apply')
    console.log('='.repeat(80))
    return
  }

  // If --apply was passed:
  if (process.env.RETAG_CONFIRM !== 'yes') {
    console.error('\nError: --apply requires environment variable RETAG_CONFIRM=yes.')
    console.error('Example (PowerShell): $env:RETAG_CONFIRM=\'yes\'; node scripts/retag/apply-topic-tags.mjs --apply')
    process.exit(1)
  }

  console.log('\n' + '='.repeat(80))
  console.log('APPLYING TOPIC TAGS TO DATABASE...')
  console.log('='.repeat(80))

  // Determine whether "Life and Character" will be created
  let lifeAndCharacterTag = tags.find((t) => t.name.toLowerCase() === 'life and character')
  const willCreateTag = !lifeAndCharacterTag

  // 1. Write pre-apply manifest to os.tmpdir() BEFORE any DB operations
  const manifestTimestamp = Date.now()
  const manifestFileName = `retag-manifest-${manifestTimestamp}.json`
  const manifestPath = path.join(os.tmpdir(), manifestFileName)
  const manifestPayload = buildPreApplyManifest({
    pairsToAdd: plan.pairsToAdd,
    willCreateTag,
    timestamp: new Date(manifestTimestamp).toISOString(),
  })

  try {
    fs.writeFileSync(manifestPath, JSON.stringify(manifestPayload, null, 2), 'utf8')
    console.log(`\nPRE-APPLY MANIFEST WRITTEN TO: ${manifestPath}`)
  } catch (err) {
    console.error(`Error: Failed to write pre-apply manifest: ${err.message}`)
    throw new Error(`Aborting before any database write: failed to write manifest file at ${manifestPath}`)
  }

  // 2. Ensure "Life and Character" tag exists
  let createdTagId = null
  if (!lifeAndCharacterTag) {
    console.log('Creating missing tag "Life and Character" (slug: life-and-character)...')
    const { data: newTag, error: tagCreateErr } = await supabase
      .from('tags')
      .insert({
        name: 'Life and Character',
        slug: 'life-and-character',
        is_internal: false,
      })
      .select()
      .single()

    if (tagCreateErr) {
      throw new Error(`Failed to create tag "Life and Character": ${tagCreateErr.message}`)
    }
    lifeAndCharacterTag = newTag
    createdTagId = newTag.id
    console.log(`Created tag "Life and Character" with ID: ${newTag.id}`)
  }

  // Update pair tag_ids with newly created tag id if needed
  const rowsToInsert = plan.pairsToAdd.map((p) => {
    let tagId = p.tag_id
    if (!tagId && p.tag_name.toLowerCase() === 'life and character') {
      tagId = lifeAndCharacterTag.id
    }
    return {
      post_id: p.post_id,
      tag_id: tagId,
    }
  })

  // 3. Perform insert of join rows
  console.log(`Inserting ${rowsToInsert.length} post_tags join rows...`)
  const { data: insertedData, error: insertErr } = await supabase
    .from('post_tags')
    .insert(rowsToInsert)
    .select('id, post_id, tag_id')

  if (insertErr) {
    throw new Error(`Failed to insert post_tags rows: ${insertErr.message}`)
  }

  const insertedJoinIds = (insertedData || []).map((r) => r.id)

  // 4. Write post-insert backup to os.tmpdir() (kept as is)
  const backupFileName = `retag-backup-${Date.now()}.json`
  const backupPath = path.join(os.tmpdir(), backupFileName)
  const backupPayload = {
    timestamp: new Date().toISOString(),
    createdTagId,
    createdTagName: createdTagId ? 'Life and Character' : null,
    totalPairsAdded: insertedJoinIds.length,
    insertedJoinIds,
    insertedPairs: rowsToInsert,
  }
  fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf8')

  console.log(`\nBACKUP WRITTEN TO: ${backupPath}`)
  console.log(`To restore: node scripts/retag/apply-topic-tags.mjs --restore "${backupPath}"`)
  console.log('='.repeat(80))
}

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isMainModule) {
  run().catch((err) => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
}
