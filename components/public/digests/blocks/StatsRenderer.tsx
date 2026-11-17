'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { StatsBlock } from '@/lib/digests/types'

interface ParsedStat {
  num: string
  prefix: string
  suffix: string
  small: string
  num2: string
  suffix2: string
}

function cleanHtmlToStat(html: string): ParsedStat {
  const smallMatch = html.match(/<small>([^<]+)<\/small>/)
  const rawSmall = smallMatch ? smallMatch[1] : ''
  const hasPlusInSmall = rawSmall.trim().startsWith('+')
  const small = rawSmall.replace(/^\+\s*/, '')

  const [beforeSmall, afterSmall = ''] = smallMatch
    ? html.split(/<small>[^<]*<\/small>/)
    : [html, '']

  const nMatch1 = beforeSmall.match(/data-n="([^"]+)"/)
  const targetNum = nMatch1 ? nMatch1[1] : ''

  let prefix = ''
  let suffix = ''
  if (beforeSmall.trim().startsWith('$')) prefix = '$'
  if (beforeSmall.includes('%')) suffix += '%'
  if (beforeSmall.includes('+') || hasPlusInSmall) suffix += '+'

  const nMatch2 = afterSmall.match(/data-n="([^"]+)"/)
  const targetNum2 = nMatch2 ? nMatch2[1] : ''
  let suffix2 = ''
  if (afterSmall.includes('%')) suffix2 += '%'
  if (afterSmall.includes('+')) suffix2 += '+'

  return { num: targetNum, prefix, suffix, small, num2: targetNum2, suffix2 }
}

function StatCard({ item }: { item: [string, string] }) {
  const [rawHtml, label] = item
  const cardRef = useRef<HTMLDivElement>(null)
  const parsed = cleanHtmlToStat(rawHtml)
  const [displayVal, setDisplayVal] = useState<string>(() => parsed.num || rawHtml)
  const [displayVal2, setDisplayVal2] = useState<string>(() => parsed.num2 || '')

  useEffect(() => {
    if (!parsed.num) {
      return
    }

    const target = parseFloat(parsed.num)
    const isDecimal = parsed.num.includes('.')
    const decimals = isDecimal ? parsed.num.split('.')[1].length : 0

    const target2 = parsed.num2 ? parseFloat(parsed.num2) : 0
    const isDecimal2 = parsed.num2.includes('.')
    const decimals2 = isDecimal2 ? parsed.num2.split('.')[1].length : 0

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
          if (prefersReduced) {
            setDisplayVal(parsed.num)
            if (parsed.num2) setDisplayVal2(parsed.num2)
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
            if (parsed.num2) {
              const current2 = start + (target2 - start) * easeOut
              setDisplayVal2(current2.toFixed(decimals2))
            }
            if (progress < 1) {
              requestAnimationFrame(step)
            } else {
              setDisplayVal(parsed.num)
              if (parsed.num2) setDisplayVal2(parsed.num2)
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
  }, [parsed.num, parsed.num2, rawHtml])

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-6 shadow-2xs flex flex-col justify-start h-full"
    >
      <div
        className={`font-['MTN_Brighter_Sans',_sans-serif] ${
          parsed.num2 ? 'text-2xl sm:text-3xl lg:text-[32px]' : 'text-3xl sm:text-4xl'
        } font-bold text-[#232536] tracking-tight leading-[1.08] flex items-baseline gap-1 whitespace-nowrap h-10`}
      >
        {parsed.num ? (
          <>
            <span>
              {parsed.prefix}
              {displayVal || '0'}
              {parsed.suffix}
            </span>
            {parsed.small && (
              <small className="text-sm font-semibold text-[#5A5D70]">{parsed.small}</small>
            )}
            {parsed.num2 && (
              <span>
                {displayVal2 || '0'}
                {parsed.suffix2}
              </span>
            )}
          </>
        ) : (
          <span
            dangerouslySetInnerHTML={{
              __html: rawHtml,
            }}
          />
        )}
      </div>
      <p className="text-xs sm:text-sm text-[#5A5D70] mt-2.5 leading-relaxed">{label}</p>
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
