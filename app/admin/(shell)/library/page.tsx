'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { CloseIcon } from '@/components/admin/icons'

interface LibraryItemRecord {
  id: string
  title: string
  creator: string
  type: 'podcast' | 'book' | 'newsletter' | string
  url: string
  thumbnail_url: string | null
  recommendation_note: string | null
  created_at: string
  tag_ids?: string[]
}

interface TagOption {
  id: string
  name: string
  slug: string
  is_internal?: boolean
}

export default function AdminLibraryPage() {
  const [items, setItems] = useState<LibraryItemRecord[]>([])
  const [tags, setTags] = useState<TagOption[]>([])
  const [topicTaggingAvailable, setTopicTaggingAvailable] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Edit modal state
  const [editingItem, setEditingItem] = useState<LibraryItemRecord | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [creator, setCreator] = useState('')
  const [type, setType] = useState('podcast')
  const [url, setUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [recommendationNote, setRecommendationNote] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  useEffect(() => {
    fetchLibraryData()
  }, [])

  async function fetchLibraryData() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/library')
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        setTags(data.tags || [])
        setTopicTaggingAvailable(Boolean(data.topicTaggingAvailable))
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to load library items')
      }
    } catch {
      setError('Network error loading library items')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenEdit(item: LibraryItemRecord) {
    setEditingItem(item)
    setTitle(item.title)
    setCreator(item.creator)
    setType(item.type)
    setUrl(item.url)
    setThumbnailUrl(item.thumbnail_url || '')
    setRecommendationNote(item.recommendation_note || '')
    setSelectedTagIds(item.tag_ids || [])
    setModalError(null)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setEditingItem(null)
    setModalError(null)
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault()
    if (!editingItem) return

    setModalError(null)
    if (!title.trim()) {
      setModalError('Title is required')
      return
    }
    if (!creator.trim()) {
      setModalError('Creator is required')
      return
    }
    if (!url.trim()) {
      setModalError('URL is required')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          title,
          creator,
          type,
          url,
          thumbnail_url: thumbnailUrl || null,
          recommendation_note: recommendationNote || null,
          tag_ids: selectedTagIds,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setSuccess('Library item updated successfully')
        setIsModalOpen(false)
        fetchLibraryData()
      } else {
        setModalError(data.error || 'Failed to update library item')
      }
    } catch {
      setModalError('Network error saving library item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900">Library Items</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {items.length} curated
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/library"
            target="_blank"
            className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition border border-gray-200"
          >
            Live Library ↗
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-6 sm:px-10 py-8 flex-1">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Curated Library</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage podcast episodes, recommended books, and newsletters displayed on the site.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-6 flex justify-between items-center">
            <span>{success}</span>
            <button
              onClick={() => setSuccess(null)}
              aria-label="Dismiss notification"
              className="text-emerald-500 hover:text-emerald-700 p-0.5 cursor-pointer"
            >
              <CloseIcon size={14} />
            </button>
          </div>
        )}

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
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {item.type}
                    </span>
                    <h3 className="font-bold text-gray-900 truncate text-base">{item.title}</h3>
                  </div>
                  <p className="text-xs text-gray-500">
                    by <span className="font-semibold text-gray-700">{item.creator}</span>
                  </p>
                  {item.recommendation_note && (
                    <p className="text-xs text-gray-600 line-clamp-1 italic">
                      &ldquo;{item.recommendation_note}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                  >
                    Link ↗
                  </a>
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="px-4 py-1.5 text-xs font-semibold bg-[#232536] hover:bg-[#191A23] text-white rounded-lg transition shadow-xs cursor-pointer"
                  >
                    Edit Item
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Edit Item Modal */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <h3 className="text-lg font-bold text-gray-900">Edit Library Item</h3>
              <button
                onClick={handleCloseModal}
                aria-label="Close edit modal"
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            {modalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs mb-4">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Creator
                </label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                >
                  <option value="podcast">Podcast</option>
                  <option value="book">Book</option>
                  <option value="newsletter">Newsletter</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Recommendation Note
                </label>
                <textarea
                  value={recommendationNote}
                  onChange={(e) => setRecommendationNote(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                  placeholder="Why this item is recommended..."
                />
              </div>

              {/* Topic Tags Multi-select Section */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                  Topic Tags
                </label>

                {!topicTaggingAvailable ? (
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs text-amber-800">
                    Topic tagging needs the database update
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags
                      .filter((t) => !t.is_internal)
                      .map((t) => {
                        const isSelected = selectedTagIds.includes(t.id)
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => toggleTag(t.id)}
                            className={`px-3 py-1 text-xs rounded-full font-medium transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#EF5B45] text-white shadow-xs'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {t.name}
                          </button>
                        )
                      })}
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs font-semibold bg-[#EF5B45] hover:bg-[#df4a34] text-white rounded-lg transition shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
