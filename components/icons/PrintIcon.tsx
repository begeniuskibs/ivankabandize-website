import React from 'react'
import type { IconProps } from './types'

export function PrintIcon({
  size = 24,
  className,
  strokeWidth = 1.9,
  ...props
}: IconProps) {
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
      <path d="M7 9V4h10v5M7 17H5a2 2 0 01-2-2v-4a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2h-2" />
      <rect x="7" y="14" width="10" height="6" rx="1" />
    </svg>
  )
}

export default PrintIcon
