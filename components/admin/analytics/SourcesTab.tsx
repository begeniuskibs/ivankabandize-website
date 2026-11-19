'use client'

import React from 'react'
import { ChipGA } from './AnalyticsChips'
import { GoogleBlockState } from './GoogleBlockState'
import type { GoogleAnalyticsData, SearchConsoleData } from './types'
import { GLASS_CARD } from '../glass'

interface SourcesTabProps {
  gaData?: GoogleAnalyticsData
  gscData?: SearchConsoleData
}

export function SourcesTab({ gaData, gscData }: SourcesTabProps) {
  const ga = gaData || {
    status: 'not_configured',
    channels: [],
    sources: [],
    countries: [],
    devices: [],
  }

  const gsc = gscData || {
    status: 'not_configured',
    totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
    queries: [],
    pages: [],
  }

  const isConfigured = ga.status === 'ready' || gsc.status === 'ready'

  return (
    <div className="space-y-4">
      {/* Google Analytics: Channels and Top referring sites */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Channels */}
        <div className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 ${GLASS_CARD}`}>
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Channels
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Direct, search, social, email, other sites
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA />
            </div>
          </div>

          <GoogleBlockState
            status={ga.status}
            loadingText="Loading channels..."
            notConfiguredText="The Google connection is not set up yet."
            errorText={ga.errorMessage}
            emptyText="No channel data recorded for this period yet."
          >
            <div className="flex flex-col gap-2.5">
              {ga.channels.map((item) => (
                <div
                  key={item.channelGroup}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 gap-y-1 items-center text-[13px]"
                >
                  <span className="truncate text-[#232536] font-medium">
                    {item.channelGroup}
                  </span>
                  <span className="tabular-nums text-[#5C5F73] text-xs">
                    {item.sessions.toLocaleString()}{' '}
                    {item.sessions === 1 ? 'session' : 'sessions'} (
                    {item.users.toLocaleString()}{' '}
                    {item.users === 1 ? 'user' : 'users'})
                  </span>
                  <span className="tabular-nums text-[#232536] font-semibold text-xs min-w-[32px] text-right">
                    {item.share}%
                  </span>
                  <div className="col-span-3 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden md:bg-[#232536]/[0.05]">
                    <i
                      className="block h-full bg-[#3C6FD1] rounded-full md:bg-[#232536]"
                      style={{ width: `${Math.min(item.share, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GoogleBlockState>
        </div>

        {/* Top referring sites */}
        <div className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 ${GLASS_CARD}`}>
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Top referring sites
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Links and sources that sent readers to you
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA />
            </div>
          </div>

          <GoogleBlockState
            status={ga.status}
            loadingText="Loading referring sites..."
            notConfiguredText="The Google connection is not set up yet."
            errorText={ga.errorMessage}
            emptyText="No referrer data recorded for this period yet."
          >
            <div className="flex flex-col gap-2.5">
              {ga.sources.map((item) => (
                <div
                  key={item.sourceMedium}
                  className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 gap-y-1 items-center text-[13px]"
                >
                  <span className="truncate text-[#232536] font-medium">
                    {item.sourceMedium}
                  </span>
                  <span className="tabular-nums text-[#5C5F73] text-xs">
                    {item.sessions.toLocaleString()}{' '}
                    {item.sessions === 1 ? 'session' : 'sessions'}
                  </span>
                  <span className="tabular-nums text-[#232536] font-semibold text-xs min-w-[32px] text-right">
                    {item.share}%
                  </span>
                  <div className="col-span-3 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden md:bg-[#232536]/[0.05]">
                    <i
                      className="block h-full bg-[#3C6FD1] rounded-full md:bg-[#232536]"
                      style={{ width: `${Math.min(item.share, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GoogleBlockState>
        </div>
      </div>

      {/* Search Console: Performance totals */}
      <div className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 ${GLASS_CARD}`}>
        <div className="flex justify-between items-start gap-2.5 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#232536] m-0">
              Search Console performance
            </h2>
            <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
              Total organic search traffic from Google (sc-domain:ivankabandize.com)
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <ChipGA label="Search Console" />
          </div>
        </div>

        <GoogleBlockState
          status={gsc.status}
          loadingText="Loading Search Console totals..."
          notConfiguredText="The Search Console connection is not set up yet."
          errorText={gsc.errorMessage}
          emptyText="No Search Console totals recorded for this period yet."
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#F0E4D2]/60 md:bg-white/[0.4] md:border-[#F0E4D2]">
              <span className="block text-xs font-medium text-[#5C5F73]">
                Total clicks
              </span>
              <span className="block text-2xl font-bold tracking-tight text-[#232536] mt-1 tabular-nums">
                {gsc.totals.clicks.toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#F0E4D2]/60 md:bg-white/[0.4] md:border-[#F0E4D2]">
              <span className="block text-xs font-medium text-[#5C5F73]">
                Total impressions
              </span>
              <span className="block text-2xl font-bold tracking-tight text-[#232536] mt-1 tabular-nums">
                {gsc.totals.impressions.toLocaleString()}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#F0E4D2]/60 md:bg-white/[0.4] md:border-[#F0E4D2]">
              <span className="block text-xs font-medium text-[#5C5F73]">
                Average CTR
              </span>
              <span className="block text-2xl font-bold tracking-tight text-[#232536] mt-1 tabular-nums">
                {(gsc.totals.ctr * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#FAF6F0] border border-[#F0E4D2]/60 md:bg-white/[0.4] md:border-[#F0E4D2]">
              <span className="block text-xs font-medium text-[#5C5F73]">
                Average position
              </span>
              <span className="block text-2xl font-bold tracking-tight text-[#232536] mt-1 tabular-nums">
                {gsc.totals.position.toFixed(1)}
              </span>
            </div>
          </div>
        </GoogleBlockState>
      </div>

      {/* Search Console: Top 10 queries and Top 10 pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 queries */}
        <div className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 ${GLASS_CARD}`}>
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Top search queries
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Top 10 searches that brought readers to your site
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA label="Search Console" />
            </div>
          </div>

          <GoogleBlockState
            status={gsc.status}
            loadingText="Loading search queries..."
            notConfiguredText="The Search Console connection is not set up yet."
            errorText={gsc.errorMessage}
            emptyText="No search queries recorded for this period yet."
          >
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#F0E4D2] text-[#5C5F73]">
                    <th className="py-2 px-2 font-medium">Query</th>
                    <th className="py-2 px-2 font-medium text-right">Clicks</th>
                    <th className="py-2 px-2 font-medium text-right">Impressions</th>
                    <th className="py-2 px-2 font-medium text-right">CTR</th>
                    <th className="py-2 px-2 font-medium text-right">Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E4D2]/60">
                  {gsc.queries.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF6F0]/50 transition-colors">
                      <td className="py-2 px-2 font-medium text-[#232536] max-w-[160px] truncate">
                        {item.key}
                      </td>
                      <td className="py-2 px-2 tabular-nums text-right text-[#232536]">
                        {item.clicks.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 tabular-nums text-right text-[#5C5F73]">
                        {item.impressions.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 tabular-nums text-right text-[#5C5F73]">
                        {(item.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 tabular-nums text-right text-[#5C5F73]">
                        {item.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GoogleBlockState>
        </div>

        {/* Top 10 pages */}
        <div className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 ${GLASS_CARD}`}>
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Top search pages
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Top 10 landing pages in Google search results
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA label="Search Console" />
            </div>
          </div>

          <GoogleBlockState
            status={gsc.status}
            loadingText="Loading search pages..."
            notConfiguredText="The Search Console connection is not set up yet."
            errorText={gsc.errorMessage}
            emptyText="No search pages recorded for this period yet."
          >
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#F0E4D2] text-[#5C5F73]">
                    <th className="py-2 px-2 font-medium">Page</th>
                    <th className="py-2 px-2 font-medium text-right">Clicks</th>
                    <th className="py-2 px-2 font-medium text-right">Impressions</th>
                    <th className="py-2 px-2 font-medium text-right">CTR</th>
                    <th className="py-2 px-2 font-medium text-right">Pos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E4D2]/60">
                  {gsc.pages.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF6F0]/50 transition-colors">
                      <td className="py-2 px-2 font-medium text-[#232536] max-w-[160px] truncate" title={item.key}>
                        {item.key}
                      </td>
                      <td className="py-2 px-2 tabular-nums text-right text-[#232536]">
                        {item.clicks.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 tabular-nums text-right text-[#5C5F73]">
                        {item.impressions.toLocaleString()}
                      </td>
                      <td className="py-2 px-2 tabular-nums text-right text-[#5C5F73]">
                        {(item.ctr * 100).toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 tabular-nums text-right text-[#5C5F73]">
                        {item.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GoogleBlockState>
        </div>
      </div>

      {/* Lag Notice */}
      <p className="text-xs text-[#5C5F73] mt-2 mb-0">
        Google Analytics data can lag 24 to 48 hours and Search Console 2 to 3 days.
      </p>

      {/* Notice Callout */}
      {!isConfigured && (
        <div className={`flex gap-3 items-start bg-white border border-[#F0E4D2] rounded-xl p-3.5 text-[#5C5F73] text-sm leading-relaxed mt-3 ${GLASS_CARD}`}>
          <span aria-hidden="true" className="text-base select-none mt-0.5">
            &#9432;
          </span>
          <div>
            <b className="text-[#232536] font-semibold">
              Connecting Google Analytics and Search Console.{' '}
            </b>
            Where a reader came from is reported by Google Analytics for visitors who accepted cookies.
            Search queries and impressions come directly from Google Search Console.
            To display live numbers on this page, configure the GOOGLE_SERVICE_ACCOUNT_JSON variable in environment settings.
          </div>
        </div>
      )}
    </div>
  )
}
