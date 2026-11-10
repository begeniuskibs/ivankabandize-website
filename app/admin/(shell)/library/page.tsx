'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CloseIcon } from '@/components/admin/icons'
import TipTapEditor from '@/components/editor/TipTapEditor'
import { getTipTapWordCount, isNonEmptyTipTapDoc } from '@/lib/libraryTake'
import {
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_IMAGE_SIZE_BYTES,
  isAllowedImageExtension,
} from '@/lib/uploadRules'

const ALLOWED_LINK_TYPES = [
  'book',
  'audible',
  'spotify',
  'apple_podcasts',
  'youtube',
  'website',
] as const

type LibraryLinkType = (typeof ALLOWED_LINK_TYPES)[number]

const LINK_TYPE_LABELS: Record<LibraryLinkType, string> = {
  book: 'Get the book',
  audible: 'Listen on Audible',
  spotify: 'Listen on Spotify',
  apple_podcasts: 'Listen on Apple Podcasts',
  youtube: 'Watch on YouTube',
  website: 'Visit website',
}

interface LibraryLinkItem {
  type: LibraryLinkType
  url: string
  label?: string
}

function safeParseLibraryLinks(raw: unknown): LibraryLinkItem[] {
  if (!Array.isArray(raw)) return []
  const result: LibraryLinkItem[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue
    const { type, url, label } = item as Record<string, unknown>
    if (
      typeof type === 'string' &&
      (ALLOWED_LINK_TYPES as readonly string[]).includes(type) &&
      typeof url === 'string' &&
      url.trim().length > 0
    ) {
      const parsed: LibraryLinkItem = {
        type: type as LibraryLinkType,
        url: url.trim(),
      }
      if (typeof label === 'string' && label.trim().length > 0) {
        parsed.label = label.trim()
      }
      result.push(parsed)
    }
  }
  return result
}

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
  slug?: string | null
  links?: LibraryLinkItem[] | null
  video_url?: string | null
  take?: Record<string, unknown> | null
  take_published?: boolean | null
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
  const [slug, setSlug] = useState('')
  const [url, setUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [recommendationNote, setRecommendationNote] = useState('')
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [links, setLinks] = useState<LibraryLinkItem[]>([])
  const [take, setTake] = useState<Record<string, unknown> | null>(null)
  const [takePublished, setTakePublished] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
    setSlug(item.slug || '')
    setUrl(item.url)
    setVideoUrl(item.video_url || '')
    setThumbnailUrl(item.thumbnail_url || '')
    setRecommendationNote(item.recommendation_note || '')
    setSelectedTagIds(item.tag_ids || [])
    setLinks(safeParseLibraryLinks(item.links))
    setTake(item.take && typeof item.take === 'object' ? item.take : null)
    setTakePublished(Boolean(item.take_published))
    setUploadError(null)
    setModalError(null)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setEditingItem(null)
    setTake(null)
    setTakePublished(false)
    setModalError(null)
    setUploadError(null)
    setIsUploading(false)
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)
    const rawExt = file.name.includes('.') ? file.name.split('.').pop() || '' : ''
    if (!isAllowedImageExtension(rawExt)) {
      setUploadError(
        `File extension .${rawExt} is not allowed. Allowed extensions: ${ALLOWED_IMAGE_EXTENSIONS.join(
          ', '
        )}`
      )
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError('File size exceeds 10 MB limit for images')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'post-images')

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok && data.url) {
        setThumbnailUrl(data.url)
      } else {
        setUploadError(data.error || 'Failed to upload image')
      }
    } catch {
      setUploadError('Network error uploading image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  function handleAddLink() {
    if (links.length >= 8) return
    setLinks((prev) => [...prev, { type: 'website', url: '', label: '' }])
  }

  function handleRemoveLink(index: number) {
    setLinks((prev) => prev.filter((_, i) => i !== index))
  }

  function handleMoveLinkUp(index: number) {
    if (index === 0) return
    setLinks((prev) => {
      const copy = [...prev]
      const temp = copy[index - 1]
      copy[index - 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  function handleMoveLinkDown(index: number) {
    if (index === links.length - 1) return
    setLinks((prev) => {
      const copy = [...prev]
      const temp = copy[index + 1]
      copy[index + 1] = copy[index]
      copy[index] = temp
      return copy
    })
  }

  function handleLinkChange(
    index: number,
    field: keyof LibraryLinkItem,
    value: string
  ) {
    setLinks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
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
    if (!slug.trim()) {
      setModalError('Page address cannot be empty.')
      return
    }
    if (!url.trim()) {
      setModalError('URL is required')
      return
    }

    setSaving(true)
    try {
      const cleanLinks = links.map((l) => {
        const item: LibraryLinkItem = {
          type: l.type,
          url: l.url.trim(),
        }
        if (l.label && l.label.trim()) {
          item.label = l.label.trim()
        }
        return item
      })

      const res = await fetch('/api/admin/library', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem.id,
          title,
          creator,
          type,
          slug: slug.trim(),
          url,
          video_url: videoUrl.trim() ? videoUrl.trim() : null,
          thumbnail_url: thumbnailUrl ? thumbnailUrl.trim() : null,
          recommendation_note: recommendationNote ? recommendationNote.trim() : null,
          tag_ids: selectedTagIds,
          links: cleanLinks,
          take,
          take_published: takePublished,
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                      {item.type}
                    </span>
                    {isNonEmptyTipTapDoc(item.take) ? (
                      item.take_published ? (
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#E8F4F1] text-teal-text border border-[#2AA198]/20">
                          Take: published
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                          Take: draft
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-50 text-gray-400 border border-gray-200">
                        Take: none
                      </span>
                    )}
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
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
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

              {/* Page address (slug) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Page address
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                  placeholder="e.g. entrepreneurship-masterclass"
                  required
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  This becomes ivankabandize.com/library/your-address. Lowercase letters, numbers and hyphens only.
                </p>
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

              {/* Video URL (YouTube) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Video URL (YouTube)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Used for the video player on podcast pages. Leave empty if there is none.
                </p>
              </div>

              {/* Thumbnail URL with Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45]/20 focus:border-[#EF5B45]"
                    placeholder="https://..."
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-2 text-xs font-semibold rounded-lg border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isUploading ? 'Uploading...' : 'Upload image'}
                  </button>
                </div>

                {uploadError && (
                  <p className="text-xs text-red-600 mt-1">{uploadError}</p>
                )}

                {thumbnailUrl && (
                  <div className="mt-2.5 flex items-center gap-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="relative w-12 h-12 shrink-0 rounded-md overflow-hidden bg-gray-200 border border-gray-300">
                      <Image
                        src={thumbnailUrl}
                        alt="Thumbnail preview"
                        width={48}
                        height={48}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-500 truncate flex-1 font-mono">
                      {thumbnailUrl}
                    </span>
                  </div>
                )}
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

              {/* My Take Section */}
              <div className="pt-2 border-t border-gray-100 space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                    My Take
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Write your personal commentary, takeaways, and key insights for this resource.
                  </p>
                  <div className="border border-gray-300 rounded-xl overflow-hidden focus-within:border-[#EF5B45] focus-within:ring-2 focus-within:ring-[#EF5B45]/20 bg-white">
                    <TipTapEditor
                      key={editingItem.id}
                      content={take || undefined}
                      onChange={(doc) => setTake(doc)}
                      placeholder="Write your take on this item..."
                    />
                  </div>
                </div>

                {/* Live word count and soft guidance */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <span className="text-gray-600">Word count:</span>
                    <span
                      className={
                        getTipTapWordCount(take) >= 500
                          ? 'text-emerald-600 font-bold'
                          : 'text-amber-600 font-bold'
                      }
                    >
                      {getTipTapWordCount(take)} words
                    </span>
                  </div>
                  <span className="text-gray-400 italic text-[11px]">
                    Aim for 500 words or more. You can still save with fewer.
                  </span>
                </div>

                {/* Published switch */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={takePublished && isNonEmptyTipTapDoc(take)}
                      disabled={!isNonEmptyTipTapDoc(take)}
                      onClick={() => setTakePublished((prev) => !prev)}
                      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[#EF5B45] focus:ring-offset-2 ${
                        !isNonEmptyTipTapDoc(take)
                          ? 'bg-gray-200 opacity-50 cursor-not-allowed'
                          : takePublished
                            ? 'bg-[#EF5B45] cursor-pointer'
                            : 'bg-gray-200 cursor-pointer'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                          takePublished && isNonEmptyTipTapDoc(take) ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        Published
                      </span>
                      <p className="text-xs text-gray-500">
                        {!isNonEmptyTipTapDoc(take)
                          ? 'Write your take first'
                          : takePublished
                            ? 'Your take is live on the public item page.'
                            : 'Turn on to publish your take on the public item page.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Links List Section */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      Links
                    </label>
                    <span className="text-[11px] font-semibold text-gray-500">
                      ({links.length}/8)
                    </span>
                  </div>
                  {links.length < 8 && (
                    <button
                      type="button"
                      onClick={handleAddLink}
                      className="px-2.5 py-1 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition cursor-pointer"
                    >
                      + Add link
                    </button>
                  )}
                </div>

                {links.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">
                    No links added yet. Click &quot;+ Add link&quot; to attach Spotify, Audible, YouTube, or other links.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {links.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-[11px] font-bold text-gray-400 w-4">
                              #{idx + 1}
                            </span>
                            <select
                              value={link.type}
                              onChange={(e) =>
                                handleLinkChange(idx, 'type', e.target.value)
                              }
                              className="px-2.5 py-1 text-xs font-semibold border border-gray-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-[#EF5B45]"
                            >
                              {ALLOWED_LINK_TYPES.map((t) => (
                                <option key={t} value={t}>
                                  {LINK_TYPE_LABELS[t]} ({t})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveLinkUp(idx)}
                              disabled={idx === 0}
                              className="px-2 py-0.5 text-[11px] font-medium border border-gray-200 rounded bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                            >
                              Move up
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveLinkDown(idx)}
                              disabled={idx === links.length - 1}
                              className="px-2 py-0.5 text-[11px] font-medium border border-gray-200 rounded bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-30 disabled:hover:bg-white cursor-pointer disabled:cursor-not-allowed"
                            >
                              Move down
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveLink(idx)}
                              className="px-2 py-0.5 text-[11px] font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded cursor-pointer"
                            >
                              Remove
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <input
                              type="url"
                              value={link.url}
                              onChange={(e) =>
                                handleLinkChange(idx, 'url', e.target.value)
                              }
                              placeholder="https://..."
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-[#EF5B45]"
                              required
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={link.label || ''}
                              maxLength={60}
                              onChange={(e) =>
                                handleLinkChange(idx, 'label', e.target.value)
                              }
                              placeholder="Optional label (max 60 chars)"
                              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-[#EF5B45]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition cursor-pointer"
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
