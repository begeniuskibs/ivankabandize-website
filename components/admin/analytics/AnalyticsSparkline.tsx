import React from 'react'

interface AnalyticsSparklineProps {
  data: number[]
  color: string
}

export function AnalyticsSparkline({ data, color }: AnalyticsSparklineProps) {
  const w = 200
  const h = 38

  if (!data || data.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="w-full h-[38px] mt-2 block"
      >
        <line
          x1="0"
          y1={h - 4}
          x2={w}
          y2={h - 4}
          stroke="#EDE3D3"
          strokeWidth="2"
        />
      </svg>
    )
  }

  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1

  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w
    const y = h - 3 - ((v - min) / range) * (h - 8)
    return [x, y]
  })

  const lineD = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L')
  const areaD = `${lineD} L${w} ${h} L0 ${h} Z`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className="w-full h-[38px] mt-2 block"
      role="img"
      aria-hidden="true"
    >
      <path d={areaD} fill={color} opacity="0.12" />
      <path
        d={lineD}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

