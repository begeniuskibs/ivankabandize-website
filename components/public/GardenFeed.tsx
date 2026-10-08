'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Leaf } from 'lucide-react'
import PostCard from './PostCard'

export interface PostItem {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  published_at?: string | null
  content_type?: 'random_thoughts' | 'structured_thoughts' | 'tools_for_thought' | string
  featured_image_url?: string | null
  post_tags?: { tag?: { name?: string; slug?: string } | null }[] | any[]
}

export interface SeriesFeedItem {
  id: string
  title: string
  slug: string
  description?: string | null
  status: 'growing' | 'complete'
  cover_emoji?: string | null
  card_tint?: string | null
  published_count: number
}

interface GardenFeedProps {
  title: string
  eyebrow?: string
  description: string
  currentFilter: 'all' | 'random_thoughts' | 'structured_thoughts' | 'tools_for_thought'
  posts: PostItem[]
  series?: SeriesFeedItem[]
  heroBannerImage?: string | null
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
  series = [],
  heroBannerImage = null,
}: GardenFeedProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const CATEGORY_NAMES = ['random thoughts', 'structured thoughts', 'tools for thought']

  // Extract unique tags present in posts, strictly excluding stream/category names
  const allTags = Array.from(
    new Set(
      posts.flatMap((post) =>
        (post.post_tags as any[])
          ?.map((pt: any) => pt.tag?.name)
          .filter(Boolean) || []
      )
    )
  ).filter((tag) => !CATEGORY_NAMES.includes(tag.toLowerCase().trim()))

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
      <section
        className={`relative py-16 md:py-24 border-b border-[#F5ECDE] overflow-hidden ${
          heroBannerImage ? 'text-[#FDF8F1] bg-[#232536]' : 'bg-[#FDF8F1]'
        }`}
      >
        {heroBannerImage && (
          <>
            {/* Background Banner Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 scale-105"
              style={{ backgroundImage: `url(${heroBannerImage})` }}
            />
            {/* Dark Gradient Overlay matching auth card visual styling */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#232536] via-[#232536]/80 to-[#232536]/55 backdrop-blur-[1px]" />
          </>
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <p
            className={`text-xs uppercase tracking-widest font-bold mb-3 ${
              heroBannerImage ? 'text-[#F7C55C]' : 'text-[#C99424]'
            }`}
          >
            {eyebrow}
          </p>
          <h1
            className={`font-['MTN_Brighter_Sans',_sans-serif] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4 ${
              heroBannerImage ? 'text-[#FDF8F1]' : 'text-[#232536]'
            }`}
          >
            {title}
          </h1>
          <p
            className={`text-lg max-w-2xl leading-relaxed ${
              heroBannerImage ? 'text-[#FDF8F1]/85 font-light' : 'text-[#5A5D70]'
            }`}
          >
            {description}
          </p>

          {/* Stream Type Navigation Pills */}
          <div
            className={`mt-8 pt-6 border-t flex flex-wrap items-center gap-2 sm:gap-3 ${
              heroBannerImage ? 'border-white/15' : 'border-[#F5ECDE]'
            }`}
          >
            <Link
              href="/garden"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                currentFilter === 'all'
                  ? 'bg-[#EF5B45] text-white shadow-sm'
                  : heroBannerImage
                  ? 'bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              All Entries
            </Link>
            <Link
              href="/random-thoughts"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                currentFilter === 'random_thoughts'
                  ? 'bg-[#EF5B45] text-white shadow-sm'
                  : heroBannerImage
                  ? 'bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              Random Thoughts
            </Link>
            <Link
              href="/structured-thoughts"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                currentFilter === 'structured_thoughts'
                  ? 'bg-[#EF5B45] text-white shadow-sm'
                  : heroBannerImage
                  ? 'bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              Structured Thoughts
            </Link>
            <Link
              href="/tools-for-thought"
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition ${
                currentFilter === 'tools_for_thought'
                  ? 'bg-[#EF5B45] text-white shadow-sm'
                  : heroBannerImage
                  ? 'bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              Tools for Thought
            </Link>
          </div>

          {/* Topic Pillar Filter (if tags exist) */}
          {allTags.length > 0 && (
            <div
              className={`mt-4 flex flex-wrap items-center gap-2 pt-3 ${
                heroBannerImage ? 'border-t border-white/10' : ''
              }`}
            >
              <span
                className={`text-xs font-semibold mr-1 ${
                  heroBannerImage ? 'text-[#FDF8F1]/70' : 'text-[#5A5D70]'
                }`}
              >
                Topics:
              </span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  selectedTag === null
                    ? heroBannerImage
                      ? 'bg-white text-[#232536] font-bold'
                      : 'bg-[#232536] text-white'
                    : heroBannerImage
                    ? 'bg-white/10 text-[#FDF8F1]/80 hover:bg-white/20'
                    : 'bg-white text-[#5A5D70] border border-[#F5ECDE]'
                }`}
              >
                All Topics
              </button>
              {allTags.map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    selectedTag === tag
                      ? heroBannerImage
                        ? 'bg-[#2AA198] text-white font-bold'
                        : 'bg-[#2AA198] text-white'
                      : heroBannerImage
                      ? 'bg-white/10 text-[#FDF8F1]/80 hover:bg-white/20'
                      : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#2AA198]'
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
          {/* Series Section (Curated Collections) */}
          {series && series.length > 0 && currentFilter === 'all' && (
            <div className="mb-14">
              <div className="flex items-center justify-between mb-6 border-b border-[#F5ECDE] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[#C99424]">
                    Series
                  </span>
                  <span className="text-[#5A5D70]/40 text-xs">•</span>
                  <span className="text-xs font-medium text-[#5A5D70]">
                    Curated Collections
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {series.map((item) => (
                  <Link
                    key={item.id}
                    href={`/garden/series/${item.slug}`}
                    className="group relative flex flex-col justify-between p-6 bg-white rounded-[5px] border border-[#F5ECDE] hover:border-[#EF5B45]/40 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                    style={
                      item.card_tint
                        ? {
                            borderTopWidth: '3px',
                            borderTopColor: item.card_tint,
                          }
                        : undefined
                    }
                  >
                    <div>
                      {/* Top Row: Label and Emoji */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                            item.status === 'complete'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200/50'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                          }`}
                        >
                          SERIES - {item.status === 'complete' ? 'COMPLETE' : 'GROWING'}
                        </span>
                        {item.cover_emoji && (
                          <span className="text-xl" aria-hidden="true">
                            {item.cover_emoji}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] group-hover:text-[#EF5B45] transition-colors mb-2 leading-snug">
                        {item.title}
                      </h3>

                      {/* Description */}
                      {item.description && (
                        <p className="text-sm text-[#5A5D70] leading-relaxed line-clamp-3 mb-4">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Live Entry Count */}
                    <div className="pt-3 border-t border-[#F5ECDE]/80 flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#2AA198]">
                        {item.status === 'complete'
                          ? `${item.published_count} ${item.published_count === 1 ? 'entry' : 'entries'}`
                          : `${item.published_count} ${item.published_count === 1 ? 'entry' : 'entries'} and counting`}
                      </span>
                      <span className="text-[#5A5D70] group-hover:text-[#EF5B45] group-hover:translate-x-0.5 font-bold transition-all">
                        Explore series &rarr;
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {filteredPosts && filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
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
