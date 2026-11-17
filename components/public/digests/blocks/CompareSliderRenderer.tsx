'use client'

import React, { useRef, useState, useEffect } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import type { CompareSliderBlock } from '@/lib/digests/types'

function splitMobileModelLabel(label: string): [string, string | null] {
  if (label.length <= 10 || !label.includes(' ')) {
    return [label, null]
  }
  const parts = label.split(' ')
  if (parts.length === 2) {
    return [parts[0], parts[1]]
  }
  // e.g. "Claude Sonnet 4.6" -> ["Claude", "Sonnet 4.6"], "Gemini 3 Flash" -> ["Gemini 3", "Flash"]
  if (parts[0].length >= parts[parts.length - 1].length) {
    return [parts[0], parts.slice(1).join(' ')]
  }
  return [parts.slice(0, -1).join(' '), parts[parts.length - 1]]
}

export default function CompareSliderRenderer({ block }: { block: CompareSliderBlock }) {
  const [sliderVal, setSliderVal] = useState<number>(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState<number>(720)

  useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()
    const ro = new ResizeObserver(updateWidth)
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const isMobile = containerWidth > 0 && containerWidth < 520

  const W = isMobile ? 288 : 720
  const H = isMobile ? 276 : 300
  const baseLineY = isMobile ? 202 : 250
  const chartHeight = isMobile ? 164 : 210
  const leftAxisX = isMobile ? 22 : 34
  const n = block.groups.length
  const per = Math.max(block.sub.length, 1)
  const y = (v: number) => baseLineY - (v / block.max) * chartHeight
  const gw = (W - (isMobile ? 26 : 60)) / n
  const barGap = isMobile ? 4 : 12
  const bw = isMobile
    ? Math.min(32, Math.floor((gw - 8 - (per - 1) * barGap) / per))
    : Math.min(78, (gw - 30) / per)

  const renderSvg = (k: 1 | 2, color: string) => {
    const gridLines = []
    for (let i = 1; i <= 4; i++) {
      const v = (block.max * i) / 4
      gridLines.push(
        <g key={i}>
          <line
            x1={leftAxisX}
            x2={W - 4}
            y1={y(v)}
            y2={y(v)}
            stroke="#F5ECDE"
            strokeWidth="1"
          />
          <text
            x={leftAxisX - 4}
            y={y(v) + 4}
            textAnchor="end"
            fontSize={isMobile ? '12' : '12'}
            fill="#5A5D70"
          >
            {+v.toFixed(1)}
          </text>
        </g>
      )
    }

    const groupElements = block.groups.map((m, i) => {
      const startOffset = isMobile ? 24 : 46
      const x0 = startOffset + i * gw + (gw - per * bw - (per - 1) * barGap) / 2
      const groupLabelX = x0 + (per * bw + (per - 1) * barGap) / 2
      const values = m[k] || []
      const [line1, line2] = isMobile ? splitMobileModelLabel(m[0]) : [m[0], null]

      return (
        <g key={i}>
          <text
            x={groupLabelX}
            y={isMobile ? (line2 ? '252' : '258') : '290'}
            textAnchor="middle"
            fontSize={isMobile ? '12' : '13'}
            fontWeight="600"
            fill="#232536"
          >
            {line2 ? (
              <>
                <tspan x={groupLabelX} dy="0">
                  {line1}
                </tspan>
                <tspan x={groupLabelX} dy="14">
                  {line2}
                </tspan>
              </>
            ) : (
              line1
            )}
          </text>
          {values.map((v, j) => {
            const x = x0 + j * (bw + barGap)
            const barH = baseLineY - y(v)
            const subY = isMobile ? (per >= 2 && j % 2 === 1 ? 231 : 217) : 268

            return (
              <g key={j}>
                <rect
                  x={x}
                  y={y(v)}
                  width={bw}
                  height={Math.max(barH, 0)}
                  rx={isMobile ? '4' : '6'}
                  fill={color}
                />
                <text
                  x={x + bw / 2}
                  y={y(v) - 6}
                  textAnchor="middle"
                  fontSize={isMobile ? '12' : '12'}
                  fontWeight="bold"
                  fill="#232536"
                >
                  {v.toFixed(block.dec)}
                  {block.suf || ''}
                </text>
                {block.sub[j] && (
                  <text
                    x={x + bw / 2}
                    y={subY}
                    textAnchor="middle"
                    fontSize={isMobile ? '11.5' : '11'}
                    fill="#5A5D70"
                  >
                    {block.sub[j]}
                  </text>
                )}
              </g>
            )
          })}
        </g>
      )
    })

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block bg-white"
        preserveAspectRatio="xMidYMid meet"
      >
        {gridLines}
        {groupElements}
      </svg>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F5ECDE] max-md:p-4 p-5 md:p-7 shadow-2xs mt-5">
      {/* Legend header */}
      <div className="flex justify-between items-center gap-3 flex-wrap text-xs sm:text-sm font-bold pb-4 border-b border-[#F5ECDE]/60">
        <span className="text-[#CF3F29] flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 bg-[#EF5B45] rounded-xs shrink-0" />
          <span>{block.la}</span>
        </span>
        <span className="text-[#1F8A5B] flex items-center gap-1.5">
          <span>{block.lb}</span>
          <span className="inline-block w-2.5 h-2.5 bg-[#1F8A5B] rounded-xs shrink-0" />
        </span>
      </div>

      {/* Compare interactive container */}
      <div
        ref={containerRef}
        className="relative overflow-hidden mt-4 rounded-xl border border-[#F5ECDE] select-none"
      >
        {/* Underlayer (Right side / Green #1F8A5B) */}
        <div className="w-full">{renderSvg(2, '#1F8A5B')}</div>

        {/* Top layer (Left side / Coral #EF5B45) clipped */}
        <div
          className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-[#232536]"
          style={{ width: `${sliderVal}%` }}
        >
          <div style={{ width: `${containerWidth}px` }}>{renderSvg(1, '#EF5B45')}</div>
        </div>

        {/* Divider handle (44px touch target on mobile, unchanged on desktop) */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none flex items-center justify-center max-md:-ml-5.5 -ml-3.5 z-10"
          style={{ left: `${sliderVal}%` }}
        >
          <div className="max-md:w-11 max-md:h-11 w-7 h-7 rounded-full bg-[#232536] text-white flex items-center justify-center shadow-md">
            <ArrowLeftRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </div>
        </div>

        {/* Hidden range slider capturing clicks/drags */}
        <input
          type="range"
          min="0"
          max="100"
          value={sliderVal}
          onChange={(e) => setSliderVal(Number(e.target.value))}
          aria-label="Compare slider"
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
        />
      </div>

      {/* Footnote */}
      <p className="text-xs text-[#5A5D70] mt-3 leading-relaxed">{block.src}</p>
    </div>
  )
}
