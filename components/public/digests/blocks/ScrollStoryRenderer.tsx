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
  const prefersReducedMotion = usePrefersReducedMotion()
  const stepsRef = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-step-index'))
            if (!isNaN(index)) {
              setActiveStep(index)
            }
          }
        })
      },
      {
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0.1,
      }
    )

    stepsRef.current.forEach((el) => {
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [block.steps.length])

  const currentStep = block.steps[activeStep] || block.steps[0]

  // Pre-calculate dot styles for the current active step
  const dots: StoryStepDot[] = Array.from({ length: block.n }, (_, i) => {
    return currentStep.f(activeStep, i)
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start mt-6">
      {/* Sticky Visualization Stage */}
      <div className="sticky top-20 sm:top-24 z-20 aspect-square max-h-[460px] w-full rounded-3xl bg-[#232536] overflow-hidden p-6 relative shadow-lg flex flex-col justify-end">
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
        <div className="relative z-10 text-white bg-[#232536]/80 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
          <b className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold block leading-tight">
            {currentStep.cap[0]}
          </b>
          <span className="text-xs text-[#C9CADA] mt-0.5 block leading-snug">
            {currentStep.cap[1]}
          </span>
        </div>
      </div>

      {/* Scrolling Narrative Steps */}
      <div className="space-y-12 sm:space-y-24 py-6 md:py-12">
        {block.steps.map((step, idx) => {
          const isActive = idx === activeStep

          return (
            <div
              key={idx}
              ref={(el) => {
                stepsRef.current[idx] = el
              }}
              data-step-index={idx}
              className={`min-h-[280px] sm:min-h-[340px] flex flex-col justify-center transition-opacity duration-500 ${
                isActive ? 'opacity-100' : 'opacity-25'
              }`}
            >
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#CF3F29] mb-1 font-['MTN_Brighter_Sans',_sans-serif]">
                {step.k}
              </p>
              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-bold text-[#232536] leading-tight">
                {step.t}
              </h3>
              <p className="text-sm sm:text-base text-[#5A5D70] mt-3 leading-relaxed">{step.p}</p>
            </div>
          )
        })}

        {/* Optional Legend */}
        {block.legend && block.legend.length > 0 && (
          <div className="pt-6 border-t border-[#F5ECDE]">
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
