import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import TipTapRenderer from '@/components/editor/TipTapRenderer'
import ReadingProgressBar from '@/components/public/ReadingProgressBar'
import WideContainer from '@/components/public/WideContainer'
import { renderCaption } from '@/components/editor/captionLinks'

export interface PostTagItem {
  tag?: {
    name?: string
    slug?: string
  } | Array<{
    name?: string
    slug?: string
  }> | null
}

export interface ArticleSeriesContext {
  series: {
    id: string
    title: string
    slug: string
    status: 'growing' | 'complete'
  }
  partNumber: number
  totalParts: number
  prevPost?: {
    title: string
    slug: string
  } | null
  nextPost?: {
    title: string
    slug: string
  } | null
}

export interface PostData {
  id?: string
  title: string
  slug?: string
  content?: Record<string, unknown> | null
  excerpt?: string | null
  published_at?: string | null
  content_type?: string | null
  featured_image_url?: string | null
  header_image_width?: 'standard' | 'wide' | null
  post_tags?: PostTagItem[] | any[] | null
  series_id?: string | null
}

export interface RelatedPostData {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content_type?: string | null
  featured_image_url?: string | null
}

export interface ArticleViewProps {
  post: PostData
  relatedPost?: RelatedPostData | null
  seriesContext?: ArticleSeriesContext | null
  isPreview?: boolean
}

const TYPE_CONFIG: Record<string, { label: string; href: string; badgeColor: string }> = {
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

// Calculate dynamic read time based on word count (approx 200 words per minute)
function calculateReadTime(content: unknown, excerpt?: string | null): number {
  let text = excerpt || ''
  const extractText = (node: any) => {
    if (!node) return
    if (node.text) text += ' ' + node.text
    if (Array.isArray(node.content)) node.content.forEach(extractText)
  }
  if (content && typeof content === 'object') {
    extractText(content)
  }
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function ArticleView({
  post,
  relatedPost = null,
  seriesContext = null,
  isPreview = false,
}: ArticleViewProps) {
  const typeInfo = post.content_type && TYPE_CONFIG[post.content_type] ? TYPE_CONFIG[post.content_type] : null
  const readTime = calculateReadTime(post.content, post.excerpt)

  // Extract optional featured image caption if present in content
  const contentObj = (post.content || {}) as Record<string, unknown>
  const featuredImageCaption = (contentObj?.featured_image_caption as string) || null

  // Header image width: 'standard' (default) vs 'wide' (breakout container)
  const headerImageWidth: 'standard' | 'wide' =
    post.header_image_width || (contentObj?.header_image_width as 'standard' | 'wide') || 'standard'

  return (
    <>
      {isPreview && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#EF5B45] text-white text-center py-2 px-4 text-xs font-bold tracking-wide shadow-md">
          Preview - this version is not published
        </div>
      )}

      <ReadingProgressBar targetSelector="#article-body" />
      <article className={`min-h-full font-sans py-12 md:py-24 bg-[#FDF8F1] ${isPreview ? 'pt-20 md:pt-24' : ''}`}>
        <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
          {/* Navigation Breadcrumb */}
          <div className="mb-10">
            <Link
              href="/garden"
              className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-[#5A5D70] hover:text-[#232536] transition"
            >
              <span>&larr; Back to The Garden</span>
            </Link>
          </div>

          {/* 1. Primary Tag & Categories ABOVE Headline */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs mb-4">
            {typeInfo && (
              <Link
                href={typeInfo.href}
                className={`font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border text-[11px] hover:opacity-80 transition ${typeInfo.badgeColor}`}
              >
                {typeInfo.label}
              </Link>
            )}

            {post.post_tags && post.post_tags.length > 0 && (() => {
              const secondaryTags = (post.post_tags as any[]).filter(
                (pt: any) => {
                  const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
                  return tagObj?.name && tagObj.name.toLowerCase() !== typeInfo?.label.toLowerCase()
                }
              )
              if (secondaryTags.length === 0) return null
              return (
                <div className="flex flex-wrap gap-2">
                  {secondaryTags.map((pt: any, idx: number) => {
                    const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
                    return (
                      <span
                        key={idx}
                        className="bg-white text-[#2AA198] border border-[#F5ECDE] px-3 py-1 rounded-full text-[11px] font-semibold"
                      >
                        {tagObj?.name}
                      </span>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* 2. Main Headline */}
          <header className="mb-6">
            <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl font-bold text-[#232536] leading-[1.18] mb-6 tracking-tight">
              {post.title}
            </h1>

            {/* 3. Combined Byline + Dynamic Read Time row */}
            <div className="flex items-center gap-3.5 text-sm text-[#5A5D70] pb-8 border-b border-[#F5ECDE]">
              <Image
                src="/images/ivan-portrait.jpg"
                alt="Ivan Kabandize"
                width={42}
                height={42}
                className="w-10 h-10 rounded-full object-cover border border-[#F5ECDE] shadow-sm"
              />
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-bold text-[#232536]">Ivan Kabandize</span>
                <span className="text-[#5A5D70]/50">•</span>
                <time dateTime={post.published_at || ''}>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recently published'}
                </time>
                <span className="text-[#5A5D70]/50">•</span>
                <span className="font-bold text-[#2AA198]">{readTime} min read</span>
              </div>
            </div>
          </header>

          {/* 4. Optional Database-Driven Series Callout Box */}
          {seriesContext && (
            <div className="mb-8 p-5 rounded-3xl bg-white border-2 border-[#2AA198]/20 shadow-[0_4px_16px_rgba(42,161,152,0.06)]">
              <div className="flex items-start gap-3.5 mb-2">
                <span className="text-2xl" aria-hidden="true">📖</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2AA198] mb-0.5">
                    Series - Part {seriesContext.partNumber} of {seriesContext.totalParts}
                  </p>
                  <Link
                    href={`/garden/series/${seriesContext.series.slug}`}
                    className="font-bold text-base text-[#232536] hover:text-[#EF5B45] transition inline-block"
                  >
                    {seriesContext.series.title}
                  </Link>
                </div>
              </div>

              {(seriesContext.prevPost || seriesContext.nextPost) && (
                <div className="pt-3 border-t border-[#F5ECDE] flex flex-wrap items-center justify-between gap-3 text-xs">
                  {seriesContext.prevPost ? (
                    <Link
                      href={`/garden/${seriesContext.prevPost.slug}`}
                      className="text-[#5A5D70] hover:text-[#EF5B45] font-semibold transition flex items-center gap-1.5 truncate max-w-[48%]"
                      title={seriesContext.prevPost.title}
                    >
                      <span aria-hidden="true">&larr;</span>
                      <span className="truncate">Previous: {seriesContext.prevPost.title}</span>
                    </Link>
                  ) : (
                    <div />
                  )}

                  {seriesContext.nextPost && (
                    <Link
                      href={`/garden/${seriesContext.nextPost.slug}`}
                      className="text-[#5A5D70] hover:text-[#EF5B45] font-semibold transition flex items-center gap-1.5 truncate max-w-[48%] ml-auto"
                      title={seriesContext.nextPost.title}
                    >
                      <span className="truncate">Next: {seriesContext.nextPost.title}</span>
                      <span aria-hidden="true">&rarr;</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 5. Header Image rendered AFTER Byline */}
          {post.featured_image_url && (() => {
            const figureElement = (
              <figure className={headerImageWidth === 'wide' ? '' : 'mb-10'}>
                <div className="relative aspect-[16/9] w-full rounded-[5px] overflow-hidden">
                  <img
                    src={post.featured_image_url}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {featuredImageCaption && (
                  <figcaption className="mt-2.5 text-center text-[13px] sm:text-[14px] leading-relaxed text-[#5A5D70] max-w-full break-words px-2">
                    {renderCaption(featuredImageCaption)}
                  </figcaption>
                )}
              </figure>
            )

            if (headerImageWidth === 'wide') {
              return <WideContainer className="mb-10">{figureElement}</WideContainer>
            }
            return figureElement
          })()}

          {/* 6. Post TipTap Content */}
          <main
            id="article-body"
            className="text-[#232536] text-[17px] sm:text-[18px] md:text-lg leading-[1.65] max-w-none break-words [&_p]:text-[17px] sm:[&_p]:text-[18px] md:[&_p]:text-lg [&_p]:leading-[1.65] [&_li]:text-[17px] sm:[&_li]:text-[18px] md:[&_li]:text-lg [&_li]:leading-[1.65] [&_img]:max-w-full [&_iframe]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_table]:max-w-full [&_table]:overflow-x-auto"
          >
            <TipTapRenderer content={post.content || {}} />
          </main>

          {/* 7. Optional "You Might Have Missed" Bookmark-Style Card */}
          {relatedPost && (
            <section className="mt-16 pt-12 border-t border-[#F5ECDE]">
              <p className="text-xs uppercase tracking-widest font-bold text-[#C99424] mb-4">
                You might have missed
              </p>
              <Link
                href={`/garden/${relatedPost.slug}`}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 p-6 rounded-3xl bg-white border border-[#F5ECDE] hover:border-[#EF5B45]/30 shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.08)] hover:-translate-y-1 transition-all duration-300"
              >
                <div className="space-y-2 flex-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2AA198]">
                    {(relatedPost.content_type && TYPE_CONFIG[relatedPost.content_type]?.label) || 'Article'}
                  </span>
                  <h3 className="font-sans text-xl sm:text-2xl font-bold tracking-tight text-[#232536] group-hover:text-[#EF5B45] transition-colors">
                    {relatedPost.title}
                  </h3>
                  {relatedPost.excerpt && (
                    <p className="text-sm text-[#5A5D70] line-clamp-2 leading-relaxed">
                      {relatedPost.excerpt}
                    </p>
                  )}
                </div>
                {relatedPost.featured_image_url ? (
                  <div className="w-full sm:w-36 h-28 flex-shrink-0 rounded-[5px] overflow-hidden">
                    <img
                      src={relatedPost.featured_image_url}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="hidden sm:flex w-12 h-12 rounded-full bg-[#FDF8F1] border border-[#F5ECDE] items-center justify-center text-[#EF5B45] group-hover:translate-x-1 transition-transform">
                    &rarr;
                  </div>
                )}
              </Link>
            </section>
          )}
        </div>
      </article>
    </>
  )
}
