import React from 'react'
import type { AdminIconProps } from './types'

export function AppearanceIcon({
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
      <path d="M20 14A8 8 0 1110 4a6.5 6.5 0 0010 10z" fill="#FDE9E4" />
    </svg>
  )
}

export default AppearanceIcon
