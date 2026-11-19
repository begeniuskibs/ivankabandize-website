'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { PublicResource } from '@/lib/resources'
import {
  kindLabel,
  shouldShowCategoryFilter,
  filterResourcesByCategory,
} from '@/lib/resourceUi'

// Interactive client-side category filter and resource card grid
// House style: spaced hyphen " - " only

interface ResourcesShelfListProps {
  resources: PublicResource[]
}

export default function ResourcesShelfList({
  resources,
}: ResourcesShelfListProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')

  // Category filter is shown ONLY when there are 4 or more published resources
  const showFilter = shouldShowCategoryFilter(resources.length)

  // Extract distinct non-empty categories
  const categories = useMemo(() => {
    if (!showFilter) return []
    const cats = new Set<string>()
    for (const r of resources) {
      if (r.category && r.category.trim()) {
        cats.add(r.category.trim())
      }
    }
    return ['All', ...Array.from(cats)]
  }, [resources, showFilter])

  // Filter client-side without any network calls
  const visibleResources = useMemo(() => {
    if (!showFilter) return resources
    return filterResourcesByCategory(resources, selectedCategory)
  }, [resources, selectedCategory, showFilter])

  return (
    <div>
      {/* Category chips filter row: only when 4 or more resources exist */}
      {showFilter && categories.length > 1 && (
        <div
          role="group"
          aria-label="Filter resources by category"
          className="flex flex-wrap items-center gap-2 mb-8"
        >
          {categories.map((cat) => {
            const isActive =
              selectedCategory.toLowerCase() === cat.toLowerCase()
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2 ${
                  isActive
                    ? 'bg-[#232536] text-[#FDF8F1] shadow-xs'
                    : 'bg-white text-[#5C5F73] border border-[#F0E4D2] hover:border-[#232536]/30 hover:text-[#232536]'
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>
      )}

      {/* Resource Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleResources.map((item) => (
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
    </div>
  )
}
