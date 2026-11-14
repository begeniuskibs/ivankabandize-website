import React from 'react'

export default function AnalyticsLoading() {
  return (
    <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-8 py-7 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-2">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-[#EAE6DF] rounded-lg" />
          <div className="h-4 w-72 bg-[#F0EBE1] rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-52 bg-[#EAE6DF] rounded-xl" />
          <div className="h-9 w-24 bg-[#EAE6DF] rounded-xl" />
        </div>
      </div>

      {/* Caption line placeholder */}
      <div className="h-4 w-96 bg-[#F0EBE1] rounded mt-2 mb-4" />

      {/* Switch placeholder */}
      <div className="h-5 w-80 bg-[#F0EBE1] rounded mb-5" />

      {/* Tabs Bar Skeleton */}
      <div className="flex gap-4 border-b border-[#F0E4D2] pb-3 mb-5">
        <div className="h-6 w-20 bg-[#EAE6DF] rounded" />
        <div className="h-6 w-20 bg-[#F0EBE1] rounded" />
        <div className="h-6 w-20 bg-[#F0EBE1] rounded" />
        <div className="h-6 w-20 bg-[#F0EBE1] rounded" />
      </div>

      {/* 4 KPIs Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-3.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#F0E4D2] rounded-2xl p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-4 w-24 bg-[#F0EBE1] rounded" />
              <div className="h-4 w-12 bg-[#F0EBE1] rounded-full" />
            </div>
            <div className="h-9 w-20 bg-[#EAE6DF] rounded" />
            <div className="h-3 w-32 bg-[#F0EBE1] rounded" />
            <div className="h-8 w-full bg-[#FAF7F2] rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Main Charts Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-3.5">
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 space-y-4">
          <div className="h-5 w-48 bg-[#EAE6DF] rounded" />
          <div className="h-56 w-full bg-[#FAF7F2] rounded-xl" />
        </div>
        <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 space-y-4">
          <div className="h-5 w-32 bg-[#EAE6DF] rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-4 w-36 bg-[#F0EBE1] rounded" />
                  <div className="h-4 w-8 bg-[#F0EBE1] rounded" />
                </div>
                <div className="h-2 w-full bg-[#F3EBDD] rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

