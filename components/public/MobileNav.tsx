'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { computeScrollHeaderState, type ScrollHeaderState } from './scrollHeader'
import type { User } from '@supabase/supabase-js'

interface MobileNavProps {
  user: User | null
  displayName?: string | null
}

export default function MobileNav({ user, displayName }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scrollState, setScrollState] = useState<ScrollHeaderState>({
    isSlim: false,
    isHidden: false,
  })

  const pathname = usePathname()
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    setIsOpen(false)
  }

  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastScrollYRef = useRef(0)


  // Body scroll lock when menu is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])

  // Focus management & Escape key handling
  useEffect(() => {
    if (isOpen) {
      // Focus close button on open
      closeButtonRef.current?.focus()

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault()
          setIsOpen(false)
          menuButtonRef.current?.focus()
          return
        }

        if (e.key === 'Tab' && dialogRef.current) {
          const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          if (focusable.length === 0) return

          const firstEl = focusable[0]
          const lastEl = focusable[focusable.length - 1]

          if (e.shiftKey) {
            if (document.activeElement === firstEl) {
              e.preventDefault()
              lastEl.focus()
            }
          } else {
            if (document.activeElement === lastEl) {
              e.preventDefault()
              firstEl.focus()
            }
          }
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // Hide-on-scroll logic with passive listener & requestAnimationFrame
  useEffect(() => {
    lastScrollYRef.current = window.scrollY

    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY
          setScrollState((prev) => {
            const next = computeScrollHeaderState({
              currentScrollY: currentY,
              lastScrollY: lastScrollYRef.current,
              isMenuOpen: isOpen,
              previousIsHidden: prev.isHidden,
            })
            return next
          })
          lastScrollYRef.current = currentY
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [isOpen])

  function handleOpen() {
    setIsOpen(true)
  }

  function handleClose() {
    setIsOpen(false)
    menuButtonRef.current?.focus()
  }

  const { isSlim, isHidden } = scrollState
  const heightClass = isSlim ? 'h-[56px]' : 'h-[64px]'
  const transformClass = isHidden && !isOpen ? '-translate-y-full' : 'translate-y-0'

  return (
    <>
      {/* Reserved height spacer on mobile to prevent layout shift */}
      <div className="h-[64px] md:hidden" aria-hidden="true" />

      {/* Sticky, slimmer and hide-on-scroll mobile header */}
      <div
        className={`fixed top-0 left-0 right-0 z-40 bg-[#FDF8F1] border-b border-[#F0E4D2] md:hidden transition-all duration-200 ease-in-out motion-reduce:transition-none ${heightClass} ${transformClass}`}
      >
        <div className="h-full px-5 flex items-center justify-between whitespace-nowrap">
          {/* Logo text: "Ivan Kabandize." 21px, weight 800, nowrap, trailing dot in #CF3F29 */}
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="font-['MTN_Brighter_Sans',_sans-serif] text-[21px] font-[800] tracking-tight text-[#232536] hover:opacity-90 transition inline-flex items-baseline whitespace-nowrap"
          >
            <span>Ivan Kabandize</span>
            <span className="text-[#CF3F29] text-[21px] font-[800]">.</span>
          </Link>

          {/* 44x44 Menu button */}
          <button
            ref={menuButtonRef}
            type="button"
            onClick={handleOpen}
            aria-label="Open menu"
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
            className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[12px] bg-white border border-[#F0E4D2] flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition"
          >
            {/* Hamburger icon 22px stroke #232536 */}
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#232536"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Full-screen Mobile Menu Dialog */}
      {isOpen && (
        <div
          id="mobile-menu"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-50 bg-[#FDF8F1] flex flex-col h-[100dvh] overflow-hidden md:hidden font-sans"
        >
          {/* Top row: identical to header with close (X) button */}
          <div className="h-[64px] px-5 flex items-center justify-between border-b border-[#F0E4D2] shrink-0 whitespace-nowrap">
            <Link
              href="/"
              onClick={handleClose}
              className="font-['MTN_Brighter_Sans',_sans-serif] text-[21px] font-[800] tracking-tight text-[#232536] hover:opacity-90 transition inline-flex items-baseline whitespace-nowrap"
            >
              <span>Ivan Kabandize</span>
              <span className="text-[#CF3F29] text-[21px] font-[800]">.</span>
            </Link>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={handleClose}
              aria-label="Close menu"
              className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[12px] bg-white border border-[#F0E4D2] flex items-center justify-center cursor-pointer shadow-sm active:scale-95 transition"
            >
              {/* Close (X) icon 22px stroke #232536 */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#232536"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Stacked Links: 24px, weight 700, letter-spacing -0.01em, min-height 64px, border-b #F0E4D2, px 20px */}
          <nav className="flex-1 overflow-y-auto flex flex-col">
            <Link
              href="/workwithme"
              onClick={handleClose}
              className="min-h-[64px] px-5 flex items-center justify-between border-b border-[#F0E4D2] text-[24px] font-bold tracking-[-0.01em] text-[#232536] hover:text-[#CF3F29] transition"
            >
              <span>Work with Me</span>
            </Link>

            <Link
              href="/me"
              onClick={handleClose}
              className="min-h-[64px] px-5 flex items-center justify-between border-b border-[#F0E4D2] text-[24px] font-bold tracking-[-0.01em] text-[#232536] hover:text-[#CF3F29] transition"
            >
              <span>Me</span>
            </Link>

            <Link
              href="/garden"
              onClick={handleClose}
              className="min-h-[64px] px-5 flex items-center justify-between border-b border-[#F0E4D2] text-[24px] font-bold tracking-[-0.01em] text-[#232536] hover:text-[#CF3F29] transition"
            >
              <span>The Garden</span>
              {/* Small 8px coral dot on the right */}
              <span className="w-2 h-2 rounded-full bg-[#CF3F29] shrink-0" aria-hidden="true" />
            </Link>

            <Link
              href="/now"
              onClick={handleClose}
              className="min-h-[64px] px-5 flex items-center justify-between border-b border-[#F0E4D2] text-[24px] font-bold tracking-[-0.01em] text-[#232536] hover:text-[#CF3F29] transition"
            >
              <span>Now</span>
            </Link>
          </nav>

          {/* Bottom Actions: Two pill buttons 56px high, radius 28, 18px/700 */}
          <div className="shrink-0 px-5 pt-4 pb-[calc(36px+env(safe-area-inset-bottom,0px))] flex flex-col gap-3 mt-auto bg-[#FDF8F1]">
            <Link
              href="/lets-talk"
              onClick={handleClose}
              className="w-full h-[56px] rounded-[28px] bg-[#CF3F29] hover:bg-[#b83420] text-white text-[18px] font-bold flex items-center justify-center transition shadow-sm active:scale-[0.99]"
            >
              Let&apos;s Talk
            </Link>

            <Link
              href={user ? '/auth/account' : '/login'}
              onClick={handleClose}
              className="w-full h-[56px] rounded-[28px] bg-white border border-[#F0E4D2] hover:bg-[#FAF3E8] text-[#232536] text-[18px] font-bold flex items-center justify-center transition shadow-sm active:scale-[0.99]"
            >
              {user ? (displayName || 'Account') : 'Sign in'}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
