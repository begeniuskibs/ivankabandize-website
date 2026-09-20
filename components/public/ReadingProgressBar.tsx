'use client'

import { useEffect, useState } from 'react'

interface ReadingProgressBarProps {
  targetSelector?: string
}

export default function ReadingProgressBar({
  targetSelector = '#article-body',
}: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let animationFrameId: number | null = null

    const handleScroll = () => {
      if (animationFrameId !== null) return

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = null
        const target = document.querySelector(targetSelector) as HTMLElement | null

        if (!target) {
          // Fallback to document scroll if target selector is not found
          const totalScroll = document.documentElement.scrollHeight - window.innerHeight
          if (totalScroll > 0) {
            const current = Math.min(100, Math.max(0, (window.scrollY / totalScroll) * 100))
            setProgress(current)
          }
          return
        }

        const rect = target.getBoundingClientRect()
        const targetTop = rect.top + window.scrollY
        const targetHeight = rect.height
        const windowHeight = window.innerHeight
        const currentScroll = window.scrollY

        // Progress starts when top of target reaches viewport top (or start of page)
        const startScroll = targetTop - 60 // account for header offset
        const endScroll = targetTop + targetHeight - windowHeight

        if (endScroll <= startScroll) {
          setProgress(100)
          return
        }

        if (currentScroll <= startScroll) {
          setProgress(0)
        } else if (currentScroll >= endScroll) {
          setProgress(100)
        } else {
          const pct = ((currentScroll - startScroll) / (endScroll - startScroll)) * 100
          setProgress(Math.min(100, Math.max(0, pct)))
        }
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [targetSelector])

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none print:hidden"
    >
      <div
        className="h-full bg-[#EF5B45] transition-[width] duration-75 ease-out motion-reduce:transition-none"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
