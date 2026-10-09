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

export function renderCaption(text: string | null | undefined): ReactNode {
  if (!text) return null

  // Fast path for text without brackets
  if (!text.includes('[') || !text.includes(']')) {
    return text
  }

  const matches = Array.from(text.matchAll(CAPTION_LINK_REGEX))
  if (matches.length === 0) {
    return text
  }

  const nodes: ReactNode[] = []
  let lastIndex = 0

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const matchIndex = match.index ?? 0
    const [fullMatch, linkText, url] = match

    if (matchIndex > lastIndex) {
      nodes.push(text.slice(lastIndex, matchIndex))
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

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return React.createElement(React.Fragment, null, ...nodes)
}
