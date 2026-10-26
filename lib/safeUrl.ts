/**
 * Safe URL validation for links, CTAs, bookmarks, buttons, and media hrefs.
 * Allows only http:, https:, mailto:, tel: absolute URLs,
 * and relative paths that start with a single "/" (not "//", no backslash,
 * no control characters or whitespace). Anything else returns the fallback.
 */
export function safeHref(input: unknown, fallback: string = '#'): string {
  if (typeof input !== 'string') {
    return fallback
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return fallback
  }

  // Reject any control characters or internal whitespace
  if (/[\s\x00-\x1F\x7F]/.test(trimmed)) {
    return fallback
  }

  // Relative paths: must start with single '/', not '//', and no backslash
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//') || trimmed.includes('\\')) {
      return fallback
    }
    return trimmed
  }

  // Absolute URLs: allow only http:, https:, mailto:, tel:
  try {
    const parsed = new URL(trimmed)
    if (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:' ||
      parsed.protocol === 'tel:'
    ) {
      return trimmed
    }
  } catch {
    // Not a valid URL
  }

  return fallback
}
