import React from 'react'
import type { AdminIconProps } from './types'

export function ButtonBlockIcon({
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
      <rect x="3" y="8" width="18" height="8" rx="4" fill="#FDE9E4" />
      <path d="M8 12h8" fill="none" />
    </svg>
  )
}

export default ButtonBlockIcon
