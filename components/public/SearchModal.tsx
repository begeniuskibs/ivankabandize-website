'use client'

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useSearchOpen, closeSearch } from './searchStore'
import type { SearchResultItem } from '@/lib/search'

function formatDate(iso: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function SearchOverlayContent() {
  const router = useRouter()
  const pathname = usePathname()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState<number>(-1)

  const cardRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const initialPathRef = useRef(pathname)

  // Focus input on initial mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close modal when route changes
  useEffect(() => {
    if (initialPathRef.current !== pathname) {
      closeSearch()
    }
  }, [pathname])

  // Body scroll lock while modal is mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [])

  // Debounced search with AbortController for in-flight request cancellation
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) return

    const abortController = new AbortController()

    const timer = setTimeout(() => {
      setLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: abortController.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Search failed')
          return res.json()
        })
        .then((data) => {
          setResults(data.results || [])
          setLoading(false)
          setSelectedIndex(-1)
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name !== 'AbortError') {
            console.error('Search request failed:', err)
            setResults([])
            setLoading(false)
          }
        })
    }, 250)

    return () => {
      clearTimeout(timer)
      abortController.abort()
    }
  }, [query])

  // Ensure selected item scrolls into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined
      activeEl?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  // Focus trap & Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeSearch()
        return
      }

      if (e.key === 'Tab' && cardRef.current) {
        const focusable = cardRef.current.querySelectorAll<HTMLElement>(
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
  }, [])

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (val.trim().length < 2) {
      setResults([])
      setLoading(false)
      setSelectedIndex(-1)
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (results.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
      }
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault()
        const targetSlug = results[selectedIndex].slug
        closeSearch()
        router.push(`/garden/${targetSlug}`)
      }
    }
  }

  const trimmedQuery = query.trim()
  const showNoResults = trimmedQuery.length >= 2 && !loading && results.length === 0
  const showMinCharsHint = trimmedQuery.length > 0 && trimmedQuery.length < 2

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site search"
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center pt-3 sm:pt-14 px-3 sm:px-6 transition-opacity motion-reduce:transition-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeSearch()
        }
      }}
    >
      {/* Top-anchored White Card (Ghost style) */}
      <div
        ref={cardRef}
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-[#F0E4D2] overflow-hidden flex flex-col max-h-[calc(100dvh-24px-env(safe-area-inset-bottom,0px))] sm:max-h-[calc(100dvh-80px)] font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Header Row */}
        <div className="p-3.5 sm:p-4 flex items-center gap-3 border-b border-[#F0E4D2]/80 shrink-0">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A8D9F"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            placeholder="Search articles and topics"
            aria-label="Search articles and topics"
            aria-autocomplete="list"
            aria-controls="search-results-list"
            aria-activedescendant={
              selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined
            }
            className="flex-1 bg-transparent text-[#232536] text-[16px] sm:text-[17px] font-medium outline-none placeholder:text-[#8A8D9F]"
          />

          {loading && (
            <div
              className="w-5 h-5 border-2 border-[#CF3F29] border-t-transparent rounded-full animate-spin shrink-0 motion-reduce:animate-none"
              aria-label="Searching..."
            />
          )}

          <button
            type="button"
            onClick={closeSearch}
            className="px-2.5 py-1 text-sm font-semibold text-[#5A5D70] hover:text-[#232536] hover:bg-[#FAF3E8] rounded-lg transition shrink-0 cursor-pointer"
          >
            Cancel
          </button>
        </div>

        {/* Results List Area */}
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {showMinCharsHint && (
            <div className="py-8 px-4 text-center text-[#8A8D9F] text-xs sm:text-sm">
              Type at least 2 characters to search
            </div>
          )}

          {showNoResults && (
            <div className="py-12 px-4 text-center text-[#8A8D9F] text-sm">
              No results found for &ldquo;<span className="text-[#232536] font-semibold">{trimmedQuery}</span>&rdquo;
            </div>
          )}

          {results.length > 0 && (
            <ul
              id="search-results-list"
              ref={listRef}
              role="listbox"
              aria-label="Search results"
              className="divide-y divide-[#F0E4D2]/50 py-1"
            >
              {results.map((item, index) => {
                const isSelected = selectedIndex === index
                return (
                  <li
                    key={item.slug}
                    id={`search-result-${index}`}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <Link
                      href={`/garden/${item.slug}`}
                      onClick={closeSearch}
                      className={`block px-4 py-3 sm:py-3.5 transition group ${
                        isSelected
                          ? 'bg-[#FAF3E8]'
                          : 'hover:bg-[#FAF3E8]/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px] sm:text-xs font-semibold text-[#8A8D9F] mb-1">
                        <span className="text-[#CF3F29] font-bold tracking-tight">
                          {item.stream}
                        </span>
                        {item.published_at && (
                          <span className="text-[#8A8D9F]">
                            {formatDate(item.published_at)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-[15px] sm:text-base font-bold text-[#232536] group-hover:text-[#CF3F29] transition-colors line-clamp-1 leading-snug">
                        {item.title}
                      </h4>
                      {item.excerpt && (
                        <p className="text-xs sm:text-sm text-[#5A5D70] line-clamp-1 mt-0.5 leading-relaxed">
                          {item.excerpt}
                        </p>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchModal() {
  const isOpen = useSearchOpen()
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )

  if (!isOpen || !isClient) return null
  return createPortal(<SearchOverlayContent />, document.body)
}
