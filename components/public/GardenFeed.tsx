'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import PostCard from './PostCard'

export interface TagDetails {
  name?: string | null
  slug?: string | null
  is_internal?: boolean | null
}

export interface PostTagItem {
  tag?: TagDetails | TagDetails[] | null
}

export interface PostItem {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  preview?: string | null
  published_at?: string | null
  content_type?: 'random_thoughts' | 'structured_thoughts' | 'tools_for_thought' | string
  featured_image_url?: string | null
  post_tags?: PostTagItem[] | null
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

export interface TopicTagItem {
  name: string
  slug: string
  is_internal?: boolean | null
}

export interface LibraryFeedItem {
  id: string
  title: string
  creator: string
  type: 'podcast' | 'book' | 'newsletter' | string
  url: string
  thumbnail_url?: string | null
  recommendation_note?: string | null
  created_at?: string
}

interface GardenFeedProps {
  title: string
  eyebrow?: string
  description?: string | null
  currentFilter?: 'all' | 'random_thoughts' | 'structured_thoughts' | 'tools_for_thought' | 'topic' | string
  posts: PostItem[]
  series?: SeriesFeedItem[]
  heroBannerImage?: string | null
  topicTags?: TopicTagItem[]
  activeTopicSlug?: string | null
  libraryItems?: LibraryFeedItem[]
  reportDigests?: PostItem[]
  isSectionedLanding?: boolean
}

function LibraryCard({ item }: { item: LibraryFeedItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col justify-between bg-white rounded-[5px] border border-[#F5ECDE] hover:border-[#EF5B45]/40 p-5 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-300"
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E8F4F1] text-[#2AA198] border border-[#2AA198]/20">
            {item.type}
          </span>
          <span className="text-xs font-semibold text-[#5A5D70] group-hover:text-[#EF5B45] transition-colors">
            Visit ↗
          </span>
        </div>
        <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-lg font-bold text-[#232536] group-hover:text-[#EF5B45] transition-colors leading-snug mb-1 line-clamp-2">
          {item.title}
        </h3>
        <p className="text-xs font-medium text-[#5A5D70] mb-3">
          by <span className="font-semibold text-[#232536]">{item.creator}</span>
        </p>
        {item.recommendation_note && (
          <p className="text-xs text-[#5A5D70] line-clamp-2 italic border-l-2 border-[#F5ECDE] pl-2.5 my-2">
            &ldquo;{item.recommendation_note}&rdquo;
          </p>
        )}
      </div>
      <div className="pt-3 border-t border-[#F5ECDE]/80 flex items-center justify-between text-xs text-[#5A5D70]">
        <span className="font-semibold text-[#2AA198]">Curated resource</span>
        <span className="font-bold group-hover:text-[#EF5B45] transition-colors inline-flex items-center">
          <ArrowRight
            size={14}
            strokeWidth={2.5}
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
          />
        </span>
      </div>
    </a>
  )
}

export default function GardenFeed({
  title,
  eyebrow = 'Writing & Garden',
  description,
  currentFilter = 'all',
  posts,
  series = [],
  heroBannerImage = null,
  topicTags,
  activeTopicSlug = null,
  libraryItems = [],
  reportDigests = [],
  isSectionedLanding = false,
}: GardenFeedProps) {
  const CATEGORY_NAMES = ['random thoughts', 'structured thoughts', 'tools for thought']

  // Extract unique tags present in posts if not explicitly provided
  const derivedTopicTags: TopicTagItem[] = (() => {
    if (topicTags && topicTags.length > 0) return topicTags
    const tagMap = new Map<string, string>()
    posts.forEach((post) => {
      const ptList = post.post_tags || []
      ptList.forEach((pt) => {
        const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
        if (tagObj?.name && tagObj?.slug && !tagObj.is_internal) {
          const name = tagObj.name.trim()
          if (!CATEGORY_NAMES.includes(name.toLowerCase())) {
            tagMap.set(name, tagObj.slug)
          }
        }
      })
    })
    return Array.from(tagMap.entries())
      .map(([name, slug]) => ({ name, slug }))
      .sort((a, b) => a.name.localeCompare(b.name))
  })()

  const rawTopicList = topicTags && topicTags.length > 0 ? topicTags : derivedTopicTags
  const topicList = rawTopicList.filter((t) => !t.is_internal)

  const isTopicPage = currentFilter === 'topic'

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
          {description && description.trim() !== '' && (
            <p
              className={`text-lg max-w-2xl leading-relaxed ${
                heroBannerImage ? 'text-[#FDF8F1]/85 font-light' : 'text-[#5A5D70]'
              }`}
            >
              {description}
            </p>
          )}

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
                  ? 'bg-[#CF3F29] text-white shadow-sm'
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
                  ? 'bg-[#CF3F29] text-white shadow-sm'
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
                  ? 'bg-[#CF3F29] text-white shadow-sm'
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
                  ? 'bg-[#CF3F29] text-white shadow-sm'
                  : heroBannerImage
                  ? 'bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10'
                  : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              Tools for Thought
            </Link>
          </div>

          {/* Topic Pillar Filter (if tags exist) */}
          {topicList.length > 0 && (
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
              <Link
                href="/garden"
                className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  !activeTopicSlug
                    ? heroBannerImage
                    : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
                }`}
              >
                All Topics
              </Link>
              {topicList.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/garden/topics/${tag.slug}`}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    activeTopicSlug === tag.slug
                      ? heroBannerImage
                        ? 'bg-[#2AA198] text-white font-bold'
                        : 'bg-[#2AA198] text-white font-bold'
                      : heroBannerImage
                      ? 'bg-white/10 text-[#FDF8F1]/80 hover:bg-white/20'
                      : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#2AA198]'
                  }`}
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feed Content */}
      <section className="py-12 md:py-16 bg-[#FDF8F1] flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
          {/* ================= MODE 1: SECTIONED LANDING (/garden) ================= */}
          {isSectionedLanding && (
            <>
              {/* 1. Series Section (Curated Collections) */}
              {series && series.length > 0 && (
                <div id="series">
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

                          <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] group-hover:text-[#EF5B45] transition-colors mb-2 leading-snug">
                            {item.title}
                          </h3>

                          {item.description && (
                            <p className="text-sm text-[#5A5D70] leading-relaxed line-clamp-3 mb-4">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-[#F5ECDE]/80 flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#2AA198]">
                            {item.status === 'complete'
                              ? `${item.published_count} ${item.published_count === 1 ? 'entry' : 'entries'}`
                              : `${item.published_count} ${item.published_count === 1 ? 'entry' : 'entries'} and counting`}
                          </span>
                          <span className="text-[#5A5D70] group-hover:text-[#EF5B45] font-bold transition-all inline-flex items-center gap-1.5">
                            <span>Explore series</span>
                            <ArrowRight
                              size={14}
                              strokeWidth={2.5}
                              aria-hidden="true"
                              className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                            />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Articles Section (Three streams) */}
              {posts && posts.length > 0 && (
                <div id="articles">
                  <div className="flex items-center justify-between mb-6 border-b border-[#F5ECDE] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#EF5B45]">
                        Articles
                      </span>
                      <span className="text-[#5A5D70]/40 text-xs">•</span>
                      <span className="text-xs font-medium text-[#5A5D70]">
                        The Three Streams
                      </span>
                    </div>
                    <Link
                      href="/garden?view=articles"
                      className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#EF5B45] hover:underline"
                    >
                      <span>See all articles</span>
                      <ArrowRight
                        size={14}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.slice(0, 3).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Library Section */}
              {libraryItems && libraryItems.length > 0 && (
                <div id="library">
                  <div className="flex items-center justify-between mb-6 border-b border-[#F5ECDE] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#2AA198]">
                        Library
                      </span>
                      <span className="text-[#5A5D70]/40 text-xs">•</span>
                      <span className="text-xs font-medium text-[#5A5D70]">
                        Curated Podcasts, Books &amp; Newsletters
                      </span>
                    </div>
                    <Link
                      href="/library"
                      className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#2AA198] hover:underline"
                    >
                      <span>See all in Library</span>
                      <ArrowRight
                        size={14}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {libraryItems.slice(0, 3).map((item) => (
                      <LibraryCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Report Digests Section (ONLY if any exist) */}
              {reportDigests && reportDigests.length > 0 && (
                <div id="report-digests">
                  <div className="flex items-center justify-between mb-6 border-b border-[#F5ECDE] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-[#C99424]">
                        Report Digests
                      </span>
                      <span className="text-[#5A5D70]/40 text-xs">•</span>
                      <span className="text-xs font-medium text-[#5A5D70]">
                        Research &amp; Executive Briefs
                      </span>
                    </div>
                    <Link
                      href="/garden?view=report_digests"
                      className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#C99424] hover:underline"
                    >
                      <span>See all digests</span>
                      <ArrowRight
                        size={14}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {reportDigests.slice(0, 3).map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= MODE 2: TOPIC PAGES (Grouped by type) ================= */}
          {isTopicPage && (
            <>
              {/* Articles Group */}
              {posts && posts.length > 0 && (
                <div id="topic-articles">
                  <div className="flex items-center justify-between mb-6 border-b border-[#F5ECDE] pb-3">
                    <h2 className="text-base font-bold text-[#232536]">
                      Articles - {posts.length}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                </div>
              )}

              {/* Library Group (matched through library_item_tags) */}
              {libraryItems && libraryItems.length > 0 && (
                <div id="topic-library">
                  <div className="flex items-center justify-between mb-6 border-b border-[#F5ECDE] pb-3">
                    <h2 className="text-base font-bold text-[#232536]">
                      Library - {libraryItems.length}
                    </h2>
                    {activeTopicSlug && (
                      <Link
                        href={`/library?topic=${activeTopicSlug}`}
                        className="group inline-flex items-center gap-1.5 text-xs font-bold text-[#2AA198] hover:underline"
                      >
                        <span>See in Library</span>
                        <ArrowRight
                          size={14}
                          strokeWidth={2.5}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                        />
                      </Link>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {libraryItems.map((item) => (
                      <LibraryCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ================= MODE 3: REGULAR SINGLE-STREAM OR ALL ARTICLES FEED ================= */}
          {!isSectionedLanding && !isTopicPage && (
            <>
              {posts && posts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border border-[#F5ECDE] max-w-2xl mx-auto px-6 shadow-sm">
                  <Image
                    src="/icons/3d/seedling.svg"
                    alt=""
                    aria-hidden="true"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain drop-shadow-md mx-auto mb-4"
                  />
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
                        className="group inline-flex items-center text-xs font-bold text-[#EF5B45] hover:underline gap-1.5"
                      >
                        <span>View all garden entries</span>
                        <ArrowRight
                          size={14}
                          strokeWidth={2.5}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                        />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}
