import dns from 'dns/promises'
import net from 'net'

export function isPrivateOrReservedIp(ip: string): boolean {
  // Normalize IPv6-mapped IPv4 e.g. ::ffff:127.0.0.1
  const ipv4MappedMatch = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)
  if (ipv4MappedMatch) {
    ip = ipv4MappedMatch[1]
  }

  const family = net.isIP(ip)
  if (family === 4) {
    const parts = ip.split('.').map(Number)
    const [b0, b1, b2] = parts

    // 0.0.0.0/8 (Current network)
    if (b0 === 0) return true
    // 10.0.0.0/8 (Private network)
    if (b0 === 10) return true
    // 100.64.0.0/10 (Shared address / CGNAT)
    if (b0 === 100 && b1 >= 64 && b1 <= 127) return true
    // 127.0.0.0/8 (Loopback)
    if (b0 === 127) return true
    // 169.254.0.0/16 (Link-local)
    if (b0 === 169 && b1 === 254) return true
    // 172.16.0.0/12 (Private network: 172.16.x.x - 172.31.x.x)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if (b0 === 192 && b1 === 0 && b2 === 0) return true
    // 192.0.2.0/24 (TEST-NET-1)
    if (b0 === 192 && b1 === 0 && b2 === 2) return true
    // 192.168.0.0/16 (Private network)
    if (b0 === 192 && b1 === 168) return true
    // 198.18.0.0/15 (Network benchmark tests)
    if (b0 === 198 && (b1 === 18 || b1 === 19)) return true
    // 198.51.100.0/24 (TEST-NET-2)
    if (b0 === 198 && b1 === 51 && b2 === 100) return true
    // 203.0.113.0/24 (TEST-NET-3)
    if (b0 === 203 && b1 === 0 && b2 === 113) return true
    // 224.0.0.0/4 (Multicast)
    if (b0 >= 224 && b0 <= 239) return true
    // 240.0.0.0/4 (Reserved / Future use / Broadcast)
    if (b0 >= 240) return true

    return false
  }

  if (family === 6) {
    // ::1 (Loopback)
    if (ip === '::1' || ip === '0:0:0:0:0:0:0:1') return true
    // :: (Unspecified)
    if (ip === '::' || ip === '0:0:0:0:0:0:0:0') return true

    // Expand short IPv6 to full hex string for prefix check
    const normalized = expandIPv6(ip)
    if (!normalized) return true // fail closed if unparseable

    const firstWord = parseInt(normalized.slice(0, 4), 16)

    // fc00::/7 (Unique local: fc00:: to fdff::)
    if ((firstWord & 0xfe00) === 0xfc00) return true
    // fe80::/10 (Link-local: fe80:: to febf::)
    if ((firstWord & 0xffc0) === 0xfe80) return true
    // ff00::/8 (Multicast)
    if ((firstWord & 0xff00) === 0xff00) return true

    return false
  }

  // Not a valid IP
  return true
}

function expandIPv6(ip: string): string | null {
  try {
    const address = ip.toLowerCase()
    if (address.includes('::')) {
      const parts = address.split('::')
      const left = parts[0] ? parts[0].split(':') : []
      const right = parts[1] ? parts[1].split(':') : []
      const missing = 8 - (left.length + right.length)
      const middle = Array(missing).fill('0000')
      const full = [...left, ...middle, ...right].map((seg) => seg.padStart(4, '0'))
      return full.join('')
    } else {
      return address.split(':').map((seg) => seg.padStart(4, '0')).join('')
    }
  } catch {
    return null
  }
}

export interface UrlSafetyResult {
  safe: boolean
  reason?: string
  url?: URL
}

export async function validateUrlSafety(inputUrl: string): Promise<UrlSafetyResult> {
  let parsed: URL
  try {
    parsed = new URL(inputUrl)
  } catch {
    return { safe: false, reason: 'Invalid URL format' }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      safe: false,
      reason: `Disallowed protocol: ${parsed.protocol}. Only http and https are allowed.`,
    }
  }

  const rawHostname = parsed.hostname.toLowerCase()
  // Strip brackets from IPv6 hostnames like [::1]
  const hostname =
    rawHostname.startsWith('[') && rawHostname.endsWith(']')
      ? rawHostname.slice(1, -1)
      : rawHostname

  if (!hostname) {
    return { safe: false, reason: 'Missing hostname' }
  }

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local')
  ) {
    return { safe: false, reason: 'Localhost addresses are not allowed' }
  }

  // Check if hostname is directly an IP literal
  if (net.isIP(hostname)) {
    if (isPrivateOrReservedIp(hostname)) {
      return {
        safe: false,
        reason: `Private, loopback, or reserved IP address is not allowed: ${hostname}`,
      }
    }
    return { safe: true, url: parsed }
  }

  // Otherwise, resolve hostname via DNS
  try {
    const addresses = await dns.lookup(hostname, { all: true })
    if (!addresses || addresses.length === 0) {
      return { safe: false, reason: `DNS lookup returned no addresses for ${hostname}` }
    }

    for (const record of addresses) {
      if (isPrivateOrReservedIp(record.address)) {
        return {
          safe: false,
          reason: `Host ${hostname} resolves to private, loopback, or reserved IP: ${record.address}`,
        }
      }
    }

    return { safe: true, url: parsed }
  } catch (dnsErr) {
    const msg = dnsErr instanceof Error ? dnsErr.message : 'DNS lookup failed'
    return { safe: false, reason: `DNS resolution failed: ${msg}` }
  }
}

export interface SafeFetchHtmlResult {
  html: string
  finalUrl: string
}

export async function safeFetchHtml(initialUrl: string): Promise<SafeFetchHtmlResult> {
  let currentUrl = initialUrl
  let redirectCount = 0
  const maxRedirects = 3
  const maxBytes = 1024 * 1024 // 1 MB limit

  while (true) {
    const safetyCheck = await validateUrlSafety(currentUrl)
    if (!safetyCheck.safe) {
      throw new Error(`SSRF validation failed: ${safetyCheck.reason}`)
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    let res: Response
    try {
      res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; IvanKabandizeBot/1.0; +https://ivankabandize.com)',
          Accept: 'text/html,application/xhtml+xml',
        },
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timed out after 8 seconds')
      }
      const message = err instanceof Error ? err.message : 'Network error'
      throw new Error(`Failed to fetch page: ${message}`)
    } finally {
      clearTimeout(timeoutId)
    }

    // Handle redirects
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      redirectCount++
      if (redirectCount > maxRedirects) {
        throw new Error(`Too many redirects (maximum ${maxRedirects} allowed)`)
      }
      const location = res.headers.get('location')
      if (!location) {
        throw new Error(`Redirect status ${res.status} returned without a location header`)
      }
      currentUrl = new URL(location, currentUrl).href
      continue
    }

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`)
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error(`Invalid content-type: ${contentType}. Only HTML responses are accepted.`)
    }

    // Read at most 1 MB
    const contentLength = res.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      throw new Error(`Page size exceeds 1 MB limit (${contentLength} bytes)`)
    }

    const reader = res.body?.getReader()
    if (!reader) {
      throw new Error('Response body is empty or not readable')
    }

    const chunks: Uint8Array[] = []
    let totalBytes = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        totalBytes += value.length
        if (totalBytes > maxBytes) {
          reader.cancel()
          throw new Error('Page size exceeded 1 MB limit during download')
        }
        chunks.push(value)
      }
    }

    const fullBuffer = Buffer.concat(chunks)
    const html = fullBuffer.toString('utf-8')
    return { html, finalUrl: currentUrl }
  }
}

/**
 * Re-hosting helper: downloads image, validates type & size, and uploads to storage.
 * NOTE: As per batch rules, real storage uploads are not executed during testing.
 */
export async function rehostBookmarkImage(
  supabase: unknown,
  imageUrl: string,
  executeUpload: boolean = false
): Promise<string> {
  if (!imageUrl || !executeUpload) {
    return imageUrl
  }

  const safetyCheck = await validateUrlSafety(imageUrl)
  if (!safetyCheck.safe) {
    return imageUrl
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 8000)

  let res: Response
  try {
    res = await fetch(imageUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'IvanKabandizeBot/1.0',
      },
    })
  } catch {
    return imageUrl
  } finally {
    clearTimeout(timeoutId)
  }

  if (!res.ok) return imageUrl

  const contentType = (res.headers.get('content-type') || '').toLowerCase().split(';')[0].trim()
  const allowedMimes: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
  }

  // Explicitly refuse svg
  if (contentType === 'image/svg+xml' || imageUrl.toLowerCase().endsWith('.svg')) {
    return imageUrl
  }

  const ext = allowedMimes[contentType] || imageUrl.split('.').pop()?.toLowerCase() || 'jpg'
  if (!['png', 'jpg', 'jpeg', 'webp', 'gif', 'ico'].includes(ext)) {
    return imageUrl
  }

  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Max 5 MB limit
  if (buffer.length > 5 * 1024 * 1024) {
    return imageUrl
  }

  const client = supabase as {
    storage: {
      from: (bucket: string) => {
        upload: (
          path: string,
          buffer: Buffer,
          options: { contentType: string; upsert: boolean }
        ) => Promise<{ data: { path: string } | null; error: unknown }>
        getPublicUrl: (path: string) => { data: { publicUrl: string } }
      }
    }
  }

  const path = `bookmarks/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { data, error } = await client.storage
    .from('post-images')
    .upload(path, buffer, {
      contentType: contentType || 'image/jpeg',
      upsert: true,
    })

  if (error || !data) {
    return imageUrl
  }

  const {
    data: { publicUrl },
  } = client.storage.from('post-images').getPublicUrl(data.path)

  return publicUrl || imageUrl
}
