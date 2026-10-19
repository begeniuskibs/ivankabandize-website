import React from 'react'
import type { AdminIconProps } from './types'

export function CommentsIcon({
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
      <path d="M4 5h16v11H10l-5 4v-4H4z" fill="#FDE9E4" />
    </svg>
  )
}

export default CommentsIcon
