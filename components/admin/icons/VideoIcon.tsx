import React from 'react'
import type { AdminIconProps } from './types'

export function VideoIcon({
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
      <rect x="3" y="6" width="13" height="12" rx="2" fill="#FDE9E4" />
      <path d="M16 10l5-3v10l-5-3z" fill="#FDE9E4" />
    </svg>
  )
}

export default VideoIcon
