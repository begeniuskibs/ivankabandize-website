import React from 'react'
import type { AdminIconProps } from './types'

export function ImageIcon({
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
      <rect x="3" y="4" width="18" height="16" rx="2" fill="#FDE9E4" />
      <circle cx="9" cy="10" r="1.8" fill="none" />
      <path d="M3 17l5-5 4 4 3-3 6 6" fill="none" />
    </svg>
  )
}

export default ImageIcon
