'use client'

import React from 'react'

export interface ButtonCardProps {
  label?: string
  url?: string
  alignment?: 'left' | 'center'
  isEditor?: boolean
  className?: string
}

export function isInternalButtonUrl(url?: string): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true
  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.toLowerCase()
    return host === 'ivankabandize.com' || host === 'www.ivankabandize.com'
  } catch {
    return false
  }
}

export function isValidButtonUrl(url?: string): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (trimmed.startsWith('/')) {
    if (trimmed.startsWith('//')) return false
    return true
  }
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function sanitizeButtonUrl(url?: string): string {
  if (!url) return '#'
  const trimmed = url.trim()
  if (isValidButtonUrl(trimmed)) {
    return trimmed
  }
  return '#'
}

export default function ButtonCard({
  label = 'Click here',
  url = '',
  alignment = 'left',
  isEditor = false,
  className = '',
}: ButtonCardProps) {
  const isInternal = isInternalButtonUrl(url)
  const safeUrl = sanitizeButtonUrl(url)
  const displayLabel = label || 'Button'
  const isCenter = alignment === 'center'

  return (
    <div
      className={`kg-card kg-button-card my-6 w-full flex ${
        isCenter ? 'kg-align-center justify-center text-center' : 'kg-align-left justify-start text-left'
      } ${className}`}
    >
      <a
        href={safeUrl}
        target={isInternal ? undefined : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
        onClick={isEditor ? (e) => e.preventDefault() : undefined}
        className="kg-btn kg-btn-accent inline-flex items-center justify-center font-['MTN_Brighter_Sans',_sans-serif] font-bold text-[15px] px-7 py-3 rounded-full bg-[#EF5B45] text-white hover:bg-[#D94834] active:bg-[#B93A2A] shadow-sm hover:shadow-md transition-all duration-200 no-underline cursor-pointer select-none"
      >
        {displayLabel}
      </a>
    </div>
  )
}
