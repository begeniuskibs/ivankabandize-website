'use client'

import React from 'react'

interface DigestProgressRingProps {
  currentSection: number
  totalSections: number
  progressPercent: number
  onClick?: () => void
}

export default function DigestProgressRing({
  currentSection,
  totalSections,
  progressPercent,
  onClick,
}: DigestProgressRingProps) {
  // r = 24, perimeter = 2 * PI * 24 ≈ 150.8
  const radius = 24
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(Math.max(progressPercent, 0), 1))

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`Section ${currentSection + 1} of ${totalSections}`}
      className="fixed right-4 bottom-5 sm:right-8 sm:bottom-8 z-40 w-14 h-14 rounded-full bg-white shadow-lg border border-[#F5ECDE] flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 select-none"
    >
      <svg className="absolute inset-0 w-full h-full -rotate-90 p-1" viewBox="0 0 60 60">
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke="#F5ECDE"
          strokeWidth="3.5"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          stroke="#CF3F29"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-300 ease-out"
        />
      </svg>
      <span className="relative z-10 font-['MTN_Brighter_Sans',_sans-serif] text-xs font-bold text-[#232536]">
        {currentSection + 1}/{totalSections}
      </span>
    </div>
  )
}
