'use client'

import { useState, useRef } from 'react'
import type { DemoTab } from '@/lib/resourcePageDetails'
import {
  getNextTabIndex,
  getPrevTabIndex,
  getFirstTabIndex,
  getLastTabIndex,
  getSwipedTabIndex,
} from '@/lib/resourceDemo'

// Client component for data-driven interactive demo tabs
// House style: spaced hyphen " - " only

interface ResourceDemoProps {
  demo?: DemoTab[]
}

export default function ResourceDemo({ demo }: ResourceDemoProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  if (!demo || demo.length === 0) {
    return null
  }

  const activeTab = demo[activeIndex] || demo[0]

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      nextIndex = getNextTabIndex(index, demo.length)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      nextIndex = getPrevTabIndex(index, demo.length)
    } else if (e.key === 'Home') {
      e.preventDefault()
      nextIndex = getFirstTabIndex()
    } else if (e.key === 'End') {
      e.preventDefault()
      nextIndex = getLastTabIndex(demo.length)
    }

    if (nextIndex !== null) {
      setActiveIndex(nextIndex)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const endX = e.changedTouches[0].clientX
    const startX = touchStartX.current
    touchStartX.current = null
    const nextIndex = getSwipedTabIndex(activeIndex, demo.length, startX, endX)
    if (nextIndex !== activeIndex) {
      setActiveIndex(nextIndex)
    }
  }

  return (
    <div>
      {/* Heading, Example chip, and hint line */}
      <div className="mb-4">
        <div className="flex items-center gap-2.5 mb-1.5">
          <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
            A quick look inside
          </h2>
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EF5B45]/10 text-[#CF3F29]">
            Example
          </span>
        </div>
        <p className="text-sm text-[#5C5F73]">
          Tap a tab to look around.
          <span className="md:hidden"> Swipe to move between them.</span>
        </p>
      </div>

      {/* Card with tablist and tabpanel */}
      <div className="bg-white border border-[#F0E4D2] rounded-2xl shadow-xs overflow-hidden">
        {/* Tab strip */}
        <div
          role="tablist"
          aria-label="Template preview tabs"
          className="flex gap-1.5 p-2 border-b border-[#F0E4D2] overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          {demo.map((tab, idx) => {
            const isSelected = idx === activeIndex
            return (
              <button
                key={idx}
                ref={(el) => {
                  tabRefs.current[idx] = el
                }}
                type="button"
                role="tab"
                id={`demo-tab-${idx}`}
                aria-selected={isSelected}
                aria-controls={`demo-panel-${idx}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveIndex(idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={`px-3.5 py-2 min-h-[40px] rounded-xl text-sm whitespace-nowrap transition-colors motion-reduce:transition-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CF3F29] ${
                  isSelected
                    ? 'bg-[#FDF8F1] text-[#232536] font-bold border border-[#F0E4D2] shadow-2xs'
                    : 'text-[#5C5F73] hover:text-[#232536] hover:bg-[#FAF3E8]/50 font-semibold border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Panel */}
        <div
          role="tabpanel"
          id={`demo-panel-${activeIndex}`}
          aria-labelledby={`demo-tab-${activeIndex}`}
          tabIndex={0}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="p-4 sm:p-6 min-h-[220px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CF3F29] focus-visible:ring-inset"
        >
          {/* Columns variant */}
          {activeTab.type === 'columns' && activeTab.columns && (
            <div className="grid grid-cols-2 md:grid-flow-col md:auto-cols-fr gap-3">
              {activeTab.columns.map((col, colIdx) => (
                <div
                  key={colIdx}
                  className="bg-[#FAF3E8]/60 border border-[#F0E4D2] rounded-xl p-3 flex flex-col min-h-[140px]"
                >
                  {col.title && (
                    <b className="block font-['MTN_Brighter_Sans',_sans-serif] text-xs sm:text-sm font-bold text-[#232536] mb-2">
                      {col.title}
                    </b>
                  )}
                  <div className="space-y-1.5 flex-1">
                    {col.items.map((it, itemIdx) => (
                      <span
                        key={itemIdx}
                        className={`block p-2 rounded-lg text-xs leading-snug border ${
                          it.key
                            ? 'bg-[#EF5B45]/10 text-[#CF3F29] border-[#EF5B45]/20 font-semibold'
                            : 'bg-[#FDF8F1] text-[#232536] border-[#F0E4D2] font-medium'
                        }`}
                      >
                        {it.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List variant */}
          {activeTab.type === 'list' && activeTab.items && (
            <div className="divide-y divide-[#F0E4D2]">
              {activeTab.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="py-3 flex items-center gap-3 first:pt-0 last:pb-0"
                >
                  {activeTab.marker === 'checkbox' ? (
                    <span
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                        item.done
                          ? 'bg-[#1F8A5B] border-[#1F8A5B] text-white'
                          : 'border-[#F0E4D2] bg-white'
                      }`}
                      aria-hidden="true"
                    >
                      {item.done && (
                        <svg
                          className="w-3.5 h-3.5 stroke-current fill-none"
                          viewBox="0 0 24 24"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  ) : (
                    <span
                      className="w-6 h-6 rounded-full bg-[#EF5B45]/10 text-[#CF3F29] font-['MTN_Brighter_Sans',_sans-serif] font-bold text-xs flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      {itemIdx + 1}
                    </span>
                  )}
                  <span
                    className={`flex-1 text-sm sm:text-base leading-relaxed ${
                      item.done
                        ? 'line-through text-[#5C5F73]'
                        : 'text-[#232536]'
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.chip && (
                    <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7EDE0] text-[#5C5F73] shrink-0">
                      {item.chip}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Tab caption */}
          {activeTab.caption && (
            <p className="mt-4 pt-3 border-t border-[#F0E4D2] text-xs sm:text-sm text-[#5C5F73] leading-relaxed">
              {activeTab.caption}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
