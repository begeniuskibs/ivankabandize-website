// Media re-hosting and size validation helper
// Flags image files > 45 MB and video files > 50 MB

import crypto from 'node:crypto'

export const MAX_IMAGE_BYTES = 45 * 1024 * 1024 // 45 MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50 MB

export function isGhostMedia(url) {
  if (!url || typeof url !== 'string') return false
  return (
    url.includes('__GHOST_URL__') ||
    url.includes('/content/images') ||
    url.includes('/content/media') ||
    url.includes('begenius-thoughts.ghost.io') ||
    url.includes('ivankabandize.com/content/')
  )
}

export function toAbsoluteGhostMediaUrl(url) {
  if (!url) return ''
  let clean = url.trim()
  if (clean.startsWith('__GHOST_URL__')) {
    clean = clean.replace('__GHOST_URL__', 'https://begenius-thoughts.ghost.io')
  } else if (clean.startsWith('/content/')) {
    clean = `https://begenius-thoughts.ghost.io${clean}`
  } else if (clean.startsWith('http://') || clean.startsWith('https://')) {
    clean = clean.replace(/^https?:\/\/(?:www\.)?ivankabandize\.com\/content\//, 'https://begenius-thoughts.ghost.io/content/')
  }
  return clean
}

export async function inspectMediaUrl(rawUrl, isVideo = false) {
  const absoluteUrl = toAbsoluteGhostMediaUrl(rawUrl)
  try {
    const res = await fetch(absoluteUrl, { method: 'HEAD' })
    if (!res.ok) {
      // Fallback to GET with range
      const getRes = await fetch(absoluteUrl, {
        method: 'GET',
        headers: { Range: 'bytes=0-1' },
      })
      const sizeHeader = getRes.headers.get('content-range')?.split('/')[1] || getRes.headers.get('content-length')
      const bytes = parseInt(sizeHeader || '0', 10)
      const contentType = getRes.headers.get('content-type') || ''
      return {
        url: rawUrl,
        absoluteUrl,
        status: getRes.status,
        bytes,
        contentType,
        oversized: isVideo ? bytes > MAX_VIDEO_BYTES : bytes > MAX_IMAGE_BYTES,
      }
    }
    const bytes = parseInt(res.headers.get('content-length') || '0', 10)
    const contentType = res.headers.get('content-type') || ''
    return {
      url: rawUrl,
      absoluteUrl,
      status: res.status,
      bytes,
      contentType,
      oversized: isVideo ? bytes > MAX_VIDEO_BYTES : bytes > MAX_IMAGE_BYTES,
    }
  } catch (err) {
    return {
      url: rawUrl,
      absoluteUrl,
      status: 0,
      bytes: 0,
      error: err.message,
      oversized: false,
    }
  }
}

export function getStorageObjectName(rawUrl, isVideo = false) {
  if (!rawUrl) return ''
  const absoluteUrl = toAbsoluteGhostMediaUrl(rawUrl)
  const cleanUrl = absoluteUrl.split('?')[0]
  const hash12 = crypto.createHash('sha1').update(cleanUrl).digest('hex').slice(0, 12)
  const urlParts = cleanUrl.split('/')
  const rawFileName = urlParts[urlParts.length - 1] || 'media'
  const ext = (rawFileName.includes('.') ? rawFileName.split('.').pop() : (isVideo ? 'mp4' : 'jpg')).toLowerCase()
  const baseName = rawFileName
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `ghost-${hash12}-${baseName || 'upload'}.${ext}`
}

export async function uploadMediaToSupabase({
  supabase,
  rawUrl,
  bucket,
  dryRun = true,
}) {
  const absoluteUrl = toAbsoluteGhostMediaUrl(rawUrl)
  const isVideo = bucket === 'post-videos'

  if (dryRun) {
    const inspect = await inspectMediaUrl(rawUrl, isVideo)
    return {
      success: true,
      url: absoluteUrl,
      publicUrl: `[DRY_RUN_STORAGE_URL:${bucket}]`,
      bytes: inspect.bytes,
      oversized: inspect.oversized,
    }
  }

  const storagePath = getStorageObjectName(rawUrl, isVideo)

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(storagePath)

  // Check whether object already exists by HEAD request on public URL
  try {
    const headRes = await fetch(publicUrl, { method: 'HEAD' })
    if (headRes.status === 200) {
      const bytes = parseInt(headRes.headers.get('content-length') || '0', 10)
      return {
        success: true,
        url: rawUrl,
        publicUrl,
        bytes,
        oversized: false,
      }
    }
  } catch {
    // Proceed with upload if HEAD check fails
  }

  // Real download and upload
  const res = await fetch(absoluteUrl)
  if (!res.ok) {
    throw new Error(`Failed to download ${absoluteUrl}: HTTP ${res.status}`)
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const bytes = buffer.length
  const oversized = isVideo ? bytes > MAX_VIDEO_BYTES : bytes > MAX_IMAGE_BYTES
  if (oversized) {
    throw new Error(`File ${absoluteUrl} exceeds limit (${bytes} bytes)`)
  }

  const contentType = res.headers.get('content-type') || (isVideo ? 'video/mp4' : 'image/jpeg')

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Upload error to ${bucket}/${storagePath}: ${uploadError.message}`)
  }

  return {
    success: true,
    url: rawUrl,
    publicUrl,
    bytes,
    oversized: false,
  }
}
