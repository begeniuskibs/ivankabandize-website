'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Share2, Printer, Link2, Check, Mail, MessageCircle } from 'lucide-react'

export interface ArticleActionsProps {
  title: string
  slug?: string
}

export function buildShareUrls(title: string, url: string) {
  const encodedTitle = encodeURIComponent(title)
  const encodedUrl = encodeURIComponent(url)
  const encodedTextAndUrl = encodeURIComponent(`${title} ${url}`)
  const encodedEmailBody = encodeURIComponent(`${title}\n\n${url}`)

  return {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTextAndUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    x: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedEmailBody}`,
  }
}

export default function ArticleActions({ title, slug }: ArticleActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const canonicalUrl = slug
    ? `https://ivankabandize.com/garden/${slug}`
    : 'https://ivankabandize.com'

  const getTargetUrl = () => {
    if (slug) return `https://ivankabandize.com/garden/${slug}`
    if (typeof window !== 'undefined') return window.location.href
    return canonicalUrl
  }

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current)
      }
    }
  }, [])

  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!isMenuOpen) return

    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const shareUrls = buildShareUrls(title, canonicalUrl)

  const handleShareClick = async () => {
    const isMobilePhone =
      typeof window !== 'undefined' &&
      (/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent) ||
        (typeof window.matchMedia === 'function' &&
          window.matchMedia('(pointer: coarse) and (max-width: 1024px)').matches))

    const activeUrl = getTargetUrl()

    if (isMobilePhone && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title,
          url: activeUrl,
        })
        return
      } catch (err: unknown) {
        // If cancelled by user, do nothing; if other failure, fall through to dropdown menu
        if ((err as Error)?.name !== 'AbortError') {
          setIsMenuOpen((prev) => !prev)
        }
        return
      }
    }

    setIsMenuOpen((prev) => !prev)
  }

  const handleCopyLink = async () => {
    const activeUrl = getTargetUrl()
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeUrl)
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea')
        textArea.value = activeUrl
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        document.execCommand('copy')
        textArea.remove()
      }
    } catch {
      // Fallback feedback on clipboard failure
    }

    setCopied(true)
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current)
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <div
      id="article-actions"
      className="flex items-center gap-2.5 pt-4 max-md:pt-3 max-md:gap-2 print:hidden relative"
      aria-label="Article actions"
    >
      {/* Share Button and Dropdown Menu */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={handleShareClick}
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          aria-label="Share article"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#EF5B45]/40 hover:text-[#232536] hover:bg-[#FAF3E8]/40 transition shadow-2xs cursor-pointer select-none shrink-0"
        >
          <Share2 className="w-3.5 h-3.5 text-[#5A5D70]" aria-hidden="true" />
          <span>Share</span>
        </button>

        {isMenuOpen && (
          <div
            role="menu"
            aria-label="Share options"
            className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#F5ECDE] p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100"
          >
            {/* Copy Link */}
            <button
              type="button"
              role="menuitem"
              onClick={handleCopyLink}
              aria-label={copied ? 'Link copied' : 'Copy link to clipboard'}
              className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs text-[#232536] hover:bg-[#FAF3E8] rounded-lg transition font-medium text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                ) : (
                  <Link2 className="w-3.5 h-3.5 text-[#5A5D70]" aria-hidden="true" />
                )}
                <span>{copied ? 'Copied' : 'Copy link'}</span>
              </div>
              {copied && <span className="text-[10px] font-bold text-emerald-600">✓</span>}
            </button>

            <div className="h-[1px] bg-[#F5ECDE] my-1" />

            {/* WhatsApp */}
            <a
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              aria-label="Share on WhatsApp"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#232536] hover:bg-[#FAF3E8] rounded-lg transition font-medium"
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" aria-hidden="true" />
              <span>WhatsApp</span>
            </a>

            {/* LinkedIn */}
            <a
              href={shareUrls.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              aria-label="Share on LinkedIn"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#232536] hover:bg-[#FAF3E8] rounded-lg transition font-medium"
            >
              <svg className="w-3.5 h-3.5 text-[#0A66C2] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.65 1.65 0 0 0 1.66-1.66 1.66 1.66 0 0 0-3.32 0 1.65 1.65 0 0 0 1.66 1.66m1.4 9.74v-8.37H5.06v8.37h2.8z" />
              </svg>
              <span>LinkedIn</span>
            </a>

            {/* X */}
            <a
              href={shareUrls.x}
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              aria-label="Share on X"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#232536] hover:bg-[#FAF3E8] rounded-lg transition font-medium"
            >
              <svg className="w-3.5 h-3.5 text-[#232536] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>X</span>
            </a>

            {/* Email */}
            <a
              href={shareUrls.email}
              role="menuitem"
              aria-label="Share via Email"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-[#232536] hover:bg-[#FAF3E8] rounded-lg transition font-medium"
            >
              <Mail className="w-3.5 h-3.5 text-[#EF5B45]" aria-hidden="true" />
              <span>Email</span>
            </a>
          </div>
        )}
      </div>

      {/* Print Button */}
      <button
        type="button"
        onClick={handlePrint}
        aria-label="Print article"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#EF5B45]/40 hover:text-[#232536] hover:bg-[#FAF3E8]/40 transition shadow-2xs cursor-pointer select-none shrink-0"
      >
        <Printer className="w-3.5 h-3.5 text-[#5A5D70]" aria-hidden="true" />
        <span>Print</span>
      </button>
    </div>
  )
}
