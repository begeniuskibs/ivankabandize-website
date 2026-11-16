'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import type { Digest } from '@/lib/digests/types'

interface DigestIndexViewProps {
  digests: Digest[]
}

const TOPICS = ['All', 'Faith', 'Technology', 'Work'] as const
type Topic = (typeof TOPICS)[number]

export default function DigestIndexView({ digests }: DigestIndexViewProps) {
  const [selectedTopic, setSelectedTopic] = useState<Topic>('All')

  const filteredDigests = digests.filter(
    (d) => selectedTopic === 'All' || d.topic === selectedTopic
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 font-sans">
      {/* Category Chip */}
      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#FBE0DA] text-[#CF3F29] mb-4">
        Report Digests
      </span>

      {/* Main Title & Lead */}
      <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-5xl lg:text-6xl font-bold text-[#232536] tracking-tight leading-[1.1] max-w-2xl text-balance">
        Long reports, read for you.
      </h1>
      <p className="text-base sm:text-lg text-[#5C5F73] max-w-2xl leading-relaxed mt-4 mb-8">
        I read the reports leaders keep meaning to read, and turn each one into
        something you can take in over a cup of tea. Every digest has a 2-minute
        version.
      </p>

      {/* Topic Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {TOPICS.map((topic) => {
          const isSelected = selectedTopic === topic
          return (
            <button
              key={topic}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[36px] ${
                isSelected
                  ? 'bg-[#232536] text-[#FDF8F1]'
                  : 'bg-[#F7EDE0] text-[#5C5F73] hover:text-[#232536] hover:bg-[#E8DCC4]'
              }`}
            >
              {topic}
            </button>
          )
        })}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {filteredDigests.map((digest) => (
          <article
            key={digest.slug}
            className="flex flex-col bg-white border border-[#F0E4D2] rounded-2xl p-6 transition-all duration-200 hover:border-[#CF3F29] hover:shadow-md"
          >
            {/* Color Cover Box */}
            <div
              className="rounded-xl p-5 mb-5 text-white flex flex-col justify-between min-h-[140px]"
              style={{ backgroundColor: digest.color }}
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                  {digest.topic}
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                  {digest.mins} min
                </span>
              </div>
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-lg sm:text-xl font-bold leading-snug line-clamp-2">
                {digest.title}
              </h2>
            </div>

            {/* Publisher */}
            <p className="text-xs sm:text-sm font-medium text-[#5C5F73] mb-4">
              {digest.pub}
            </p>

            {/* Key takeaway bullets */}
            <ul className="text-sm text-[#232536] space-y-2 mb-6 list-disc list-inside">
              {digest.key.map((bullet, idx) => (
                <li key={idx} className="leading-snug">
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-[#F5ECDE]">
              <Link
                href={`/garden/report-digests/${digest.slug}?v=2min`}
                className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#CF3F29] text-white hover:bg-[#b83420] transition-colors"
              >
                2-minute version
              </Link>
              <Link
                href={`/garden/report-digests/${digest.slug}`}
                className="inline-flex items-center justify-center px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-[#F0E4D2] text-[#232536] hover:border-[#CF3F29] hover:text-[#CF3F29] transition-colors"
              >
                Full digest
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
