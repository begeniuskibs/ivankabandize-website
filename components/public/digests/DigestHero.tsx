'use client'

import React, { useEffect, useRef, useState } from 'react'

interface DigestHeroProps {
  kick: string
  h1: string
  lead: string
  facts: [number, string][]
  credit: string
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
          const finalNum = typeof target === 'number' ? target : parseFloat(String(target).replace(/,/g, ''))

          if (isNaN(finalNum)) {
            setDisplayValue(String(target))
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
              setDisplayValue(typeof target === 'number' ? target.toLocaleString() : String(target))
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
    <div ref={ref} className="flex flex-col">
      <span className="font-['Outfit',_sans-serif] text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
        {displayValue}
      </span>
      <span className="text-xs sm:text-sm text-[#A9ABC0] mt-1 max-w-[200px] leading-snug">
        {label}
      </span>
    </div>
  )
}

export default function DigestHero({
  kick,
  h1,
  lead,
  facts,
  credit,
  isFull,
  onToggleFull,
  onJumpToStart,
}: DigestHeroProps) {
  // Parse <em> tags in h1 safely
  const h1Parts = h1.split(/(<em>.*?<\/em>)/g)

  return (
    <header className="relative bg-[#232536] text-[#FDF8F1] overflow-hidden pt-12 pb-14 sm:py-16 font-sans">
      {/* Decorative dot matrix pattern */}
      <svg
        className="absolute right-0 top-4 w-40 sm:w-72 lg:w-96 h-auto opacity-60 pointer-events-none"
        viewBox="0 0 230 200"
        aria-hidden="true"
      >
        {Array.from({ length: 46 }, (_, i) => (
          <circle
            key={i}
            cx={20 + (i % 8) * 27}
            cy={20 + Math.floor(i / 8) * 30}
            r={i % 5 === 0 ? 8 : 6}
            fill={i % 7 === 3 ? '#EF5B45' : i % 4 === 1 ? '#9FE3C5' : '#5C5F73'}
          />
        ))}
      </svg>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <p className="font-['DM_Sans',_sans-serif] text-xs font-bold uppercase tracking-widest text-[#EF5B45] mb-3">
          {kick}
        </p>

        <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight max-w-4xl text-balance">
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
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-[#CF3F29] text-white hover:bg-[#b83420] transition-colors shadow-sm min-h-[44px]"
          >
            Give me the 2-minute version
          </button>
          {!isFull && (
            <button
              type="button"
              onClick={() => onToggleFull(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl font-semibold text-sm bg-transparent text-[#FDF8F1] border border-white/30 hover:border-white/60 transition-colors min-h-[44px]"
            >
              Show the full digest
            </button>
          )}
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
          {credit}
        </p>
      </div>
    </header>
  )
}
