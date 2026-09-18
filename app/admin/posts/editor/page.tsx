'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import TipTapEditor from '@/components/editor/TipTapEditor'
import UnsplashModal from '@/components/editor/UnsplashModal'

interface Tag {
  id: string
  name: string
  slug: string
}

function PostEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams.get('id')
  const featureImageInputRef = useRef<HTMLInputElement>(null)

  // Post Data
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState<Record<string, unknown>>({})
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null)
  const [featuredImageCaption, setFeaturedImageCaption] = useState<string | null>(null)

  // Drawer Settings (Who & Classification)
  const [visibility, setVisibility] = useState<'public' | 'free' | 'paid' | 'comped'>('public')
  const [contentType, setContentType] = useState<'random_thoughts' | 'structured_thoughts' | 'tools_for_thought'>('structured_thoughts')
  const [availableTags, setAvailableTags] = useState<Tag[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [newTagName, setNewTagName] = useState('')

  // Publish / Schedule
  const [publishStatus, setPublishStatus] = useState<'draft' | 'scheduled' | 'published'>('draft')
  const [scheduledDate, setScheduledDate] = useState('')

  // UI States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isUnsplashOpen, setIsUnsplashOpen] = useState(false)
  const [uploadingFeatureImage, setUploadingFeatureImage] = useState(false)
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
        setFeaturedImageUrl(post.featured_image_url || null)
        setFeaturedImageCaption((post.content as any)?.featured_image_caption || null)
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

  async function handleFeatureImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFeatureImage(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          setFeaturedImageUrl(data.url)
          setFeaturedImageCaption(null)
        }
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to upload featured image')
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Error uploading featured image')
    } finally {
      setUploadingFeatureImage(false)
      if (featureImageInputRef.current) {
        featureImageInputRef.current.value = ''
      }
    }
  }

  function handleSelectUnsplash(imageUrl: string, captionHtml: string) {
    setFeaturedImageUrl(imageUrl)
    setFeaturedImageCaption(captionHtml)
  }

  function handleRemoveFeatureImage() {
    setFeaturedImageUrl(null)
    setFeaturedImageCaption(null)
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

    // Embed featured_image_caption into content JSONB object
    const finalContent = { ...(content || {}) }
    if (featuredImageCaption) {
      (finalContent as any).featured_image_caption = featuredImageCaption
    } else {
      delete (finalContent as any).featured_image_caption
    }

    const payload = {
      title,
      slug: slug || undefined,
      excerpt,
      content: finalContent,
      featured_image_url: featuredImageUrl || null,
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
      setIsDrawerOpen(false)

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
    <div className="min-h-screen bg-[#FAFAF9] font-sans flex flex-col">
      {/* Hidden file input for feature image upload */}
      <input
        ref={featureImageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFeatureImageUpload}
        className="hidden"
      />

      {/* Unsplash Search Modal */}
      <UnsplashModal
        isOpen={isUnsplashOpen}
        onClose={() => setIsUnsplashOpen(false)}
        onSelect={handleSelectUnsplash}
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/garden"
            className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition flex items-center gap-1.5"
          >
            <span>&larr;</span>
            <span>Garden</span>
          </Link>
          <div className="h-4 w-[1px] bg-gray-300" />
          <Link
            href="/admin/pages"
            className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition"
          >
            Pages
          </Link>
          <div className="h-4 w-[1px] bg-gray-300" />
          <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full uppercase tracking-wider ${
            publishStatus === 'published'
              ? 'bg-green-100 text-green-800'
              : publishStatus === 'scheduled'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-gray-100 text-gray-700'
          }`}>
            {publishStatus}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleSave('draft')}
            className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
          >
            Save Draft
          </button>

          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-5 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-2"
          >
            <span>Publish Settings</span>
            <span className="text-gray-400">&rarr;</span>
          </button>
        </div>
      </header>

      {/* Status Notifications */}
      <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 pt-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm mb-4">
            {success}
          </div>
        )}
      </div>

      {/* CLEAN WRITING CANVAS (Only Title + Feature Image + TipTap Body) */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Featured Image Section */}
        <div className="mb-8">
          {featuredImageUrl ? (
            <div className="relative group rounded-2xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
              <div className="relative aspect-[16/9] w-full">
                <img
                  src={featuredImageUrl}
                  alt={title || 'Featured post image'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Attribution Caption Overlay / Display */}
              {featuredImageCaption && (
                <div
                  className="p-3 bg-white/95 border-t border-gray-100 text-center text-xs text-gray-500"
                  dangerouslySetInnerHTML={{ __html: featuredImageCaption }}
                />
              )}

              {/* Action Buttons on Hover */}
              <div className="absolute top-3 right-3 flex items-center gap-2 opacity-90 group-hover:opacity-100 transition">
                <button
                  type="button"
                  onClick={() => setIsUnsplashOpen(true)}
                  className="px-3 py-1.5 bg-black/80 hover:bg-black text-white text-xs font-semibold rounded-lg backdrop-blur-sm shadow transition"
                >
                  Change (Unsplash)
                </button>
                <button
                  type="button"
                  onClick={() => featureImageInputRef.current?.click()}
                  className="px-3 py-1.5 bg-black/80 hover:bg-black text-white text-xs font-semibold rounded-lg backdrop-blur-sm shadow transition"
                >
                  Change (Upload)
                </button>
                <button
                  type="button"
                  onClick={handleRemoveFeatureImage}
                  className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm shadow transition text-xs font-bold leading-none"
                  title="Remove Feature Image"
                >
                  &times;
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 hover:border-gray-300 rounded-2xl p-6 transition flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/60">
              <div>
                <p className="text-sm font-semibold text-gray-800">Add a Feature Image</p>
                <p className="text-xs text-gray-500">Attach an Unsplash photo or upload a custom image</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsUnsplashOpen(true)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition"
                >
                  🔍 Search Unsplash
                </button>
                <button
                  type="button"
                  disabled={uploadingFeatureImage}
                  onClick={() => featureImageInputRef.current?.click()}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-800 text-xs font-semibold rounded-xl transition disabled:opacity-50"
                >
                  {uploadingFeatureImage ? 'Uploading...' : '📁 Upload Image'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Clean Post Title Input */}
        <div className="mb-6">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Post Title..."
            className="w-full text-4xl sm:text-5xl font-extrabold placeholder-gray-300 border-0 focus:ring-0 focus:outline-none p-0 text-gray-900 tracking-tight bg-transparent"
          />
        </div>

        {/* TipTap Rich Text Writing Canvas */}
        <div className="mt-4">
          <TipTapEditor
            content={content}
            onChange={newJson => setContent(newJson)}
            placeholder="Begin writing your post..."
          />
        </div>
      </main>

      {/* SLIDE-OUT PUBLISH DRAWER / PANEL */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-gray-200">
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Publish Settings</h2>
                  <p className="text-xs text-gray-500">Ghost Three-Row Model</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold p-1 leading-none"
                >
                  &times;
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* ROW 1: WHAT (Slug & Excerpt) */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Row 1 &bull; What
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Custom Slug (Optional)
                    </label>
                    <input
                      type="text"
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                      placeholder="e.g. my-post-slug"
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Short Excerpt
                    </label>
                    <textarea
                      rows={3}
                      value={excerpt}
                      onChange={e => setExcerpt(e.target.value)}
                      placeholder="Brief summary of the article..."
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    />
                  </div>
                </div>

                {/* ROW 2: WHO (Visibility, Garden Stream, Tags) */}
                <div className="space-y-4">
                  <div className="border-b border-gray-100 pb-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Row 2 &bull; Who &amp; Classification
                    </span>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Access / Visibility
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'public', label: 'Public (All)', desc: 'Visible to everyone' },
                        { value: 'free', label: 'Free Members', desc: 'Logged-in members' },
                        { value: 'paid', label: 'Paid Members', desc: 'Paid subscribers' },
                        { value: 'comped', label: 'Comped / VIP', desc: 'Comped tier' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setVisibility(opt.value as typeof visibility)}
                          className={`p-2.5 text-left border rounded-lg transition text-xs ${
                            visibility === opt.value
                              ? 'border-black bg-gray-50 text-black font-semibold ring-1 ring-black'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-gray-400">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Garden Stream */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Garden Stream / Content Type
                    </label>
                    <div className="space-y-1.5">
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
                          className={`w-full p-2.5 text-left border rounded-lg transition text-xs ${
                            contentType === opt.value
                              ? 'border-black bg-gray-50 text-black font-semibold ring-1 ring-black'
                              : 'border-gray-200 hover:border-gray-300 text-gray-600'
                          }`}
                        >
                          <div className="font-semibold">{opt.label}</div>
                          <div className="text-[10px] text-gray-400">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Tags &amp; Topics
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {availableTags.map(tag => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                            selectedTagIds.includes(tag.id)
                              ? 'bg-black text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          #{tag.name}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        placeholder="Add tag..."
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

                {/* ROW 3: WHEN (Publish Schedule & Actions) */}
                <div className="space-y-4 pt-2">
                  <div className="border-b border-gray-100 pb-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Row 3 &bull; When
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Schedule Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleSave('published')}
                  className="w-full py-2.5 bg-black hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  Publish Now
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSave('scheduled')}
                    className="py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  >
                    Schedule
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleSave('draft')}
                    className="py-2 border border-gray-300 text-gray-700 hover:bg-white rounded-xl text-xs font-semibold transition disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PostEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-sans text-sm">
          Loading editor...
        </div>
      }
    >
      <PostEditorContent />
    </Suspense>
  )
}
