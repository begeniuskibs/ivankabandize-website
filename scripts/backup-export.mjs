import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

export const TABLES = [
  'users',
  'members',
  'tiers',
  'subscriptions',
  'posts',
  'tags',
  'post_tags',
  'newsletters',
  'newsletter_subscriptions',
  'comments',
  'pages',
  'post_views',
  'now_entries',
  'inquiries',
  'library_items',
  'series',
  'library_item_tags',
]

export const STORAGE_BUCKETS = ['post-images', 'post-videos']

function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing required environment variable(s): NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function getBackupFolderName(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `ivankabandize-backup-${yyyy}-${mm}-${dd}-${hh}${min}`
}

function computeSha256(content) {
  if (typeof crypto.hash === 'function') {
    return crypto.hash('sha256', content, 'hex')
  }
  const hasher = crypto.createHash('sha256')
  hasher['update'](content, 'utf8')
  return hasher.digest('hex')
}

export async function fetchTableRows(client, table) {
  const rows = []
  const pageSize = 1000
  let page = 0

  while (true) {
    const from = page * pageSize
    const to = from + pageSize - 1

    let query = client.from(table).select('*').range(from, to)

    if (table === 'library_item_tags') {
      query = query.order('library_item_id', { ascending: true }).order('tag_id', { ascending: true })
    } else {
      query = query.order('id', { ascending: true })
    }

    const { data, error } = await query
    if (error) {
      throw new Error(`Failed to query table "${table}": ${error.message}`)
    }

    if (!data || data.length === 0) {
      break
    }

    rows.push(...data)

    if (data.length < pageSize) {
      break
    }

    page++
  }

  return rows
}

export async function fetchAuthUsers(client) {
  const users = []
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`Failed to list auth users: ${error.message}`)
    }

    const currentUsers = data?.users || []
    if (currentUsers.length === 0) {
      break
    }

    users.push(...currentUsers)

    if (!data.nextPage || currentUsers.length < perPage) {
      break
    }

    page = data.nextPage
  }

  return users
}

export async function listStorageObjects(client, bucket, prefix = '') {
  const objects = []
  let offset = 0
  const limit = 100

  while (true) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })

    if (error) {
      throw new Error(`Failed to list objects in bucket "${bucket}" (prefix: "${prefix}"): ${error.message}`)
    }

    if (!data || data.length === 0) {
      break
    }

    for (const item of data) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name

      if (item.id === null || !item.metadata) {
        const subObjects = await listStorageObjects(client, bucket, fullPath)
        objects.push(...subObjects)
      } else {
        objects.push({
          name: fullPath,
          size: item.metadata?.size ?? item.size ?? 0,
          created_at: item.created_at || item.updated_at || null,
        })
      }
    }

    if (data.length < limit) {
      break
    }

    offset += limit
  }

  return objects
}

export async function runBackupExport() {
  const isApply = process.argv.includes('--apply')
  const client = getClient()

  const folderName = getBackupFolderName()
  const backupDir = path.join(os.tmpdir(), folderName)

  // 1. Initial live table row counts
  const liveCounts = {}
  for (const table of TABLES) {
    const { count, error } = await client
      .from(table)
      .select('*', { count: 'exact', head: true })
    if (error) {
      throw new Error(`Failed to get count for table "${table}": ${error.message}`)
    }
    liveCounts[table] = count ?? 0
  }

  // If dry-run: prints folder path and table of "table name: row count", writes NOTHING
  if (!isApply) {
    console.log(backupDir)
    console.table(
      TABLES.map((table) => ({
        'table name': table,
        'row count': liveCounts[table],
      }))
    )
    return
  }

  // 2. Apply mode: export tables
  const exportedTables = {}
  const exportedCounts = {}

  for (const table of TABLES) {
    const rows = await fetchTableRows(client, table)
    exportedTables[table] = rows
    exportedCounts[table] = rows.length
  }

  // 3. Post-export count verification - fail loudly if any exported count differs from live count
  for (const table of TABLES) {
    const { count: currentCount, error: countError } = await client
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (countError) {
      throw new Error(`Failed to verify count for table "${table}": ${countError.message}`)
    }

    if (currentCount !== exportedCounts[table]) {
      throw new Error(
        `Export count mismatch for table "${table}": exported ${exportedCounts[table]} rows, live database has ${currentCount} rows`
      )
    }
  }

  // 4. Export auth users
  const authUsers = await fetchAuthUsers(client)

  // 5. Export storage object manifests
  const storageManifest = {}
  const storageObjectCounts = {}
  for (const bucket of STORAGE_BUCKETS) {
    const bucketObjects = await listStorageObjects(client, bucket)
    storageManifest[bucket] = bucketObjects
    storageObjectCounts[bucket] = bucketObjects.length
  }

  // 6. Build file map and compute SHA-256 for each exported file
  const filesToWrite = {}
  for (const table of TABLES) {
    filesToWrite[`${table}.json`] = JSON.stringify(exportedTables[table], null, 2)
  }
  filesToWrite['auth-users.json'] = JSON.stringify(authUsers, null, 2)
  filesToWrite['storage-manifest.json'] = JSON.stringify(storageManifest, null, 2)

  const fileSha256 = {}
  for (const [filename, content] of Object.entries(filesToWrite)) {
    fileSha256[filename] = computeSha256(content)
  }

  let projectHost = ''
  try {
    projectHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).host
  } catch {
    projectHost = ''
  }

  const manifest = {
    project_host: projectHost,
    timestamp: new Date().toISOString(),
    table_row_counts: exportedCounts,
    auth_users_count: authUsers.length,
    storage_object_counts: storageObjectCounts,
    file_sha256: fileSha256,
    notes: [
      'Password hashes are not available from the Supabase Auth admin API.',
    ],
  }

  filesToWrite['manifest.json'] = JSON.stringify(manifest, null, 2)

  // 7. Write all files to os.tmpdir() folder
  fs.mkdirSync(backupDir, { recursive: true })
  for (const [filename, content] of Object.entries(filesToWrite)) {
    fs.writeFileSync(path.join(backupDir, filename), content, 'utf8')
  }

  // 8. Output strictly folder path and table of "table name: row count"
  console.log(backupDir)
  console.table(
    TABLES.map((table) => ({
      'table name': table,
      'row count': exportedCounts[table],
    }))
  )
}

if (process.argv[1] && (process.argv[1].endsWith('backup-export.mjs') || process.argv[1].endsWith('backup-export'))) {
  runBackupExport().catch((err) => {
    console.error('Backup export failed:', err.message)
    process.exit(1)
  })
}
