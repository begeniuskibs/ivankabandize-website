'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import PostCard, { PostCardItem } from './PostCard'

export interface GardenArticleTag {
  name?: string | null
  slug?: string | null
  is_internal?: boolean | null
}

export interface GardenArticlePostTag {
  tag?: GardenArticleTag | GardenArticleTag[] | null
}

export interface GardenArticleItem extends PostCardItem {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  preview?: string | null
  published_at?: string | null
  visibility?: string | null
  publish_status?: string | null
  content_type?: string | null
  featured_image_url?: string | null
  post_tags?: GardenArticlePostTag[] | null
}

export interface GardenSeriesItem {
  id: string
  title: string
  slug: string
  description?: string | null
  cover_emoji?: string | null
  card_tint?: string | null
  header_image_url?: string | null
  status: 'growing' | 'complete'
  published_count: number
}

export interface GardenTopicTag {
  name: string
  slug: string
}

interface GardenArticlesViewProps {
  posts: GardenArticleItem[]
  series: GardenSeriesItem[]
  topicTags: GardenTopicTag[]
}

export const STREAM_PILLS = [
  { label: 'All', value: 'all' },
  { label: 'Random Thoughts', value: 'random_thoughts' },
  { label: 'Structured Thoughts', value: 'structured_thoughts' },
  { label: 'Tools for Thought', value: 'tools_for_thought' },
] as const

export type StreamFilterValue = (typeof STREAM_PILLS)[number]['value']

export interface StreamHeroConfig {
  eyebrow?: string | null
  title: string
  description: string
  image: string
  tint: string
}

export const STREAM_HEROES: Record<StreamFilterValue, StreamHeroConfig> = {
  all: {
    eyebrow: null,
    title: 'Articles',
    description:
      'Essays, sparks and tools for thinking. Pick a stream, follow a series, or browse everything.',
    image: '/garden-heroes/articles.jpg',
    tint: '#FEF1ED',
  },
  random_thoughts: {
    eyebrow: 'Sparks & Observations',
    title: 'Random Thoughts',
    description:
      'Spontaneous ideas, fleeting observations, and short reflections captured in the moment.',
    image: '/images/auth-pool/01-bookblock-notebook.jpg',
    tint: '#FEF1ED',
  },
  structured_thoughts: {
    eyebrow: 'Essays & Deep Dives',
    title: 'Structured Thoughts',
    description:
      'Long-form essays, architectural explorations, and frameworks for leadership and systems.',
    image: '/images/auth-pool/03-gery-wibowo-laptop-study.jpg',
    tint: '#FEF1ED',
  },
  tools_for_thought: {
    eyebrow: 'Systems & Workflows',
    title: 'Tools for Thought',
    description:
      'Software, tools, mental setups, and workflows designed to extend thinking and eliminate friction.',
    image: '/images/auth-pool/08-nicholas-ng-laptop.jpg',
    tint: '#FEF1ED',
  },
}

function postMatchesTopic(post: GardenArticleItem, topicSlug: string): boolean {
  if (topicSlug === 'all') return true
  const ptList = post.post_tags || []
  return ptList.some((pt) => {
    const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
    return tagObj?.slug === topicSlug
  })
}

function postMatchesStream(post: GardenArticleItem, stream: StreamFilterValue): boolean {
  if (stream === 'all') return true
  return post.content_type === stream
}

export default function GardenArticlesView({
  posts,
  series,
  topicTags,
}: GardenArticlesViewProps) {
  const [selectedStream, setSelectedStream] = useState<StreamFilterValue>('all')
  const [selectedTopic, setSelectedTopic] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState<number>(9)

  const handleStreamChange = (stream: StreamFilterValue) => {
    setSelectedStream(stream)
    setVisibleCount(9)
  }

  const handleTopicChange = (topicSlug: string) => {
    setSelectedTopic(topicSlug)
    setVisibleCount(9)
  }

  const handleClearFilters = () => {
    setSelectedStream('all')
    setSelectedTopic('all')
    setVisibleCount(9)
  }

  const currentHero = STREAM_HEROES[selectedStream]

  const filteredPosts = posts.filter((post) => {
    return postMatchesStream(post, selectedStream) && postMatchesTopic(post, selectedTopic)
  })

  const displayedPosts = filteredPosts.slice(0, visibleCount)
  const hasMore = visibleCount < filteredPosts.length

  return (
    <div className="min-h-screen bg-[#FDF8F1] flex flex-col font-sans">
      {/* Hero band */}
      <section className="relative w-full bg-[#FEF1ED] border-b border-[#F7D6CC] overflow-hidden md:pt-[36px] md:pb-[44px]">
        {/* Mobile: photo as visible strip on top (h-[160px], object-cover, no overlay) */}
        <div className="block md:hidden relative w-full h-[160px] overflow-hidden">
          <Image
            key={`mobile-${currentHero.image}`}
            src={currentHero.image}
            alt=""
            fill
            priority
            className="object-cover transition-opacity duration-300"
          />
        </div>

        {/* Desktop: background image with gradient overlay */}
        <div className="hidden md:block absolute inset-0 z-0">
          <Image
            key={`desktop-${currentHero.image}`}
            src={currentHero.image}
            alt=""
            fill
            priority
            className="object-cover transition-opacity duration-300"
          />
          {/* Desktop tint overlay: solid #FEF1ED at left, fully transparent by ~70% across */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(90deg, #FEF1ED 0%, #FEF1ED 30%, rgba(254, 241, 237, 0.75) 50%, rgba(254, 241, 237, 0) 70%)',
            }}
          />
        </div>

        {/* Content container: mobile has padding 20px (p-5), desktop uses standard layout */}
        <div className="relative z-10 max-w-6xl mx-auto p-5 md:p-0 md:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-3">
            {selectedStream === 'all' ? (
              <div className="text-[12px] font-bold tracking-[0.1em] uppercase flex items-center gap-1.5">
                <Link
                  href="/garden"
                  className="text-[#CF3F29] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] rounded-xs"
                >
                  THE GARDEN
                </Link>
                <span className="text-[#5C5F73]">/</span>
                <span className="text-[#5C5F73]">ARTICLES</span>
              </div>
            ) : (
              <div className="text-[12px] font-bold tracking-[0.1em] uppercase flex items-center gap-1.5">
                <Link
                  href="/garden"
                  className="text-[#CF3F29] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] rounded-xs"
                >
                  THE GARDEN
                </Link>
                <span className="text-[#5C5F73]">/</span>
                <Link
                  href="/garden?view=articles"
                  onClick={(e) => {
                    e.preventDefault()
                    handleStreamChange('all')
                  }}
                  className="text-[#CF3F29] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] rounded-xs"
                >
                  ARTICLES
                </Link>
                <span className="text-[#5C5F73]">/</span>
                <span className="text-[#5C5F73]">{currentHero.title.toUpperCase()}</span>
              </div>
            )}
          </nav>

          {/* Eyebrow: small uppercase coral label above the title, only when set */}
          {currentHero.eyebrow && (
            <p className="text-[12px] font-bold uppercase tracking-[0.1em] text-[#CF3F29] mb-2">
              {currentHero.eyebrow}
            </p>
          )}

          {/* H1 Title */}
          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-[36px] md:text-[52px] font-medium text-[#232536] leading-[1.15] mb-3">
            {currentHero.title}
          </h1>

          {/* Intro line / description */}
          <p className="text-[18px] text-[#5C5F73] max-w-[620px] leading-relaxed mb-6">
            {currentHero.description}
          </p>

          {/* Stream pills: mobile is horizontally scrollable row, desktop wraps */}
          <div className="flex overflow-x-auto whitespace-nowrap gap-2 sm:gap-2.5 pb-1 md:pb-0 md:flex-wrap [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {STREAM_PILLS.map((pill) => {
              const isActive = selectedStream === pill.value
              return (
                <button
                  key={pill.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleStreamChange(pill.value)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-[#CF3F29] text-white border border-[#CF3F29]'
                      : 'bg-white text-[#232536] border border-[#F0E4D2] hover:border-[#EF5B45]'
                  }`}
                >
                  {pill.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Main body area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12 w-full flex-1 space-y-10">
        {/* Series row: shown only when selectedStream is "all" and series exist */}
        {selectedStream === 'all' && series && series.length > 0 && (
          <section aria-labelledby="series-row-heading">
            <p
              id="series-row-heading"
              className="text-[13px] font-bold tracking-[0.1em] text-[#A97B1A] uppercase mb-4"
            >
              SERIES - READ IN ORDER
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {series.map((item) => {
                const count = item.published_count
                const entryCountText = count === 1 ? '1 entry' : `${count} entries`
                const exploreText =
                  item.status === 'complete'
                    ? `${entryCountText} - Explore series →`
                    : `${entryCountText} and counting - Explore series →`

                return (
                  <Link
                    key={item.id}
                    href={`/garden/series/${item.slug}`}
                    className="group relative flex flex-col justify-end p-3.5 sm:p-4 rounded-[18px] overflow-hidden min-h-[220px] border border-[#F0E4D2] hover:border-[#EF5B45] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lg motion-reduce:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2"
                    style={{ backgroundColor: item.card_tint || '#FDE9E4' }}
                  >
                    {/* Full-bleed background image or emoji fallback */}
                    {item.header_image_url && item.header_image_url.trim() ? (
                      <Image
                        src={item.header_image_url}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100 motion-reduce:transition-none"
                      />
                    ) : item.cover_emoji && item.cover_emoji.trim() ? (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-6xl select-none pointer-events-none transition-transform duration-500 group-hover:scale-105 motion-reduce:group-hover:scale-100 motion-reduce:transition-none"
                        aria-hidden="true"
                      >
                        {item.cover_emoji}
                      </div>
                    ) : null}

                    {/* Frosted plate at the bottom */}
                    <div className="relative z-10 w-full rounded-[14px] bg-white/80 backdrop-blur-md border border-white/60 shadow-xs p-3.5 sm:p-4">
                      <span className="text-[12px] font-bold uppercase tracking-wider text-[#A97B1A] block mb-1">
                        {item.status === 'complete' ? 'SERIES - COMPLETE' : 'SERIES - GROWING'}
                      </span>
                      <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-[19px] font-medium text-[#232536] group-hover:text-[#EF5B45] transition-colors leading-snug line-clamp-1 mb-2">
                        {item.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-[#5C5F73] font-medium">
                        {exploreText}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Topic row */}
        {topicTags && topicTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <span className="text-[14px] font-bold text-[#232536] shrink-0 mr-1">
              Topic:
            </span>
            <button
              type="button"
              aria-pressed={selectedTopic === 'all'}
              onClick={() => handleTopicChange('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2 ${
                selectedTopic === 'all'
                  ? 'bg-[#CF3F29] text-white border border-[#CF3F29]'
                  : 'bg-white text-[#232536] border border-[#F0E4D2] hover:border-[#EF5B45]'
              }`}
            >
              All topics
            </button>
            {topicTags.map((topic) => {
              const isActive = selectedTopic === topic.slug
              return (
                <button
                  key={topic.slug}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleTopicChange(topic.slug)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-[#CF3F29] text-white border border-[#CF3F29]'
                      : 'bg-white text-[#232536] border border-[#F0E4D2] hover:border-[#EF5B45]'
                  }`}
                >
                  {topic.name}
                </button>
              )
            })}
          </div>
        )}

        {/* Article grid */}
        <section aria-label="Articles list" className="space-y-8">
          {filteredPosts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[18px]">
                {displayedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + 9)}
                    className="px-6 py-2.5 rounded-full border border-[#CF3F29] text-[#CF3F29] text-sm font-semibold hover:bg-[#FEF1ED] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2"
                  >
                    Load more articles
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 px-4 bg-white rounded-[14px] border border-[#F0E4D2]">
              <p className="text-base text-[#5C5F73] mb-4">
                No articles match these filters yet.
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-5 py-2 rounded-full border border-[#CF3F29] text-[#CF3F29] text-sm font-semibold hover:bg-[#FEF1ED] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
