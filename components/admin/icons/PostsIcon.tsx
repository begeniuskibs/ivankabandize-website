import React from 'react'
import type { AdminIconProps } from './types'

export function PostsIcon({
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
      <rect x="4" y="4" width="13" height="16" rx="2" fill="#FDE9E4" />
      <path d="M7.5 9h6M7.5 13h4" fill="none" />
      <path d="M14.5 18l6-6 1.8 1.8-6 6-2.6.8z" fill="#FDE9E4" />
    </svg>
  )
}

export default PostsIcon
