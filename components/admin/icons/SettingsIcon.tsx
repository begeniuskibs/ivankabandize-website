import React from 'react'
import type { AdminIconProps } from './types'

export function SettingsIcon({
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
      <path d="M4 7h9M19 7h1M4 17h1M11 17h9" fill="none" />
      <circle cx="16" cy="7" r="2.5" fill="#FDE9E4" />
      <circle cx="8" cy="17" r="2.5" fill="#FDE9E4" />
    </svg>
  )
}

export default SettingsIcon
