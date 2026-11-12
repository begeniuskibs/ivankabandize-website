'use client'

import React from 'react'
import type { AnalyticsData } from './types'
import {
  ChipOwn,
  ChipV1,
  ChipLater,
} from './AnalyticsChips'
import { AnalyticsMemberChart } from './AnalyticsMemberChart'

interface AudienceTabProps {
  data: AnalyticsData
  v1Only: boolean
}

export function AudienceTab({ data, v1Only }: AudienceTabProps) {
  const { free, paid, comped } = data.tierCounts
  const total = free + paid + comped || 1

  const freePct = Math.round((free / total) * 100)
  const paidPct = Math.round((paid / total) * 100)
  const compedPct = Math.round((comped / total) * 100)

  return (
    <div className="space-y-3.5">
      {/* Grid g-main */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-3.5">
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
          <AnalyticsMemberChart
            data={data.memberCurrentBuckets}
            rangeDays={data.range}
          />
        </div>

        {/* Members by tier */}
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0">
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

          <div className="flex flex-col gap-3 pt-2">
            {/* Free */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-[13.5px]">
              <span className="font-medium text-[#232536]">Free</span>
              <b className="font-semibold tabular-nums text-[#232536]">
                {free.toLocaleString('en-US')}
              </b>
              <div className="col-span-2 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                <i
                  className="block h-full bg-[#232536] rounded-full transition-all"
                  style={{ width: `${freePct}%` }}
                />
              </div>
            </div>

            {/* Paid */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-[13.5px]">
              <span className="font-medium text-[#232536]">Paid</span>
              <b className="font-semibold tabular-nums text-[#232536]">
                {paid.toLocaleString('en-US')}
              </b>
              <div className="col-span-2 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                <i
                  className="block h-full bg-[#232536] rounded-full transition-all"
                  style={{ width: `${paidPct}%` }}
                />
              </div>
            </div>

            {/* Comped */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-[13.5px]">
              <span className="font-medium text-[#232536]">Comped</span>
              <b className="font-semibold tabular-nums text-[#232536]">
                {comped.toLocaleString('en-US')}
              </b>
              <div className="col-span-2 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                <i
                  className="block h-full bg-[#232536] rounded-full transition-all"
                  style={{ width: `${compedPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2 Later cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
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
                Sign - up sources
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
            Uses the existing sign - up source field once more members arrive.
          </p>
        </div>
      </div>
    </div>
  )
}

