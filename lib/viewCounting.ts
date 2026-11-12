import { createHmac } from 'node:crypto'

// Pure helper functions for article view counting
// House style: spaced hyphen only

const BOT_PATTERNS = [
  'bot',
  'crawler',
  'spider',
  'slurp',
  'headless',
  'lighthouse',
  'vercel',
  'uptime',
  'curl',
  'wget',
  'python-requests',
  'facebookexternalhit',
  'whatsapp',
  'telegram',
  'slack',
  'preview',
]

export function isBotUserAgent(ua?: string | null): boolean {
  if (!ua || typeof ua !== 'string') return true
  const trimmed = ua.trim().toLowerCase()
  if (!trimmed) return true
  return BOT_PATTERNS.some((pattern) => trimmed.includes(pattern))
}

export function isValidSlug(s: unknown): s is string {
  if (typeof s !== 'string') return false
  if (s.length < 1 || s.length > 200) return false
  return /^[a-z0-9-]+$/.test(s)
}

export interface SessionHashParams {
  secret: string
  ip: string
  userAgent: string
  postId: string
  day: string
}

export function makeSessionHash({
  secret,
  ip,
  userAgent,
  postId,
  day,
}: SessionHashParams): string {
  const data = `${ip}|${userAgent}|${postId}|${day}`
  return createHmac('sha256', secret).update(data).digest('hex')
}

export function getUtcDay(date?: Date): string {
  const d = date || new Date()
  return d.toISOString().split('T')[0]
}
