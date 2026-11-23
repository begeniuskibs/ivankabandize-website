import React from 'react'
import type { CardsBlock } from '@/lib/digests/types'

export default function CardsRenderer({ block }: { block: CardsBlock }) {
  const count = block.items.length
  const gridClasses =
    count === 1
      ? 'grid grid-cols-1 gap-4'
      : count === 2
        ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
        : count === 4
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
          : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'

  return (
    <div className={gridClasses}>
      {block.items.map(([title, desc], idx) => (
        <div
          key={idx}
          className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-6 shadow-2xs flex flex-col"
        >
          <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536] leading-snug">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-[#5A5D70] mt-2.5 leading-relaxed">{desc}</p>
        </div>
      ))}
    </div>
  )
}
