import React, { ReactNode } from 'react'

export const CAPTION_LINK_REGEX = /\[([^\]]+)\]\s*\(([^)\s]+)\)/g

export function isAllowedCaptionUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  if (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:')) {
    return true
  }
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true
  }
  return false
}

export function stripCaptionMarkdown(text: string): string {
  if (!text) return ''
  return text.replace(CAPTION_LINK_REGEX, '$1')
}

export function wrapSelectionAsLink(
  text: string,
  start: number,
  end: number,
  url: string
): string | null {
  if (typeof text !== 'string') return null
  if (start >= end) return null
  if (start < 0 || end > text.length) return null
  const cleanUrl = (url || '').trim()
  if (!cleanUrl) return null
  const selected = text.slice(start, end)
  if (!selected) return null

  const before = text.slice(0, start)
  const after = text.slice(end)
  return `${before}[${selected}](${cleanUrl})${after}`
}

export function hasHtmlTags(text: string): boolean {
  if (!text || typeof text !== 'string') return false
  return /<(?:\/?[a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/.test(text)
}

function decodeHtmlEntities(str: string): string {
  if (!str) return ''
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
}

export function sanitizeCaptionHtml(rawHtml: string): ReactNode {
  if (!rawHtml || typeof rawHtml !== 'string') return null
  const trimmed = rawHtml.trim()
  if (!trimmed) return null

  // 1. Strip script and style blocks completely (tags + body)
  const clean = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // 2. Tokenize by HTML tags: (<tag ...> or </tag>)
  const tagRegex = /(<\/?[a-zA-Z0-9]+(?:\s+[^>]*)?>)/g
  const tokens = clean.split(tagRegex)

  interface StackEntry {
    type: 'a' | 'em' | 'strong'
    props?: Record<string, unknown>
    children: ReactNode[]
  }

  const stack: StackEntry[] = []
  const rootNodes: ReactNode[] = []
  let keyCounter = 0

  function pushNode(node: ReactNode) {
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node)
    } else {
      rootNodes.push(node)
    }
  }

  for (const token of tokens) {
    if (!token) continue

    const tagMatch = token.match(/^<(\/)?([a-zA-Z0-9]+)([\s\S]*)>$/)
    if (!tagMatch) {
      // Plain text token: decode common HTML entities, React renders safely
      pushNode(decodeHtmlEntities(token))
      continue
    }

    const isClosing = Boolean(tagMatch[1])
    const tagName = tagMatch[2].toLowerCase()
    const attrString = tagMatch[3] || ''

    if (isClosing) {
      if (tagName === 'a' || tagName === 'em' || tagName === 'strong') {
        const idx = stack.map((s) => s.type).lastIndexOf(tagName)
        if (idx !== -1) {
          while (stack.length > idx) {
            const popped = stack.pop()!
            const element = React.createElement(
              popped.type,
              { key: `sanitized-${popped.type}-${keyCounter++}`, ...popped.props },
              ...popped.children
            )
            pushNode(element)
          }
        }
      }
      continue
    }

    // Opening tag
    if (tagName === 'a') {
      const hrefMatch = attrString.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
      const rawHref = decodeHtmlEntities((hrefMatch ? hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] : '').trim())

      if (rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
        stack.push({
          type: 'a',
          props: {
            href: rawHref,
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'underline underline-offset-2 text-inherit hover:text-gray-900 transition-colors',
          },
          children: [],
        })
      }
    } else if (tagName === 'em') {
      stack.push({
        type: 'em',
        children: [],
      })
    } else if (tagName === 'strong') {
      stack.push({
        type: 'strong',
        children: [],
      })
    }
  }

  while (stack.length > 0) {
    const popped = stack.pop()!
    const element = React.createElement(
      popped.type,
      { key: `sanitized-${popped.type}-${keyCounter++}`, ...popped.props },
      ...popped.children
    )
    pushNode(element)
  }

  if (rootNodes.length === 0) return null
  if (rootNodes.length === 1 && typeof rootNodes[0] === 'string') return rootNodes[0]
  return React.createElement(React.Fragment, null, ...rootNodes)
}

export function renderCaption(text: string | null | undefined): ReactNode {
  if (!text || typeof text !== 'string') return null
  const trimmed = text.trim()
  if (!trimmed) return null

  // If the stored string contains HTML tags, render as sanitized HTML
  if (hasHtmlTags(trimmed)) {
    return sanitizeCaptionHtml(trimmed)
  }

  // Fast path for text without brackets
  if (!trimmed.includes('[') || !trimmed.includes(']')) {
    return trimmed
  }

  const matches = Array.from(trimmed.matchAll(CAPTION_LINK_REGEX))
  if (matches.length === 0) {
    return trimmed
  }

  const nodes: ReactNode[] = []
  let lastIndex = 0

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const matchIndex = match.index ?? 0
    const [fullMatch, linkText, url] = match

    if (matchIndex > lastIndex) {
      nodes.push(trimmed.slice(lastIndex, matchIndex))
    }

    if (isAllowedCaptionUrl(url)) {
      const isInternal = url.startsWith('/')
      nodes.push(
        React.createElement(
          'a',
          {
            key: `caption-link-${i}`,
            href: url,
            className: 'underline underline-offset-2 text-inherit hover:text-gray-900 transition-colors',
            ...(!isInternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}),
          },
          linkText
        )
      )
    } else {
      nodes.push(fullMatch)
    }

    lastIndex = matchIndex + fullMatch.length
  }

  if (lastIndex < trimmed.length) {
    nodes.push(trimmed.slice(lastIndex))
  }

  return React.createElement(React.Fragment, null, ...nodes)
}
