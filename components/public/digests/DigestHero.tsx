'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { DigestHeroArt } from '@/lib/digests/types'

interface DigestHeroProps {
  kick: string
  h1: string
  lead: string
  facts: [number, string][]
  credit: string
  heroArt: DigestHeroArt
  isFull: boolean
  onToggleFull: (full: boolean) => void
  onJumpToStart: () => void
}

function AnimatedFact({ target, label }: { target: number | string; label: string }) {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    typeof target === 'number' ? '0' : String(target)
  )
  const ref = useRef<HTMLDivElement>(null)
  const animatedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || animatedRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animatedRef.current) {
          animatedRef.current = true
          const finalNum =
            typeof target === 'number' ? target : parseFloat(String(target).replace(/,/g, ''))

          if (isNaN(finalNum)) {
            setDisplayValue(String(target))
            return
          }

          const prefersReduced =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches
          if (prefersReduced) {
            setDisplayValue(typeof target === 'number' ? target.toLocaleString() : String(target))
            return
          }

          const duration = 800
          const startTime = performance.now()

          const update = (now: number) => {
            const elapsed = now - startTime
            const progress = Math.min(elapsed / duration, 1)
            const ease = 1 - Math.pow(1 - progress, 3)
            const current = Math.floor(finalNum * ease)
            setDisplayValue(current.toLocaleString())

            if (progress < 1) {
              requestAnimationFrame(update)
            } else {
              setDisplayValue(
                typeof target === 'number' ? target.toLocaleString() : String(target)
              )
            }
          }
          requestAnimationFrame(update)
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target])

  return (
    <div ref={ref} className="flex flex-col min-w-0">
      <span className="font-['MTN_Brighter_Sans',_sans-serif] tabular-nums text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
        {displayValue}
      </span>
      <span className="text-xs sm:text-sm text-[#A9ABC0] mt-1 max-w-[200px] leading-snug">
        {label}
      </span>
    </div>
  )
}

function HeroIllustration({ heroArt, className }: { heroArt: DigestHeroArt; className: string }) {
  const dotTiming = (i: number): React.CSSProperties => ({
    animationDuration: `${(2.6 + (i % 7) * 0.42).toFixed(2)}s`,
    animationDelay: `-${((i * 0.37) % 3.8).toFixed(2)}s`,
  })

  if (heroArt === 'trends') {
    // 14 trends in a constellation/orbit layout: 4 inner coral AI trends + 10 outer trends
    const innerCoords: [number, number][] = [
      [115, 62],
      [153, 100],
      [115, 138],
      [77, 100],
    ]
    const outerCoords: [number, number][] = Array.from({ length: 10 }, (_, idx) => {
      const angle = (idx * 2 * Math.PI) / 10 - Math.PI / 2
      return [
        Math.round(115 + Math.cos(angle) * 76),
        Math.round(100 + Math.sin(angle) * 76),
      ]
    })

    return (
      <svg className={className} viewBox="0 0 230 200" aria-hidden="true">
        {/* Subtle orbit rings and constellation spokes */}
        <circle
          cx="115"
          cy="100"
          r="38"
          fill="none"
          stroke="#5C5F73"
          strokeWidth="1"
          strokeDasharray="3 4"
          opacity="0.45"
        />
        <circle
          cx="115"
          cy="100"
          r="76"
          fill="none"
          stroke="#5C5F73"
          strokeWidth="1"
          strokeDasharray="3 5"
          opacity="0.35"
        />
        {innerCoords.map(([x, y], i) => {
          const [ox, oy] = outerCoords[(i * 2) % 10]
          return (
            <line
              key={`line-${i}`}
              x1={x}
              y1={y}
              x2={ox}
              y2={oy}
              stroke="#5C5F73"
              strokeWidth="1"
              opacity="0.35"
            />
          )
        })}
        {/* 4 highlighted coral dots for AI trends */}
        {innerCoords.map(([cx, cy], i) => (
          <circle
            key={`ai-${i}`}
            cx={cx}
            cy={cy}
            r={8.5}
            fill="#EF5B45"
            className="digest-hero-dot"
            style={dotTiming(i)}
          />
        ))}
        {/* 10 outer trend dots */}
        {outerCoords.map(([cx, cy], i) => (
          <circle
            key={`outer-${i}`}
            cx={cx}
            cy={cy}
            r={i % 3 === 0 ? 7 : 5.5}
            fill={i % 2 === 0 ? '#9FE3C5' : '#5C5F73'}
            className="digest-hero-dot"
            style={dotTiming(i + 4)}
          />
        ))}
      </svg>
    )
  }

  if (heroArt === 'coverage') {
    // 50 dots (5 rows x 10 cols, each dot = 2%): 33% observed (17 coral) vs 94% possible (30 mint) vs 6% unexposed (3 dim)
    return (
      <svg className={className} viewBox="0 0 230 200" aria-hidden="true">
        {Array.from({ length: 50 }, (_, i) => {
          const cx = 18 + (i % 10) * 21.5
          const cy = 28 + Math.floor(i / 10) * 35
          const isObserved = i < 17
          const isPossible = i >= 17 && i < 47

          if (isObserved) {
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={6.5}
                fill="#EF5B45"
                className="digest-hero-dot"
                style={dotTiming(i)}
              />
            )
          }

          if (isPossible) {
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={6}
                fill="#9FE3C5"
                fillOpacity="0.28"
                stroke="#9FE3C5"
                strokeWidth="1.6"
                className="digest-hero-dot"
                style={dotTiming(i)}
              />
            )
          }

          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={5.5}
              fill="none"
              stroke="#5C5F73"
              strokeWidth="1.5"
              opacity="0.45"
              className="digest-hero-dot"
              style={dotTiming(i)}
            />
          )
        })}
      </svg>
    )
  }

  // Default: "models" (46 AI models in 8-column matrix)
  return (
    <svg className={className} viewBox="0 0 230 200" aria-hidden="true">
      {Array.from({ length: 46 }, (_, i) => (
        <circle
          key={i}
          cx={20 + (i % 8) * 27}
          cy={20 + Math.floor(i / 8) * 30}
          r={i % 5 === 0 ? 8 : 6}
          fill={i % 7 === 3 ? '#EF5B45' : i % 4 === 1 ? '#9FE3C5' : '#5C5F73'}
          className="digest-hero-dot"
          style={dotTiming(i)}
        />
      ))}
    </svg>
  )
}

export default function DigestHero({
  kick,
  h1,
  lead,
  facts,
  credit,
  heroArt,
  isFull,
  onToggleFull,
  onJumpToStart,
}: DigestHeroProps) {
  const headerRef = useRef<HTMLElement>(null)
  const [isHeroVisible, setIsHeroVisible] = useState(true)

  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting)
      },
      { threshold: 0 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Parse <em> tags in h1 safely
  const h1Parts = h1.split(/(<em>.*?<\/em>)/g)
  // Parse <b> tags in credit safely
  const creditParts = credit.split(/(<b>.*?<\/b>)/g)

  return (
    <header
      ref={headerRef}
      className={`relative bg-[#232536] text-[#FDF8F1] overflow-hidden pt-8 pb-12 sm:py-16 ${
        !isHeroVisible ? 'digest-hero-paused' : ''
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Hero illustration: own block above text on mobile, positioned right on desktop */}
        <HeroIllustration
          heroArt={heroArt}
          className="max-md:block max-md:w-36 max-md:h-auto max-md:mb-4 md:absolute md:right-6 lg:right-8 md:top-2 md:w-64 lg:w-88 md:h-auto opacity-85 pointer-events-none"
        />

        <div className="min-w-0 md:pr-68 lg:pr-96">
          <p className="text-xs font-bold uppercase tracking-widest text-[#EF5B45] mb-3">
            {kick}
          </p>

          <h1
            className="font-['MTN_Brighter_Sans',_sans-serif] text-[clamp(1.75rem,6.5vw,3.5rem)] sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight max-w-full min-w-0 wrap-anywhere text-balance"
            style={{ overflowWrap: 'anywhere' }}
          >
            {h1Parts.map((part, idx) => {
              if (part.startsWith('<em>') && part.endsWith('</em>')) {
                const text = part.slice(4, -5)
                return (
                  <em
                    key={idx}
                    className="font-['Fraunces',_serif] italic font-normal text-[#9FE3C5]"
                  >
                    {text}
                  </em>
                )
              }
              return <React.Fragment key={idx}>{part}</React.Fragment>
            })}
          </h1>

          <p className="text-base sm:text-lg text-[#C9CADA] max-w-2xl leading-relaxed mt-4 mb-6">
            {lead}
          </p>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <button
              type="button"
              onClick={onJumpToStart}
              className="group inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#CF3F29] text-white hover:bg-[#b83420] transition-colors shadow-sm min-h-[44px] cursor-pointer"
            >
              <span>Give me the 2-minute version</span>
              <ArrowRight
                size={14}
                strokeWidth={2.5}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
              />
            </button>
            {!isFull && (
              <button
                type="button"
                onClick={() => onToggleFull(true)}
                className="group inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm bg-transparent text-[#FDF8F1] border border-white/30 hover:border-white/60 transition-colors min-h-[44px] cursor-pointer"
              >
                <span>Show the full digest</span>
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                />
              </button>
            )}
          </div>
        </div>

        {/* Fact counters */}
        {facts && facts.length > 0 && (
          <div className="border-t border-white/15 pt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {facts.map(([num, lbl], i) => (
              <AnimatedFact key={i} target={num} label={lbl} />
            ))}
          </div>
        )}

        {/* Credit */}
        <p className="text-xs text-[#A9ABC0] mt-6 max-w-2xl leading-relaxed">
          {creditParts.map((part, idx) => {
            if (part.startsWith('<b>') && part.endsWith('</b>')) {
              return (
                <strong key={idx} className="text-[#FDF8F1] font-semibold">
                  {part.slice(3, -4)}
                </strong>
              )
            }
            return <React.Fragment key={idx}>{part}</React.Fragment>
          })}
        </p>
      </div>
    </header>
  )
}
