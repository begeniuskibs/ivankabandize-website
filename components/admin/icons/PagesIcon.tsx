import React from 'react'
import type { AdminIconProps } from './types'

export function PagesIcon({
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
      <path d="M6 3h8l4 4v14H6z" fill="#FDE9E4" />
      <path d="M14 3v4h4M9 13h6M9 17h4" fill="none" />
    </svg>
  )
}

export default PagesIcon
