'use client'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PageData {
  id: string
  slug: string
  title: string
  hero_headline: string
  hero_subheadline: string | null
  cta_text: string | null
  cta_url: string | null
  closing_cta_headline: string | null
  body_paragraphs: string[] | null
  pullquote: string | null
  background_teaching: string | null
  background_method: string | null
  trust_bar_entities: any[] | null
  testimonials: any[] | null
  updated_at: string
}

const PAGE_LIVE_PATHS: Record<string, string> = {
  home: '/',
  workwithme: '/workwithme',
  me: '/me',
}

export default function PageEditPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form State
  const [title, setTitle] = useState('')
  const [heroHeadline, setHeroHeadline] = useState('')
  const [heroSubheadline, setHeroSubheadline] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [closingCtaHeadline, setClosingCtaHeadline] = useState('')
  const [bodyParagraphs, setBodyParagraphs] = useState<string[]>([])
  const [pullquote, setPullquote] = useState('')
  const [backgroundTeaching, setBackgroundTeaching] = useState('')
  const [backgroundMethod, setBackgroundMethod] = useState('')

  useEffect(() => {
    fetchPageData()
  }, [slug])

  async function fetchPageData() {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/pages/${slug}`)
      if (res.ok) {
        const { page }: { page: PageData } = await res.json()
        setTitle(page.title || '')
        setHeroHeadline(page.hero_headline || '')
        setHeroSubheadline(page.hero_subheadline || '')
        setCtaText(page.cta_text || '')
        setCtaUrl(page.cta_url || '')
        setClosingCtaHeadline(page.closing_cta_headline || '')
        setBodyParagraphs(Array.isArray(page.body_paragraphs) ? page.body_paragraphs : [])
        setPullquote(page.pullquote || '')
        setBackgroundTeaching(page.background_teaching || '')
        setBackgroundMethod(page.background_method || '')
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to load page')
      }
    } catch {
      setError('Network error fetching page data')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!heroHeadline.trim()) {
      setError('Hero headline is required')
      return
    }

    try {
      setSaving(true)
      const res = await fetch(`/api/admin/pages/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          hero_headline: heroHeadline,
          hero_subheadline: heroSubheadline,
          cta_text: ctaText,
          cta_url: ctaUrl,
          closing_cta_headline: closingCtaHeadline,
          body_paragraphs: bodyParagraphs,
          pullquote: slug === 'me' ? pullquote : undefined,
          background_teaching: slug === 'me' ? backgroundTeaching : undefined,
          background_method: slug === 'me' ? backgroundMethod : undefined,
        }),
      })

      if (res.ok) {
        setSuccess('Page changes saved successfully!')
        setTimeout(() => setSuccess(null), 4000)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to save page changes')
      }
    } catch {
      setError('Network error saving page changes')
    } finally {
      setSaving(false)
    }
  }

  function handleParagraphChange(index: number, val: string) {
    const updated = [...bodyParagraphs]
    updated[index] = val
    setBodyParagraphs(updated)
  }

  function addParagraph() {
    setBodyParagraphs([...bodyParagraphs, ''])
  }

  function removeParagraph(index: number) {
    setBodyParagraphs(bodyParagraphs.filter((_, i) => i !== index))
  }

  const livePath = PAGE_LIVE_PATHS[slug] || `/${slug}`

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] font-sans flex items-center justify-center p-6">
        <div className="text-gray-500 text-sm">Loading page fields...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/pages"
            className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>All Pages</span>
          </Link>
          <div className="h-4 w-[1px] bg-gray-300" />
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-gray-900">
              Editing: {title || slug}
            </h1>
            <span className="text-xs text-gray-400 font-mono">({livePath})</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={livePath}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition border border-gray-200"
          >
            View Live ↗
          </a>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2 text-xs font-semibold bg-black hover:bg-gray-800 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Form Canvas */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* SECTION 1: Page Info & Hero */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Hero Section</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                The primary headline and introductory text at the top of {livePath}.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Page Title (Admin Name)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
                  placeholder="e.g. Home, Work With Me, Me"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Hero Headline <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition resize-y"
                  placeholder="The primary statement in large display font"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Hero Subheadline / Lead Copy
                </label>
                <textarea
                  rows={3}
                  value={heroSubheadline}
                  onChange={(e) => setHeroSubheadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition resize-y"
                  placeholder="Supporting narrative under the headline"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Calls to Action */}
          <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Calls to Action (CTAs)</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Buttons and closing CTA banner for this page.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
                  placeholder="e.g. Let's Talk, Work With Me"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                  Primary Button Link (URL)
                </label>
                <input
                  type="text"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition font-mono"
                  placeholder="e.g. /lets-talk, /workwithme"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                Closing Call to Action Headline
              </label>
              <input
                type="text"
                value={closingCtaHeadline}
                onChange={(e) => setClosingCtaHeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
                placeholder="Closing banner statement at page bottom"
              />
            </div>
          </div>

          {/* SECTION 3: Structured Body Paragraphs (For Home & Me) */}
          {(slug === 'home' || slug === 'me') && (
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-gray-900">
                    {slug === 'home' ? 'Trust Bar & Who I Work With Copy' : 'Biography Body Paragraphs'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {slug === 'home'
                      ? 'Descriptive paragraphs under the trust bar section.'
                      : 'Main narrative paragraphs in the background section.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addParagraph}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition"
                >
                  + Add Paragraph
                </button>
              </div>

              <div className="space-y-4">
                {bodyParagraphs.map((para, idx) => (
                  <div key={idx} className="relative group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-400">
                        Paragraph {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeParagraph(idx)}
                        className="text-xs text-red-500 hover:text-red-700 transition"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={para}
                      onChange={(e) => handleParagraphChange(idx, e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition resize-y"
                      placeholder={`Enter paragraph ${idx + 1} content...`}
                    />
                  </div>
                ))}

                {bodyParagraphs.length === 0 && (
                  <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-xs text-gray-400">
                    No custom paragraphs. Click &ldquo;+ Add Paragraph&rdquo; to create one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 4: Me Page Specific Sections (Pullquote & Background Details) */}
          {slug === 'me' && (
            <div className="bg-white border border-gray-200/90 rounded-2xl p-6 sm:p-8 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">Philosophy &amp; Credibility Details</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Specific structured callout fields on the About / Me page.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Central Philosophy Pullquote
                  </label>
                  <textarea
                    rows={2}
                    value={pullquote}
                    onChange={(e) => setPullquote(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition resize-y italic"
                    placeholder="e.g. Most organisations don’t have a people problem - they have a structure problem..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Background - On Teaching
                  </label>
                  <textarea
                    rows={3}
                    value={backgroundTeaching}
                    onChange={(e) => setBackgroundTeaching(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition resize-y"
                    placeholder="Specifics about teaching at Watoto School of Community Leadership..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">
                    Background - On Method
                  </label>
                  <textarea
                    rows={3}
                    value={backgroundMethod}
                    onChange={(e) => setBackgroundMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition resize-y"
                    placeholder="Specifics on the 3-step engagement pattern..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="pt-4 flex items-center justify-between border-t border-gray-200">
            <Link
              href="/admin/pages"
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition"
            >
              &larr; Back to Pages
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-semibold bg-black hover:bg-gray-800 text-white rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
