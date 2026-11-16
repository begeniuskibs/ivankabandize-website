'use client'

import React, { useRef, useState, useEffect } from 'react'
import type { CompareSliderBlock } from '@/lib/digests/types'

export default function CompareSliderRenderer({ block }: { block: CompareSliderBlock }) {
  const [sliderVal, setSliderVal] = useState<number>(25)
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

  const W = 720
  const H = 300
  const n = block.groups.length
  const per = Math.max(block.sub.length, 1)
  const y = (v: number) => 250 - (v / block.max) * 210
  const gw = (W - 60) / n
  const bw = Math.min(78, (gw - 30) / per)

  const renderSvg = (k: 1 | 2, color: string) => {
    const gridLines = []
    for (let i = 1; i <= 4; i++) {
      const v = (block.max * i) / 4
      gridLines.push(
        <g key={i}>
          <line
            x1="34"
            x2={W - 6}
            y1={y(v)}
            y2={y(v)}
            stroke="#F5ECDE"
            strokeWidth="1"
          />
          <text
            x="26"
            y={y(v) + 4}
            textAnchor="end"
            fontSize="12"
            fill="#5A5D70"
            fontFamily="var(--font-sans), system-ui, sans-serif"
          >
            {+v.toFixed(1)}
          </text>
        </g>
      )
    }

    const groupElements = block.groups.map((m, i) => {
      const x0 = 46 + i * gw + (gw - per * bw - (per - 1) * 12) / 2
      const groupLabelX = x0 + (per * bw + (per - 1) * 12) / 2
      const values = m[k] || []

      return (
        <g key={i}>
          <text
            x={groupLabelX}
            y="290"
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fill="#232536"
            fontFamily="var(--font-sans), system-ui, sans-serif"
          >
            {m[0]}
          </text>
          {values.map((v, j) => {
            const x = x0 + j * (bw + 12)
            const barH = 250 - y(v)
            return (
              <g key={j}>
                <rect
                  x={x}
                  y={y(v)}
                  width={bw}
                  height={Math.max(barH, 0)}
                  rx="6"
                  fill={color}
                />
                <text
                  x={x + bw / 2}
                  y={y(v) - 7}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="bold"
                  fill="#232536"
                  fontFamily="var(--font-sans), system-ui, sans-serif"
                >
                  {v.toFixed(block.dec)}
                  {block.suf || ''}
                </text>
                {block.sub[j] && (
                  <text
                    x={x + bw / 2}
                    y="268"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#5A5D70"
                    fontFamily="var(--font-sans), system-ui, sans-serif"
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
    <div className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-7 shadow-2xs mt-5">
      {/* Legend header */}
      <div className="flex justify-between items-center gap-4 flex-wrap text-xs sm:text-sm font-bold pb-4 border-b border-[#F5ECDE]/60">
        <span className="text-[#CF3F29] flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 bg-[#EF5B45] rounded-xs" />
          {block.la}
        </span>
        <span className="text-[#1F8A5B] flex items-center gap-1.5">
          {block.lb}
          <span className="inline-block w-2.5 h-2.5 bg-[#1F8A5B] rounded-xs" />
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

        {/* Divider handle */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none flex items-center justify-center -ml-3.5 z-10"
          style={{ left: `${sliderVal}%` }}
        >
          <div className="w-7 h-7 rounded-full bg-[#232536] text-white flex items-center justify-center shadow-md text-xs font-bold">
            ↔
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
