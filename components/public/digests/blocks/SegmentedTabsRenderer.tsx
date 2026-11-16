'use client'

import React, { useState } from 'react'
import type { SegmentedTabsBlock } from '@/lib/digests/types'

export default function SegmentedTabsRenderer({ block }: { block: SegmentedTabsBlock }) {
  const [activeIdx, setActiveIdx] = useState<number>(0)

  return (
    <div className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-6 shadow-2xs mt-4">
      {/* Tab controls */}
      <div className="flex gap-1.5 p-1 bg-[#FDF8F1] border border-[#F5ECDE] rounded-xl overflow-x-auto">
        {block.tabs.map(([label], i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActiveIdx(i)}
            className={`flex-1 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeIdx === i
                ? 'bg-[#232536] text-white shadow-xs'
                : 'text-[#5A5D70] hover:text-[#232536] hover:bg-[#F5ECDE]/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab body */}
      <div
        className="mt-4 text-xs sm:text-sm text-[#232536] leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: block.tabs[activeIdx]?.[1] || '',
        }}
      />
    </div>
  )
}
