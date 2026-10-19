import React from 'react'
import type { AdminIconProps } from './types'

export function DividerIcon({
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
      <path d="M4 12h16M4 6h4M16 6h4M4 18h4M16 18h4" fill="none" />
    </svg>
  )
}

export default DividerIcon
