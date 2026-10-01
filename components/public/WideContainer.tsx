import React from 'react'

export interface WideContainerProps {
  children: React.ReactNode
  className?: string
}

/**
 * Shared breakout container wider than the article's standard reading column (~768px).
 * On desktop and tablet, it expands symmetrically to max-w-5xl (1024px) with responsive gutters.
 * On mobile (< 640px), it renders at normal reading column width (100% of parent).
 */
export default function WideContainer({ children, className = '' }: WideContainerProps) {
  return (
    <div
      className={`w-full sm:relative sm:left-1/2 sm:-translate-x-1/2 sm:w-[calc(100vw-3rem)] sm:max-w-5xl lg:w-[calc(100vw-4rem)] lg:max-w-5xl ${className}`}
    >
      {children}
    </div>
  )
}
