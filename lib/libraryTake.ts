export const MAX_TAKE_SIZE_BYTES = 200 * 1024 // 200 KB = 204,800 bytes

export interface ValidateLibraryTakeResult {
  valid: boolean
  value?: Record<string, unknown> | null
  error?: string
  isEmpty?: boolean
}

export function isNonEmptyTipTapDoc(doc: unknown): boolean {
  if (!doc || typeof doc !== 'object') return false
  const d = doc as { type?: string; content?: unknown[] }
  if (!Array.isArray(d.content) || d.content.length === 0) return false

  const hasTextOrMedia = (nodes: unknown[]): boolean => {
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue
      const n = node as { type?: string; text?: string; content?: unknown[] }
      if (typeof n.text === 'string' && n.text.trim().length > 0) return true
      if (n.type && !['paragraph', 'doc', 'text'].includes(n.type)) return true
      if (Array.isArray(n.content) && hasTextOrMedia(n.content)) return true
    }
    return false
  }

  return hasTextOrMedia(d.content)
}

export function getTipTapWordCount(doc: unknown): number {
  if (!doc || typeof doc !== 'object') return 0
  let text = ''
  const extract = (node: unknown) => {
    if (!node || typeof node !== 'object') return
    const n = node as { text?: string; content?: unknown[] }
    if (typeof n.text === 'string') {
      text += ' ' + n.text
    }
    if (Array.isArray(n.content)) {
      n.content.forEach(extract)
    }
  }
  const d = doc as { content?: unknown[] }
  if (Array.isArray(d.content)) {
    d.content.forEach(extract)
  }
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length
}

export function isTakeDocEmpty(doc: unknown): boolean {
  return !isNonEmptyTipTapDoc(doc)
}

export function validateLibraryTake(value: unknown): ValidateLibraryTakeResult {
  // null or undefined clears the take
  if (value === null || value === undefined) {
    return {
      valid: true,
      value: null,
      isEmpty: true,
    }
  }

  // Must be an object (and not an array)
  if (typeof value !== 'object' || Array.isArray(value)) {
    return {
      valid: false,
      error: 'Take must be a document object or null.',
    }
  }

  const doc = value as { type?: unknown; content?: unknown }

  // Must have type: 'doc' and content: Array
  if (doc.type !== 'doc' || !Array.isArray(doc.content)) {
    return {
      valid: false,
      error: 'Take must be a valid document with type "doc" and a content array.',
    }
  }

  // Size limit of 200 KB when JSON-stringified
  let jsonString: string
  try {
    jsonString = JSON.stringify(value)
  } catch {
    return {
      valid: false,
      error: 'Take cannot be serialized to JSON.',
    }
  }

  const byteLength = Buffer.byteLength(jsonString, 'utf8')
  if (byteLength > MAX_TAKE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Take document exceeds the maximum size limit of 200 KB.',
    }
  }

  const empty = !isNonEmptyTipTapDoc(value)

  return {
    valid: true,
    value: value as Record<string, unknown>,
    isEmpty: empty,
  }
}
