import { validateUrlSafety } from './urlSafety.ts'

export const ALLOWED_LINK_TYPES = [
  'book',
  'audible',
  'spotify',
  'apple_podcasts',
  'youtube',
  'website',
] as const

export type LibraryLinkType = (typeof ALLOWED_LINK_TYPES)[number]

export const LINK_TYPE_LABELS: Record<LibraryLinkType, string> = {
  book: 'Get the book',
  audible: 'Listen on Audible',
  spotify: 'Listen on Spotify',
  apple_podcasts: 'Listen on Apple Podcasts',
  youtube: 'Watch on YouTube',
  website: 'Visit website',
}

export const ALLOWED_YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
] as const

export interface LibraryLinkItem {
  type: LibraryLinkType
  url: string
  label?: string
}

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export type ValidationResult<T> =
  | { valid: true; value: T }
  | { valid: false; error: string }

/**
 * Validates a library item page address (slug).
 * - 3 to 80 characters
 * - lowercase letters, numbers, and hyphens (no consecutive hyphens, no leading/trailing hyphens)
 * - non-empty
 */
export function validateLibrarySlug(slug: unknown): ValidationResult<string> {
  if (slug === undefined || slug === null) {
    return { valid: false, error: 'Page address cannot be empty.' }
  }
  if (typeof slug !== 'string') {
    return { valid: false, error: 'Page address must be a string.' }
  }

  const trimmed = slug.trim()
  if (!trimmed) {
    return { valid: false, error: 'Page address cannot be empty.' }
  }

  if (trimmed.length < 3 || trimmed.length > 80) {
    return { valid: false, error: 'Page address must be between 3 and 80 characters.' }
  }

  if (!SLUG_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: 'Page address must use lowercase letters, numbers and hyphens only.',
    }
  }

  return { valid: true, value: trimmed }
}

/**
 * Validates a library item YouTube video URL.
 * - empty string or null clears it (returns null)
 * - otherwise must be https://, host in youtube.com, www.youtube.com, m.youtube.com, youtu.be
 * - must pass validateUrlSafety
 */
export async function validateLibraryVideoUrl(
  videoUrl: unknown
): Promise<ValidationResult<string | null>> {
  if (videoUrl === undefined || videoUrl === null) {
    return { valid: true, value: null }
  }
  if (typeof videoUrl !== 'string') {
    return { valid: false, error: 'Video URL must be a string or null.' }
  }

  const trimmed = videoUrl.trim()
  if (!trimmed) {
    return { valid: true, value: null }
  }

  if (!trimmed.startsWith('https://')) {
    return { valid: false, error: 'Video URL must start with https://' }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    return { valid: false, error: 'Invalid Video URL format.' }
  }

  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'Video URL must use HTTPS.' }
  }

  const host = parsed.hostname.toLowerCase()
  if (!ALLOWED_YOUTUBE_HOSTS.includes(host as (typeof ALLOWED_YOUTUBE_HOSTS)[number])) {
    return {
      valid: false,
      error: 'Video URL must have a host of youtube.com, www.youtube.com, m.youtube.com or youtu.be.',
    }
  }

  const safety = await validateUrlSafety(trimmed)
  if (!safety.safe) {
    return { valid: false, error: `Invalid Video URL: ${safety.reason || 'Unsafe URL'}` }
  }

  return { valid: true, value: trimmed }
}

/**
 * Validates a library item links list.
 * - array of at most 8
 * - each type in ALLOWED_LINK_TYPES
 * - each url non-empty, starts with https://, passes validateUrlSafety
 * - label if present is string of at most 60 chars (if empty, omitted)
 */
export async function validateLibraryLinks(
  links: unknown
): Promise<ValidationResult<LibraryLinkItem[]>> {
  if (!Array.isArray(links)) {
    return { valid: false, error: 'Links must be an array.' }
  }

  if (links.length > 8) {
    return { valid: false, error: 'Links list cannot have more than 8 links.' }
  }

  const cleanLinks: LibraryLinkItem[] = []

  for (let i = 0; i < links.length; i++) {
    const item = links[i]
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { valid: false, error: `Link at index ${i} must be an object.` }
    }

    const { type, url, label } = item as Record<string, unknown>

    if (
      typeof type !== 'string' ||
      !ALLOWED_LINK_TYPES.includes(type as LibraryLinkType)
    ) {
      return {
        valid: false,
        error: `Link at index ${i} has invalid type "${String(type)}". Allowed types: ${ALLOWED_LINK_TYPES.join(', ')}`,
      }
    }

    if (typeof url !== 'string' || !url.trim()) {
      return { valid: false, error: `Link at index ${i} must have a non-empty URL.` }
    }

    const trimmedUrl = url.trim()
    if (!trimmedUrl.startsWith('https://')) {
      return { valid: false, error: `Link at index ${i} URL must start with https://` }
    }

    const safety = await validateUrlSafety(trimmedUrl)
    if (!safety.safe) {
      return {
        valid: false,
        error: `Link at index ${i} has invalid URL: ${safety.reason || 'Unsafe URL'}`,
      }
    }

    let cleanLabel: string | undefined = undefined
    if (label !== undefined && label !== null) {
      if (typeof label !== 'string') {
        return { valid: false, error: `Link at index ${i} label must be a string if provided.` }
      }
      if (label.length > 60) {
        return {
          valid: false,
          error: `Link at index ${i} label cannot exceed 60 characters.`,
        }
      }
      if (label.trim().length > 0) {
        cleanLabel = label.trim()
      }
    }

    const cleanItem: LibraryLinkItem = {
      type: type as LibraryLinkType,
      url: trimmedUrl,
    }
    if (cleanLabel !== undefined) {
      cleanItem.label = cleanLabel
    }

    cleanLinks.push(cleanItem)
  }

  return { valid: true, value: cleanLinks }
}

/**
 * Safely parses raw links data from database or API response into typed LibraryLinkItem array.
 * Tolerates null, undefined, or malformed data by defaulting to empty array.
 */
export function safeParseLibraryLinks(raw: unknown): LibraryLinkItem[] {
  if (!Array.isArray(raw)) return []

  const result: LibraryLinkItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const { type, url, label } = item as Record<string, unknown>
    if (
      typeof type === 'string' &&
      ALLOWED_LINK_TYPES.includes(type as LibraryLinkType) &&
      typeof url === 'string' &&
      url.trim().length > 0
    ) {
      const parsed: LibraryLinkItem = {
        type: type as LibraryLinkType,
        url: url.trim(),
      }
      if (typeof label === 'string' && label.trim().length > 0) {
        parsed.label = label.trim()
      }
      result.push(parsed)
    }
  }

  return result
}
