import React from 'react'
import type { IconProps } from './types'

export function MailIcon({
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
      <rect x="3" y="5.5" width="18" height="13" rx="3" />
      <path d="M4 8l8 6 8-6" />
    </svg>
  )
}

export default MailIcon
