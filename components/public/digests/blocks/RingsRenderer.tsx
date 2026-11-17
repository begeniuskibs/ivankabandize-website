'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { RingsBlock } from '@/lib/digests/types'

export default function RingsRenderer({ block }: { block: RingsBlock }) {
  const [animated, setAnimated] = useState<boolean>(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const pctA = block.a[2] / 100
  const pctB = block.b[2] / 100

  const circ1 = 314.16 // 2 * PI * 50
  const circ2 = 213.63 // 2 * PI * 34

  useEffect(() => {
    if (!cardRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimated(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  const offsetA = animated ? circ1 * (1 - pctA) : circ1
  const offsetB = animated ? circ2 * (1 - pctB) : circ2

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl border border-[#F5ECDE] p-6 md:p-8 shadow-2xs mt-5 flex flex-col sm:flex-row items-center gap-6 sm:gap-8"
    >
      <div className="w-36 h-36 shrink-0 relative">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          {/* Outer circle background & fill */}
          <circle cx="60" cy="60" r="50" fill="none" stroke="#F5ECDE" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#1F8A5B"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ1}
            strokeDashoffset={offsetA}
            className="transition-[stroke-dashoffset] duration-1000 ease-out"
          />

          {/* Inner circle background & fill */}
          <circle cx="60" cy="60" r="34" fill="none" stroke="#F5ECDE" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="34"
            fill="none"
            stroke="#EF5B45"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ2}
            strokeDashoffset={offsetB}
            className="transition-[stroke-dashoffset] duration-1000 ease-out delay-200"
          />
        </svg>
      </div>

      <div className="flex-1 space-y-2.5 text-xs sm:text-sm">
        <p className="leading-snug">
          <strong className="text-[#1F8A5B] font-bold block sm:inline">{block.a[0]}</strong>{' '}
          <span className="text-[#5A5D70]">{block.a[1]}</span>
        </p>
        <p className="leading-snug">
          <strong className="text-[#CF3F29] font-bold block sm:inline">{block.b[0]}</strong>{' '}
          <span className="text-[#5A5D70]">{block.b[1]}</span>
        </p>
        <p className="text-[#5A5D70] pt-2 text-xs sm:text-sm leading-relaxed border-t border-[#F5ECDE]/80">
          {block.p}
        </p>
      </div>
    </div>
  )
}
