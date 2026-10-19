import React from 'react'
import type { AdminIconProps } from './types'

export function TagsIcon({
  size = 24,
  className,
  strokeWidth = 1.8,
  ...props
}: AdminIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <path d="M3 12V4h8l10 10-8 8z" fill="#FDE9E4" />
      <circle cx="7.5" cy="8.5" r="1.3" fill="none" />
    </svg>
  )
}

export default TagsIcon
