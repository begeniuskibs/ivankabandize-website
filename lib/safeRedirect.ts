/**
 * Safe redirect helper.
 * Validates that an untrusted redirect input is a safe relative pathname.
 * Prevents open redirects (e.g. //evil.com, /\\evil.com, /\\t/evil.com).
 */

export function safeRedirectPath(input: unknown, fallback = '/auth/account'): string {
  if (typeof input !== 'string') {
    return fallback
  }

  // Must start with exactly one "/" and the second character is not "/" and not "\"
  if (!input.startsWith('/') || input[1] === '/' || input[1] === '\\') {
    return fallback
  }

  // Must contain no backslash, no whitespace and no control characters (code points 0 to 31 or 127) anywhere
  if (/[\\\s\x00-\x1F\x7F]/.test(input)) {
    return fallback
  }

  try {
    const parsed = new URL(input, 'https://placeholder.invalid')
    if (parsed.origin !== 'https://placeholder.invalid') {
      return fallback
    }
  } catch {
    return fallback
  }

  return input
}
