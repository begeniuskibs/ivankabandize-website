'use client'

import React from 'react'
import { ChipGA, ChipLater } from './AnalyticsChips'

interface SourcesTabProps {
  v1Only: boolean
}

export function SourcesTab({ v1Only }: SourcesTabProps) {
  return (
    <div className="space-y-3.5">
      {/* Grid 2 Later cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Channels */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity ${
            v1Only ? 'opacity-35' : ''
          }`}
        >
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
              <ChipLater />
            </div>
          </div>
          <div className="flex flex-col gap-2 opacity-50 select-none">
            {[
              { name: 'Direct', val: 38 },
              { name: 'Google search', val: 27 },
              { name: 'LinkedIn', val: 14 },
              { name: 'Email newsletter', val: 11 },
              { name: 'WhatsApp', val: 6 },
              { name: 'Other sites', val: 4 },
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

        {/* Top referring sites */}
        <div
          className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 transition-opacity ${
            v1Only ? 'opacity-35' : ''
          }`}
        >
          <div className="flex justify-between items-start gap-2.5 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-[#232536] m-0">
                Top referring sites
              </h2>
              <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
                Links that sent readers to you
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <ChipGA />
              <ChipLater />
            </div>
          </div>
          <div className="flex flex-col gap-2 opacity-50 select-none">
            {[
              { name: 'linkedin.com', val: 112 },
              { name: 't.co (X)', val: 41 },
              { name: 'watoto.com', val: 33 },
              { name: 'google.com', val: 30 },
              { name: 'facebook.com', val: 22 },
              { name: 'bing.com', val: 9 },
            ].map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center text-[13px]"
              >
                <span className="truncate text-[#5C5F73]">{item.name}</span>
                <span className="tabular-nums text-[#5C5F73]">{item.val}</span>
                <div className="col-span-2 h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden">
                  <i
                    className="block h-full bg-[#3C6FD1] rounded-full"
                    style={{ width: `${(item.val / 112) * 100}%` }}
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

      {/* Notice Callout */}
      <div className="flex gap-3 items-start bg-white border border-[#F0E4D2] rounded-xl p-3.5 text-[#5C5F73] text-sm leading-relaxed">
        <span aria-hidden="true" className="text-base select-none mt-0.5">
          &#9432;
        </span>
        <div>
          <b className="text-[#232536] font-semibold">
            Why Sources is a later step.{' '}
          </b>
          Where a reader came from is only known to Google Analytics, and only for
          visitors who accepted cookies. To show it here, Google needs to hand the
          numbers to this page through a service account. Until then, the Google
          Analytics link on Overview shows the same thing.
        </div>
      </div>
    </div>
  )
}

