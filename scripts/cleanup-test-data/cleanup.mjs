// Test data cleanup script for inquiries, posts, and tags
// Default mode: Dry run (lists what it would delete, writes nothing)
// Apply mode: CONFIRM_TEST_CLEANUP=yes node scripts/cleanup-test-data/cleanup.mjs --ids <allowlist.json> --apply
// Restore mode (dry run): node scripts/cleanup-test-data/cleanup.mjs --restore <backup-file>
// Restore mode (apply): CONFIRM_TEST_CLEANUP=yes node scripts/cleanup-test-data/cleanup.mjs --restore <backup-file> --apply
// House style: spaced hyphen " - " only

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'

export const BATCH_SIZE = 5

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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
    const serviceRoleKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error(
            'Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
        )
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
}

export function maskEmail(email) {
    if (!email || typeof email !== 'string') return '(none)'
    const trimmed = email.trim()
    const atIndex = trimmed.indexOf('@')
    if (atIndex <= 0) {
        return trimmed.slice(0, 2) + '***'
    }
    const localPart = trimmed.slice(0, atIndex)
    const domainPart = trimmed.slice(atIndex + 1)
    const prefix = localPart.slice(0, 2)
    return `${prefix}***@${domainPart}`
}

export function truncateName(name, maxLen = 40) {
    if (!name || typeof name !== 'string') return ''
    return name.slice(0, maxLen)
}

export function parseAllowList(rawObj) {
    if (!rawObj || typeof rawObj !== 'object' || Array.isArray(rawObj)) {
        throw new Error('Allow-list must be a JSON object with arrays: inquiries, posts, tags')
    }

    const keys = ['inquiries', 'posts', 'tags']
    const normalized = {
        inquiries: [],
        posts: [],
        tags: [],
    }

    for (const key of keys) {
        const arr = rawObj[key]
        if (!Array.isArray(arr)) {
            throw new Error(`Allow-list property "${key}" must be an array of UUID strings`)
        }
        const seen = new Set()
        for (const item of arr) {
            if (typeof item !== 'string' || !UUID_REGEX.test(item.trim())) {
                throw new Error(`Invalid UUID in allow-list "${key}": ${String(item)}`)
            }
            const clean = item.trim().toLowerCase()
            if (!seen.has(clean)) {
                seen.add(clean)
                normalized[key].push(clean)
            }
        }
    }

    return normalized
}

export function buildCleanupPlan({
    allowList,
    dbInquiries = [],
    dbPosts = [],
    dbTags = [],
    dbPostTags = [],
}) {
    const parsedAllow = parseAllowList(allowList)

    const inquiryAllowSet = new Set(parsedAllow.inquiries)
    const postAllowSet = new Set(parsedAllow.posts)
    const tagAllowSet = new Set(parsedAllow.tags)

    const postsById = new Map(
        dbPosts.map((p) => [String(p.id).toLowerCase(), p])
    )
    const inquiriesById = new Map(
        dbInquiries.map((inq) => [String(inq.id).toLowerCase(), inq])
    )
    const tagsById = new Map(
        dbTags.map((t) => [String(t.id).toLowerCase(), t])
    )

    const postTagsByTagId = new Map()
    for (const pt of dbPostTags) {
        const tagId = String(pt.tag_id).toLowerCase()
        const postId = String(pt.post_id).toLowerCase()
        if (!postTagsByTagId.has(tagId)) {
            postTagsByTagId.set(tagId, [])
        }
        postTagsByTagId.get(tagId).push(postId)
    }

    const inquiriesToDelete = []
    const postsToDelete = []
    const tagsToDelete = []
    const refused = []
    const missingIds = []

    // 1. Inquiries: only delete IDs explicitly on the allow-list
    for (const id of inquiryAllowSet) {
        const row = inquiriesById.get(id)
        if (!row) {
            missingIds.push({ table: 'inquiries', id })
            continue
        }
        inquiriesToDelete.push(row)
    }

    // 2. Posts: only delete IDs on the allow-list, and REFUSE any published post
    for (const id of postAllowSet) {
        const post = postsById.get(id)
        if (!post) {
            missingIds.push({ table: 'posts', id })
            continue
        }
        if (post.publish_status === 'published') {
            refused.push({
                table: 'posts',
                id: post.id,
                slug: post.slug,
                reason: 'Refused: post has publish_status = "published"',
            })
            continue
        }
        postsToDelete.push(post)
    }

    // 3. Tags: only delete IDs on the allow-list, and REFUSE any tag attached to a published post
    for (const id of tagAllowSet) {
        const tag = tagsById.get(id)
        if (!tag) {
            missingIds.push({ table: 'tags', id })
            continue
        }
        const attachedPostIds = postTagsByTagId.get(id) || []
        const attachedPublishedPosts = attachedPostIds
            .map((pid) => postsById.get(pid))
            .filter((p) => p && p.publish_status === 'published')

        if (attachedPublishedPosts.length > 0) {
            const slugs = attachedPublishedPosts.map((p) => p.slug).join(', ')
            refused.push({
                table: 'tags',
                id: tag.id,
                slug: tag.slug,
                name: tag.name,
                reason: `Refused: tag is attached to ${attachedPublishedPosts.length} published post(s) (${slugs})`,
            })
            continue
        }
        tagsToDelete.push({
            ...tag,
            attachedPostCount: attachedPostIds.length,
        })
    }

    return {
        allowList: parsedAllow,
        inquiriesToDelete,
        postsToDelete,
        tagsToDelete,
        refused,
        missingIds,
        canApply: refused.length === 0,
    }
}

async function deleteInBatchesAndVerify(supabase, table, ids) {
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batchIds = ids.slice(i, i + BATCH_SIZE)
        const batchNum = Math.floor(i / BATCH_SIZE) + 1

        const { error: deleteErr } = await supabase
            .from(table)
            .delete()
            .in('id', batchIds)

        if (deleteErr) {
            throw new Error(
                `Failed deleting batch ${batchNum} from ${table}: ${deleteErr.message}`
            )
        }

        const { data: remaining, error: verifyErr } = await supabase
            .from(table)
            .select('id')
            .in('id', batchIds)

        if (verifyErr) {
            throw new Error(
                `Failed verifying deletion of batch ${batchNum} from ${table}: ${verifyErr.message}`
            )
        }

        if (remaining && remaining.length > 0) {
            throw new Error(
                `Verification failed for ${table} batch ${batchNum}: ${remaining.length} row(s) still present`
            )
        }

        console.log(
            `  [${table}] Batch ${batchNum}: deleted and verified ${batchIds.length} row(s).`
        )
    }
}

async function handleRestore(supabase, backupFile, isApply) {
    const resolved = path.resolve(backupFile)
    if (!fs.existsSync(resolved)) {
        throw new Error(`Backup file not found: ${resolved}`)
    }

    const backup = JSON.parse(fs.readFileSync(resolved, 'utf8'))
    const inquiries = Array.isArray(backup.inquiries) ? backup.inquiries : []
    const posts = Array.isArray(backup.posts) ? backup.posts : []
    const tags = Array.isArray(backup.tags) ? backup.tags : []
    const postTags = Array.isArray(backup.post_tags) ? backup.post_tags : []

    console.log('=== TEST DATA CLEANUP RESTORE PLAN ===')
    console.log(`Backup file: ${resolved}`)
    console.log(`Timestamp: ${backup.timestamp || 'unknown'}`)
    console.log(`Inquiries to restore: ${inquiries.length}`)
    console.log(`Posts to restore: ${posts.length}`)
    console.log(`Tags to restore: ${tags.length}`)
    console.log(`Post-tag links to restore: ${postTags.length}`)

    if (!isApply) {
        console.log('\nRESTORE DRY RUN MODE: Zero database mutations made.')
        console.log(
            'To apply restore, run with: CONFIRM_TEST_CLEANUP=yes node scripts/cleanup-test-data/cleanup.mjs --restore <backup-file> --apply'
        )
        return
    }

    if (process.env.CONFIRM_TEST_CLEANUP !== 'yes') {
        console.error(
            '\nSAFETY BLOCK: CONFIRM_TEST_CLEANUP=yes required in environment to apply restore.'
        )
        process.exit(1)
    }

    if (tags.length > 0) {
        const { error } = await supabase.from('tags').upsert(tags, { onConflict: 'id' })
        if (error) throw new Error(`Failed restoring tags: ${error.message}`)
    }
    if (posts.length > 0) {
        const { error } = await supabase.from('posts').upsert(posts, { onConflict: 'id' })
        if (error) throw new Error(`Failed restoring posts: ${error.message}`)
    }
    if (postTags.length > 0) {
        const { error } = await supabase
            .from('post_tags')
            .upsert(postTags, { onConflict: 'post_id,tag_id' })
        if (error) throw new Error(`Failed restoring post_tags: ${error.message}`)
    }
    if (inquiries.length > 0) {
        const { error } = await supabase
            .from('inquiries')
            .upsert(inquiries, { onConflict: 'id' })
        if (error) throw new Error(`Failed restoring inquiries: ${error.message}`)
    }

    console.log('Restore completed successfully.')
}

function printPlanReport(plan, idsFilePath, isApply) {
    console.log('=== TEST DATA CLEANUP PLAN ===')
    console.log(`Mode: ${isApply ? 'APPLY' : 'DRY RUN (default - writes nothing)'}`)
    console.log(`Allow-list file: ${idsFilePath || '(default discovery allow-list)'}`)
    console.log('')

    console.log(`--- Inquiries to delete (${plan.inquiriesToDelete.length}) ---`)
    if (plan.inquiriesToDelete.length === 0) {
        console.log('  (none)')
    } else {
        for (const inq of plan.inquiriesToDelete) {
            console.log(
                `  - id=${inq.id} | created_at=${inq.created_at} | email=${maskEmail(inq.email)} | name="${truncateName(inq.name, 40)}"`
            )
        }
    }

    console.log(`\n--- Posts to delete (${plan.postsToDelete.length}) ---`)
    if (plan.postsToDelete.length === 0) {
        console.log('  (none)')
    } else {
        for (const post of plan.postsToDelete) {
            console.log(
                `  - id=${post.id} | slug="${post.slug}" | publish_status=${post.publish_status} | published_at=${post.published_at || 'null'}`
            )
        }
    }

    console.log(`\n--- Tags to delete (${plan.tagsToDelete.length}) ---`)
    if (plan.tagsToDelete.length === 0) {
        console.log('  (none)')
    } else {
        for (const tag of plan.tagsToDelete) {
            console.log(
                `  - id=${tag.id} | name="${tag.name}" | slug="${tag.slug}" | post_count=${tag.attachedPostCount ?? 0}`
            )
        }
    }

    console.log(`\n--- Refused items (${plan.refused.length}) ---`)
    if (plan.refused.length === 0) {
        console.log('  (none)')
    } else {
        for (const r of plan.refused) {
            console.log(
                `  - [REFUSED] table=${r.table} | id=${r.id} | slug=${r.slug || ''} | ${r.reason}`
            )
        }
    }

    if (plan.missingIds.length > 0) {
        console.log(`\n--- Allow-list IDs not found in DB (${plan.missingIds.length}) ---`)
        for (const m of plan.missingIds) {
            console.log(`  - table=${m.table} | id=${m.id}`)
        }
    }

    console.log('\n--- Summary ---')
    console.log(
        `inquiries to delete: ${plan.inquiriesToDelete.length}, posts to delete: ${plan.postsToDelete.length}, tags to delete: ${plan.tagsToDelete.length}, refused: ${plan.refused.length}`
    )
}

async function main() {
    const args = process.argv.slice(2)
    const isApply = args.includes('--apply')
    const restoreIdx = args.indexOf('--restore')
    const idsIdx = args.indexOf('--ids')

    const supabase = getSupabaseClient()

    if (restoreIdx !== -1) {
        const backupFile = args[restoreIdx + 1]
        if (!backupFile || backupFile.startsWith('--')) {
            console.error('Error: --restore requires a path to a backup file')
            process.exit(1)
        }
        await handleRestore(supabase, backupFile, isApply)
        return
    }

    let idsFilePath = null
    if (idsIdx !== -1) {
        const candidate = args[idsIdx + 1]
        if (!candidate || candidate.startsWith('--')) {
            console.error('Error: --ids requires a path to an allow-list JSON file')
            process.exit(1)
        }
        idsFilePath = path.resolve(candidate)
    } else if (!isApply) {
        const defaultAllowlist = path.resolve('scripts/cleanup-test-data/allowlist.json')
        if (fs.existsSync(defaultAllowlist)) {
            idsFilePath = defaultAllowlist
        }
    }

    if (isApply) {
        if (process.env.CONFIRM_TEST_CLEANUP !== 'yes') {
            console.error(
                'SAFETY BLOCK: CONFIRM_TEST_CLEANUP=yes is required in environment to run --apply.'
            )
            process.exit(1)
        }
        if (idsIdx === -1 || !idsFilePath) {
            console.error(
                'SAFETY BLOCK: --apply requires an explicit allow-list file passed with --ids <file>.'
            )
            process.exit(1)
        }
    }

    if (!idsFilePath || !fs.existsSync(idsFilePath)) {
        throw new Error(
            `Allow-list file not found. Pass --ids <file> with JSON { inquiries, posts, tags }.`
        )
    }

    const rawAllowList = JSON.parse(fs.readFileSync(idsFilePath, 'utf8'))

    const [inquiriesRes, postsRes, tagsRes, postTagsRes] = await Promise.all([
        supabase.from('inquiries').select('*').order('created_at', { ascending: true }),
        supabase.from('posts').select('*').order('slug', { ascending: true }),
        supabase.from('tags').select('*').order('slug', { ascending: true }),
        supabase.from('post_tags').select('*'),
    ])

    if (inquiriesRes.error) {
        throw new Error(`Failed to fetch inquiries: ${inquiriesRes.error.message}`)
    }
    if (postsRes.error) {
        throw new Error(`Failed to fetch posts: ${postsRes.error.message}`)
    }
    if (tagsRes.error) {
        throw new Error(`Failed to fetch tags: ${tagsRes.error.message}`)
    }
    if (postTagsRes.error) {
        throw new Error(`Failed to fetch post_tags: ${postTagsRes.error.message}`)
    }

    const plan = buildCleanupPlan({
        allowList: rawAllowList,
        dbInquiries: inquiriesRes.data || [],
        dbPosts: postsRes.data || [],
        dbTags: tagsRes.data || [],
        dbPostTags: postTagsRes.data || [],
    })

    printPlanReport(plan, idsFilePath, isApply)

    if (!isApply) {
        console.log('\nDRY RUN MODE: Zero database mutations made.')
        console.log(
            'To apply deletion, run with: CONFIRM_TEST_CLEANUP=yes node scripts/cleanup-test-data/cleanup.mjs --ids <file> --apply'
        )
        return
    }

    if (!plan.canApply) {
        console.error(
            `\nSAFETY BLOCK: Refusing to apply because ${plan.refused.length} item(s) violated safety rules.`
        )
        process.exit(1)
    }

    const deletePostIds = new Set(plan.postsToDelete.map((p) => p.id))
    const deleteTagIds = new Set(plan.tagsToDelete.map((t) => t.id))
    const affectedPostTags = (postTagsRes.data || []).filter(
        (pt) => deletePostIds.has(pt.post_id) || deleteTagIds.has(pt.tag_id)
    )

    const backupPayload = {
        timestamp: new Date().toISOString(),
        allowListFile: idsFilePath,
        inquiries: plan.inquiriesToDelete,
        posts: plan.postsToDelete,
        tags: plan.tagsToDelete,
        post_tags: affectedPostTags,
    }

    const backupPath = path.join(
        os.tmpdir(),
        `cleanup-test-data-backup-${Date.now()}.json`
    )
    fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2), 'utf8')
    console.log(`\nBackup written before deletion: ${backupPath}`)

    if (plan.inquiriesToDelete.length > 0) {
        await deleteInBatchesAndVerify(
            supabase,
            'inquiries',
            plan.inquiriesToDelete.map((r) => r.id)
        )
    }

    if (plan.postsToDelete.length > 0) {
        await deleteInBatchesAndVerify(
            supabase,
            'posts',
            plan.postsToDelete.map((r) => r.id)
        )
    }

    if (plan.tagsToDelete.length > 0) {
        await deleteInBatchesAndVerify(
            supabase,
            'tags',
            plan.tagsToDelete.map((r) => r.id)
        )
    }

    console.log('\nCleanup completed and verified.')
}

const isMain =
    process.argv[1] &&
    path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
    main().catch((err) => {
        console.error('Error:', err instanceof Error ? err.message : String(err))
        process.exit(1)
    })
}
