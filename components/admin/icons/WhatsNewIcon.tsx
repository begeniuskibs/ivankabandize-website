import React from 'react'
import type { AdminIconProps } from './types'

export function WhatsNewIcon({
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
      <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#FDE9E4" />
    </svg>
  )
}

export default WhatsNewIcon
