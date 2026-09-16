'use client'

import Link from 'next/link'
import { useState } from 'react'

export interface PostItem {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  published_at?: string | null
  content_type?: 'random_thoughts' | 'structured_thoughts' | 'tools_for_thought' | string
  post_tags?: { tag?: { name?: string; slug?: string } | null }[] | any[]
}

interface GardenFeedProps {
  title: string
  eyebrow?: string
  description: string
  currentFilter: 'all' | 'random_thoughts' | 'structured_thoughts' | 'tools_for_thought'
  posts: PostItem[]
}

const TYPE_CONFIG = {
  all: {
    label: 'All Entries',
    href: '/garden',
  },
  random_thoughts: {
    label: 'Random Thoughts',
    href: '/random-thoughts',
    badgeColor: 'bg-[#FDF3DC] text-[#C99424] border-[#F7C55C]/30',
  },
  structured_thoughts: {
    label: 'Structured Thoughts',
    href: '/structured-thoughts',
    badgeColor: 'bg-[#FDF0EE] text-[#EF5B45] border-[#EF5B45]/20',
  },
  tools_for_thought: {
    label: 'Tools for Thought',
    href: '/tools-for-thought',
    badgeColor: 'bg-[#EEEDF9] text-[#6B66C4] border-[#6B66C4]/20',
  },
}

export default function GardenFeed({
  title,
  eyebrow = 'Writing & Garden',
  description,
  currentFilter,
  posts,
}: GardenFeedProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Extract unique tags present in posts
  const allTags = Array.from(
    new Set(
      posts.flatMap((post) =>
        (post.post_tags as any[])
          ?.map((pt: any) => pt.tag?.name)
          .filter(Boolean) || []
      )
    )
  )

  const filteredPosts = posts.filter((post) => {
    if (!selectedTag) return true
    const postTagNames = (post.post_tags as any[])
      ?.map((pt: any) => pt.tag?.name)
      .filter(Boolean) || []
    return postTagNames.includes(selectedTag)
  })

  return (
    <div className="flex flex-col min-h-full font-sans bg-[#FDF8F1]">
      {/* Header Section */}
      <section className="py-16 md:py-20 bg-[#FDF8F1] border-b border-[#F5ECDE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest font-bold text-[#C99424] mb-3">
            {eyebrow}
          </p>
          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#232536] leading-tight mb-4">
            {title}
          </h1>
          <p className="text-lg text-[#5A5D70] max-w-2xl leading-relaxed">
            {description}
          </p>

          {/* Stream Type Navigation Pills */}
          <div className="mt-8 pt-6 border-t border-[#F5ECDE] flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/garden"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                currentFilter === 'all'
                  ? 'bg-[#232536] text-white shadow-sm'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              All Entries
            </Link>
            <Link
              href="/random-thoughts"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                currentFilter === 'random_thoughts'
                  ? 'bg-[#232536] text-white shadow-sm'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              Random Thoughts
            </Link>
            <Link
              href="/structured-thoughts"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                currentFilter === 'structured_thoughts'
                  ? 'bg-[#232536] text-white shadow-sm'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              Structured Thoughts
            </Link>
            <Link
              href="/tools-for-thought"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                currentFilter === 'tools_for_thought'
                  ? 'bg-[#232536] text-white shadow-sm'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              Tools for Thought
            </Link>
          </div>

          {/* Topic Pillar Filter (if tags exist) */}
          {allTags.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-3">
              <span className="text-xs font-semibold text-[#5A5D70] mr-1">Topics:</span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                  selectedTag === null
                    ? 'bg-[#2AA198] text-white'
                    : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:bg-[#FDF8F1]'
                }`}
              >
                All Topics
              </button>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition ${
                    selectedTag === tag
                      ? 'bg-[#2AA198] text-white'
                      : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:bg-[#FDF8F1]'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feed Content */}
      <section className="py-12 md:py-16 bg-[#FDF8F1] flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {filteredPosts && filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => {
                const tagNames: string[] =
                  (post.post_tags as any[])
                    ?.map((pt: any) => pt.tag?.name)
                    .filter(Boolean) || []
                const typeInfo =
                  post.content_type && TYPE_CONFIG[post.content_type as keyof typeof TYPE_CONFIG]
                    ? TYPE_CONFIG[post.content_type as keyof typeof TYPE_CONFIG]
                    : null

                return (
                  <Link
                    key={post.id}
                    href={`/garden/${post.slug}`}
                    className="bg-white border border-[#F5ECDE] rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
                  >
                    <div>
                      {/* Classification & Topic Badges */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {typeInfo && 'badgeColor' in typeInfo && (
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${typeInfo.badgeColor}`}
                          >
                            {typeInfo.label}
                          </span>
                        )}
                        {tagNames.map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FDF8F1] text-[#2AA198] border border-[#F5ECDE]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-semibold text-[#232536] group-hover:text-[#EF5B45] transition-colors leading-snug mb-2">
                        {post.title}
                      </h2>

                      {post.excerpt && (
                        <p className="text-[#5A5D70] text-sm leading-relaxed line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#F5ECDE] flex items-center justify-between text-xs text-[#5A5D70] font-semibold">
                      <time dateTime={post.published_at || ''}>
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Recently published'}
                      </time>
                      <span className="font-bold text-[#EF5B45] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Read</span>
                        <span aria-hidden="true">&rarr;</span>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-[#F5ECDE] max-w-2xl mx-auto px-6 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-[#FDF8F1] border border-[#F5ECDE] flex items-center justify-center mx-auto mb-4 text-[#C99424] text-xl">
                &#127793;
              </div>
              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-semibold text-[#232536] mb-2">
                New entries coming soon
              </h3>
              <p className="text-sm text-[#5A5D70] max-w-md mx-auto leading-relaxed">
                Thoughts, deep dives, and systems notes are currently being tended. Check back soon or explore the other streams.
              </p>
              {currentFilter !== 'all' && (
                <div className="mt-6">
                  <Link
                    href="/garden"
                    className="inline-flex items-center text-xs font-bold text-[#EF5B45] hover:underline gap-1"
                  >
                    <span>View all garden entries</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
