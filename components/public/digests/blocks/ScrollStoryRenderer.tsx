'use client'

import React, { useEffect, useRef, useState } from 'react'
import type { ScrollStoryBlock, StoryStepDot } from '@/lib/digests/types'

function usePrefersReducedMotion(): boolean {
  return React.useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false
  )
}

export default function ScrollStoryRenderer({ block }: { block: ScrollStoryBlock }) {
  const [activeStep, setActiveStep] = useState<number>(0)
  const [stickyTop, setStickyTop] = useState<number | null>(null)
  const prefersReducedMotion = usePrefersReducedMotion()
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])

  // Measure the sticky sub-header height and top offset dynamically
  useEffect(() => {
    const updateStickyOffset = () => {
      const subbar = document.querySelector<HTMLElement>('[data-digest-subbar]')
      if (!subbar) return
      const computedTop = parseFloat(window.getComputedStyle(subbar).top || '0') || 0
      const barHeight = subbar.getBoundingClientRect().height
      const gap = window.innerWidth < 768 ? 8 : 16
      setStickyTop(Math.ceil(computedTop + barHeight + gap))
    }

    updateStickyOffset()
    window.addEventListener('resize', updateStickyOffset, { passive: true })
    return () => window.removeEventListener('resize', updateStickyOffset)
  }, [])

  // Scroll-driven step activation (one change per step)
  useEffect(() => {
    const updateActiveStep = () => {
      const isMobile = window.innerWidth < 768
      // Reading focal line: below the sticky stage on mobile (~66% viewport height), middle on desktop (~50%)
      const focalY = window.innerHeight * (isMobile ? 0.66 : 0.5)

      let bestIdx = 0
      let bestDist = Infinity

      stepsRef.current.forEach((el, idx) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const centerY = rect.top + rect.height / 2
        const dist = Math.abs(centerY - focalY)
        if (dist < bestDist) {
          bestDist = dist
          bestIdx = idx
        }
      })

      setActiveStep((prev) => (prev !== bestIdx ? bestIdx : prev))
    }

    updateActiveStep()
    window.addEventListener('scroll', updateActiveStep, { passive: true })
    window.addEventListener('resize', updateActiveStep, { passive: true })
    return () => {
      window.removeEventListener('scroll', updateActiveStep)
      window.removeEventListener('resize', updateActiveStep)
    }
  }, [block.steps.length])

  const currentStep = block.steps[activeStep] || block.steps[0]

  // Pre-calculate dot styles for the current active step
  const dots: StoryStepDot[] = Array.from({ length: block.n }, (_, i) => {
    return currentStep.f(activeStep, i)
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-12 items-start mt-6">
      {/* Sticky Visualization Stage */}
      <div
        className="sticky max-md:top-[59px] md:top-[148px] z-20 max-md:aspect-auto max-md:h-[37vh] max-md:min-h-[240px] max-md:max-h-[320px] md:aspect-square md:max-h-[460px] w-full max-md:rounded-2xl rounded-3xl bg-[#232536] overflow-hidden max-md:p-3.5 p-6 relative shadow-lg flex flex-col justify-end"
        style={stickyTop !== null ? { top: `${stickyTop}px` } : undefined}
      >
        {/* Dots Canvas Container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {dots.map((dot, i) => {
            const delay = prefersReducedMotion ? 0 : i * (block.n > 50 ? 5 : 25)

            return (
              <div
                key={i}
                className="absolute rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center font-['MTN_Brighter_Sans',_sans-serif] font-bold text-white select-none pointer-events-none"
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  width: `${dot.s}%`,
                  aspectRatio: '1',
                  backgroundColor: dot.c,
                  opacity: dot.o !== undefined ? dot.o : 1,
                  fontSize: dot.s > 8 ? '10px' : '8px',
                  transitionProperty: prefersReducedMotion
                    ? 'none'
                    : 'left, top, width, height, background-color, opacity',
                  transitionDuration: prefersReducedMotion ? '0ms' : '800ms',
                  transitionTimingFunction: 'cubic-bezier(0.3, 0.9, 0.3, 1)',
                  transitionDelay: `${delay}ms`,
                }}
              >
                {dot.t || ''}
              </div>
            )
          })}
        </div>

        {/* Step Caption */}
        <div className="relative z-10 text-white bg-[#232536]/85 backdrop-blur-xs max-md:p-2.5 p-3.5 rounded-xl border border-white/10">
          <b className="font-['MTN_Brighter_Sans',_sans-serif] text-sm sm:text-lg font-bold block leading-tight">
            {currentStep.cap[0]}
          </b>
          <span className="text-xs text-[#C9CADA] mt-0.5 block leading-snug">
            {currentStep.cap[1]}
          </span>
        </div>
      </div>

      {/* Scrolling Narrative Steps (vertical gap halved on mobile and desktop) */}
      <div className="space-y-6 md:space-y-12 py-3 md:py-6">
        {block.steps.map((step, idx) => {
          const isActive = idx === activeStep

          return (
            <div
              key={idx}
              ref={(el) => {
                stepsRef.current[idx] = el
              }}
              data-step-index={idx}
              className={`max-md:min-h-[150px] md:min-h-[190px] py-3 flex flex-col justify-center transition-all duration-500 ${
                isActive ? 'opacity-100 blur-none' : 'opacity-30 blur-[0.5px]'
              }`}
            >
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#CF3F29] mb-1 font-['MTN_Brighter_Sans',_sans-serif]">
                {step.k}
              </p>
              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-bold text-[#232536] leading-tight">
                {step.t}
              </h3>
              <p className="text-sm sm:text-base text-[#5A5D70] mt-2.5 leading-relaxed">
                {step.p}
              </p>
            </div>
          )
        })}

        {/* Optional Legend */}
        {block.legend && block.legend.length > 0 && (
          <div className="pt-4 border-t border-[#F5ECDE]">
            <p className="text-xs font-bold text-[#5A5D70] uppercase tracking-wider mb-2.5">
              Legend
            </p>
            <div className="flex flex-wrap gap-2">
              {block.legend.map((l, lIdx) => (
                <span
                  key={lIdx}
                  className="text-xs font-medium px-3 py-1 rounded-full bg-[#F5ECDE]/70 text-[#232536]"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
