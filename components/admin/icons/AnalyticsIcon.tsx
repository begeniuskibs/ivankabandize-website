import React from 'react'
import type { AdminIconProps } from './types'

export function AnalyticsIcon({
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
      <rect x="3.5" y="12" width="4" height="8.5" rx="1" fill="#FDE9E4" />
      <rect x="10" y="3.5" width="4" height="17" rx="1" fill="#FDE9E4" />
      <rect x="16.5" y="8" width="4" height="12.5" rx="1" fill="#FDE9E4" />
    </svg>
  )
}

export default AnalyticsIcon
