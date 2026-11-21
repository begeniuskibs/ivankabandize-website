'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { getDigestBySlug } from '@/lib/digests'
import type { DigestChapter, DigestBlock } from '@/lib/digests/types'
import DigestHero from './DigestHero'
import DigestSideRail from './DigestSideRail'
import DigestContentsMenu from './DigestContentsMenu'
import DigestProgressRing from './DigestProgressRing'
import BlockRenderer from './blocks/BlockRenderer'

interface DigestViewProps {
  slug: string
}

export default function DigestView({ slug }: DigestViewProps) {
  const digest = getDigestBySlug(slug)
  const searchParams = useSearchParams()
  const initial2Min = searchParams.get('v') === '2min'

  const [isFull, setIsFull] = useState(!initial2Min)
  const [activeSection, setActiveSection] = useState(0)
  const [isContentsOpen, setIsContentsOpen] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [isDocked, setIsDocked] = useState(false)
  const bottomSentinelRef = useRef<HTMLDivElement>(null)

  // Only include approved chapters
  const approvedChapters: DigestChapter[] = useMemo(() => {
    if (!digest) return []
    return digest.ch.filter((c: DigestChapter) => c.approved !== false)
  }, [digest])

  // Visible chapters based on isFull
  const visibleChapters: DigestChapter[] = useMemo(() => {
    return isFull ? approvedChapters : approvedChapters.slice(0, 1)
  }, [isFull, approvedChapters])

  // Scroll to a specific section by index
  const scrollToSection = useCallback(
    (index: number) => {
      if (index > 0 && !isFull) {
        setIsFull(true)
        // Wait for state update to render additional sections
        setTimeout(() => {
          const el = document.getElementById(`s${index}`)
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 100
            window.scrollTo({ top, behavior: 'smooth' })
          }
        }, 60)
        return
      }

      const el = document.getElementById(`s${index}`)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 100
        window.scrollTo({ top, behavior: 'smooth' })
      }
    },
    [isFull]
  )

  // Scroll listener for progress line and active section spy
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight
      const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0
      setProgressPercent(progress)

      // Find active section
      const sections = visibleChapters.map((_: DigestChapter, i: number) =>
        document.getElementById(`s${i}`)
      )

      let current = 0
      sections.forEach((sec: HTMLElement | null, i: number) => {
        if (!sec) return
        const rect = sec.getBoundingClientRect()
        if (rect.top <= 160) {
          current = i
        }
      })
      setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [visibleChapters])

  // Observe bottom sentinel so progress ring parks above the site footer
  useEffect(() => {
    const sentinel = bottomSentinelRef.current
    if (!sentinel) return

    const checkDocked = () => {
      const rect = sentinel.getBoundingClientRect()
      setIsDocked(rect.top <= window.innerHeight)
    }

    checkDocked()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const isAtOrPast =
            entry.isIntersecting || entry.boundingClientRect.top <= window.innerHeight
          setIsDocked(isAtOrPast)
        }
      },
      {
        threshold: [0, 1],
      }
    )

    observer.observe(sentinel)
    window.addEventListener('resize', checkDocked, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', checkDocked)
    }
  }, [visibleChapters])

  if (!digest) {
    return null
  }

  const activeTitle = visibleChapters[activeSection]?.t || digest.title

  return (
    <div className="relative min-h-screen bg-[#FDF8F1] text-[#232536] selection:bg-[#E8DCC4]">
      {/* Sticky Sub-Header */}
      <div
        data-digest-subbar="true"
        className="sticky top-0 md:top-20 z-30 bg-[#FDF8F1]/95 backdrop-blur-md border-b border-[#F5ECDE]"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3">
          {/* Back breadcrumb */}
          {/* Mobile back link */}
          <Link
            href="/garden/report-digests"
            className="group inline-flex md:hidden items-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#5C5F73] hover:text-[#232536] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#232536] focus-visible:outline-offset-2 rounded-xs transition-colors shrink-0"
          >
            <ArrowLeft
              size={12}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
            />
            <span>Report Digests</span>
          </Link>

          {/* Desktop breadcrumb */}
          <Link
            href="/garden/report-digests"
            className="hidden md:inline-flex group font-bold text-xs sm:text-sm text-[#232536] hover:text-[#CF3F29] transition-colors items-center gap-1.5 shrink-0"
          >
            <ArrowLeft
              size={14}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
            />
            <span className="hidden sm:inline">Report Digests</span>
          </Link>

          {/* Active section title */}
          <span className="text-xs text-[#5C5F73] truncate flex-1 min-w-0 font-medium text-center px-2">
            {activeTitle}
          </span>

          {/* Contents button */}
          <button
            type="button"
            onClick={() => setIsContentsOpen(!isContentsOpen)}
            aria-expanded={isContentsOpen}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-[#E8DCC4] bg-[#FFFBF5] text-[#232536] hover:bg-[#F5ECDE] transition-colors shrink-0 cursor-pointer"
          >
            Contents
          </button>
        </div>

        {/* Scroll reading progress bar */}
        <div
          className="h-[2px] bg-[#CF3F29] transition-all duration-150"
          style={{ width: `${progressPercent * 100}%` }}
        />
      </div>

      {/* Hero section */}
      <DigestHero
        kick={digest.kick}
        h1={digest.h1}
        lead={digest.lead}
        facts={digest.facts}
        credit={digest.credit}
        sourceUrl={digest.sourceUrl}
        heroArt={digest.heroArt}
        isFull={isFull}
        onToggleFull={setIsFull}
        onJumpToStart={() => scrollToSection(0)}
        about={digest.about}
      />

      {/* Main content grid with sticky side rail */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="flex gap-12 items-start">
          {/* Sticky desktop side rail */}
          <DigestSideRail
            chapters={approvedChapters}
            currentSection={activeSection}
            onSelectSection={scrollToSection}
          />

          {/* Chapters content area */}
          <main className="flex-1 min-w-0 max-w-3xl">
            {visibleChapters.map((chapter: DigestChapter, i: number) => {
              const numStr = String(i + 1).padStart(2, '0')
              return (
                <section
                  key={i}
                  id={`s${i}`}
                  className={`scroll-mt-36 py-8 sm:py-12 border-b border-[#F5ECDE]/80 last:border-b-0 ${
                    chapter.alt
                      ? 'bg-[#F7EDE0]/50 rounded-3xl max-md:p-4 p-6 sm:p-10 my-6 border border-[#F0E4D2]'
                      : ''
                  }`}
                >
                  <span className="tabular-nums text-xs font-bold text-[#CF3F29] tracking-wider block mb-2">
                    {numStr}
                  </span>

                  <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl lg:text-4xl font-bold text-[#232536] leading-tight mb-3">
                    {chapter.t}
                  </h2>

                  {chapter.l && (
                    <p className="text-base sm:text-lg text-[#5C5F73] leading-relaxed mb-6">
                      {chapter.l}
                    </p>
                  )}

                  {/* Chapter blocks */}
                  <div className="space-y-6">
                    {chapter.b.map((b: DigestBlock, bIdx: number) => (
                      <BlockRenderer
                        key={bIdx}
                        block={b}
                        pdfUrl={digest.pdfUrl}
                        digestSlug={digest.slug}
                      />
                    ))}
                  </div>
                </section>
              )
            })}

            {/* Prompt to expand full digest if in 2-min mode */}
            {!isFull && (
              <div className="py-10 border-t border-[#F5ECDE] mt-8 text-center sm:text-left">
                <button
                  type="button"
                  onClick={() => {
                    setIsFull(true)
                    scrollToSection(1)
                  }}
                  className="group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm bg-[#CF3F29] text-white hover:bg-[#b83420] transition-colors shadow-sm cursor-pointer"
                >
                  <span>
                    Keep going - show me the full digest ({approvedChapters.length - 1} more sections)
                  </span>
                  <ArrowRight
                    size={14}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                  />
                </button>
              </div>
            )}

            {/* Digest Footer: Source, credit, pages */}
            <footer className="mt-16 pt-8 border-t border-[#F0E4D2] text-sm text-[#5C5F73] space-y-4">
              <p>
                <strong className="text-[#232536]">Source and credit.</strong>{' '}
                {digest.foot}
                {digest.sourceUrl && (
                  <>
                    {' '}
                    <a
                      href={digest.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#CF3F29] hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Read the original report</span>
                      <ExternalLink size={14} strokeWidth={2} aria-hidden="true" />
                    </a>
                    .
                  </>
                )}
              </p>
              {digest.pages && (
                <p>
                  <strong className="text-[#232536]">
                    Where the headline numbers come from:
                  </strong>{' '}
                  {digest.pages}
                </p>
              )}
              <div className="pt-4 max-md:pb-28">
                <Link
                  href="/garden/report-digests"
                  data-digest-all-link="true"
                  className="group inline-flex items-center gap-1.5 font-semibold text-[#CF3F29] hover:underline"
                >
                  <ArrowLeft
                    size={14}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
                  />
                  <span>All report digests</span>
                </Link>
              </div>
            </footer>
          </main>
        </div>
      </div>

      {/* Sentinel for parking progress ring at digest boundary */}
      <div
        ref={bottomSentinelRef}
        data-digest-sentinel="true"
        className="h-px w-full pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating progress ring */}
      <DigestProgressRing
        currentSection={activeSection}
        totalSections={visibleChapters.length}
        progressPercent={progressPercent}
        isHidden={isContentsOpen}
        onClick={() => setIsContentsOpen(true)}
        isDocked={isDocked}
      />

      {/* Table of Contents dropdown / mobile sheet */}
      <DigestContentsMenu
        isOpen={isContentsOpen}
        onClose={() => setIsContentsOpen(false)}
        chapters={approvedChapters}
        currentSection={activeSection}
        onSelectSection={scrollToSection}
      />
    </div>
  )
}
