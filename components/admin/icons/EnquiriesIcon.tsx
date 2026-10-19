import React from 'react'
import type { AdminIconProps } from './types'

export function EnquiriesIcon({
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
      <path d="M3 13l3-8h12l3 8v6H3z" fill="#FDE9E4" />
      <path d="M3 13h5l1 3h6l1-3h5" fill="none" />
    </svg>
  )
}

export default EnquiriesIcon
