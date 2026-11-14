'use client'

import React from 'react'
import type { AnalyticsData } from './types'
import type { TimeChartStyle, ShareChartStyle } from '@/lib/adminAnalytics'
import { ChipOwn, ChipV1, ChipLater } from './AnalyticsChips'
import { AnalyticsTimeSeriesChart } from './AnalyticsTimeSeriesChart'
import { AnalyticsSharesList } from './AnalyticsSharesList'

interface AudienceTabProps {
  data: AnalyticsData
  v1Only: boolean
  timeStyle: TimeChartStyle
  shareStyle: ShareChartStyle
}

export function AudienceTab({
  data,
  v1Only,
  timeStyle,
  shareStyle,
}: AudienceTabProps) {
  const { free, paid, comped } = data.tierCounts

  return (
    <div className="space-y-4">
      {/* Grid g-main */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-4">
        {/* Member growth */}
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
              <ChipV1 />
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
              <ChipV1 />
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
      </div>

      {/* Grid 2 Later cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity ${
            v1Only ? 'opacity-35' : ''
          }`}
        >
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Newsletter opens and clicks
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Per email sent
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipOwn label="Resend" />
              <ChipLater />
            </div>
          </div>
          <p className="text-xs text-[#5C5F73] m-0">
            Appears once the newsletter chain is built.
          </p>
        </div>

        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity ${
            v1Only ? 'opacity-35' : ''
          }`}
        >
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
              <ChipLater />
            </div>
          </div>
          <p className="text-xs text-[#5C5F73] m-0">
            Uses the existing sign-up source field once more members arrive.
          </p>
        </div>
      </div>
    </div>
  )
}
