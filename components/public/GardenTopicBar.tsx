'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import {
  TOPIC_ALL_CHIP_ACTIVE,
  TOPIC_ALL_CHIP_INACTIVE,
  TOPIC_CHIP_ACTIVE,
  TOPIC_CHIP_INACTIVE,
} from '@/lib/gardenChipStyles'
import type { GardenTopicItem } from '@/lib/gardenTopicBar'

// Unified topic filter bar supporting desktop scrollable chip row and mobile pill select
// House style: spaced hyphen " - " only

export interface GardenTopicBarProps {
  items: GardenTopicItem[]
  activeKey: string
  onSelect?: (key: string) => void
  className?: string
}

export default function GardenTopicBar({
  items,
  activeKey,
  onSelect,
  className = '',
}: GardenTopicBarProps) {
  const router = useRouter()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Update left/right scroll arrows based on scroll position and content overflow
  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    // Tolerance of 2px for subpixel rendering
    setCanScrollLeft(scrollLeft > 2)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    updateScrollState()
    el.addEventListener('scroll', updateScrollState, { passive: true })

    const ro = new ResizeObserver(() => {
      updateScrollState()
    })
    ro.observe(el)

    window.addEventListener('resize', updateScrollState)

    return () => {
      el.removeEventListener('scroll', updateScrollState)
      ro.disconnect()
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState, items])

  // On load or activeKey change, scroll the active chip into view if it is off-screen
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const activeEl = container.querySelector('[data-active="true"]') as HTMLElement | null
    if (activeEl) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches

      const containerLeft = container.scrollLeft
      const containerRight = containerLeft + container.clientWidth
      const activeLeft = activeEl.offsetLeft
      const activeRight = activeLeft + activeEl.offsetWidth

      if (activeLeft < containerLeft || activeRight > containerRight) {
        activeEl.scrollIntoView({
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
          block: 'nearest',
          inline: 'center',
        })
      }
    }
    updateScrollState()
  }, [activeKey, updateScrollState])

  // Scroll by ~70% of the visible container width
  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const scrollAmount = container.clientWidth * 0.7
    const target =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount
    container.scrollTo({
      left: target,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  // Handle native mobile select change
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedKey = e.target.value
    const found = items.find((item) => item.key === selectedKey)
    if (onSelect) {
      onSelect(selectedKey)
    } else if (found?.href) {
      router.push(found.href)
    }
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Mobile view: native <select> styled as pill */}
      <div className="md:hidden w-full max-w-xs">
        <div className="relative">
          <select
            aria-label="Filter by topic"
            value={activeKey}
            onChange={handleSelectChange}
            className="w-full appearance-none rounded-full px-4 py-2 pr-9 text-xs font-medium bg-white text-[#5A5D70] border border-[#F5ECDE] shadow-2xs hover:border-[#232536]/30 focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-[#232536] focus-visible:outline-offset-1 transition cursor-pointer"
          >
            {items.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[#5A5D70]">
            <ChevronDown size={14} strokeWidth={2.5} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Desktop view: single-row scrollable chip list with chevrons */}
      <div className="hidden md:block relative w-full">
        {/* Left scroll chevron with soft cream fade */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center pr-8 bg-gradient-to-r from-[#FAF3E8] via-[#FAF3E8]/90 to-transparent z-10 pointer-events-none">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              aria-label="Show earlier topics"
              className="pointer-events-auto w-7 h-7 rounded-full bg-white border border-[#E8DCC4] shadow-xs flex items-center justify-center text-[#232536] hover:bg-[#FAF3E8] hover:border-[#232536]/30 transition focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-[#232536] focus-visible:outline-offset-1 cursor-pointer"
            >
              <ChevronLeft size={14} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Scrollable Chip Row */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-0.5"
        >
          {items.map((item) => {
            const isActive = item.key === activeKey
            const chipClass =
              item.key === 'all'
                ? isActive
                  ? TOPIC_ALL_CHIP_ACTIVE
                  : TOPIC_ALL_CHIP_INACTIVE
                : isActive
                ? TOPIC_CHIP_ACTIVE
                : TOPIC_CHIP_INACTIVE

            if (item.href && !onSelect) {
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  data-active={isActive}
                  className={`shrink-0 ${chipClass}`}
                >
                  {item.label}
                </Link>
              )
            }

            return (
              <button
                key={item.key}
                type="button"
                data-active={isActive}
                onClick={() => onSelect?.(item.key)}
                className={`shrink-0 ${chipClass}`}
              >
                {item.label}
              </button>
            )
          })}
        </div>

        {/* Right scroll chevron with soft cream fade */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center pl-8 bg-gradient-to-l from-[#FAF3E8] via-[#FAF3E8]/90 to-transparent z-10 pointer-events-none">
            <button
              type="button"
              onClick={() => handleScroll('right')}
              aria-label="Show more topics"
              className="pointer-events-auto w-7 h-7 rounded-full bg-white border border-[#E8DCC4] shadow-xs flex items-center justify-center text-[#232536] hover:bg-[#FAF3E8] hover:border-[#232536]/30 transition focus-visible:outline focus-visible:outline-[2px] focus-visible:outline-[#232536] focus-visible:outline-offset-1 cursor-pointer"
            >
              <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
