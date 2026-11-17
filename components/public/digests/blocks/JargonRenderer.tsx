'use client'

import React, { useState } from 'react'
import type { JargonBlock } from '@/lib/digests/types'

export default function JargonRenderer({ block }: { block: JargonBlock }) {
  const [flippedMap, setFlippedMap] = useState<Record<number, boolean>>({})

  const toggleCard = (idx: number) => {
    setFlippedMap((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  return (
    <div
      data-jargon-grid="true"
      className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 my-4 items-stretch"
    >
      {block.terms.map((item, idx) => {
        const isFlipped = !!flippedMap[idx]
        return (
          <button
            key={idx}
            type="button"
            data-jargon-card="true"
            aria-pressed={isFlipped}
            onClick={() => toggleCard(idx)}
            className="group relative w-full h-full text-left rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CF3F29] cursor-pointer [perspective:1000px]"
          >
            <span
              className={`grid [grid-template-areas:'card'] w-full h-full min-h-[152px] sm:min-h-[164px] transition-transform duration-500 ease-out motion-reduce:transition-none [transform-style:preserve-3d] ${
                isFlipped
                  ? '[transform:rotateY(180deg)] motion-reduce:[transform:none]'
                  : '[transform:rotateY(0deg)]'
              }`}
            >
              {/* Front face */}
              <span
                data-jargon-front="true"
                aria-hidden={isFlipped}
                className={`[grid-area:card] [backface-visibility:hidden] [transform:rotateY(0deg)] bg-white border border-[#F0E4D2] group-hover:border-[#CF3F29]/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between w-full h-full transition-colors ${
                  isFlipped ? 'motion-reduce:invisible motion-reduce:opacity-0' : ''
                }`}
              >
                <span className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536] leading-snug block">
                  {item.t}
                </span>
                <span className="text-xs text-[#5C5F73] mt-3 block">
                  Tap to translate
                </span>
              </span>

              {/* Back face */}
              <span
                data-jargon-back="true"
                aria-hidden={!isFlipped}
                className={`[grid-area:card] [backface-visibility:hidden] [transform:rotateY(180deg)] motion-reduce:[transform:none] bg-[#232536] border border-[#232536] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-center w-full h-full ${
                  !isFlipped ? 'motion-reduce:invisible motion-reduce:opacity-0' : ''
                }`}
              >
                <span className="font-['MTN_Brighter_Sans',_sans-serif] text-sm sm:text-base font-bold text-[#9FE3C5] mb-1.5 block">
                  {item.t}
                </span>
                <span className="text-xs sm:text-sm leading-relaxed text-white block">
                  {item.p}
                </span>
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
