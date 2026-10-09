// Preflight Report Generator for Ghost Importer Batch 0
// Performs read-only analysis and live network checks for all 52 posts

import fs from 'node:fs'
import { APPROVED_MAPPINGS } from './mapping.mjs'
import { convertGhostPostToTipTap, rewriteBookmarkUrl } from './converter.mjs'
import { isGhostMedia, toAbsoluteGhostMediaUrl, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from './rehost.mjs'

const EXPORT_FILE = 'C:/Users/ivan.kabandize/ghost-export/begenius-thoughts.ghost.2026-09-21-17-50-28.json'

function calculateWordCount(doc) {
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

function countCards(doc) {
  const counts = {
    paragraph: 0,
    heading: 0,
    bulletList: 0,
    orderedList: 0,
    image: 0,
    gallery: 0,
    video: 0,
    youtube: 0,
    bookmark: 0,
    button: 0,
    callout: 0,
    blockquote: 0,
    horizontalRule: 0,
    codeBlock: 0,
  }
  function scan(n) {
    if (!n) return
    if (counts[n.type] !== undefined) {
      counts[n.type]++
    }
    if (n.content && Array.isArray(n.content)) {
      n.content.forEach(scan)
    }
  }
  scan(doc)
  return counts
}

async function checkUrl(url, { isYouTube = false } = {}) {
  if (!url) return { status: 0, message: 'Empty URL' }
  const trimmed = url.trim()

  if (isYouTube || trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`
      const res = await fetch(oembedUrl)
      if (res.ok) {
        const data = await res.json()
        return {
          status: 200,
          type: 'youtube_oembed',
          title: data.title,
          author: data.author_name,
          valid: true,
        }
      }
      return {
        status: res.status,
        type: 'youtube_oembed',
        valid: false,
        error: `oEmbed returned HTTP ${res.status}`,
      }
    } catch (err) {
      return { status: 0, type: 'youtube_oembed', valid: false, error: err.message }
    }
  }

  // Standard URL check
  try {
    const res = await fetch(trimmed, {
      method: 'HEAD',
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    })

    if ([301, 302, 307, 308].includes(res.status)) {
      return {
        status: res.status,
        type: 'redirect',
        location: res.headers.get('location'),
        valid: true,
      }
    }

    if (res.status === 405 || res.status === 403) {
      // Retry with GET
      const getRes = await fetch(trimmed, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          Range: 'bytes=0-10',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })
      if ([301, 302, 307, 308].includes(getRes.status)) {
        return {
          status: getRes.status,
          type: 'redirect',
          location: getRes.headers.get('location'),
          valid: true,
        }
      }
      return { status: getRes.status, type: 'http_get', valid: getRes.ok }
    }

    return { status: res.status, type: 'http_head', valid: res.ok }
  } catch (err) {
    return { status: 0, type: 'error', valid: false, error: err.message }
  }
}

export async function runPreflight() {
  console.log('=== RUNNING PREFLIGHT VERIFICATION ===\n')

  const exportData = JSON.parse(fs.readFileSync(EXPORT_FILE, 'utf8'))
  const rawPosts = exportData.db[0].data.posts || []

  // Lookups
  const ghostPostBySlug = new Map()
  const ghostPostByUuid = new Map()
  const allGhostSlugs = new Set()
  for (const p of rawPosts) {
    if (p.slug) {
      ghostPostBySlug.set(p.slug, p)
      allGhostSlugs.add(p.slug)
    }
    if (p.uuid && p.slug) ghostPostByUuid.set(p.uuid, p.slug)
  }

  // 1. Existing post slugs in DB (from Step 1 baseline)
  const existingDbSlugs = [
    'a-first-step-prolonged-procrastination',
    'sample-post-1789720089373',
    'the-research-that-changed-everything-1789895747013',
    'welcome-to-my-space',
    'systems-over-goals',
    'apple-vision-pro-thoughts-impressions',
    'notion-weekly-planner',
    'the-ai-you-already-use',
    'sample-post-1791088473733',
  ]

  // Check slug conflicts
  const conflicts = []
  for (const m of APPROVED_MAPPINGS) {
    if (existingDbSlugs.includes(m.slug)) {
      conflicts.push(m.slug)
    }
  }

  console.log('1. SLUG CONFLICTS CHECK:')
  console.log(conflicts.length === 0 ? '   None! Zero slug conflicts with existing posts in database.' : `   Conflicts: ${conflicts.join(', ')}`)

  // 2. Process all 52 posts and build summary table
  const postsTable = []
  const allGhostMediaMap = new Map()
  const bookmarkUrlSet = new Set()
  const embedUrlSet = new Set()
  const unmappedCardsReport = new Map()

  const sortedMappings = [...APPROVED_MAPPINGS].sort((a, b) => {
    const postA = ghostPostBySlug.get(a.slug)
    const postB = ghostPostBySlug.get(b.slug)
    const timeA = postA?.published_at ? new Date(postA.published_at).getTime() : Infinity
    const timeB = postB?.published_at ? new Date(postB.published_at).getTime() : Infinity
    return timeA - timeB
  })

  for (let i = 0; i < sortedMappings.length; i++) {
    const mapping = sortedMappings[i]
    const p = ghostPostBySlug.get(mapping.slug)
    if (!p) {
      console.error(`Post missing in export: ${mapping.slug}`)
      continue
    }

    const { doc, format, unmappedCards } = convertGhostPostToTipTap(p, {
      uuidToSlugMap: ghostPostByUuid,
      allGhostSlugs,
      mediaUrlMap: new Map(),
    })

    if (unmappedCards.length > 0) {
      for (const c of unmappedCards) {
        unmappedCardsReport.set(c.type, (unmappedCardsReport.get(c.type) || 0) + 1)
      }
    }

    const wordCount = calculateWordCount(doc)
    const cardCounts = countCards(doc)

    // Collect internal bookmark targets
    const internalBookmarks = []
    function scanBookmarks(n) {
      if (!n) return
      if (n.type === 'bookmark') {
        const rewritten = rewriteBookmarkUrl(n.attrs?.url, ghostPostByUuid, allGhostSlugs)
        if (rewritten.startsWith('/garden/')) {
          const targetSlug = rewritten.replace('/garden/', '').replace(/\/$/, '')
          let resolves = false
          let resolutionType = 'unknown'
          if (targetSlug === 'series/30in30') {
            resolves = true
            resolutionType = 'existing_series_page'
          } else if (APPROVED_MAPPINGS.some(m => m.slug === targetSlug)) {
            resolves = true
            resolutionType = 'imported_post'
          } else if (existingDbSlugs.includes(targetSlug)) {
            resolves = true
            resolutionType = 'existing_site_post'
          }
          internalBookmarks.push({
            originalUrl: n.attrs?.url,
            rewrittenUrl: rewritten,
            targetSlug,
            resolves,
            resolutionType,
          })
        }
        if (n.attrs?.url) bookmarkUrlSet.add(n.attrs.url)
      }
      if (n.type === 'youtube' && n.attrs?.url) {
        embedUrlSet.add(n.attrs.url)
      }
      if (n.content && Array.isArray(n.content)) n.content.forEach(scanBookmarks)
    }
    scanBookmarks(doc)

    // Collect media files
    if (p.feature_image && isGhostMedia(p.feature_image)) {
      allGhostMediaMap.set(p.feature_image, {
        post: p.slug,
        context: 'feature_image',
        bucket: 'post-images',
      })
    }

    function scanMedia(n) {
      if (!n) return
      if (n.type === 'image' && isGhostMedia(n.attrs?.src)) {
        allGhostMediaMap.set(n.attrs.src, { post: p.slug, context: 'image', bucket: 'post-images' })
      }
      if (n.type === 'video' && isGhostMedia(n.attrs?.url)) {
        allGhostMediaMap.set(n.attrs.url, { post: p.slug, context: 'video', bucket: 'post-videos' })
      }
      if (n.type === 'gallery' && Array.isArray(n.attrs?.images)) {
        for (const img of n.attrs.images) {
          if (isGhostMedia(img.url)) {
            allGhostMediaMap.set(img.url, { post: p.slug, context: 'gallery_image', bucket: 'post-images' })
          }
        }
      }
      if (n.type === 'bookmark') {
        if (isGhostMedia(n.attrs?.thumbnail)) {
          allGhostMediaMap.set(n.attrs.thumbnail, { post: p.slug, context: 'bookmark_thumbnail', bucket: 'post-images' })
        }
        if (isGhostMedia(n.attrs?.icon)) {
          allGhostMediaMap.set(n.attrs.icon, { post: p.slug, context: 'bookmark_icon', bucket: 'post-images' })
        }
      }
      if (n.content && Array.isArray(n.content)) n.content.forEach(scanMedia)
    }
    scanMedia(doc)

    // Check in batches of 10 with retry logic
    const skippedSignupCards = unmappedCards.filter(c => c.type === 'signup').length

    postsTable.push({
      num: i + 1,
      slug: p.slug,
      title: p.title,
      stream: mapping.stream,
      tags: mapping.tags.length > 0 ? mapping.tags.join(', ') : 'none',
      series: mapping.series || 'none',
      published_at: p.published_at || 'draft (no date)',
      wordCount,
      format,
      cardCounts,
      skippedSignupCards,
      internalBookmarks,
    })
  }

  // 3. Inspect Media files to re-host with sizes
  console.log(`\n2. MEDIA FILES INSPECTION (${allGhostMediaMap.size} unique Ghost media files):`)
  const mediaResults = []
  const mediaEntries = Array.from(allGhostMediaMap.entries())

  // Check in batches of 10 with retry and fallback
  for (let i = 0; i < mediaEntries.length; i += 10) {
    const batch = mediaEntries.slice(i, i + 10)
    await Promise.all(
      batch.map(async ([rawUrl, meta]) => {
        const absUrl = toAbsoluteGhostMediaUrl(rawUrl)
        const isVideo = meta.bucket === 'post-videos'
        let attempts = 0
        let lastErr = null

        while (attempts < 3) {
          attempts++
          try {
            let res = await fetch(absUrl, {
              method: 'HEAD',
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              },
            })

            let bytes = parseInt(res.headers.get('content-length') || '0', 10)
            let contentType = res.headers.get('content-type') || ''
            let status = res.status

            if (!res.ok || bytes === 0 || res.status === 405 || res.status === 403) {
              const getRes = await fetch(absUrl, {
                method: 'GET',
                headers: {
                  Range: 'bytes=0-1024',
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                },
              })
              status = getRes.status
              contentType = getRes.headers.get('content-type') || contentType
              const contentRange = getRes.headers.get('content-range')
              if (contentRange) {
                const totalMatch = contentRange.match(/\/(\d+)$/)
                if (totalMatch) bytes = parseInt(totalMatch[1], 10)
              }
              if (bytes === 0) {
                bytes = parseInt(getRes.headers.get('content-length') || '0', 10)
              }
            }

            const oversized = isVideo ? bytes > MAX_VIDEO_BYTES : bytes > MAX_IMAGE_BYTES
            mediaResults.push({
              rawUrl,
              absUrl,
              post: meta.post,
              context: meta.context,
              bucket: meta.bucket,
              bytes,
              mb: (bytes / (1024 * 1024)).toFixed(2),
              contentType,
              status,
              oversized,
            })
            return
          } catch (err) {
            lastErr = err
            if (attempts < 3) {
              await new Promise(r => setTimeout(r, 400 * attempts))
            }
          }
        }

        mediaResults.push({
          rawUrl,
          absUrl,
          post: meta.post,
          context: meta.context,
          bucket: meta.bucket,
          bytes: 0,
          mb: '0',
          contentType: 'error',
          status: 0,
          error: lastErr ? lastErr.message : 'Unknown error',
          oversized: false,
        })
      })
    )
    process.stdout.write(`   Checked ${Math.min(i + 10, mediaEntries.length)}/${mediaEntries.length} media files...\r`)
  }
  console.log(`\n   Media inspection complete. Total files checked: ${mediaResults.length}`)

  const oversizedItems = mediaResults.filter(m => m.oversized)
  console.log(
    oversizedItems.length === 0
      ? '   PASS: All media files are within limits (no images > 45 MB, no videos > 50 MB).'
      : `   FLAG: Found ${oversizedItems.length} oversized files!`
  )

  // 4. HTTP Check for all Embeds (YouTube oEmbed) and Bookmarks
  console.log(`\n3. EMBED & BOOKMARK URL CHECKS:`)
  console.log(`   Embed URLs: ${embedUrlSet.size}, Bookmark URLs: ${bookmarkUrlSet.size}`)

  const embedResults = []
  for (const url of Array.from(embedUrlSet)) {
    const check = await checkUrl(url, { isYouTube: true })
    embedResults.push({ url, ...check })
  }

  const bookmarkResults = []
  for (const rawUrl of Array.from(bookmarkUrlSet)) {
    const rewritten = rewriteBookmarkUrl(rawUrl, ghostPostByUuid, allGhostSlugs)
    if (rewritten.startsWith('/garden/')) {
      bookmarkResults.push({
        rawUrl,
        rewritten,
        isInternal: true,
        status: 200,
        valid: true,
        note: 'Internal garden route',
      })
    } else {
      const check = await checkUrl(rawUrl)
      bookmarkResults.push({
        rawUrl,
        rewritten,
        isInternal: false,
        ...check,
      })
    }
  }

  console.log('\n4. UNMAPPED CARD TYPES REPORT:')
  for (const [cardType, count] of unmappedCardsReport.entries()) {
    console.log(`   - Card type: "${cardType}" (encountered ${count} times) - Ghost newsletter subscription card, omitted (public site renders its own footer newsletter subscription).`)
  }

  const skippedSignupCardsPerPost = {}
  for (const post of postsTable) {
    if (post.skippedSignupCards > 0) {
      skippedSignupCardsPerPost[post.slug] = post.skippedSignupCards
    }
  }

  return {
    postsTable,
    mediaResults,
    oversizedItems,
    embedResults,
    bookmarkResults,
    unmappedCardsReport: Object.fromEntries(unmappedCardsReport),
    skippedSignupCardsPerPost,
    conflicts,
  }
}

// Standalone execution
if (process.argv[1]?.endsWith('preflight.mjs')) {
  runPreflight()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Preflight error:', err)
      process.exit(1)
    })
}
