import React from 'react'
import type { AdminIconProps } from './types'

export function BookmarkIcon({
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
      <path d="M6 3h12v18l-6-4-6 4z" fill="#FDE9E4" />
    </svg>
  )
}

export default BookmarkIcon
