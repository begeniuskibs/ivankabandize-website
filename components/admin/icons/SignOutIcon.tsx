import React from 'react'
import type { AdminIconProps } from './types'

export function SignOutIcon({
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
      <path d="M10 4H5v16h5M14 8l4 4-4 4M18 12H9" fill="none" />
    </svg>
  )
}

export default SignOutIcon
