'use client'

import React from 'react'
import type { AnalyticsData } from './types'
import {
  ChipOwn,
  ChipGA,
  ChipV1,
  ChipLater,
} from './AnalyticsChips'
import { AnalyticsSparkline } from './AnalyticsSparkline'
import { AnalyticsViewsChart } from './AnalyticsViewsChart'

interface OverviewTabProps {
  data: AnalyticsData
  v1Only: boolean
}

export function OverviewTab({ data, v1Only }: OverviewTabProps) {
  const viewsSparklineData = data.viewsCurrentBuckets.map((b) => b.count)
  const memberSparklineData = data.memberCurrentBuckets.map((b) => b.count)

  const topMaxViews =
    data.topArticles.length > 0 ? Math.max(...data.topArticles.map((a) => a.views)) : 0

  return (
    <div className="space-y-3.5">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Article views */}
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity">
          <div className="flex items-center justify-between gap-2 text-[#5C5F73] text-[13px]">
            <span>Article views</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipOwn />
              <ChipV1 />
            </div>
          </div>
          <div className="text-[34px] font-semibold tracking-[-0.02em] leading-tight my-2 tabular-nums text-[#232536]">
            {data.totalViewsCurrent.toLocaleString('en-US')}
          </div>
          <div
            className={`text-[12.5px] font-semibold ${
              data.viewsPercentDelta !== null && data.viewsPercentDelta < 0
                ? 'text-[#CF3F29]'
                : 'text-[#2F9E7A]'
            }`}
          >
            {data.viewsPercentDelta !== null
              ? `${data.viewsPercentDelta >= 0 ? '+' : ''}${data.viewsPercentDelta}% vs the previous ${data.range} days`
              : `Baseline period - no previous data`}
          </div>
          <AnalyticsSparkline data={viewsSparklineData} color="#CF3F29" />
        </div>

        {/* KPI 2: Best day */}
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity">
          <div className="flex items-center justify-between gap-2 text-[#5C5F73] text-[13px]">
            <span>Best day</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipOwn />
              <ChipV1 />
            </div>
          </div>
          <div className="text-[34px] font-semibold tracking-[-0.02em] leading-tight my-2 tabular-nums text-[#232536]">
            {data.bestDayCount.toLocaleString('en-US')}
          </div>
          <div className="text-[12.5px] font-semibold text-[#2F9E7A]">
            {data.bestDayCount > 0
              ? `${data.bestDayDateDisplay}, the most - read day`
              : 'No views recorded yet'}
          </div>
          <AnalyticsSparkline data={viewsSparklineData} color="#232536" />
        </div>

        {/* KPI 3: Members */}
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity">
          <div className="flex items-center justify-between gap-2 text-[#5C5F73] text-[13px]">
            <span>Members</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipOwn label="Database" />
              <ChipV1 />
            </div>
          </div>
          <div className="text-[34px] font-semibold tracking-[-0.02em] leading-tight my-2 tabular-nums text-[#232536]">
            {data.totalMembersCurrent.toLocaleString('en-US')}
          </div>
          <div
            className={`text-[12.5px] font-semibold ${
              data.memberPercentDelta !== null && data.memberPercentDelta < 0
                ? 'text-[#CF3F29]'
                : 'text-[#2F9E7A]'
            }`}
          >
            {data.memberPercentDelta !== null
              ? `${data.memberPercentDelta >= 0 ? '+' : ''}${data.memberPercentDelta}% vs the previous ${data.range} days`
              : `Baseline period - no previous data`}
          </div>
          <AnalyticsSparkline data={memberSparklineData} color="#2F9E7A" />
        </div>

        {/* KPI 4: Visitors who accepted cookies (Later) */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity ${
            v1Only ? 'opacity-35' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-[#5C5F73] text-[13px]">
            <span>Visitors who accepted cookies</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA />
              <ChipLater />
            </div>
          </div>
          <div className="text-[34px] font-semibold tracking-[-0.02em] leading-tight my-2 tabular-nums text-[#5C5F73]">
            -
          </div>
          <div className="text-[12.5px] font-medium text-[#5C5F73]">
            Planned for later sprint
          </div>
          <AnalyticsSparkline data={[]} color="#3C6FD1" />
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-3.5">
        {/* Article views per day */}
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0">
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Article views per day
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Last {data.range} days, {data.totalViewsCurrent.toLocaleString('en-US')} views in total
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipOwn />
              <ChipV1 />
            </div>
          </div>
          <AnalyticsViewsChart
            data={data.viewsCurrentBuckets}
            totalViews={data.totalViewsCurrent}
            rangeDays={data.range}
          />
        </div>

        {/* Top articles */}
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0">
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Top articles
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Most read in the period
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipOwn />
              <ChipV1 />
            </div>
          </div>

          {data.topArticles.length === 0 || data.totalViewsCurrent === 0 ? (
            <div className="py-12 text-center text-sm text-[#5C5F73]">
              No articles viewed yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {data.topArticles.map((article) => {
                const widthPercent =
                  topMaxViews > 0 ? (article.views / topMaxViews) * 100 : 0
                return (
                  <div
                    key={article.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-[13.5px]"
                  >
                    <span className="truncate font-medium text-[#232536]">
                      {article.title}
                    </span>
                    <b className="font-semibold tabular-nums text-[#232536]">
                      {article.views.toLocaleString('en-US')}
                    </b>
                    <div className="col-span-2 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                      <i
                        className="block h-full bg-[#CF3F29] rounded-full transition-all"
                        style={{ width: `${Math.max(2, widthPercent)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Grid 3: Later cards (Where readers come from, Countries, Phone or computer) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Where readers come from */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity ${
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
          <div className="flex flex-col gap-2 opacity-50 select-none">
            {[
              { name: 'Direct', val: 38 },
              { name: 'Google search', val: 27 },
              { name: 'LinkedIn', val: 14 },
              { name: 'Email newsletter', val: 11 },
            ].map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-[13px]"
              >
                <span className="truncate text-[#5C5F73]">{item.name}</span>
                <span className="tabular-nums text-[#5C5F73]">{item.val}%</span>
                <div className="col-span-2 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                  <i
                    className="block h-full bg-[#3C6FD1] rounded-full"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#5C5F73] mt-3 mb-0">
            Coming with Google Analytics integration.
          </p>
        </div>

        {/* Countries */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity ${
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
          <div className="flex flex-col gap-2 opacity-50 select-none">
            {[
              { name: 'Uganda', val: 54 },
              { name: 'United States', val: 13 },
              { name: 'Kenya', val: 9 },
              { name: 'United Kingdom', val: 7 },
            ].map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-[13px]"
              >
                <span className="truncate text-[#5C5F73]">{item.name}</span>
                <span className="tabular-nums text-[#5C5F73]">{item.val}%</span>
                <div className="col-span-2 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                  <i
                    className="block h-full bg-[#3C6FD1] rounded-full"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#5C5F73] mt-3 mb-0">
            Coming with Google Analytics integration.
          </p>
        </div>

        {/* Phone or computer */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity ${
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
          <div className="flex flex-col gap-2 opacity-50 select-none">
            {[
              { name: 'Phone', val: 68 },
              { name: 'Computer', val: 29 },
              { name: 'Tablet', val: 3 },
            ].map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-[13px]"
              >
                <span className="truncate text-[#5C5F73]">{item.name}</span>
                <span className="tabular-nums text-[#5C5F73]">{item.val}%</span>
                <div className="col-span-2 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                  <i
                    className="block h-full bg-[#232536] rounded-full"
                    style={{ width: `${item.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#5C5F73] mt-3 mb-0">
            Coming with Google Analytics integration.
          </p>
        </div>
      </div>

      {/* Your other tools */}
      <div className="pt-3">
        <h2 className="text-base font-semibold text-[#232536] mb-2.5">
          Your other tools
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
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

