import React from 'react'
import type { HorizontalBarsBlock } from '@/lib/digests/types'

export default function HorizontalBarsRenderer({ block }: { block: HorizontalBarsBlock }) {
  const colCount = block.cols.length
  const gridClasses = colCount === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'

  return (
    <div className="mt-4">
      <div className={gridClasses}>
        {block.cols.map(([title, rows, color], colIdx) => (
          <div
            key={colIdx}
            className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-6 shadow-2xs flex flex-col justify-between"
          >
            <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536] mb-4">
              {title}
            </h3>
            <div className="space-y-3 flex-1">
              {rows.map(([label, val], rowIdx) => {
                const percent = Math.min(Math.max((val / block.max) * 100, 0), 100)
                const barColor =
                  color === 'var(--blue)'
                    ? '#4660C8'
                    : color === 'var(--coral)'
                      ? '#EF5B45'
                      : color === 'var(--good)'
                        ? '#1F8A5B'
                        : color === 'var(--bad)'
                          ? '#D5402B'
                          : color

                return (
                  <div key={rowIdx} className="grid grid-cols-[120px_1fr_48px] sm:grid-cols-[160px_1fr_56px] items-center gap-3 text-xs sm:text-sm">
                    <span className="text-[#232536] font-medium truncate" title={label}>
                      {label}
                    </span>
                    <div className="h-2.5 w-full bg-[#F5ECDE]/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%`, backgroundColor: barColor }}
                      />
                    </div>
                    <span className="font-bold text-[#232536] text-right font-['MTN_Brighter_Sans',_sans-serif]">
                      {val.toFixed(block.dec)}
                      {block.suf || ''}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      {block.note && (
        <p className="text-xs text-[#5A5D70] mt-3 leading-relaxed">{block.note}</p>
      )}
    </div>
  )
}
