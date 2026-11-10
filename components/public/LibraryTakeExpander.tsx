'use client'

import React, { useState } from 'react'

interface LibraryTakeExpanderProps {
  children: React.ReactNode
  wordCount: number
}

export default function LibraryTakeExpander({
  children,
  wordCount,
}: LibraryTakeExpanderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = wordCount > 300

  if (!isLong) {
    return <div>{children}</div>
  }

  return (
    <div className="relative">
      <div
        className={`relative transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-none' : 'max-h-[360px]'
        }`}
      >
        {children}
        {!isExpanded && (
          <div
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#FDF8F1] via-[#FDF8F1]/85 to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}
      </div>

      <div className="mt-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="text-[#CF3F29] hover:text-[#b83420] font-bold text-sm underline underline-offset-4 cursor-pointer transition-colors"
        >
          {isExpanded ? 'Show less' : 'Read the full take'}
        </button>
      </div>
    </div>
  )
}
