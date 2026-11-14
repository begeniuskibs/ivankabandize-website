'use client'

import React, { useState, useMemo } from 'react'
import type {
  CompactAnalyticsData,
  AnalyticsRange,
  AnalyticsTab,
} from '@/lib/adminAnalytics'
import { deriveAnalyticsForRange } from '@/lib/adminAnalytics'
import { OverviewTab } from './OverviewTab'
import { ArticlesTab } from './ArticlesTab'
import { SourcesTab } from './SourcesTab'
import { AudienceTab } from './AudienceTab'

interface AnalyticsClientProps {
  initialCompact: CompactAnalyticsData
}

export function AnalyticsClient({ initialCompact }: AnalyticsClientProps) {
  const [selectedRange, setSelectedRange] = useState<AnalyticsRange>(
    initialCompact.range
  )
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(initialCompact.tab)
  const [v1Only, setV1Only] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  // Derive current and previous period metrics client-side with no network round trip
  const derivedData = useMemo(
    () => deriveAnalyticsForRange(initialCompact, selectedRange, activeTab),
    [initialCompact, selectedRange, activeTab]
  )

  const handleRangeChange = (range: AnalyticsRange) => {
    setSelectedRange(range)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('range', String(range))
      window.history.replaceState({}, '', url.toString())
    }
  }

  const handleTabChange = (tab: AnalyticsTab) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      window.history.replaceState({}, '', url.toString())
    }
  }

  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-8 py-7">
      {/* Top Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-2">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold tracking-[-0.02em] leading-tight text-[#232536] m-0">
            Analytics
          </h1>
          <p className="text-[#5C5F73] text-sm mt-1.5 max-w-xl">
            How your writing is being read, and where readers come from.
          </p>

          {/* Plain muted caption text line with explanation toggle */}
          <div className="mt-2 text-xs sm:text-sm text-[#5C5F73]">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Counting since 12 Nov 2026 with our own cookie-free counter.</span>
              <button
                type="button"
                onClick={() => setShowExplanation(!showExplanation)}
                className="text-xs text-[#5C5F73] underline hover:text-[#232536] cursor-pointer bg-transparent border-0 p-0"
              >
                How is this counted?
              </button>
            </div>
            {showExplanation && (
              <p className="text-xs text-[#5C5F73] mt-2 mb-0 max-w-2xl leading-relaxed">
                It counts article reads without cookies, so it includes everyone. Google
                Analytics only counts visitors who clicked Accept on the cookie bar, so its
                numbers are lower. Each panel is labelled with its source.
              </p>
            )}
            {initialCompact.capHit && (
              <p className="text-xs font-semibold text-[#CF3F29] mt-1 mb-0">
                Note: View count query capped at 200,000 records.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Range segmented buttons */}
          <div
            className="inline-flex bg-white border border-[#F0E4D2] rounded-xl p-1 shadow-xs"
            role="group"
            aria-label="Date range"
          >
            {([7, 30, 90] as AnalyticsRange[]).map((r) => {
              const isOn = selectedRange === r
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRangeChange(r)}
                  className={`border-0 py-1.5 px-3.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    isOn
                      ? 'bg-[#232536] text-white shadow-xs'
                      : 'bg-transparent text-[#5C5F73] hover:text-[#232536]'
                  }`}
                >
                  {r} days
                </button>
              )
            })}
          </div>

          {/* Export CSV button */}
          <button
            type="button"
            disabled
            title="Planned for later"
            className="border border-[#F0E4D2] bg-white text-[#232536] py-2 px-3.5 rounded-xl text-xs font-medium opacity-50 cursor-not-allowed"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* v1 Only Switch */}
      <label className="flex items-center gap-2.5 mt-3 text-xs sm:text-[13px] text-[#5C5F73] select-none cursor-pointer">
        <span className="relative inline-block w-[38px] h-[22px] flex-none">
          <input
            type="checkbox"
            checked={v1Only}
            onChange={(e) => setV1Only(e.target.checked)}
            className="opacity-0 absolute inset-0 m-0 w-full h-full cursor-pointer z-10"
          />
          <i
            className={`absolute inset-0 rounded-full transition-colors ${
              v1Only ? 'bg-[#232536]' : 'bg-[#D9CDBB]'
            }`}
          >
            <span
              className={`absolute top-[3px] left-[3px] w-4 h-4 rounded-full bg-white transition-transform ${
                v1Only ? 'translate-x-4' : ''
              }`}
            />
          </i>
        </span>
        <span>
          Show only what is in the first build (v1). Greyed panels come later.
        </span>
      </label>

      {/* Tabs Bar without overflow slider */}
      <div
        className="flex gap-1 border-b border-[#F0E4D2] mt-5 mb-5"
        role="tablist"
      >
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'articles', label: 'Articles' },
            { id: 'sources', label: 'Sources' },
            { id: 'audience', label: 'Audience' },
          ] as const
        ).map((tab) => {
          const isOn = activeTab === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isOn}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`border-0 bg-transparent py-2.5 px-3.5 text-sm font-medium transition cursor-pointer -mb-px whitespace-nowrap border-b-2 ${
                isOn
                  ? 'text-[#232536] border-[#CF3F29] font-semibold'
                  : 'text-[#5C5F73] border-transparent hover:text-[#232536]'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Active Tab Panel */}
      <div role="tabpanel">
        {activeTab === 'overview' && (
          <OverviewTab data={derivedData} v1Only={v1Only} />
        )}
        {activeTab === 'articles' && (
          <ArticlesTab data={derivedData} v1Only={v1Only} />
        )}
        {activeTab === 'sources' && <SourcesTab v1Only={v1Only} />}
        {activeTab === 'audience' && (
          <AudienceTab data={derivedData} v1Only={v1Only} />
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-[#5C5F73]">
        Real numbers come from the post_views table and the members table. Google
        Analytics and Search Console integration planned for a later sprint.
      </p>
    </div>
  )
}
