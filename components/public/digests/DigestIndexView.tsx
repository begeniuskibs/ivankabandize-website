'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DIGESTS } from '@/lib/digests'

const TOPICS = ['All', 'Faith', 'Technology', 'Work'] as const
type Topic = (typeof TOPICS)[number]

export default function DigestIndexView() {
  const [selectedTopic, setSelectedTopic] = useState<Topic>('All')

  const filteredDigests = DIGESTS.filter(
    (d) => selectedTopic === 'All' || d.topic === selectedTopic
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Topic Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        {TOPICS.map((topic) => {
          const isSelected = selectedTopic === topic
          return (
            <button
              key={topic}
              type="button"
              onClick={() => setSelectedTopic(topic)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors min-h-[36px] cursor-pointer ${
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
                className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#CF3F29] text-white hover:bg-[#b83420] transition-colors"
              >
                <span>2-minute version</span>
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                />
              </Link>
              <Link
                href={`/garden/report-digests/${digest.slug}`}
                className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-[#F0E4D2] text-[#232536] hover:border-[#CF3F29] hover:text-[#CF3F29] transition-colors"
              >
                <span>Full digest</span>
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
