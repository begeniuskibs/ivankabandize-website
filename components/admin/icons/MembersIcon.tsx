import React from 'react'
import type { AdminIconProps } from './types'

export function MembersIcon({
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
      <circle cx="9" cy="8" r="3.5" fill="#FDE9E4" />
      <path d="M2.5 20c0-4 3-6 6.5-6s6.5 2 6.5 6" fill="none" />
      <circle cx="17" cy="9" r="2.5" fill="#FDE9E4" />
      <path d="M16.5 14c3 0 5 1.8 5 5" fill="none" />
    </svg>
  )
}

export default MembersIcon
