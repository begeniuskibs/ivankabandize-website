'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'

interface PostRecord {
  id: string
  title: string
  slug: string
  publish_status: 'draft' | 'scheduled' | 'published'
  visibility: 'public' | 'free' | 'paid' | 'comped'
  published_at: string | null
  updated_at: string
  created_at: string
  post_tags?: { tag: { id: string; name: string; slug: string } }[]
}

type StatusTab = 'all' | 'draft' | 'scheduled' | 'published'

export default function AdminPostsListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const statusFilter = (searchParams.get('status') as StatusTab) || 'all'

  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/posts')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to load posts')
      }
    } catch {
      setError('Network error fetching posts')
    } finally {
      setLoading(false)
    }
  }

  const filteredPosts = useMemo(() => {
    if (statusFilter === 'all') return posts
    return posts.filter((p) => p.publish_status === statusFilter)
  }, [posts, statusFilter])

  const counts = useMemo(() => {
    return {
      all: posts.length,
      draft: posts.filter((p) => p.publish_status === 'draft').length,
      scheduled: posts.filter((p) => p.publish_status === 'scheduled').length,
      published: posts.filter((p) => p.publish_status === 'published').length,
    }
  }, [posts])

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900">Posts</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {posts.length} total
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/posts/editor"
            className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-xl shadow-sm transition flex items-center gap-1.5"
          >
            <span>+</span>
            <span>New Post</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-6 sm:px-10 py-8 flex-1">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
          {(['all', 'draft', 'scheduled', 'published'] as const).map((tab) => {
            const isActive = statusFilter === tab
            const label = tab.charAt(0).toUpperCase() + tab.slice(1)
            const count = counts[tab]

            return (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  if (tab === 'all') {
                    router.push('/admin/posts')
                  } else {
                    router.push(`/admin/posts?status=${tab}`)
                  }
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#191A23] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <p className="text-gray-500 text-sm mb-4">
              {statusFilter === 'all'
                ? 'No posts created yet.'
                : `No posts with status "${statusFilter}".`}
            </p>
            <Link
              href="/admin/posts/editor"
              className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 transition"
            >
              <span>+</span>
              <span>Write your first post</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="divide-y divide-gray-100">
              {filteredPosts.map((post) => {
                const tagNames = post.post_tags?.map((pt) => pt.tag?.name).filter(Boolean) || []

                return (
                  <Link
                    key={post.id}
                    href={`/admin/posts/editor?id=${post.id}`}
                    className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-gray-50/80 transition group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                            post.publish_status === 'published'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : post.publish_status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}
                        >
                          {post.publish_status}
                        </span>

                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#EF5B45] transition-colors truncate">
                          {post.title}
                        </h3>
                      </div>

                      <div className="text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          {post.publish_status === 'published' && post.published_at
                            ? `Published on ${new Date(post.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}`
                            : `Updated on ${new Date(post.updated_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}`}
                        </span>

                        {tagNames.length > 0 && (
                          <>
                            <span>&bull;</span>
                            <span className="text-gray-600 font-medium">
                              {tagNames.join(', ')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-900 transition flex items-center gap-1">
                        <span>Edit</span>
                        <span>&rarr;</span>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
