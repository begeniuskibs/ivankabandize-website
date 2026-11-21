import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { PublicResource } from '@/lib/resources'
import { kindLabel } from '@/lib/resourceUi'

// Resource card grid for the Garden Resources shelf
// House style: spaced hyphen " - " only

interface ResourcesShelfListProps {
  resources: PublicResource[]
}

export default function ResourcesShelfList({
  resources,
}: ResourcesShelfListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resources.map((item) => (
        <Link
          key={item.id}
          href={`/garden/resources/${item.slug}`}
          className="group flex flex-col justify-between bg-white border border-[#F0E4D2] hover:border-[#CF3F29] rounded-2xl p-6 sm:p-7 transition duration-200 shadow-xs hover:shadow-md text-left no-underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
        >
          <div>
            {/* Chips row */}
            <div className="flex flex-wrap items-center gap-2 mb-3.5">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EF5B45]/10 text-[#CF3F29]">
                {kindLabel(item.kind)}
              </span>
              {item.category && (
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F7EDE0] text-[#5C5F73]">
                  {item.category}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] group-hover:text-[#CF3F29] transition-colors mb-2 leading-snug">
              {item.title}
            </h3>

            {/* Summary */}
            <p className="text-sm text-[#5C5F73] leading-relaxed line-clamp-3">
              {item.summary}
            </p>
          </div>

          {/* Whole card is one link; subtle open cue at the bottom */}
          <div className="pt-5 mt-6 border-t border-[#F0E4D2]/60 flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#CF3F29] group-hover:text-[#b83420] transition-colors">
              <span>Open resource</span>
              <ArrowRight
                className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                aria-hidden="true"
              />
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
