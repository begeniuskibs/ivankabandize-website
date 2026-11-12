'use client'

import React from 'react'
import type { DayBucket } from '@/lib/adminAnalytics'
import { formatKampalaDisplayDate } from '@/lib/adminAnalytics'

interface AnalyticsMemberChartProps {
  data: DayBucket[]
  rangeDays: number
}

export function AnalyticsMemberChart({
  data,
  rangeDays,
}: AnalyticsMemberChartProps) {
  const W = 720
  const H = 220
  const pl = 44
  const pr = 10
  const pt = 10
  const pb = 26
  const iw = W - pl - pr
  const ih = H - pt - pb

  const counts = data.map((d) => d.count)
  const max = Math.max(...counts, 1)

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

  const gridValues = [0, 1, 2, 3, 4].map((g) => (nice / 4) * g)

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

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto block select-none overflow-visible"
        role="img"
        aria-label={`Cumulative member growth for the last ${rangeDays} days`}
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

        {/* Area fill and stroke */}
        <path d={areaD} fill="#2F9E7A" opacity="0.12" />
        <path
          d={lineD}
          fill="none"
          stroke="#2F9E7A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

