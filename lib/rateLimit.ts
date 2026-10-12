// Rate limiting helper for search and public APIs
// Supports Upstash Redis via REST API when configured
// Fails open safely if Upstash credentials are not set
// House style: spaced hyphen only

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  retryAfter?: number
  isConfigured: boolean
}

export function getClientIp(headers: Headers | { get(name: string): string | null }): string {
  const xForwardedFor = headers.get('x-forwarded-for')
  if (xForwardedFor) {
    const firstIp = xForwardedFor.split(',')[0].trim()
    if (firstIp) return firstIp
  }
  const xRealIp = headers.get('x-real-ip')
  if (xRealIp) {
    const trimmed = xRealIp.trim()
    if (trimmed) return trimmed
  }
  return '127.0.0.1'
}

export interface RateLimiterStore {
  increment(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }>
}

// In-memory sliding window store for testing and simulation
export class MemoryRateLimitStore implements RateLimiterStore {
  private hits = new Map<string, number[]>()

  async increment(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }> {
    const now = Date.now()
    const windowMs = windowSeconds * 1000
    const timestamps = (this.hits.get(key) || []).filter((t) => now - t < windowMs)
    timestamps.push(now)
    this.hits.set(key, timestamps)
    const oldest = timestamps[0]
    const ttl = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000))
    return { count: timestamps.length, ttl }
  }

  reset() {
    this.hits.clear()
  }
}

// Upstash Redis REST API store
export class UpstashRateLimitStore implements RateLimiterStore {
  private url: string
  private token: string

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '')
    this.token = token
  }

  async increment(key: string, windowSeconds: number): Promise<{ count: number; ttl: number }> {
    const response = await fetch(`${this.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSeconds, 'NX'],
        ['TTL', key],
      ]),
    })

    if (!response.ok) {
      throw new Error(`Upstash request failed with status ${response.status}`)
    }

    const data = await response.json()
    const count = Number(data[0]?.result || 1)
    const ttlRaw = Number(data[2]?.result || windowSeconds)
    const ttl = ttlRaw > 0 ? ttlRaw : windowSeconds
    return { count, ttl }
  }
}

export async function checkRateLimitWithStore(
  store: RateLimiterStore,
  ip: string,
  limit = 60,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const key = `ratelimit:search:${ip}`
  const { count, ttl } = await store.increment(key, windowSeconds)

  if (count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      retryAfter: ttl,
      isConfigured: true,
    }
  }

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - count),
    isConfigured: true,
  }
}

export async function checkRateLimit(
  ip: string,
  limit = 60,
  windowSeconds = 60
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN

  // Fail OPEN: if Upstash credentials are not set, allow request through safely
  if (!url || !token) {
    return {
      success: true,
      limit,
      remaining: limit,
      isConfigured: false,
    }
  }

  try {
    const store = new UpstashRateLimitStore(url, token)
    return await checkRateLimitWithStore(store, ip, limit, windowSeconds)
  } catch (error) {
    // Fail OPEN: network or Redis errors must never bring down search
    console.warn('Rate limiter error - failing open:', error)
    return {
      success: true,
      limit,
      remaining: limit,
      isConfigured: true,
    }
  }
}
