'use client'

import React, { useEffect, useRef } from 'react'
import type { DigestChapter } from '@/lib/digests/types'

interface DigestContentsMenuProps {
  isOpen: boolean
  onClose: () => void
  chapters: DigestChapter[]
  currentSection: number
  onSelectSection: (index: number) => void
}

export default function DigestContentsMenu({
  isOpen,
  onClose,
  chapters,
  currentSection,
  onSelectSection,
}: DigestContentsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop for mobile bottom sheet & desktop dismissal */}
      <div
        className="fixed inset-0 bg-[#232536]/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu container: dropdown on desktop, bottom sheet on phone */}
      <div
        ref={menuRef}
        role="dialog"
        aria-label="Table of contents"
        className="fixed z-50 
          max-md:inset-x-0 max-md:bottom-0 max-md:max-h-[76vh] max-md:rounded-t-3xl max-md:border-t max-md:shadow-2xl
          md:top-32 md:right-8 md:w-84 md:max-h-[70vh] md:rounded-2xl md:border md:shadow-xl
          bg-white border-[#F0E4D2] p-4 overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Mobile handle indicator */}
        <div className="md:hidden w-11 h-1.5 rounded-full bg-[#E8DCC4] mx-auto mb-3 shrink-0" />

        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#F5ECDE]">
          <span className="font-['MTN_Brighter_Sans',_sans-serif] text-xs font-bold tracking-wider text-[#5C5F73] uppercase">
            In This Digest
          </span>
          <button
            onClick={onClose}
            className="text-xs text-[#5C5F73] hover:text-[#232536] px-2 py-1 rounded"
            aria-label="Close contents"
          >
            Close
          </button>
        </div>

        <nav className="flex flex-col gap-1 py-1" aria-label="Chapters">
          {chapters.map((ch, i) => {
            const isActive = i === currentSection
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelectSection(i)
                  onClose()
                }}
                className={`flex items-start gap-3 w-full text-left p-2.5 rounded-xl text-sm transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-[#F7EDE0] text-[#232536] font-bold'
                    : 'text-[#5C5F73] hover:bg-[#FDF8F1] hover:text-[#232536]'
                }`}
              >
                <span className="tabular-nums text-xs text-[#CF3F29] mt-0.5 shrink-0">
                  {i + 1}.
                </span>
                <span className="leading-snug flex-1">{ch.t}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
