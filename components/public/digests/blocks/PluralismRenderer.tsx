'use client'

import React, { useState } from 'react'

export default function PluralismRenderer() {
  const [tabIdx, setTabIdx] = useState<number>(0)

  return (
    <div className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-7 shadow-2xs mt-5">
      {/* Segmented tabs */}
      <div className="flex gap-1.5 p-1 bg-[#FDF8F1] border border-[#F5ECDE] rounded-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setTabIdx(0)}
          className={`flex-1 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            tabIdx === 0
              ? 'bg-[#232536] text-white shadow-xs'
              : 'text-[#5A5D70] hover:text-[#232536] hover:bg-[#F5ECDE]/40'
          }`}
        >
          Typical answer today
        </button>
        <button
          type="button"
          onClick={() => setTabIdx(1)}
          className={`flex-1 min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
            tabIdx === 1
              ? 'bg-[#232536] text-white shadow-xs'
              : 'text-[#5A5D70] hover:text-[#232536] hover:bg-[#F5ECDE]/40'
          }`}
        >
          Principled pluralist answer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center mt-6">
        {tabIdx === 0 ? (
          <>
            <div className="space-y-1.5">
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#FDF8F1] border border-[#F5ECDE] text-[#232536]">
                Opening
              </div>
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#EF5B45] text-white shadow-xs">
                The religion you asked about
              </div>
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#FDF8F1] border border-[#F5ECDE] text-[#5A5D70]">
                Other perspective 1
              </div>
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#FDF8F1] border border-[#F5ECDE] text-[#5A5D70]">
                Other perspective 2
              </div>
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#FDF8F1] border border-[#F5ECDE] text-[#5A5D70]">
                Other perspective 3
              </div>
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#FDF8F1] border border-[#F5ECDE] text-[#5A5D70]">
                Other perspective 4
              </div>
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#FDF8F1] border border-[#F5ECDE] text-[#232536]">
                Closing
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#5A5D70] leading-relaxed">
              Roughly 75 to 150 words go to the faith you asked about. Half to four-fifths of the
              answer goes to other viewpoints. It feels fair, but you leave without really
              understanding any one tradition.
            </p>
          </>
        ) : (
          <>
            <div className="space-y-1.5">
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#FDF8F1] border border-[#F5ECDE] text-[#232536]">
                Opening - &quot;I will answer from the historic Christian tradition&quot;
              </div>
              <div className="rounded-lg py-8 px-4 text-xs font-semibold bg-[#EF5B45] text-white text-center shadow-xs">
                The religion you asked about (300 to 500 words)
              </div>
              <div className="rounded-lg p-2.5 text-xs font-semibold bg-[#FDF8F1] border border-[#F5ECDE] text-[#232536]">
                Closing - &quot;Want a historical, sceptical or comparative view? Just ask&quot;
              </div>
            </div>
            <p className="text-xs sm:text-sm text-[#5A5D70] leading-relaxed">
              The whole body, 300 to 500 words, explains what that tradition actually teaches. Other
              angles are offered at the end, not forced in. This works the same way for any
              religion, which is why the report calls it a religious freedom issue, not only a
              Christian one.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
