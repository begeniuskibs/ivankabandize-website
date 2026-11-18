'use client'

import React from 'react'

interface SetupCardProps {
  setupStatus?: {
    searchConsoleConnected: boolean
    googleAnalyticsConnected: boolean
  }
}

export function SetupCard({ setupStatus }: SetupCardProps) {
  const scDone = !!setupStatus?.searchConsoleConnected
  const gaDone = !!setupStatus?.googleAnalyticsConnected

  const steps = [
    {
      title: 'Own view counter',
      description: 'Counting reads since 12 Nov 2026',
      done: true,
    },
    {
      title: 'Google Analytics tag',
      description: 'Live for visitors who accept cookies',
      done: true,
    },
    {
      title: 'Connect Search Console',
      description: scDone
        ? 'Connected to sc-domain:ivankabandize.com'
        : 'Shows what people typed into Google',
      done: scDone,
    },
    {
      title: 'Bring Google numbers onto this page',
      description: gaDone
        ? 'Connected via service account'
        : 'Needs a Google service account',
      done: gaDone,
    },
  ]

  const doneCount = steps.filter((st) => st.done).length
  const progressPercent = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 md:p-6 flex flex-col min-w-0">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-[#232536] m-0">
          Finish setting up analytics
        </h2>
        <div className="h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden my-2.5">
          <div
            className="h-full bg-[#232536] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-[#5C5F73] mt-1 mb-0">
          {doneCount} of {steps.length} complete
        </p>
      </div>

      <div className="flex flex-col mt-2">
        {steps.map((st, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 py-2.5 text-[13.5px] ${
              i > 0 ? 'border-t border-[#F0E4D2]' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-none ${
                st.done
                  ? 'bg-[#2F9E7A] text-white'
                  : 'border-[1.5px] border-[#CDBFA8] text-transparent'
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            <div className="min-w-0 flex-1">
              <span
                className={`block font-medium ${
                  st.done ? 'text-[#232536]' : 'text-[#5C5F73]'
                }`}
              >
                {st.title}
              </span>
              <small className="block text-xs text-[#5C5F73] mt-0.5">
                {st.description}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
