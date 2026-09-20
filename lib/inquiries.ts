// Shared constants and validation utilities for Let's Talk inquiries

export const HELP_OPTIONS = [
  'Operations & systems',
  'Training my team',
  'Strategy & planning',
  'Make sense of AI',
  'Not sure yet',
] as const

export type HelpOption = (typeof HELP_OPTIONS)[number]

export const TIMING_OPTIONS = [
  { label: 'ASAP', value: 'As soon as possible' },
  { label: '1–3 months', value: 'In the next 1–3 months' },
  { label: 'Just exploring', value: 'Just exploring' },
] as const

export const ALLOWED_TIMING_VALUES: readonly string[] = TIMING_OPTIONS.flatMap((opt) => [
  opt.value as string,
  opt.label as string,
])

export const INQUIRY_LIMITS = {
  NAME_MAX: 100,
  EMAIL_MAX: 254,
  ORGANISATION_MAX: 150,
  MESSAGE_MAX: 3000,
} as const

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface InquiryInput {
  name?: unknown
  email?: unknown
  organisation?: unknown
  problem?: unknown
  help_type?: unknown
  timing?: unknown
  contact_ref_code?: unknown
  website?: unknown
  honeypot?: unknown
}

export interface SanitizedInquiry {
  name: string
  email: string
  organisation: string | null
  problem: string
  help_type: string | null
  timing: string | null
  isSpam: boolean
}

export interface ValidationResult {
  isValid: boolean
  error?: string
  data?: SanitizedInquiry
}

/**
 * Sanitizes a string for plain-text email subjects:
 * removes CR, LF and other control characters, collapses repeated whitespace, trims, and caps at 100 chars.
 */
export function sanitizeSubjectHeader(name: string): string {
  const cleaned = (name || '').replace(/[\x00-\x1F\x7F]/g, ' ')
  const collapsed = cleaned.replace(/\s+/g, ' ').trim()
  const subject = `New inquiry from ${collapsed}`
  return subject.slice(0, 100)
}

/**
 * Escapes HTML characters in user-provided input to prevent injection in HTML emails
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
 * Formats user message for email display: HTML-escapes content first,
 * then converts newlines to <br /> tags
 */
export function formatMessageForEmail(message: string): string {
  const escaped = escapeHtml(message)
  return escaped.replace(/\r?\n/g, '<br />')
}

/**
 * Validates and sanitizes raw inquiry payload
 */
export function validateInquiryPayload(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Invalid request format.' }
  }

  const input = body as InquiryInput

  // Check honeypot spam guard first (using contact_ref_code)
  const honeypotVal =
    (typeof input.contact_ref_code === 'string' ? input.contact_ref_code : '') ||
    (typeof input.website === 'string' ? input.website : '') ||
    (typeof input.honeypot === 'string' ? input.honeypot : '')
  if (honeypotVal.trim().length > 0) {
    return {
      isValid: true,
      data: {
        name: '',
        email: '',
        organisation: null,
        problem: '',
        help_type: null,
        timing: null,
        isSpam: true,
      },
    }
  }

  // 1. Validate Name
  if (typeof input.name !== 'string' || !input.name.trim()) {
    return { isValid: false, error: 'Please tell me your name.' }
  }
  const name = input.name.trim()
  if (name.length > INQUIRY_LIMITS.NAME_MAX) {
    return {
      isValid: false,
      error: `Name is too long (maximum ${INQUIRY_LIMITS.NAME_MAX} characters).`,
    }
  }

  // 2. Validate Email
  if (typeof input.email !== 'string' || !input.email.trim()) {
    return { isValid: false, error: 'A valid email is required so I can reply.' }
  }
  const email = input.email.trim()
  if (email.length > INQUIRY_LIMITS.EMAIL_MAX) {
    return {
      isValid: false,
      error: `Email is too long (maximum ${INQUIRY_LIMITS.EMAIL_MAX} characters).`,
    }
  }
  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Please provide a valid email address.' }
  }

  // 3. Validate Problem / Message
  if (typeof input.problem !== 'string' || !input.problem.trim()) {
    return { isValid: false, error: 'Please include a brief description of what is not working.' }
  }
  const problem = input.problem.trim()
  if (problem.length > INQUIRY_LIMITS.MESSAGE_MAX) {
    return {
      isValid: false,
      error: `Message is too long (maximum ${INQUIRY_LIMITS.MESSAGE_MAX} characters).`,
    }
  }

  // 4. Validate Organisation (optional)
  let organisation: string | null = null
  if (typeof input.organisation === 'string' && input.organisation.trim()) {
    const orgTrimmed = input.organisation.trim()
    if (orgTrimmed.length > INQUIRY_LIMITS.ORGANISATION_MAX) {
      return {
        isValid: false,
        error: `Organisation name is too long (maximum ${INQUIRY_LIMITS.ORGANISATION_MAX} characters).`,
      }
    }
    organisation = orgTrimmed
  }

  // 5. Validate Help Type (must be in whitelist if provided)
  let help_type: string | null = null
  if (typeof input.help_type === 'string' && input.help_type.trim()) {
    const htTrimmed = input.help_type.trim()
    if (!HELP_OPTIONS.includes(htTrimmed as HelpOption)) {
      return {
        isValid: false,
        error: `Please select a valid help option from the list.`,
      }
    }
    help_type = htTrimmed
  }

  // 6. Validate Timing (must be in whitelist derived from TIMING_OPTIONS if provided)
  let timing: string | null = null
  if (typeof input.timing === 'string' && input.timing.trim()) {
    const timingTrimmed = input.timing.trim()
    if (!ALLOWED_TIMING_VALUES.includes(timingTrimmed)) {
      return {
        isValid: false,
        error: `Please select a valid timing option from the list.`,
      }
    }
    timing = timingTrimmed
  }

  return {
    isValid: true,
    data: {
      name,
      email,
      organisation,
      problem,
      help_type,
      timing,
      isSpam: false,
    },
  }
}
