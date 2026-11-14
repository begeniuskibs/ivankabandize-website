'use client'

import React, { useState } from 'react'
import type { DayBucket, TimeChartStyle } from '@/lib/adminAnalytics'
import { percentChange } from '@/lib/adminAnalytics'
import { AnalyticsTimeSeriesChart } from './AnalyticsTimeSeriesChart'

interface MetricTabsCardProps {
  range: number
  viewsCurrentBuckets: DayBucket[]
  totalViewsCurrent: number
  totalViewsPrev: number
  membersCurrentBuckets: DayBucket[]
  totalMembersCurrent: number
  totalMembersPrev: number
  timeStyle: TimeChartStyle
  onNavigateTab: (tab: 'articles' | 'audience') => void
}

export function MetricTabsCard({
  range,
  viewsCurrentBuckets,
  totalViewsCurrent,
  totalViewsPrev,
  membersCurrentBuckets,
  totalMembersCurrent,
  totalMembersPrev,
  timeStyle,
  onNavigateTab,
}: MetricTabsCardProps) {
  const [activeMetric, setActiveMetric] = useState<'views' | 'members'>('views')

  // Calculate percentage change
  const viewsDelta = percentChange(totalViewsCurrent, totalViewsPrev)
  const membersDelta = percentChange(totalMembersCurrent, totalMembersPrev)

  const isViews = activeMetric === 'views'
  const currentDelta = isViews ? viewsDelta : membersDelta

  return (
    <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 md:p-6 flex flex-col">
      {/* Metric Tabs */}
      <div
        className="flex gap-7 border-b border-[#F0E4D2] -mt-1 mb-3.5"
        role="tablist"
        aria-label="Metric"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isViews}
          className={`border-0 bg-transparent text-left pb-3.5 flex flex-col gap-0.5 border-b-2 -mb-[1px] transition-colors focus-visible:outline-2 focus-visible:outline-[#232536] focus-visible:outline-offset-2 ${
            isViews
              ? 'border-b-[#232536] text-[#232536]'
              : 'border-b-transparent text-[#5C5F73] hover:text-[#232536]'
          }`}
          onClick={() => setActiveMetric('views')}
        >
          <span className="text-xs tracking-[0.1em] uppercase font-semibold">
            Article views
          </span>
          <span
            className={`text-3xl md:text-4xl font-semibold tracking-tight tabular-nums leading-tight ${
              isViews ? 'text-[#232536]' : 'text-[#5C5F73]'
            }`}
          >
            {totalViewsCurrent.toLocaleString('en-US')}
          </span>
          <span className="text-xs text-[#5C5F73]">
            reads in the last {range} days
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={!isViews}
          className={`border-0 bg-transparent text-left pb-3.5 flex flex-col gap-0.5 border-b-2 -mb-[1px] transition-colors focus-visible:outline-2 focus-visible:outline-[#232536] focus-visible:outline-offset-2 ${
            !isViews
              ? 'border-b-[#232536] text-[#232536]'
              : 'border-b-transparent text-[#5C5F73] hover:text-[#232536]'
          }`}
          onClick={() => setActiveMetric('members')}
        >
          <span className="text-xs tracking-[0.1em] uppercase font-semibold">
            Members
          </span>
          <span
            className={`text-3xl md:text-4xl font-semibold tracking-tight tabular-nums leading-tight ${
              !isViews ? 'text-[#232536]' : 'text-[#5C5F73]'
            }`}
          >
            {totalMembersCurrent.toLocaleString('en-US')}
          </span>
          <span className="text-xs text-[#5C5F73]">
            people signed up in total
          </span>
        </button>
      </div>

      {/* Delta chip and Source pill */}
      <div className="flex justify-between items-center mb-2">
        <div>
          {currentDelta === null ? (
            <span className="inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-[#F3EBDD] text-[#5C5F73]">
              No previous period data
            </span>
          ) : currentDelta < 0 ? (
            <span className="inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-[#FDE6E1] text-[#CF3F29]">
              {currentDelta}% vs the previous {range} days
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-semibold rounded-full px-2.5 py-0.5 bg-[#E4F4EE] text-[#1C6B52]">
              +{currentDelta}% vs the previous {range} days
            </span>
          )}
        </div>

        <span className="text-xs text-[#5C5F73] inline-flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E7A]" />
          {isViews ? 'Own counter' : 'Database'}
        </span>
      </div>

      {/* Chart */}
      <div className="mt-2">
        {isViews ? (
          <AnalyticsTimeSeriesChart
            data={viewsCurrentBuckets}
            unit="views"
            color="#CF3F29"
            chartStyle={timeStyle}
            width={960}
            height={320}
            floorBase={false}
            emptyMessage="No views counted in this period yet. Counting began on 12 Nov 2026."
            ariaLabel={`Article views for the last ${range} days`}
          />
        ) : (
          <AnalyticsTimeSeriesChart
            data={membersCurrentBuckets}
            unit="members"
            color="#232536"
            chartStyle={timeStyle}
            width={960}
            height={320}
            floorBase={true}
            emptyMessage="No member growth in this period yet."
            ariaLabel={`Member growth for the last ${range} days`}
          />
        )}
      </div>

      {/* Full Report Link */}
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => onNavigateTab(isViews ? 'articles' : 'audience')}
          className="text-[13px] font-medium text-[#CF3F29] hover:text-[#b83420] transition-colors cursor-pointer"
        >
          View full report &rarr;
        </button>
      </div>
    </div>
  )
}

