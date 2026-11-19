// Pure UI presentation helpers for the Resources flow
// House style: spaced hyphen " - " only

/**
 * Formats a byte count into a calm, human-readable file size string.
 * Returns an empty string for invalid, zero, or negative inputs.
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (
    bytes === null ||
    bytes === undefined ||
    typeof bytes !== 'number' ||
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return ''
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kb = bytes / 1024
  if (kb < 1024) {
    return `${Math.round(kb)} KB`
  }

  const mb = kb / 1024
  if (mb < 1024) {
    const formatted =
      mb < 10 ? mb.toFixed(1).replace(/\.0$/, '') : Math.round(mb).toString()
    return `${formatted} MB`
  }

  const gb = mb / 1024
  const formatted = gb.toFixed(1).replace(/\.0$/, '')
  return `${formatted} GB`
}

/**
 * Splits multiline plain text on blank lines into distinct paragraphs.
 * Trims each paragraph and drops empty ones.
 */
export function splitParagraphs(text: string | null | undefined): string[] {
  if (!text || typeof text !== 'string') return []
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

/**
 * Maps raw resource kind slugs to friendly UI labels.
 */
export function kindLabel(kind: string | null | undefined): string {
  if (!kind || typeof kind !== 'string') return ''
  const normalized = kind.trim().toLowerCase()
  switch (normalized) {
    case 'guide':
      return 'Guide'
    case 'template':
      return 'Template'
    case 'framework':
      return 'Framework'
    default:
      return normalized.charAt(0).toUpperCase() + normalized.slice(1)
  }
}

/**
 * Maps HTTP status codes and server error strings to calm user-facing messages.
 */
export function getDownloadErrorMessage(
  status: number | null | undefined,
  serverMessage?: string | null
): string {
  if (status === 400) {
    const trimmed = (serverMessage || '').trim()
    return trimmed || 'Invalid request. Please check the form and try again.'
  }
  if (status === 403 || status === 404) {
    return "That file isn't available."
  }
  if (status === 413) {
    return 'That request is too large.'
  }
  if (status === 429) {
    return 'Too many downloads just now. Please try again in a little while.'
  }
  if (status === 503) {
    return 'Downloads are temporarily unavailable. Please try again soon.'
  }
  return 'That did not go through. Nothing was saved. Please try again in a moment.'
}
