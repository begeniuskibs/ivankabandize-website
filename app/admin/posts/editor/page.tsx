'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import TipTapEditor from '@/components/editor/TipTapEditor'

interface Tag {
  id: string
  name: string
  slug: string
}

function PostEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams.get('id')

  // Row 1: What
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState<Record<string, unknown>>({})

  // Row 2: Who & Classification
  const [visibility, setVisibility] = useState<'public' | 'free' | 'paid' | 'comped'>('public')
  const [contentType, setContentType] = useState<'random_thoughts' | 'structured_thoughts' | 'tools_for_thought'>('structured_thoughts')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')

  // Row 3: When
  const [publishStatus, setPublishStatus] = useState<'draft' | 'scheduled' | 'published'>('draft')
  const [scheduledDate, setScheduledDate] = useState('')

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchTags()
    if (postId) {
      loadPost(postId)
    }
  }, [postId])

  async function fetchTags() {
    try {
      const res = await fetch('/api/admin/tags')
      if (res.ok) {
        const data = await res.json()
        setAvailableTags(data.tags || [])
      }
    } catch (e) {
      console.error('Failed to fetch tags', e)
    }
  }

  async function loadPost(id: string) {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/posts/${id}`)
      if (res.ok) {
        const { post } = await res.json()
        setTitle(post.title || '')
        setSlug(post.slug || '')
        setExcerpt(post.excerpt || '')
        setContent(post.content || {})
        setVisibility(post.visibility || 'public')
        setContentType(post.content_type || 'structured_thoughts')
        setPublishStatus(post.publish_status || 'draft')
        if (post.published_at) {
          setScheduledDate(new Date(post.published_at).toISOString().slice(0, 16))
        }
        if (post.post_tags) {
          setSelectedTagIds(post.post_tags.map((pt: { tag: Tag }) => pt.tag?.id).filter(Boolean))
        }
      } else {
        setError('Failed to load post')
      }
    } catch {
      setError('Error loading post')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return
    try {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTagName.trim() }),
      })
      if (res.ok) {
        const { tag } = await res.json()
        setAvailableTags(prev => [...prev, tag])
        setSelectedTagIds(prev => [...prev, tag.id])
        setNewTagName('')
      }
    } catch (e) {
      console.error('Failed to create tag', e)
    }
  }

  function toggleTag(id: string) {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  async function handleSave(status: 'draft' | 'scheduled' | 'published') {
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (!title.trim()) {
      setError('Please provide a post title.')
      setLoading(false)
      return
    }

    let targetPublishedAt: string | null = null
    if (status === 'published') {
      targetPublishedAt = new Date().toISOString()
    } else if (status === 'scheduled') {
      if (!scheduledDate) {
        setError('Please choose a future date & time for scheduled publishing.')
        setLoading(false)
        return
      }
      targetPublishedAt = new Date(scheduledDate).toISOString()
    }

    const payload = {
      title,
      slug: slug || undefined,
      excerpt,
      content,
      visibility,
      content_type: contentType,
      publish_status: status,
      published_at: targetPublishedAt,
      tag_ids: selectedTagIds,
    }

    try {
      const url = postId ? `/api/admin/posts/${postId}` : '/api/admin/posts'
      const method = postId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save post')
      }

      setPublishStatus(status)
      setSuccess(`Post successfully ${status === 'published' ? 'published' : status === 'scheduled' ? 'scheduled' : 'saved as draft'}!`)

      if (!postId && data.post?.id) {
        router.push(`/admin/posts/editor?id=${data.post.id}`)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Post Editor</h1>
            <p className="text-sm text-gray-500 mt-1">Ghost Three-Row Publish Model</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider ${
              publishStatus === 'published'
                ? 'bg-green-100 text-green-800'
                : publishStatus === 'scheduled'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-200 text-gray-800'
            }`}>
              {publishStatus}
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* ROW 1: WHAT (Title + TipTap Body) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Row 1 &bull; What</span>
          </div>

          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Post Title..."
              className="w-full text-3xl font-bold placeholder-gray-300 border-0 focus:ring-0 focus:outline-none p-0 text-gray-900"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Custom Slug (Optional)</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="my-custom-post-slug"
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Short Excerpt</label>
              <input
                type="text"
                value={excerpt}
                onChange={e => setExcerpt(e.target.value)}
                placeholder="Brief summary of the post..."
                className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Content Body (TipTap Rich Text)</label>
            <TipTapEditor
              content={content}
              onChange={newJson => setContent(newJson)}
              placeholder="Begin writing your post..."
            />
          </div>
        </div>

        {/* ROW 2: WHO (Visibility + Tags) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Row 2 &bull; Who</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visibility Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Post Access / Visibility</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'public', label: 'Public (All)', desc: 'Visible to everyone' },
                  { value: 'free', label: 'Free Members', desc: 'Logged-in members' },
                  { value: 'paid', label: 'Paid Members', desc: 'Paid subscribers' },
                  { value: 'comped', label: 'Comped / VIP', desc: 'Comped & VIP tier' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setVisibility(opt.value as typeof visibility)}
                    className={`p-3 text-left border rounded-lg transition ${
                      visibility === opt.value
                        ? 'border-black bg-gray-50 text-black font-semibold'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tag Assignment */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Tags / Topics</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {availableTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-black text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    #{tag.name}
                  </button>
                ))}
              </div>

              {/* Add New Tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="New tag..."
                  className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={handleCreateTag}
                  className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-black font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Content Type / Garden Stream Selector */}
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">Garden Stream / Content Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  value: 'random_thoughts',
                  label: 'Random Thoughts',
                  desc: 'Spontaneous sparks, observations, raw reflections',
                },
                {
                  value: 'structured_thoughts',
                  label: 'Structured Thoughts',
                  desc: 'In-depth essays, mental models, frameworks',
                },
                {
                  value: 'tools_for_thought',
                  label: 'Tools for Thought',
                  desc: 'Workflows, software tools, systems',
                },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setContentType(opt.value as typeof contentType)}
                  className={`p-3 text-left border rounded-lg transition ${
                    contentType === opt.value
                      ? 'border-black bg-gray-50 text-black font-semibold ring-1 ring-black'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: WHEN (Publish Now / Schedule / Save Draft) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
          <div className="border-b border-gray-100 pb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Row 3 &bull; When</span>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Schedule Input */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Schedule For:</label>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSave('draft')}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Save Draft
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSave('scheduled')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
              >
                Schedule
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSave('published')}
                className="px-5 py-2 bg-black hover:bg-gray-800 text-white rounded-lg text-sm font-semibold transition"
              >
                Publish Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PostEditorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">Loading editor...</div>}>
      <PostEditorContent />
    </Suspense>
  )
}

