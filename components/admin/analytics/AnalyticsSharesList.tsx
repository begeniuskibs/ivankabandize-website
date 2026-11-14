'use client'

import React from 'react'
import type { ShareChartStyle } from '@/lib/adminAnalytics'
import { BRAND_PALETTE, calculateDonutSegments } from '@/lib/adminAnalytics'

interface AnalyticsSharesListProps {
  rows: [string, number][] | { label: string; value: number }[]
  shareStyle: ShareChartStyle
  suffix?: string
  barColor?: string
}

export function AnalyticsSharesList({
  rows,
  shareStyle,
  suffix = '',
  barColor = '#CF3F29',
}: AnalyticsSharesListProps) {
  const normalized = rows.map((r) =>
    Array.isArray(r) ? { label: r[0], value: r[1] } : r
  )
  const maxVal = Math.max(...normalized.map((r) => r.value), 1)

  if (shareStyle === 'donut') {
    const segments = calculateDonutSegments(normalized, BRAND_PALETTE)
    return (
      <div className="flex items-center gap-5 flex-wrap pt-2">
        <svg
          viewBox="0 0 42 42"
          className="w-[132px] h-[132px] flex-none select-none"
          role="img"
          aria-label="Donut chart distribution"
        >
          {/* Base track */}
          <circle
            cx="21"
            cy="21"
            r="15.9155"
            fill="none"
            stroke="#F3EBDD"
            strokeWidth="6"
          />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="21"
              cy="21"
              r="15.9155"
              fill="none"
              stroke={seg.color}
              strokeWidth="6"
              strokeDasharray={seg.strokeDasharray}
              strokeDashoffset={seg.strokeDashoffset}
            />
          ))}
        </svg>

        <div className="flex flex-col gap-2 flex-1 min-w-[130px] text-[13.5px]">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <i
                className="w-2.5 h-2.5 rounded-[3px] flex-none"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-[#5C5F73] flex-1 truncate">
                {seg.label}
              </span>
              <b className="font-semibold text-[#232536] tabular-nums">
                {seg.value.toLocaleString('en-US')}
                {suffix}
              </b>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Default 'bars' mode
  return (
    <div className="flex flex-col">
      {normalized.map((row, i) => {
        const widthPct = Math.min(100, (row.value / maxVal) * 100)
        return (
          <div
            key={i}
            className={`grid grid-cols-[1fr_auto] gap-x-2 gap-y-1.5 items-center py-2.5 text-[13.5px] ${
              i > 0 ? 'border-t border-[#F0E4D2]' : ''
            }`}
          >
            <span className="text-[#232536] truncate">{row.label}</span>
            <b className="font-semibold text-[#232536] tabular-nums text-right">
              {row.value.toLocaleString('en-US')}
              {suffix}
            </b>
            <div className="col-span-2 h-[5px] bg-[#F3EBDD] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

