import React from 'react'
import type { IconProps } from './types'

export function ChevronIcon({
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
      <path d="M9 6l6 6-6 6" />
    </svg>
  )
}

export default ChevronIcon
