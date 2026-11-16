'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { StatsBlock } from '@/lib/digests/types'

function cleanHtmlToStat(html: string): { num: string; prefix: string; suffix: string; small: string } {
  // Parses things like $<span data-n="194">0</span><small>bn</small>
  const nMatch = html.match(/data-n="([^"]+)"/)
  const targetNum = nMatch ? nMatch[1] : ''
  const smallMatch = html.match(/<small>([^<]+)<\/small>/)
  const small = smallMatch ? smallMatch[1] : ''
  
  let prefix = ''
  let suffix = ''
  
  if (html.startsWith('$')) prefix = '$'
  if (html.includes('%')) suffix = '%'
  if (html.includes('+')) suffix += '+'
  
  return { num: targetNum, prefix, suffix, small }
}

function StatCard({ item }: { item: [string, string] }) {
  const [rawHtml, label] = item
  const cardRef = useRef<HTMLDivElement>(null)
  const parsed = cleanHtmlToStat(rawHtml)
  const [displayVal, setDisplayVal] = useState<string>(() => parsed.num || rawHtml)

  useEffect(() => {
    if (!parsed.num) {
      return
    }

    const target = parseFloat(parsed.num)
    const isDecimal = parsed.num.includes('.')
    const decimals = isDecimal ? parsed.num.split('.')[1].length : 0

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          if (prefersReduced) {
            setDisplayVal(parsed.num)
            return
          }

          const start = 0
          const duration = 1000
          const startTime = performance.now()

          const step = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const current = start + (target - start) * easeOut
            setDisplayVal(current.toFixed(decimals))
            if (progress < 1) {
              requestAnimationFrame(step)
            } else {
              setDisplayVal(parsed.num)
            }
          }
          requestAnimationFrame(step)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )

    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [parsed.num, rawHtml])

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-6 shadow-2xs flex flex-col justify-between"
    >
      <div className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl font-bold text-[#232536] tracking-tight flex items-baseline gap-1">
        {parsed.num ? (
          <>
            {parsed.prefix}
            <span>{displayVal || '0'}</span>
            {parsed.suffix}
            {parsed.small && <small className="text-sm font-semibold text-[#5A5D70]">{parsed.small}</small>}
          </>
        ) : (
          <span
            dangerouslySetInnerHTML={{
              __html: rawHtml,
            }}
          />
        )}
      </div>
      <p className="text-xs sm:text-sm text-[#5A5D70] mt-3 leading-relaxed">{label}</p>
    </div>
  )
}

export default function StatsRenderer({ block }: { block: StatsBlock }) {
  const colCount = block.items.length
  const gridClasses =
    colCount === 2
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
      : colCount === 3
        ? 'grid grid-cols-1 sm:grid-cols-3 gap-4'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'

  return (
    <div className={gridClasses}>
      {block.items.map((item, idx) => (
        <StatCard key={idx} item={item} />
      ))}
    </div>
  )
}
