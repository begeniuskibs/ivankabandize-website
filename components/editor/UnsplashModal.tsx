'use client'

import React, { useState } from 'react'

interface UnsplashPhoto {
  id: string
  description: string
  urls: {
    regular: string
    small: string
    thumb: string
  }
  user: {
    name: string
    username: string
    profileUrl: string
  }
  caption: string
  downloadLocation: string
}

interface UnsplashModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (imageUrl: string, captionHtml: string) => void
}

export default function UnsplashModal({ isOpen, onClose, onSelect }: UnsplashModalProps) {
  const [query, setQuery] = useState('')
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMissingKey, setIsMissingKey] = useState(false)

  if (!isOpen) return null

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setIsMissingKey(false)

    try {
      const res = await fetch(`/api/admin/unsplash/search?query=${encodeURIComponent(query.trim())}`)
      const data = await res.json()

      if (!res.ok) {
        if (res.status === 503 || data.isConfigured === false) {
          setIsMissingKey(true)
          setError(data.error || 'UNSPLASH_ACCESS_KEY is not configured in the environment.')
        } else {
          setError(data.error || 'Failed to search Unsplash.')
        }
        setPhotos([])
        return
      }

      setPhotos(data.results || [])
      if ((data.results || []).length === 0) {
        setError('No images found matching your query.')
      }
    } catch {
      setError('An unexpected network error occurred while contacting Unsplash.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelect(photo: UnsplashPhoto) {
    // 1. Trigger Unsplash mandatory track-download endpoint
    if (photo.downloadLocation) {
      try {
        fetch('/api/admin/unsplash/track-download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
        }).catch(err => console.error('Failed to trigger track-download:', err))
      } catch (err) {
        console.error('Track download error:', err)
      }
    }

    // 2. Select hotlinked Unsplash CDN URL + attribution caption
    onSelect(photo.urls.regular, photo.caption)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">Search Unsplash Photos</h2>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
              Hotlinked &amp; Attributed
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 leading-none"
          >
            &times;
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 pb-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search high-resolution photos on Unsplash..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>

          {isMissingKey && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm">
              <p className="font-semibold mb-1">⚠️ Missing Unsplash API Key</p>
              <p>
                <code>UNSPLASH_ACCESS_KEY</code> is not configured in your environment. Please add your Unsplash Access Key to <code>.env.local</code> / Vercel Environment Variables to enable live photo searches.
              </p>
            </div>
          )}

          {!isMissingKey && error && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="flex-1 overflow-y-auto p-6 pt-0">
          {photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {photos.map(photo => (
                <div
                  key={photo.id}
                  onClick={() => handleSelect(photo)}
                  className="group relative aspect-[4/3] rounded-xl overflow-hidden cursor-pointer border border-gray-200 bg-gray-100 hover:shadow-lg transition-all"
                >
                  <img
                    src={photo.urls.small}
                    alt={photo.description}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3 text-white">
                    <p className="text-xs font-medium truncate">{photo.user.name}</p>
                    <p className="text-[10px] text-gray-300">Click to select</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {photos.length === 0 && !loading && !error && !isMissingKey && (
            <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-sm">
              <p>Type a topic or concept above and press Search</p>
              <p className="text-xs text-gray-300 mt-1">e.g. &quot;systems&quot;, &quot;nature&quot;, &quot;architecture&quot;, &quot;books&quot;</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
          <span>Photos provided by Unsplash API</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 border border-gray-300 rounded-lg hover:bg-white text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
