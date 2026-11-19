'use client'

import React from 'react'
import type { DayBucket } from '@/lib/adminAnalytics'
import { formatKampalaDisplayDate, percentChange } from '@/lib/adminAnalytics'
import {
  GLASS_CARD,
  GLASS_CHIP_NEUTRAL,
  GLASS_CHIP_OK,
  GLASS_CHIP_DANGER,
} from '../glass'

interface SummaryCardProps {
  range: number
  viewsBuckets: DayBucket[]
  totalMembersCurrent: number
  totalMembersPrev: number
}

export function SummaryCard({
  range,
  viewsBuckets,
  totalMembersCurrent,
  totalMembersPrev,
}: SummaryCardProps) {
  // Find best day
  let bestDayCount = 0
  let bestDayDate = ''
  for (const b of viewsBuckets) {
    if (b.count > bestDayCount) {
      bestDayCount = b.count
      bestDayDate = b.date
    }
  }

  const membersDelta = percentChange(totalMembersCurrent, totalMembersPrev)

  return (
    <div className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 md:p-6 flex flex-col min-w-0 ${GLASS_CARD}`}>
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-[#232536] m-0">Summary</h2>
        <p className="text-xs text-[#5C5F73] mt-0.5 mb-0">
          Last {range} days
        </p>
      </div>

      {/* Row 1: Best day */}
      <div className="flex justify-between items-center gap-3 py-3.5 border-t border-[#F0E4D2]">
        <div>
          <b className="block text-2xl font-semibold tracking-tight tabular-nums text-[#232536]">
            {bestDayCount.toLocaleString('en-US')}
          </b>
          <span className="block text-[13.5px] font-medium text-[#232536] mt-0.5">
            Best day
          </span>
          <small className="block text-xs text-[#5C5F73]">
            {bestDayDate
              ? `${formatKampalaDisplayDate(bestDayDate, false)}, the most-read day`
              : 'No views in this period'}
          </small>
        </div>
        <span className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-[#F3EBDD] text-[#5C5F73] ${GLASS_CHIP_NEUTRAL}`}>
          Peak
        </span>
      </div>

      {/* Row 2: Members */}
      <div className="flex justify-between items-center gap-3 py-3.5 border-t border-[#F0E4D2]">
        <div>
          <b className="block text-2xl font-semibold tracking-tight tabular-nums text-[#232536]">
            {totalMembersCurrent.toLocaleString('en-US')}
          </b>
          <span className="block text-[13.5px] font-medium text-[#232536] mt-0.5">
            Members
          </span>
          <small className="block text-xs text-[#5C5F73]">
            People signed up in total
          </small>
        </div>
        <div>
          {membersDelta === null ? (
            <span className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-[#F3EBDD] text-[#5C5F73] ${GLASS_CHIP_NEUTRAL}`}>
              0%
            </span>
          ) : membersDelta < 0 ? (
            <span className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-[#FDE6E1] text-[#CF3F29] ${GLASS_CHIP_DANGER}`}>
              {membersDelta}%
            </span>
          ) : (
            <span className={`inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-[#E4F4EE] text-[#1C6B52] ${GLASS_CHIP_OK}`}>
              +{membersDelta}%
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

