'use client'

import React, { useState, useRef } from 'react'
import type { DayBucket, TimeChartStyle } from '@/lib/adminAnalytics'
import {
  formatKampalaDisplayDate,
  calculateYAxisBounds,
  buildStepPath,
} from '@/lib/adminAnalytics'

interface AnalyticsTimeSeriesChartProps {
  data: DayBucket[]
  unit: string
  color: string
  chartStyle: TimeChartStyle
  width?: number
  height?: number
  floorBase?: boolean
  emptyMessage?: string
  ariaLabel?: string
}

export function AnalyticsTimeSeriesChart({
  data,
  unit,
  color,
  chartStyle,
  width = 960,
  height = 320,
  floorBase = false,
  emptyMessage,
  ariaLabel,
}: AnalyticsTimeSeriesChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const W = width
  const H = height
  const pl = 44
  const pr = 10
  const pt = 10
  const pb = 26
  const iw = Math.max(1, W - pl - pr)
  const ih = Math.max(1, H - pt - pb)
  const n = data.length

  const counts = data.map((d) => d.count)
  const totalCount = counts.reduce((acc, c) => acc + c, 0)
  const bounds = calculateYAxisBounds(counts, floorBase, chartStyle === 'bar')
  const lo = bounds.floor
  const nice = bounds.nice

  const y = (v: number) => {
    if (nice === lo) return pt + ih
    return pt + ih - ((v - lo) / (nice - lo)) * ih
  }

  const bw = n > 0 ? iw / n : iw
  const cx = (i: number) => {
    if (chartStyle === 'bar') {
      return pl + i * bw + bw / 2
    }
    return pl + (n > 1 ? (i / (n - 1)) * iw : iw / 2)
  }

  // 5 grid lines: 0, 25%, 50%, 75%, 100% of (nice - lo)
  const gridValues = [0, 1, 2, 3, 4].map((g) => lo + ((nice - lo) / 4) * g)

  // X axis labels
  const step = Math.max(1, Math.round(n / 6))
  const labelIndices: number[] = []
  for (let i = 0; i < n; i += step) {
    labelIndices.push(i)
  }
  if (n > 1 && !labelIndices.includes(n - 1)) {
    labelIndices.push(n - 1)
  }

  // Paths for line / area / step
  const pts: [number, number][] = data.map((d, i) => [cx(i), y(d.count)])
  let lineD = ''
  if (chartStyle === 'step') {
    lineD = buildStepPath(pts)
  } else if (pts.length > 0) {
    lineD = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')
  }

  const areaD =
    n > 0
      ? `${lineD} L${cx(n - 1).toFixed(1)} ${pt + ih} L${cx(0).toFixed(1)} ${pt + ih} Z`
      : ''

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || n === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const px = e.clientX - rect.left
    const sx = (px / rect.width) * W
    let i = 0
    if (chartStyle === 'bar') {
      i = Math.floor((sx - pl) / bw)
    } else {
      i = Math.round(((sx - pl) / iw) * (n - 1))
    }
    i = Math.max(0, Math.min(n - 1, i))
    setHoverIndex(i)
  }

  const handlePointerLeave = () => {
    setHoverIndex(null)
  }

  // Tooltip coordinates
  let tipLeftPercent = 0
  let tipTopPercent = 0
  if (hoverIndex !== null && data[hoverIndex]) {
    const ptX = cx(hoverIndex)
    const ptY = y(data[hoverIndex].count)
    tipLeftPercent = (ptX / W) * 100
    tipTopPercent = (ptY / H) * 100
  }

  return (
    <div className="relative">
      {totalCount === 0 && emptyMessage && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] rounded-lg p-6 text-center">
          <p className="text-sm text-[#5C5F73]">{emptyMessage}</p>
        </div>
      )}

      <div ref={wrapRef} className="relative w-full overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full h-auto block select-none overflow-visible cursor-crosshair"
          role="img"
          aria-label={ariaLabel || `${unit} over time`}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {/* Horizontal grid lines */}
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
                x={cx(i)}
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

          {/* Bar chart rendering */}
          {chartStyle === 'bar' &&
            data.map((d, i) => {
              const barX = pl + i * bw + bw * 0.16
              const barW = Math.max(2, bw * 0.68)
              const barY = y(d.count)
              const barH = Math.max(0, pt + ih - barY)
              const rx = Math.min(4, bw * 0.3)
              const opacity =
                hoverIndex === null ? 0.78 : hoverIndex === i ? 1 : 0.45
              return (
                <rect
                  key={d.date}
                  x={barX}
                  y={barY}
                  width={barW}
                  height={barH}
                  rx={rx}
                  fill={color}
                  opacity={opacity}
                  className="transition-opacity duration-150"
                />
              )
            })}

          {/* Non-bar (line, area, step) rendering */}
          {chartStyle !== 'bar' && n > 0 && (
            <>
              {chartStyle === 'area' && (
                <path d={areaD} fill={color} opacity="0.14" />
              )}
              <path
                d={lineD}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {hoverIndex !== null && data[hoverIndex] && (
                <g>
                  <line
                    x1={cx(hoverIndex)}
                    x2={cx(hoverIndex)}
                    y1={pt}
                    y2={pt + ih}
                    stroke="#232536"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={cx(hoverIndex)}
                    cy={y(data[hoverIndex].count)}
                    r="5"
                    fill="#FFFFFF"
                    stroke={color}
                    strokeWidth="2.5"
                  />
                </g>
              )}
            </>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoverIndex !== null && data[hoverIndex] && (
          <div
            className="absolute pointer-events-none bg-[#232536] text-white rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap shadow-md z-20"
            style={{
              left: `${Math.max(8, Math.min(92, tipLeftPercent))}%`,
              top: `${tipTopPercent}%`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <b className="block text-sm font-semibold">
              {data[hoverIndex].count.toLocaleString('en-US')} {unit}
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

