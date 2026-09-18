'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

interface PageRecord {
  id: string
  slug: string
  title: string
  hero_headline: string
  hero_subheadline: string | null
  cta_text: string | null
  cta_url: string | null
  closing_cta_headline: string | null
  updated_at: string
}

const PAGE_META: Record<string, { path: string; description: string; badge: string }> = {
  home: {
    path: '/',
    description: 'Main landing page — hero headline, subhead, trust bar narrative, and closing CTA.',
    badge: 'Homepage',
  },
  workwithme: {
    path: '/workwithme',
    description: 'Advisory & consulting page — service positioning, diagnostic process, and contact CTA.',
    badge: 'Services',
  },
  me: {
    path: '/me',
    description: 'Bio & background page — narrative paragraphs, central pullquote, teaching & method context.',
    badge: 'About',
  },
}

export default function AdminPagesListPage() {
  const [pages, setPages] = useState<PageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPages()
  }, [])

  async function fetchPages() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/pages')
      if (res.ok) {
        const data = await res.json()
        setPages(data.pages || [])
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to load pages')
      }
    } catch {
      setError('Network error loading pages')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/posts/editor"
            className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Posts Editor</span>
          </Link>
          <div className="h-4 w-[1px] bg-gray-300" />
          <h1 className="text-sm font-bold text-gray-900">Website Pages</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/garden"
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
          >
            Garden ↗
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Intro */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Structural Pages</h2>
          <p className="text-sm text-gray-500 mt-1">
            Edit the fixed structured fields (headlines, subheadings, bio copy, and CTAs) for your primary website pages.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-6 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {pages.map((page) => {
              const meta = PAGE_META[page.slug] || {
                path: `/${page.slug}`,
                description: 'Custom structural site page.',
                badge: 'Page',
              }

              return (
                <div
                  key={page.id}
                  className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-7 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-gray-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-6"
                >
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-gray-100 text-gray-700">
                        {meta.badge}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {page.title}
                      </h3>
                      <span className="text-xs text-gray-400 font-mono">
                        {meta.path}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-1">
                      {meta.description}
                    </p>

                    <div className="pt-2 text-xs text-gray-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span>
                        Headline: <strong className="font-medium text-gray-700">&ldquo;{page.hero_headline}&rdquo;</strong>
                      </span>
                      <span>&bull;</span>
                      <span>
                        Updated {new Date(page.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <a
                      href={meta.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition border border-gray-200"
                    >
                      View Live ↗
                    </a>
                    <Link
                      href={`/admin/pages/${page.slug}/edit`}
                      className="px-5 py-2 text-xs font-semibold bg-black hover:bg-gray-800 text-white rounded-xl transition shadow-sm"
                    >
                      Edit Fields &rarr;
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
