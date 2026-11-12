'use client'

import React, { useState, useRef } from 'react'
import type { DayBucket } from '@/lib/adminAnalytics'
import { formatKampalaDisplayDate } from '@/lib/adminAnalytics'

interface AnalyticsViewsChartProps {
  data: DayBucket[]
  totalViews: number
  rangeDays: number
}

export function AnalyticsViewsChart({
  data,
  totalViews,
  rangeDays,
}: AnalyticsViewsChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = 720
  const H = 260
  const pl = 44
  const pr = 10
  const pt = 10
  const pb = 26
  const iw = W - pl - pr
  const ih = H - pt - pb

  const counts = data.map((d) => d.count)
  const max = Math.max(...counts, 0)

  let nice = 4
  if (max > 100) {
    nice = Math.ceil(max / 50) * 50
  } else if (max > 20) {
    nice = Math.ceil(max / 20) * 20
  } else if (max > 10) {
    nice = 20
  } else if (max > 4) {
    nice = 10
  } else {
    nice = 4
  }

  const x = (i: number) => pl + (i / Math.max(1, data.length - 1)) * iw
  const y = (v: number) => pt + ih - (v / nice) * ih

  // Grid values (5 lines: 0, 25%, 50%, 75%, 100%)
  const gridValues = [0, 1, 2, 3, 4].map((g) => (nice / 4) * g)

  // Label indices along x axis
  const step = Math.max(1, Math.round(data.length / 6))
  const labelIndices: number[] = []
  for (let i = 0; i < data.length; i += step) {
    labelIndices.push(i)
  }
  if (!labelIndices.includes(data.length - 1) && data.length > 1) {
    labelIndices.push(data.length - 1)
  }

  const pts = data.map((d, i) => [x(i), y(d.count)])
  const lineD = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')
  const areaD = `${lineD} L${x(data.length - 1).toFixed(1)} ${pt + ih} L${x(0).toFixed(1)} ${pt + ih} Z`

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const sx = (cx / rect.width) * W
    let i = Math.round(((sx - pl) / iw) * (data.length - 1))
    i = Math.max(0, Math.min(data.length - 1, i))
    setHoverIndex(i)
  }

  const handlePointerLeave = () => {
    setHoverIndex(null)
  }

  // Calculate tooltip screen position
  let tipLeftPercent = 0
  let tipTopPercent = 0
  if (hoverIndex !== null && data[hoverIndex]) {
    const ptX = x(hoverIndex)
    const ptY = y(data[hoverIndex].count)
    tipLeftPercent = (ptX / W) * 100
    tipTopPercent = (ptY / H) * 100
  }

  return (
    <div className="relative">
      {totalViews === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-lg p-6 text-center">
          <p className="text-sm text-[#5C5F73]">
            No views counted in this period yet. Counting began on 12 Nov 2026.
          </p>
        </div>
      )}

      <div ref={wrapRef} className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block select-none overflow-visible cursor-crosshair"
          role="img"
          aria-label={`Article views per day for the last ${rangeDays} days`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {/* Horizontal Grid lines */}
          {gridValues.map((v) => {
            const lineY = y(v)
            return (
              <g key={v}>
                <line
                  x1={pl}
                  x2={W - pr}
                  y1={lineY}
                  y2={lineY}
                  stroke="#EDE3D3"
                  strokeWidth="1"
                />
                <text
                  x={pl - 8}
                  y={lineY + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#5C5F73"
                  fontFamily="inherit"
                >
                  {Math.round(v)}
                </text>
              </g>
            )
          })}

          {/* X axis date labels */}
          {labelIndices.map((i) => {
            const item = data[i]
            if (!item) return null
            return (
              <text
                key={item.date}
                x={x(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize="11"
                fill="#5C5F73"
                fontFamily="inherit"
              >
                {formatKampalaDisplayDate(item.date)}
              </text>
            )
          })}

          {/* Area fill and curve stroke */}
          <path d={areaD} fill="#CF3F29" opacity="0.12" />
          <path
            d={lineD}
            fill="none"
            stroke="#CF3F29"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Hover indicator: vertical dashed line & point */}
          {hoverIndex !== null && data[hoverIndex] && (
            <g>
              <line
                x1={x(hoverIndex)}
                x2={x(hoverIndex)}
                y1={pt}
                y2={pt + ih}
                stroke="#232536"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={x(hoverIndex)}
                cy={y(data[hoverIndex].count)}
                r="5"
                fill="#FFFFFF"
                stroke="#CF3F29"
                strokeWidth="2.5"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute pointer-events-none bg-[#232536] text-white rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md z-20"
            style={{
              left: `${tipLeftPercent}%`,
              top: `${tipTopPercent}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <b className="block text-sm font-semibold">
              {data[hoverIndex].count.toLocaleString('en-US')} views
            </b>
            <span className="text-[#C9CBDA] text-[11px]">
              {formatKampalaDisplayDate(data[hoverIndex].date, true)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

