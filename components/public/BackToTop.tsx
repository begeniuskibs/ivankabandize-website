'use client'

import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let ticking = false

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 600)
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed right-4 bottom-4 md:right-6 md:bottom-6 z-30 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[#CF3F29] hover:bg-[#b83420] text-[#FDF8F1] flex items-center justify-center shadow-md transition-opacity duration-300 ease-in-out motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF3F29] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDF8F1] cursor-pointer print:hidden ${
        isVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <ArrowUp size={20} strokeWidth={2.5} aria-hidden="true" />
    </button>
  )
}
