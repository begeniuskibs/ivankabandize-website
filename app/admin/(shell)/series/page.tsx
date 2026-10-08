'use client'

import React, { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import {
  uploadFileDirect,
  UploadProgressCard,
  formatBytes,
} from '@/components/editor/UploadProgress'

interface SeriesPostItem {
  id: string
  title: string
  slug: string
  publish_status: 'draft' | 'scheduled' | 'published'
  published_at: string | null
  created_at: string
}

interface SeriesRecord {
  id: string
  title: string
  slug: string
  description: string | null
  intro: string | null
  header_image_url: string | null
  status: 'growing' | 'complete'
  cover_emoji: string | null
  card_tint: string | null
  sort_order: number
  created_at: string
  updated_at: string
  posts?: SeriesPostItem[]
  total_posts?: number
  published_posts?: number
}

export default function AdminSeriesListPage() {
  const [seriesList, setSeriesList] = useState<SeriesRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Drawer / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSeries, setEditingSeries] = useState<SeriesRecord | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [description, setDescription] = useState('')
  const [intro, setIntro] = useState('')
  const [status, setStatus] = useState<'growing' | 'complete'>('growing')
  const [coverEmoji, setCoverEmoji] = useState('')
  const [cardTint, setCardTint] = useState('')
  const [headerImageUrl, setHeaderImageUrl] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<number>(0)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{
    filename: string
    percent: number
    loadedText: string
    totalText: string
  } | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageErrorRef = useRef<HTMLDivElement>(null)
  const modalErrorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (imageError && imageErrorRef.current) {
      imageErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [imageError])

  useEffect(() => {
    if (modalError && modalErrorRef.current) {
      modalErrorRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [modalError])

  useEffect(() => {
    fetchSeries()
  }, [])

  async function fetchSeries() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/series')
      if (res.ok) {
        const data = await res.json()
        setSeriesList(data.series || [])
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to load series')
      }
    } catch {
      setError('Network error fetching series')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenCreate() {
    setEditingSeries(null)
    setTitle('')
    setSlug('')
    setSlugManuallyEdited(false)
    setDescription('')
    setIntro('')
    setStatus('growing')
    setCoverEmoji('')
    setCardTint('')
    setHeaderImageUrl(null)
    setSortOrder(seriesList.length)
    setError(null)
    setImageError(null)
    setModalError(null)
    setSuccess(null)
    setUploadProgress(null)
    setIsModalOpen(true)
  }

  function handleOpenEdit(item: SeriesRecord) {
    setEditingSeries(item)
    setTitle(item.title)
    setSlug(item.slug)
    setSlugManuallyEdited(true)
    setDescription(item.description || '')
    setIntro(item.intro || '')
    setStatus(item.status)
    setCoverEmoji(item.cover_emoji || '')
    setCardTint(item.card_tint || '')
    setHeaderImageUrl(item.header_image_url || null)
    setSortOrder(item.sort_order || 0)
    setError(null)
    setImageError(null)
    setModalError(null)
    setSuccess(null)
    setUploadProgress(null)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setImageError(null)
    setModalError(null)
  }

  function handleTitleChange(val: string) {
    setTitle(val)
    if (!slugManuallyEdited) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setSlug(generated)
    }
  }

  function handleSlugChange(val: string) {
    setSlugManuallyEdited(true)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setImageError(null)

    // Validate: image types only
    if (!file.type.startsWith('image/')) {
      setImageError('That file is not an image. Please choose a PNG, JPG or WebP file.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Validate: max 10 MB
    const maxSizeBytes = 10 * 1024 * 1024 // 10 MB
    if (file.size > maxSizeBytes) {
      setImageError('That image is too large (max 10 MB). Please choose a smaller file.')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setUploadProgress({
      filename: file.name,
      percent: 0,
      loadedText: '0 B',
      totalText: formatBytes(file.size),
    })

    try {
      const res = await uploadFileDirect({
        file,
        bucket: 'post-images',
        onProgress: (p) => {
          setUploadProgress({
            filename: file.name,
            percent: p.percent,
            loadedText: p.formattedLoaded,
            totalText: p.formattedTotal,
          })
        },
      })

      if (res.url) {
        setHeaderImageUrl(res.url)
        setImageError(null)
      } else {
        throw new Error('Upload succeeded but no image URL was returned')
      }
    } catch (err) {
      console.error('Image upload failed', err)
      setImageError('The upload failed. Please check your connection and try again.')
    } finally {
      setUploadProgress(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  async function handleSaveSeries(e: React.FormEvent) {
    e.preventDefault()
    setModalError(null)

    if (!title.trim()) {
      setModalError('Series title is required')
      return
    }

    if (slug.trim().toLowerCase() === 'series') {
      setModalError("The slug 'series' is reserved")
      return
    }

    setSaving(true)

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || null,
      intro: intro.trim() || null,
      status,
      cover_emoji: coverEmoji.trim() || null,
      card_tint: cardTint.trim() || null,
      header_image_url: headerImageUrl || null,
      sort_order: sortOrder,
    }

    try {
      const url = editingSeries ? `/api/admin/series/${editingSeries.id}` : '/api/admin/series'
      const method = editingSeries ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save series')
      }

      setSuccess(`Series "${payload.title}" saved successfully`)
      handleCloseModal()
      fetchSeries()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving series'
      setModalError(message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteSeries(item: SeriesRecord) {
    if (item.total_posts && item.total_posts > 0) {
      alert(`Cannot delete series "${item.title}" because it contains ${item.total_posts} assigned post${item.total_posts === 1 ? '' : 's'}. Remove the series assignment from those posts first.`)
      return
    }

    const confirmed = window.confirm(`Are you sure you want to delete the series "${item.title}"? This cannot be undone.`)
    if (!confirmed) return

    try {
      const res = await fetch(`/api/admin/series/${item.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete series')
      }

      setSuccess(`Series "${item.title}" deleted`)
      fetchSeries()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error deleting series'
      setError(message)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900">Series</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {seriesList.length} total
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>New Series</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-6 sm:px-10 py-8 flex-1">
        {/* Intro */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Post Series</h2>
          <p className="text-sm text-gray-500 mt-1">
            Curate ordered multi-part writing collections. Posts are automatically ordered by publish date.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-red-500 hover:text-red-800 font-bold">&times;</button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm mb-6 flex items-center justify-between">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess(null)} className="text-emerald-500 hover:text-emerald-800 font-bold">&times;</button>
          </div>
        )}

        {/* Series List */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Loading series...
          </div>
        ) : seriesList.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 max-w-lg mx-auto p-8 shadow-sm">
            <div className="text-4xl mb-3">📚</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No series created yet</h3>
            <p className="text-xs text-gray-500 mb-6">Create your first series to group connected posts into multi-part collections.</p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition"
            >
              + Create Series
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {seriesList.map((item) => {
              const posts = item.posts || []
              const totalCount = item.total_posts || posts.length
              const publishedCount = item.published_posts || posts.filter((p) => p.publish_status === 'published').length

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition hover:border-gray-300"
                >
                  {/* Series Header Card */}
                  <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      {/* Emoji or Icon */}
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-2xl shrink-0">
                        {item.cover_emoji || '📚'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                            {item.title}
                          </h3>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              item.status === 'complete'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            Series - {item.status.toUpperCase()}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            /{item.slug}
                          </span>
                        </div>

                        {item.description && (
                          <p className="text-xs text-gray-600 line-clamp-2 mb-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">
                            {publishedCount} published / {totalCount} total parts
                          </span>
                          {item.card_tint && (
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <span
                                className="w-3 h-3 rounded-full border border-gray-300 inline-block"
                                style={{ backgroundColor: item.card_tint }}
                              />
                              <span className="font-mono text-[11px]">{item.card_tint}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(item)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition border border-gray-200 cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={totalCount > 0}
                        onClick={() => handleDeleteSeries(item)}
                        title={
                          totalCount > 0
                            ? `Cannot delete series with ${totalCount} assigned posts`
                            : 'Delete series'
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition border ${
                          totalCount > 0
                            ? 'text-gray-300 border-gray-200 cursor-not-allowed bg-gray-50'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 cursor-pointer'
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Parts List Below Each Series */}
                  <div className="p-6 bg-gray-50/60">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-4">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Parts in this Series ({posts.length})
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium">
                        To reorder, change the post&apos;s publish date.
                      </p>
                    </div>

                    {posts.length === 0 ? (
                      <div className="p-4 rounded-xl bg-white border border-dashed border-gray-200 text-center text-xs text-gray-400">
                        No posts assigned to this series yet. Select this series in the post editor&apos;s publish settings.
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                        {posts.map((post, idx) => (
                          <div
                            key={post.id}
                            className="p-3.5 px-4 flex items-center justify-between gap-4 hover:bg-gray-50/80 transition"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-bold font-mono text-gray-400 w-12 shrink-0">
                                Part {idx + 1}
                              </span>
                              <Link
                                href={`/admin/posts/editor?id=${post.id}`}
                                className="text-xs font-semibold text-gray-900 hover:text-[#EF5B45] transition truncate"
                              >
                                {post.title}
                              </Link>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  post.publish_status === 'published'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : post.publish_status === 'scheduled'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {post.publish_status}
                              </span>
                              <span className="text-[11px] text-gray-400 font-medium">
                                {post.published_at
                                  ? new Date(post.published_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : 'No publish date'}
                              </span>
                              <Link
                                href={`/admin/posts/editor?id=${post.id}`}
                                className="text-xs text-gray-400 hover:text-black font-semibold"
                                title="Edit post"
                              >
                                &rarr;
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingSeries ? 'Edit Series' : 'Create New Series'}
                </h3>
                <p className="text-xs text-gray-500">
                  Configure series metadata and display attributes.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveSeries} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Series Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Generative AI Leader"
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  URL Slug *
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-400 px-2 py-2 bg-gray-50 border border-r-0 border-gray-200 rounded-l-lg font-mono">
                    /garden/series/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="generative-ai-leader"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-r-lg font-mono focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Status & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'growing' | 'complete')}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="growing">Growing (active ongoing series)</option>
                    <option value="complete">Complete (finished collection)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Emoji & Card Tint */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Cover Emoji (Optional)
                  </label>
                  <input
                    type="text"
                    value={coverEmoji}
                    onChange={(e) => setCoverEmoji(e.target.value)}
                    placeholder="e.g. 🎁 or 💡"
                    className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Card Tint (Optional hex / color)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cardTint}
                      onChange={(e) => setCardTint(e.target.value)}
                      placeholder="e.g. #FDF3DC or #2AA198"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    {cardTint && (
                      <span
                        className="w-7 h-7 rounded-lg border border-gray-200 shrink-0 shadow-xs"
                        style={{ backgroundColor: cardTint }}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Short Description (for the card)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Concise 1-2 sentence overview for the series card..."
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              {/* Intro */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Intro Text (for the series landing page)
                </label>
                <textarea
                  rows={4}
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder="Longer introduction or essay setting up the series on its landing page..."
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              {/* Header Image */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Header Image (Uploaded to post-images)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {imageError ? (
                  <div
                    ref={imageErrorRef}
                    className="relative w-full py-5 px-4 border border-red-200 bg-red-50 rounded-xl flex flex-col items-center justify-center text-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => setImageError(null)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-700 p-1 text-sm font-bold leading-none cursor-pointer"
                      aria-label="Dismiss error"
                    >
                      &times;
                    </button>
                    <p className="text-xs font-medium text-red-800 max-w-sm">
                      {imageError}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition cursor-pointer shadow-xs"
                    >
                      Try again
                    </button>
                  </div>
                ) : uploadProgress ? (
                  <div className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50/50">
                    <UploadProgressCard
                      filename={uploadProgress.filename}
                      percent={uploadProgress.percent}
                      loadedText={uploadProgress.loadedText}
                      totalText={uploadProgress.totalText}
                    />
                  </div>
                ) : headerImageUrl ? (
                  <div className="space-y-2">
                    <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden border border-gray-200 group bg-gray-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={headerImageUrl}
                        alt="Series header preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-semibold hover:bg-gray-100 cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHeaderImageUrl(null)
                            setImageError(null)
                          }}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                      <span className="text-[11px] text-gray-400 font-mono truncate max-w-[220px]">
                        Header image preview
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-medium text-gray-600 hover:text-black cursor-pointer underline"
                        >
                          Replace image
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setHeaderImageUrl(null)
                            setImageError(null)
                          }}
                          className="text-xs font-medium text-red-600 hover:text-red-700 cursor-pointer underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-gray-400 transition cursor-pointer text-gray-500 hover:text-gray-700"
                  >
                    <span className="text-xl">🖼️</span>
                    <span className="text-xs font-semibold">
                      Upload Header Image
                    </span>
                    <span className="text-[10px] text-gray-400">PNG, JPG, WebP up to 10MB</span>
                  </button>
                )}
              </div>

              {/* Modal Error */}
              {modalError && (
                <div
                  ref={modalErrorRef}
                  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center justify-between"
                >
                  <span>{modalError}</span>
                  <button
                    type="button"
                    onClick={() => setModalError(null)}
                    className="text-red-500 hover:text-red-800 font-bold ml-2 cursor-pointer"
                  >
                    &times;
                  </button>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || Boolean(uploadProgress)}
                  className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : editingSeries ? 'Update Series' : 'Create Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
