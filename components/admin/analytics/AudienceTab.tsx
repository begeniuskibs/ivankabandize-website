'use client'

import React from 'react'
import type { AnalyticsData, GoogleAnalyticsData } from './types'
import type { TimeChartStyle, ShareChartStyle } from '@/lib/adminAnalytics'
import { ChipOwn, ChipGA } from './AnalyticsChips'
import { AnalyticsTimeSeriesChart } from './AnalyticsTimeSeriesChart'
import { AnalyticsSharesList } from './AnalyticsSharesList'
import { GoogleBlockState } from './GoogleBlockState'

interface AudienceTabProps {
  data: AnalyticsData
  timeStyle: TimeChartStyle
  shareStyle: ShareChartStyle
  gaData?: GoogleAnalyticsData
}

export function AudienceTab({
  data,
  timeStyle,
  shareStyle,
  gaData,
}: AudienceTabProps) {
  const { free, paid, comped } = data.tierCounts

  const ga = gaData || {
    status: 'not_configured',
    channels: [],
    sources: [],
    countries: [],
    devices: [],
  }

  return (
    <div className="space-y-4">
      {/* Grid 1: Member growth */}
      <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0">
        <div className="flex justify-between items-start gap-2.5 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#232536] m-0">
              Member growth
            </h2>
            <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
              Total members over time
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <ChipOwn label="Database" />
          </div>
        </div>
        <AnalyticsTimeSeriesChart
          data={data.memberCurrentBuckets}
          unit="members"
          color="#232536"
          chartStyle={timeStyle}
          width={720}
          height={220}
          floorBase={true}
          ariaLabel="Member growth"
        />
      </div>

      {/* Grid 2: Members by tier & Sign-up sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Members by tier */}
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 flex flex-col">
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Members by tier
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                From the members table
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipOwn label="Database" />
            </div>
          </div>

          <div className="pt-2 flex-1">
            <AnalyticsSharesList
              rows={[
                ['Free', free],
                ['Paid', paid],
                ['Comped', comped],
              ]}
              shareStyle={shareStyle}
              barColor="#232536"
            />
          </div>
        </div>

        {/* Sign-up sources */}
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 flex flex-col">
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Sign-up sources
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Which article or page brought each member
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipOwn label="Database" />
            </div>
          </div>

          <div className="pt-2 flex-1">
            {data.signupSources && data.signupSources.length > 0 ? (
              <AnalyticsSharesList
                rows={data.signupSources.map((s) => [s.source, s.count])}
                shareStyle={shareStyle}
                barColor="#232536"
              />
            ) : (
              <div className="py-7 px-4 rounded-xl bg-[#FAF6F0] border border-[#F0E4D2]/70 text-center">
                <p className="text-[13px] text-[#5C5F73] m-0">
                  No member sign-up sources recorded yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid 3: Top countries and Device categories */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top countries */}
          <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0">
            <div className="flex justify-between items-start gap-2.5 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#232536] m-0">
                  Top countries
                </h2>
                <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                  Where readers are visiting from
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <ChipGA />
              </div>
            </div>

            <GoogleBlockState
              status={ga.status}
              loadingText="Loading top countries..."
              notConfiguredText="The Google connection is not set up yet."
              errorText={ga.errorMessage}
              emptyText="No country data recorded for this period yet."
            >
              <div className="flex flex-col gap-2.5">
                {ga.countries.map((item) => (
                  <div
                    key={item.country}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 gap-y-1 items-center text-[13px]"
                  >
                    <span className="truncate text-[#232536] font-medium">
                      {item.country}
                    </span>
                    <span className="tabular-nums text-[#5C5F73] text-xs">
                      {item.users.toLocaleString()} users
                    </span>
                    <span className="tabular-nums text-[#232536] font-semibold text-xs min-w-[32px] text-right">
                      {item.share}%
                    </span>
                    <div className="col-span-3 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                      <i
                        className="block h-full bg-[#3C6FD1] rounded-full"
                        style={{ width: `${Math.min(item.share, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GoogleBlockState>
          </div>

          {/* Device categories */}
          <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0">
            <div className="flex justify-between items-start gap-2.5 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#232536] m-0">
                  Device categories
                </h2>
                <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                  Mobile, desktop and tablet reader share
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <ChipGA />
              </div>
            </div>

            <GoogleBlockState
              status={ga.status}
              loadingText="Loading device categories..."
              notConfiguredText="The Google connection is not set up yet."
              errorText={ga.errorMessage}
              emptyText="No device data recorded for this period yet."
            >
              <div className="flex flex-col gap-2.5">
                {ga.devices.map((item) => (
                  <div
                    key={item.deviceCategory}
                    className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 gap-y-1 items-center text-[13px]"
                  >
                    <span className="truncate text-[#232536] font-medium capitalize">
                      {item.deviceCategory}
                    </span>
                    <span className="tabular-nums text-[#5C5F73] text-xs">
                      {item.users.toLocaleString()} users
                    </span>
                    <span className="tabular-nums text-[#232536] font-semibold text-xs min-w-[32px] text-right">
                      {item.share}%
                    </span>
                    <div className="col-span-3 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                      <i
                        className="block h-full bg-[#3C6FD1] rounded-full"
                        style={{ width: `${Math.min(item.share, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GoogleBlockState>
          </div>
        </div>

        {/* Lag Notice */}
        <p className="text-xs text-[#5C5F73] mt-2 mb-0">
          Google Analytics data can lag 24 to 48 hours and Search Console 2 to 3 days.
        </p>
      </div>
    </div>
  )
}
