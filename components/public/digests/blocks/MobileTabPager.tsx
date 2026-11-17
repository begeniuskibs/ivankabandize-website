'use client'

import React from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface MobileTabPagerProps {
  currentIndex: number
  total: number
  onSelect: (index: number) => void
  tabStripRef?: React.RefObject<HTMLDivElement | null>
}

export default function MobileTabPager({
  currentIndex,
  total,
  onSelect,
  tabStripRef,
}: MobileTabPagerProps) {
  const isFirst = currentIndex <= 0
  const isLast = currentIndex >= total - 1

  const handleSelect = (nextIdx: number) => {
    if (nextIdx < 0 || nextIdx >= total) return
    onSelect(nextIdx)

    const container = tabStripRef?.current
    const el = container?.children[nextIdx] as HTMLElement | undefined
    if (container && el) {
      const targetLeft = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2
      const prefersReduced =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      container.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: prefersReduced ? 'auto' : 'smooth',
      })
    }
  }

  return (
    <div className="md:hidden flex items-center justify-between gap-3 mt-2.5">
      <button
        type="button"
        onClick={() => handleSelect(currentIndex - 1)}
        disabled={isFirst}
        aria-label="Previous view"
        className="group inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#F0E4D2] bg-[#FDF8F1] text-[#232536] hover:border-[#CF3F29] hover:text-[#CF3F29] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <ArrowLeft
          size={14}
          strokeWidth={2.5}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
        />
        <span>Back</span>
      </button>

      <span className="text-xs font-semibold text-[#5A5D70] tabular-nums">
        {currentIndex + 1} of {total}
      </span>

      <button
        type="button"
        onClick={() => handleSelect(currentIndex + 1)}
        disabled={isLast}
        aria-label="Next view"
        className="group inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#F0E4D2] bg-[#FDF8F1] text-[#232536] hover:border-[#CF3F29] hover:text-[#CF3F29] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <span>Next</span>
        <ArrowRight
          size={14}
          strokeWidth={2.5}
          aria-hidden="true"
          className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
        />
      </button>
    </div>
  )
}
