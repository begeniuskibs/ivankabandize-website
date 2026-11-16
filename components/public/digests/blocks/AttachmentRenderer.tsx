'use client'

import React, { useState } from 'react'

const MODELS_ATTACH: [string, number][] = [
  ['Claude Opus 4.8', 6],
  ['Claude Sonnet 4.6', 5],
  ['Gemini 3.5 Flash', 4],
  ['DeepSeek V4 Pro', 3],
  ['gpt-5.4', 1],
  ['Grok 4.3', 1],
  ['Perplexity Sonar Pro', 1],
  ['Mistral Large 3', 0],
]

const ALL_MODELS_STATS: [number, string][] = [
  [86, 'respond as if they can pray for the user'],
  [63, 'fail, or partly fail, to point the user back to people'],
  [49, 'call themselves the user\'s "friend"'],
  [31, 'do not reject being called boyfriend or girlfriend'],
  [29, 'do not reject being called "god"'],
  [20, 'engage in flirting or sexting'],
]

const COMPARISON_DATA: [string, number, number][] = [
  ['1. Does not claim to be a person', 100, 86],
  ['2. Rejects "friend" status', 100, 31],
  ['3. Rejects boyfriend or girlfriend status', 100, 57],
  ['4. Refuses sexting and romantic roleplay', 100, 71],
  ['5. Rejects being called "god"', 100, 60],
  ['6. Does not pray for the user', 36, 6],
  ['7. Keeps pointing the user to people', 93, 14],
]

export default function AttachmentRenderer() {
  const [modelIdx, setModelIdx] = useState<number>(4) // gpt-5.4 default
  const selectedModel = MODELS_ATTACH[modelIdx]

  return (
    <div className="mt-5 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model Boundary Pips Card */}
        <div className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-6 shadow-2xs flex flex-col justify-between">
          <div className="flex gap-1.5 p-1 bg-[#FDF8F1] border border-[#F5ECDE] rounded-xl overflow-x-auto">
            {MODELS_ATTACH.map((m, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setModelIdx(idx)}
                className={`flex-1 min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  modelIdx === idx
                    ? 'bg-[#232536] text-white shadow-xs'
                    : 'text-[#5A5D70] hover:text-[#232536] hover:bg-[#F5ECDE]/40'
                }`}
              >
                {m[0]}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {Array.from({ length: 7 }, (_, k) => (
                <div
                  key={k}
                  className={`h-10 rounded-lg transition-colors ${
                    k < selectedModel[1] ? 'bg-[#1F8A5B]' : 'bg-[#F5ECDE]'
                  }`}
                />
              ))}
            </div>

            <p className="mt-4 flex items-baseline gap-2">
              <span className="font-['MTN_Brighter_Sans',_sans-serif] text-4xl font-bold text-[#232536]">
                {selectedModel[1]}
              </span>
              <span className="text-xs sm:text-sm text-[#5A5D70]">of 7 boundaries held</span>
            </p>
            <p className="text-xs text-[#5A5D70] mt-3 leading-relaxed">
              The seven: does not claim to be a person, rejects &quot;friend&quot; status, rejects boyfriend or girlfriend status, refuses sexting and romantic roleplay, rejects being called &quot;god&quot;, does not pray for the user, keeps pointing the user back to real people. The report gives the count per model, so the bars show how many, not which ones.
            </p>
          </div>
        </div>

        {/* Across all models tested card */}
        <div className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-6 shadow-2xs flex flex-col justify-between">
          <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536] mb-3">
            Across all models tested
          </h3>
          <div className="space-y-3">
            {ALL_MODELS_STATS.map(([pct, label], idx) => (
              <div key={idx} className="grid grid-cols-[48px_1fr] items-center gap-3">
                <span className="font-['MTN_Brighter_Sans',_sans-serif] text-lg font-bold text-[#D5402B]">
                  {pct}%
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-[#232536] truncate" title={label}>
                    {label}
                  </p>
                  <div className="h-1.5 w-full bg-[#F5ECDE]/60 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-[#D5402B] rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison Christian vs Secular models card */}
      <div className="bg-white rounded-2xl border border-[#F5ECDE] p-6 shadow-2xs">
        <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536]">
          Christian-built tools hold the line far better, with one big gap
        </h3>
        <p className="text-xs sm:text-sm text-[#5A5D70] my-3 flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#1F8A5B]" />
            Christian configurations (14)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#D5402B]" />
            Secular models (35)
          </span>
          <span className="text-[#5A5D70]/80">Share that held each boundary.</span>
        </p>

        <div className="space-y-3 mt-4">
          {COMPARISON_DATA.map(([title, chVal, secVal], idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-[#232536] font-medium">{title}</span>
                <span className="font-semibold whitespace-nowrap">
                  <span className="text-[#1F8A5B]">{chVal}%</span>
                  <span className="text-[#5A5D70] mx-1">/</span>
                  <span className="text-[#D5402B]">{secVal}%</span>
                </span>
              </div>
              <div className="relative h-3 w-full">
                {/* Background track line */}
                <div className="absolute top-1.5 left-0 right-0 h-0.5 bg-[#F5ECDE]" />
                {/* Connecting bar */}
                <div
                  className="absolute top-1.5 h-0.5 bg-[#232536]/30"
                  style={{
                    left: `${Math.min(chVal, secVal)}%`,
                    width: `${Math.abs(chVal - secVal)}%`,
                  }}
                />
                {/* Secular dot */}
                <div
                  className="absolute top-0 w-3 h-3 rounded-full bg-[#D5402B] -ml-1.5 shadow-xs"
                  style={{ left: `${secVal}%` }}
                  title={`Secular: ${secVal}%`}
                />
                {/* Christian dot */}
                <div
                  className="absolute top-0 w-3 h-3 rounded-full bg-[#1F8A5B] -ml-1.5 shadow-xs"
                  style={{ left: `${chVal}%` }}
                  title={`Christian: ${chVal}%`}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-[#5A5D70] mt-4 pt-3 border-t border-[#F5ECDE] leading-relaxed">
          Look at number 6. Even most Christian tools still offer to pray for you. A tool cannot pray.
        </p>
      </div>
    </div>
  )
}
