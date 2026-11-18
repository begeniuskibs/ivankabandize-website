'use client'

import React from 'react'
import type { GoogleStatus } from './types'

interface GoogleBlockStateProps {
  status: GoogleStatus
  loadingText?: string
  notConfiguredText?: string
  errorText?: string
  emptyText?: string
  children: React.ReactNode
}

export function GoogleBlockState({
  status,
  loadingText = 'Loading Google numbers...',
  notConfiguredText = 'The Google connection is not set up yet.',
  errorText = 'Could not load numbers from Google right now. Please check back later.',
  emptyText = 'No data recorded for this period yet.',
  children,
}: GoogleBlockStateProps) {
  if (status === 'loading') {
    return (
      <div className="py-8 flex flex-col items-center justify-center text-center">
        <div className="w-5 h-5 rounded-full border-2 border-[#232536] border-t-transparent animate-spin mb-2" />
        <p className="text-xs text-[#5C5F73] m-0">{loadingText}</p>
      </div>
    )
  }

  if (status === 'not_configured') {
    return (
      <div className="py-7 px-4 rounded-xl bg-[#FAF6F0] border border-[#F0E4D2]/70 text-center">
        <p className="text-[13px] font-medium text-[#232536] m-0 mb-1">
          {notConfiguredText}
        </p>
        <p className="text-xs text-[#5C5F73] m-0">
          Set GOOGLE_SERVICE_ACCOUNT_JSON in environment variables to bring live numbers here.
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="py-7 px-4 rounded-xl bg-[#FDF4F3] border border-[#F7D3CF] text-center">
        <p className="text-[13px] font-medium text-[#CF3F29] m-0 mb-1">
          Temporary connection issue
        </p>
        <p className="text-xs text-[#5C5F73] m-0">{errorText}</p>
      </div>
    )
  }

  if (status === 'empty') {
    return (
      <div className="py-7 px-4 rounded-xl bg-[#FAF6F0] border border-[#F0E4D2]/70 text-center">
        <p className="text-[13px] text-[#5C5F73] m-0">{emptyText}</p>
      </div>
    )
  }

  return <>{children}</>
}
