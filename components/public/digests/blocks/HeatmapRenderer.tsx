'use client'

import React, { useState } from 'react'

const COMMANDMENTS: [string, number, string][] = [
  ['Religion / God', 3.03, 'Worship of God alone. Sits in the lower half of the ten.'],
  ['Idols', 2.62, 'Second lowest of the ten.'],
  ["God's Name", 2.86, "Reverence for God's name. Below the overall average."],
  ['Sabbath / Worship', 2.98, 'Rest and worship. Just under 3 out of 5.'],
  ['Parents / Authority', 3.49, 'The highest score. Honouring parents is still widely shared common sense.'],
  ['Murder / Hate / Life', 3.06, 'The report notes models answer well on racism and hatred. Its abortion example scored 1 of 5 when asked plainly.'],
  ['Adultery / Sexuality', 2.5, 'The lowest of all ten. The report says this is where the modern West has moved furthest from Christian teaching.'],
  ['Theft / Fair Dealing', 3.34, 'Honesty with money and property scores well.'],
  ['False Witness', 3.47, 'Truth-telling scores second highest.'],
  ['Coveting', 3.3, 'Contentment and envy are handled fairly well.'],
]

export default function HeatmapRenderer() {
  const [selectedIdx, setSelectedIdx] = useState<number>(6)
  const current = COMMANDMENTS[selectedIdx]

  return (
    <div className="mt-5">
      {/* 10 Commandment Heatmap buttons */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {COMMANDMENTS.map((c, i) => {
          const hue = Math.round(((c[1] - 2.4) / 1.2) * 130)
          const isSelected = selectedIdx === i

          return (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedIdx(i)}
              aria-label={`Commandment ${i + 1}: ${c[0]}, ${c[1]}`}
              className={`flex flex-col items-center justify-center p-2 rounded-xl text-white transition-all cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-[#232536] scale-105 shadow-md'
                  : 'hover:opacity-90'
              }`}
              style={{
                backgroundColor: `hsl(${hue}, 55%, 38%)`,
              }}
            >
              <span className="text-[10px] font-semibold opacity-80">{i + 1}</span>
              <span className="font-['MTN_Brighter_Sans',_sans-serif] text-xs sm:text-sm font-bold">
                {c[1].toFixed(2)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected detail card */}
      <div className="bg-white rounded-2xl border border-[#F5ECDE] p-6 shadow-2xs mt-4 animate-in fade-in duration-200">
        <p className="text-[11px] font-bold tracking-widest uppercase text-[#CF3F29] font-['MTN_Brighter_Sans',_sans-serif]">
          Commandment {selectedIdx + 1}
        </p>
        <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-lg sm:text-xl font-bold text-[#232536] my-1.5">
          {current[0]} - {current[1].toFixed(2)} out of 5
        </h3>
        <p className="text-xs sm:text-sm text-[#5A5D70] leading-relaxed">{current[2]}</p>
        <p className="text-xs sm:text-sm text-[#232536] mt-3.5 pt-3.5 border-t border-[#F5ECDE] leading-relaxed">
          <strong className="text-[#232536]">The pattern:</strong> apart from sexuality, the
          models do better on loving your neighbour (6 to 10) than on loving God (1 to 4). They
          have absorbed the parts of Christian ethics the wider culture kept, and dropped the parts
          it let go.
        </p>
      </div>
    </div>
  )
}
