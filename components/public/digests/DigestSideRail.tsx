'use client'

import React from 'react'
import type { DigestChapter } from '@/lib/digests/types'

interface DigestSideRailProps {
  chapters: DigestChapter[]
  currentSection: number
  onSelectSection: (index: number) => void
}

export default function DigestSideRail({
  chapters,
  currentSection,
  onSelectSection,
}: DigestSideRailProps) {
  return (
    <aside className="hidden lg:block w-52 shrink-0 sticky top-36 self-start py-4 pb-24 select-none">
      <div className="font-['MTN_Brighter_Sans',_sans-serif] text-[11px] font-bold tracking-wider text-[#5C5F73] uppercase mb-3 px-3">
        In This Digest
      </div>
      <nav className="flex flex-col" aria-label="In This Digest">
        {chapters.map((ch, i) => {
          const isActive = i === currentSection
          return (
            <button
              key={i}
              type="button"
              title={ch.t}
              onClick={() => onSelectSection(i)}
              className={`flex items-center w-full min-w-0 text-left text-xs py-2 px-3 transition-all duration-200 border-l-2 leading-relaxed cursor-pointer ${
                isActive
                  ? 'border-[#CF3F29] text-[#232536] font-bold pl-4 bg-[#F7EDE0]/40'
                  : 'border-[#F0E4D2] text-[#5C5F73] hover:text-[#232536] hover:border-[#CF3F29]/40'
              }`}
            >
              <span className="tabular-nums text-[11px] text-[#CF3F29] mr-1.5 font-normal shrink-0">
                {i + 1}.
              </span>
              <span className="truncate">{ch.t}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
