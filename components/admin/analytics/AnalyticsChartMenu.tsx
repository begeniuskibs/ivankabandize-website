'use client'

import React, { useState, useEffect, useRef } from 'react'
import type { TimeChartStyle, ShareChartStyle } from '@/lib/adminAnalytics'

interface AnalyticsChartMenuProps {
  timeStyle: TimeChartStyle
  shareStyle: ShareChartStyle
  onTimeStyleChange: (s: TimeChartStyle) => void
  onShareStyleChange: (s: ShareChartStyle) => void
}

const TIME_LABELS: Record<TimeChartStyle, string> = {
  bar: 'Bars',
  line: 'Line',
  area: 'Area',
  step: 'Steps',
}

export function AnalyticsChartMenu({
  timeStyle,
  shareStyle,
  onTimeStyleChange,
  onShareStyleChange,
}: AnalyticsChartMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const buttonLabel = `Charts: ${TIME_LABELS[timeStyle]}${
    shareStyle === 'donut' ? ' + Donut' : ''
  }`

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        type="button"
        className="border border-[#F0E4D2] bg-white text-[#232536] px-3.5 py-2 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-2 hover:bg-[#FAF7F2] transition-colors focus-visible:outline-2 focus-visible:outline-[#232536] focus-visible:outline-offset-2"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
        <span>{buttonLabel}</span>
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+6px)] bg-white border border-[#F0E4D2] rounded-xl p-2 min-w-[210px] shadow-[0_10px_30px_rgba(35,37,54,0.12)] z-30"
          role="menu"
          aria-label="Chart styles"
        >
          <div className="text-[11px] tracking-[0.1em] uppercase text-[#5C5F73] font-semibold px-2.5 pt-2 pb-1">
            Over time
          </div>
          {(['bar', 'line', 'area', 'step'] as TimeChartStyle[]).map((val) => {
            const isSelected = timeStyle === val
            return (
              <button
                key={val}
                type="button"
                className={`block w-full text-left border-0 px-2.5 py-1.5 rounded-lg text-[13.5px] transition-colors ${
                  isSelected
                    ? 'bg-[#232536] text-white font-medium'
                    : 'text-[#232536] hover:bg-[#F6EFE3]'
                }`}
                role="menuitem"
                onClick={() => onTimeStyleChange(val)}
              >
                {TIME_LABELS[val]}
              </button>
            )
          })}

          <div className="text-[11px] tracking-[0.1em] uppercase text-[#5C5F73] font-semibold px-2.5 pt-3 pb-1">
            Shares and splits
          </div>
          {(['bars', 'donut'] as ShareChartStyle[]).map((val) => {
            const isSelected = shareStyle === val
            const label = val === 'bars' ? 'Bars' : 'Donut'
            return (
              <button
                key={val}
                type="button"
                className={`block w-full text-left border-0 px-2.5 py-1.5 rounded-lg text-[13.5px] transition-colors ${
                  isSelected
                    ? 'bg-[#232536] text-white font-medium'
                    : 'text-[#232536] hover:bg-[#F6EFE3]'
                }`}
                role="menuitem"
                onClick={() => onShareStyleChange(val)}
              >
                {label}
              </button>
            )
          })}

          <p className="mx-2.5 mt-2.5 mb-1 text-xs text-[#5C5F73] leading-relaxed border-t border-[#F0E4D2] pt-2">
            Applies to every chart on this page and is remembered.
          </p>
        </div>
      )}
    </div>
  )
}

