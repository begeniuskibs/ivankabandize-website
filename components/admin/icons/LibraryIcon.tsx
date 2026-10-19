import React from 'react'
import type { AdminIconProps } from './types'

export function LibraryIcon({
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
      <rect x="4" y="3" width="4" height="18" rx="1" fill="#FDE9E4" />
      <rect x="10" y="3" width="4" height="18" rx="1" fill="#FDE9E4" />
      <path d="M16 5.5l4 1-3.5 14.5-4-1z" fill="#FDE9E4" />
    </svg>
  )
}

export default LibraryIcon
