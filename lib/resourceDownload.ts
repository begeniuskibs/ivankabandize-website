// Pure validation, normalization, fingerprint, and limit helpers for Resources downloads
// House style: spaced hyphen " - " only

import { createHmac } from 'node:crypto'

export const RESOURCE_DOWNLOAD_LIMITS = {
  MAX_REQUEST_BODY_CHARS: 4000,
  NAME_MIN: 2,
  NAME_MAX: 100,
  EMAIL_MAX: 254,
  SLUG_MAX: 120,
  MIN_SECRET_LENGTH: 32,
  EMAIL_LIMIT_MAX: 3,
  EMAIL_LIMIT_WINDOW_MINUTES: 60,
  FINGERPRINT_LIMIT_MAX: 10,
  FINGERPRINT_LIMIT_WINDOW_MINUTES: 60,
  GLOBAL_LIMIT_MAX: 20,
  GLOBAL_LIMIT_WINDOW_SECONDS: 60,
  SIGNED_URL_EXPIRY_SECONDS: 60,
  EMAIL_SIGNED_URL_EXPIRY_SECONDS: 86400,
  EMAIL_DUPLICATE_WINDOW_HOURS: 24,
  RESEND_TIMEOUT_MS: 8000,
} as const

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export interface ResourceDownloadInput {
  slug?: unknown
  name?: unknown
  email?: unknown
  website?: unknown
}

export interface ValidatedResourceDownload {
  slug: string
  name: string
  email: string
  isHoneypot: boolean
}

export interface ResourceDownloadValidationResult {
  isValid: boolean
  error?: string
  data?: ValidatedResourceDownload
}

/**
 * Computes an HMAC-SHA256 request fingerprint keyed by the server secret over the client IP.
 * Fails closed if the secret is missing or shorter than 32 characters.
 */
export function computeRequestFingerprint(ip: string, secret: string): string {
  if (!secret || secret.length < RESOURCE_DOWNLOAD_LIMITS.MIN_SECRET_LENGTH) {
    throw new Error('RESOURCE_FINGERPRINT_SECRET must be at least 32 characters')
  }
  return createHmac('sha256', secret).update(ip).digest('hex')
}

/**
 * Escapes HTML characters in user-supplied strings before embedding into email HTML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sanitizes a title string for use in email subject lines:
 * strips control characters, collapses whitespace, trims, and formats with house style.
 */
export function sanitizeDownloadSubject(title: string): string {
  const cleaned = (title || '').replace(/[\x00-\x1F\x7F]/g, ' ')
  const collapsed = cleaned.replace(/\s+/g, ' ').trim()
  const subject = `Your download - ${collapsed}`
  return subject.slice(0, 100)
}

/**
 * Validates and normalizes the incoming JSON body for resource download requests.
 */
export function validateResourceDownloadPayload(body: unknown): ResourceDownloadValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { isValid: false, error: 'Invalid request format.' }
  }

  const input = body as ResourceDownloadInput

  // 1. Honeypot check (website must be empty)
  const website = input.website
  if (typeof website === 'string' && website.trim().length > 0) {
    return {
      isValid: true,
      data: {
        slug: '',
        name: '',
        email: '',
        isHoneypot: true,
      },
    }
  }

  // 2. Validate Name: trimmed, 2 to 100 characters
  if (typeof input.name !== 'string' || !input.name.trim()) {
    return { isValid: false, error: 'Please enter your name.' }
  }
  const name = input.name.trim()
  if (name.length < RESOURCE_DOWNLOAD_LIMITS.NAME_MIN) {
    return {
      isValid: false,
      error: `Name must be at least ${RESOURCE_DOWNLOAD_LIMITS.NAME_MIN} characters.`,
    }
  }
  if (name.length > RESOURCE_DOWNLOAD_LIMITS.NAME_MAX) {
    return {
      isValid: false,
      error: `Name must not exceed ${RESOURCE_DOWNLOAD_LIMITS.NAME_MAX} characters.`,
    }
  }

  // 3. Validate Email: trimmed, lowercased, valid shape, max 254
  if (typeof input.email !== 'string' || !input.email.trim()) {
    return { isValid: false, error: 'A valid email is required.' }
  }
  const email = input.email.trim().toLowerCase()
  if (email.length > RESOURCE_DOWNLOAD_LIMITS.EMAIL_MAX) {
    return {
      isValid: false,
      error: `Email must not exceed ${RESOURCE_DOWNLOAD_LIMITS.EMAIL_MAX} characters.`,
    }
  }
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address.' }
  }

  // 4. Validate Slug: lowercase letters, digits and hyphens, max 120
  if (typeof input.slug !== 'string' || !input.slug.trim()) {
    return { isValid: false, error: 'Resource slug is required.' }
  }
  const slug = input.slug.trim()
  if (slug.length > RESOURCE_DOWNLOAD_LIMITS.SLUG_MAX) {
    return {
      isValid: false,
      error: `Resource slug must not exceed ${RESOURCE_DOWNLOAD_LIMITS.SLUG_MAX} characters.`,
    }
  }
  if (!SLUG_REGEX.test(slug)) {
    return {
      isValid: false,
      error: 'Resource slug must contain only lowercase letters, numbers, and hyphens.',
    }
  }

  return {
    isValid: true,
    data: {
      slug,
      name,
      email,
      isHoneypot: false,
    },
  }
}
