'use client'

import React from 'react'
import type { AnalyticsData } from './types'
import type { TimeChartStyle, ShareChartStyle } from '@/lib/adminAnalytics'
import { ChipGA, ChipV1, ChipLater } from './AnalyticsChips'
import { MetricTabsCard } from './MetricTabsCard'
import { TopArticlesCard } from './TopArticlesCard'
import { SummaryCard } from './SummaryCard'
import { SetupCard } from './SetupCard'
import { AnalyticsSharesList } from './AnalyticsSharesList'

interface OverviewTabProps {
  data: AnalyticsData
  v1Only: boolean
  timeStyle: TimeChartStyle
  shareStyle: ShareChartStyle
  onNavigateTab: (tab: 'articles' | 'audience') => void
}

export function OverviewTab({
  data,
  v1Only,
  timeStyle,
  shareStyle,
  onNavigateTab,
}: OverviewTabProps) {
  return (
    <div className="space-y-4">
      {/* Notice Card */}
      <div className="flex items-start gap-3 bg-white border border-[#F0E4D2] rounded-xl p-3.5 text-xs text-[#5C5F73]">
        <span
          className="text-sm leading-none mt-0.5 select-none text-[#5C5F73]"
          aria-hidden="true"
        >
          &#9432;
        </span>
        <div className="space-y-1">
          <p className="m-0 leading-relaxed">
            <b className="text-[#232536] font-semibold">
              Own counter started on 12 Nov 2026.
            </b>{' '}
            It runs on every article read without cookies or consent banners.
            Older visits and non - article pages are not in these numbers.
          </p>
          {data.capHit && (
            <p className="m-0 text-[#CF3F29] font-medium leading-relaxed">
              Safety cap hit: only the most recent 50,000 views were fetched to
              protect database memory.
            </p>
          )}
        </div>
      </div>

      {/* Hero Metric Tabs Card */}
      <MetricTabsCard
        range={data.range}
        viewsCurrentBuckets={data.viewsCurrentBuckets}
        totalViewsCurrent={data.totalViewsCurrent}
        totalViewsPrev={data.totalViewsPrev}
        membersCurrentBuckets={data.memberCurrentBuckets}
        totalMembersCurrent={data.totalMembersCurrent}
        totalMembersPrev={data.totalMembersPrev}
        timeStyle={timeStyle}
        onNavigateTab={onNavigateTab}
      />

      {/* Top Articles Card (full width, up to 8 articles) */}
      <TopArticlesCard
        articles={data.topArticles}
        totalViews={data.totalViewsCurrent}
        shareStyle={shareStyle}
        onNavigateTab={(tab) => onNavigateTab(tab)}
      />

      {/* 2-column Grid: Summary Card & Setup Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SummaryCard
          range={data.range}
          viewsBuckets={data.viewsCurrentBuckets}
          totalMembersCurrent={data.totalMembersCurrent}
          totalMembersPrev={data.totalMembersPrev}
        />
        <SetupCard />
      </div>

      {/* Later Cards: Where readers come from, Countries, Phone or computer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Where readers come from */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity flex flex-col ${
            v1Only ? 'opacity-35' : ''
          }`}
        >
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Where readers come from
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Accepted - cookie visitors only
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA />
              <ChipLater />
            </div>
          </div>
          <div className="opacity-70 select-none flex-1">
            <AnalyticsSharesList
              rows={[
                ['Direct', 38],
                ['Google search', 27],
                ['LinkedIn', 14],
                ['Email newsletter', 11],
              ]}
              shareStyle={shareStyle}
              suffix="%"
              barColor="#3C6FD1"
            />
          </div>
          <p className="text-xs text-[#5C5F73] mt-3 mb-0">
            Coming with Google Analytics integration.
          </p>
        </div>

        {/* Countries */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity flex flex-col ${
            v1Only ? 'opacity-35' : ''
          }`}
        >
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Countries
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Accepted - cookie visitors only
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA />
              <ChipLater />
            </div>
          </div>
          <div className="opacity-70 select-none flex-1">
            <AnalyticsSharesList
              rows={[
                ['Uganda', 54],
                ['United States', 13],
                ['Kenya', 9],
                ['United Kingdom', 7],
              ]}
              shareStyle={shareStyle}
              suffix="%"
              barColor="#3C6FD1"
            />
          </div>
          <p className="text-xs text-[#5C5F73] mt-3 mb-0">
            Coming with Google Analytics integration.
          </p>
        </div>

        {/* Phone or computer */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity flex flex-col ${
            v1Only ? 'opacity-35' : ''
          }`}
        >
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Phone or computer
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Accepted - cookie visitors only
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA />
              <ChipLater />
            </div>
          </div>
          <div className="opacity-70 select-none flex-1">
            <AnalyticsSharesList
              rows={[
                ['Phone', 68],
                ['Computer', 29],
                ['Tablet', 3],
              ]}
              shareStyle={shareStyle}
              suffix="%"
              barColor="#232536"
            />
          </div>
          <p className="text-xs text-[#5C5F73] mt-3 mb-0">
            Coming with Google Analytics integration.
          </p>
        </div>
      </div>

      {/* Your Other Tools */}
      <div className="pt-2">
        <h2 className="text-base font-semibold text-[#232536] mb-2.5">
          Your other tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-[#F0E4D2] rounded-2xl p-5 hover:border-[#DCC9A8] transition-colors flex flex-col gap-1.5 text-inherit"
          >
            <div className="flex items-center justify-between font-semibold text-sm text-[#232536]">
              <span>Google Analytics</span>
              <span>&#8599;</span>
            </div>
            <p className="text-[13px] text-[#5C5F73] m-0 flex-1">
              Full detail: realtime, pages, devices, events.
            </p>
            <div className="mt-1">
              <ChipV1 label="v1 link" />
            </div>
          </a>

          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-[#F0E4D2] rounded-2xl p-5 hover:border-[#DCC9A8] transition-colors flex flex-col gap-1.5 text-inherit"
          >
            <div className="flex items-center justify-between font-semibold text-sm text-[#232536]">
              <span>Search Console</span>
              <span>&#8599;</span>
            </div>
            <p className="text-[13px] text-[#5C5F73] m-0 flex-1">
              What people typed into Google before finding you.
            </p>
            <div className="mt-1">
              <ChipV1 label="v1 link" />
            </div>
          </a>

          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white border border-[#F0E4D2] rounded-2xl p-5 hover:border-[#DCC9A8] transition-colors flex flex-col gap-1.5 text-inherit"
          >
            <div className="flex items-center justify-between font-semibold text-sm text-[#232536]">
              <span>Vercel Analytics</span>
              <span>&#8599;</span>
            </div>
            <p className="text-[13px] text-[#5C5F73] m-0 flex-1">
              Page speed and visitor counts from your host.
            </p>
            <div className="mt-1">
              <ChipV1 label="v1 link" />
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}
