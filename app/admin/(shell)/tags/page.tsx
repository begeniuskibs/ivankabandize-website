'use client'

import React, { useEffect, useState } from 'react'

interface TagRecord {
  id: string
  name: string
  slug: string
  description: string | null
  is_internal: boolean
  created_at: string
  updated_at: string
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagRecord | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [modalError, setModalError] = useState<string | null>(null)

  useEffect(() => {
    fetchTags()
  }, [])

  async function fetchTags() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/tags')
      if (res.ok) {
        const data = await res.json()
        setTags(data.tags || [])
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to load tags')
      }
    } catch {
      setError('Network error fetching tags')
    } finally {
      setLoading(false)
    }
  }

  function handleOpenCreate() {
    setEditingTag(null)
    setName('')
    setDescription('')
    setError(null)
    setModalError(null)
    setSuccess(null)
    setIsModalOpen(true)
  }

  function handleOpenEdit(tag: TagRecord) {
    setEditingTag(tag)
    setName(tag.name)
    setDescription(tag.description || '')
    setError(null)
    setModalError(null)
    setSuccess(null)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setModalError(null)
  }

  async function handleSaveTag(e: React.FormEvent) {
    e.preventDefault()
    setModalError(null)

    if (!name.trim()) {
      setModalError('Tag name is required')
      return
    }

    if (description.length > 280) {
      setModalError('Description cannot exceed 280 characters')
      return
    }

    setSaving(true)

    try {
      const isEditing = Boolean(editingTag)
      const url = '/api/admin/tags'
      const method = isEditing ? 'PATCH' : 'POST'

      const payload = isEditing
        ? {
            id: editingTag!.id,
            name: name.trim(),
            description: description.trim() || null,
          }
        : {
            name: name.trim(),
            description: description.trim() || null,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save tag')
      }

      setSuccess(`Tag "${payload.name}" saved successfully`)
      handleCloseModal()
      fetchTags()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error saving tag'
      setModalError(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900">Tags</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {tags.length} total
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>+</span>
            <span>New Tag</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto w-full px-6 sm:px-10 py-8 flex-1">
        {/* Intro */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tags Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage public topic taxonomies, intro descriptions for topic pages, and slug assignments.
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-800 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm mb-6 flex items-center justify-between">
            <span>{success}</span>
            <button
              type="button"
              onClick={() => setSuccess(null)}
              className="text-emerald-500 hover:text-emerald-800 font-bold"
            >
              &times;
            </button>
          </div>
        )}

        {/* Tags List */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Loading tags...
          </div>
        ) : tags.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-gray-200 max-w-lg mx-auto p-8 shadow-sm">
            <div className="text-4xl mb-3">&#127991;&#65039;</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">No tags created yet</h3>
            <p className="text-xs text-gray-500 mb-6">Create tags to organize posts into topics.</p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition"
            >
              + Create Tag
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 hover:bg-gray-50/50 transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">
                      {tag.name}
                    </h3>
                    <span className="text-xs text-gray-400 font-mono">
                      /garden/topics/{tag.slug}
                    </span>
                    {tag.is_internal && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                        Internal
                      </span>
                    )}
                  </div>
                  {tag.description ? (
                    <p className="text-xs text-gray-600 leading-relaxed max-w-2xl mt-1">
                      {tag.description}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 italic mt-1">
                      No description (topic intro is empty)
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(tag)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-black hover:bg-gray-100 rounded-lg transition border border-gray-200 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-gray-200 overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  {editingTag ? 'Edit Tag' : 'Create New Tag'}
                </h3>
                <p className="text-xs text-gray-500">
                  Configure tag details and topic page introduction.
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
            <form onSubmit={handleSaveTag} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {modalError}
                </div>
              )}

              {/* Tag Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tag Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Slug Preview */}
              {editingTag && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Topic URL Slug
                  </label>
                  <div className="flex items-center text-xs font-mono text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    /garden/topics/{editingTag.slug}
                  </div>
                </div>
              )}

              {/* Description field (textarea, max 280 characters) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">
                    Description (Topic Intro)
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      description.length > 280
                        ? 'text-red-600 font-bold'
                        : description.length > 240
                        ? 'text-amber-600'
                        : 'text-gray-400'
                    }`}
                  >
                    {description.length} / 280
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={280}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short introductory summary for this topic page (max 280 characters)..."
                  className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Displayed at the top of the topic page. If left empty, no description or placeholder will appear.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || description.length > 280}
                  className="px-4 py-2 bg-black hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
