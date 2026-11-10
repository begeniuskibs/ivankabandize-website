import React from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react'
import { SITE_URL } from '@/lib/siteUrl'
import { safeHref } from '@/lib/safeUrl'
import { safeParseLibraryLinks, LINK_TYPE_LABELS, type LibraryLinkItem } from '@/lib/libraryLinks'
import {
  getLibraryItemBySlug,
  getLibraryNeighbours,
  getLibraryItemTopics,
  getRelatedLibraryItems,
  getPublishedTake,
  getTipTapWordCount,
} from '@/lib/libraryItems'
import JsonLd from '@/components/seo/JsonLd'
import TipTapRenderer from '@/components/editor/TipTapRenderer'
import LibraryVideoPlayer from '@/components/public/LibraryVideoPlayer'
import LibraryTakeExpander from '@/components/public/LibraryTakeExpander'

export const dynamic = 'force-dynamic'

interface LibraryItemPageProps {
  params: Promise<{ slug: string }>
}

const TYPE_NAMES: Record<string, { singular: string; plural: string }> = {
  book: { singular: 'Book', plural: 'Books' },
  podcast: { singular: 'Podcast', plural: 'Podcasts' },
  newsletter: { singular: 'Newsletter', plural: 'Newsletters' },
}

export async function generateMetadata({
  params,
}: LibraryItemPageProps): Promise<Metadata> {
  const { slug } = await params
  const item = await getLibraryItemBySlug(slug)

  if (!item) {
    return {
      title: 'Item Not Found',
    }
  }

  const title = `${item.title} - ${item.creator}`
  const typeLabel = TYPE_NAMES[item.type]?.singular || item.type
  const description =
    item.recommendation_note && item.recommendation_note.trim().length > 0
      ? item.recommendation_note.trim().slice(0, 160)
      : `${typeLabel} by ${item.creator} curated in Ivan Kabandize's library.`

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/library/${item.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/library/${item.slug}`,
      ...(item.thumbnail_url
        ? {
            images: [
              {
                url: item.thumbnail_url,
                alt: item.title,
              },
            ],
          }
        : {}),
    },
  }
}

export default async function LibraryItemPage({ params }: LibraryItemPageProps) {
  const { slug } = await params
  const item = await getLibraryItemBySlug(slug)

  if (!item) {
    notFound()
  }

  // Fetch related data in parallel
  const [neighbours, topics, take] = await Promise.all([
    getLibraryNeighbours(item),
    getLibraryItemTopics(item.id),
    getPublishedTake(item.id, item.take_published),
  ])

  // Fetch up to 3 related items sharing first topic if available
  const relatedItems =
    topics.length > 0
      ? await getRelatedLibraryItems(topics[0].id, item.id)
      : []

  const takeWordCount = take ? getTipTapWordCount(take) : 0
  const parsedLinks: LibraryLinkItem[] = safeParseLibraryLinks(item.links)
  const typeInfo = TYPE_NAMES[item.type] || {
    singular: item.type,
    plural: 'Curated Items',
  }

  // Fallback link action button if links array is empty
  const defaultFallbackLabel =
    item.type === 'podcast'
      ? 'Listen or watch'
      : item.type === 'book'
        ? 'Get the book'
        : 'Read and subscribe'

  const breadcrumbsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'The Garden',
        item: `${SITE_URL}/garden`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Library',
        item: `${SITE_URL}/library`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: item.title,
        item: `${SITE_URL}/library/${item.slug}`,
      },
    ],
  }

  const creativeWorkJsonLd = {
    '@context': 'https://schema.org',
    '@type': item.type === 'book' ? 'Book' : 'CreativeWork',
    name: item.title,
    author: {
      '@type': 'Person',
      name: item.creator,
    },
    url: `${SITE_URL}/library/${item.slug}`,
    ...(item.thumbnail_url ? { image: item.thumbnail_url } : {}),
  }

  return (
    <div className="min-h-screen bg-[#FDF8F1] text-[#232536] font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
      <JsonLd data={breadcrumbsJsonLd} />
      <JsonLd data={creativeWorkJsonLd} />

      <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-12">
        {/* a) Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#5C5F73]"
        >
          <Link
            href="/garden"
            className="hover:text-[#232536] transition-colors"
          >
            The Garden
          </Link>
          <span aria-hidden="true" className="text-[#5C5F73]/40">
            /
          </span>
          <Link
            href="/library"
            className="hover:text-[#232536] transition-colors"
          >
            Library
          </Link>
          <span aria-hidden="true" className="text-[#5C5F73]/40">
            /
          </span>
          <span className="text-[#232536] truncate max-w-[200px] sm:max-w-md">
            {item.title}
          </span>
        </nav>

        {/* b, c, d, e) Header & Media Block */}
        {item.type === 'podcast' ? (
          <div className="space-y-8">
            {/* Title Block for Podcasts */}
            <div className="space-y-4 max-w-3xl">
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#F5ECDE] text-[#232536]">
                {typeInfo.singular}
              </span>

              <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl font-bold text-[#232536] tracking-tight leading-tight">
                {item.title}
              </h1>

              <p className="text-base sm:text-lg text-[#5C5F73]">
                by <span className="font-bold text-[#232536]">{item.creator}</span>
              </p>

              {topics.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {topics.map((t) => (
                    <Link
                      key={t.id}
                      href={`/library?topic=${t.slug}`}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#F0E4D2] text-[#5C5F73] hover:border-[#232536] hover:text-[#232536] transition-colors shadow-2xs"
                    >
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Video Player (if video_url exists) or Cover Tile */}
            {item.video_url ? (
              <div className="max-w-3xl">
                <LibraryVideoPlayer
                  videoUrl={item.video_url}
                  title={item.title}
                  creator={item.creator}
                  thumbnailUrl={item.thumbnail_url}
                />
              </div>
            ) : item.thumbnail_url ? (
              <div className="max-w-xl aspect-video rounded-2xl overflow-hidden bg-[#FAF3E8] border border-[#F0E4D2] relative">
                <Image
                  src={item.thumbnail_url}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  unoptimized
                  className="object-cover"
                />
              </div>
            ) : null}

            {/* Action Buttons */}
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap gap-2.5 sm:gap-3">
                {parsedLinks.length > 0 ? (
                  parsedLinks.map((link, idx) => {
                    const label = link.label || LINK_TYPE_LABELS[link.type] || 'Visit link'
                    const isPrimary = idx === 0
                    return (
                      <a
                        key={idx}
                        href={safeHref(link.url, '#')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors cursor-pointer w-full sm:w-auto ${
                          isPrimary
                            ? 'bg-[#CF3F29] hover:bg-[#b83420] text-white border-2 border-[#CF3F29]'
                            : 'border-2 border-[#CF3F29] text-[#CF3F29] hover:border-[#b83420] hover:text-[#b83420] bg-transparent'
                        }`}
                      >
                        <span>{label}</span>
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    )
                  })
                ) : (
                  <a
                    href={safeHref(item.url, '#')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold bg-[#CF3F29] hover:bg-[#b83420] text-white border-2 border-[#CF3F29] transition-colors cursor-pointer w-full sm:w-auto"
                  >
                    <span>{defaultFallbackLabel}</span>
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                )}
              </div>
              <p className="text-xs text-[#5C5F73]">
                These open the original site in a new tab.
              </p>
            </div>

            {/* Why I recommend it */}
            {item.recommendation_note && item.recommendation_note.trim().length > 0 && (
              <blockquote className="border-l-3 border-[#EF5B45] bg-white rounded-r-xl p-4 sm:p-5 shadow-2xs max-w-2xl">
                <small className="block text-[11px] font-bold uppercase tracking-wider text-[#5C5F73] mb-1.5">
                  Why I recommend it
                </small>
                <p className="text-base sm:text-lg italic text-[#232536] leading-relaxed">
                  &ldquo;{item.recommendation_note}&rdquo;
                </p>
              </blockquote>
            )}
          </div>
        ) : (
          /* Books and Newsletters: Cover Tile beside Title Block */
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 md:gap-12 items-start">
            {/* Media Tile */}
            <div className="w-full max-w-[240px] md:max-w-none mx-auto md:mx-0">
              {item.type === 'book' ? (
                <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#FAF3E8] border border-[#F0E4D2] shadow-md">
                  {item.thumbnail_url ? (
                    <Image
                      src={item.thumbnail_url}
                      alt={item.title}
                      fill
                      sizes="260px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full p-5 flex flex-col justify-between bg-gradient-to-br from-[#232536] to-[#15161F] text-white">
                      <span className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold leading-snug line-clamp-4">
                        {item.title}
                      </span>
                      <span className="text-xs uppercase tracking-wider opacity-80">
                        {item.creator}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                /* Newsletter wordmark tile */
                <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#FAF3E8] border border-[#F0E4D2] shadow-md">
                  {item.thumbnail_url ? (
                    <Image
                      src={item.thumbnail_url}
                      alt={item.title}
                      fill
                      sizes="260px"
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full p-6 flex items-center justify-center text-center bg-gradient-to-br from-[#1E5E7E] to-[#0A3C4F] text-white">
                      <span className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold leading-tight line-clamp-3">
                        {item.title}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title & Details Block */}
            <div className="space-y-6 min-w-0">
              <div className="space-y-3">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[#F5ECDE] text-[#232536]">
                  {typeInfo.singular}
                </span>

                <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl font-bold text-[#232536] tracking-tight leading-tight">
                  {item.title}
                </h1>

                <p className="text-base sm:text-lg text-[#5C5F73]">
                  by <span className="font-bold text-[#232536]">{item.creator}</span>
                </p>

                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {topics.map((t) => (
                      <Link
                        key={t.id}
                        href={`/library?topic=${t.slug}`}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#F0E4D2] text-[#5C5F73] hover:border-[#232536] hover:text-[#232536] transition-colors shadow-2xs"
                      >
                        {t.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2.5 sm:gap-3">
                  {parsedLinks.length > 0 ? (
                    parsedLinks.map((link, idx) => {
                      const label = link.label || LINK_TYPE_LABELS[link.type] || 'Visit link'
                      const isPrimary = idx === 0
                      return (
                        <a
                          key={idx}
                          href={safeHref(link.url, '#')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-colors cursor-pointer w-full sm:w-auto ${
                            isPrimary
                              ? 'bg-[#CF3F29] hover:bg-[#b83420] text-white border-2 border-[#CF3F29]'
                              : 'border-2 border-[#CF3F29] text-[#CF3F29] hover:border-[#b83420] hover:text-[#b83420] bg-transparent'
                          }`}
                        >
                          <span>{label}</span>
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      )
                    })
                  ) : (
                    <a
                      href={safeHref(item.url, '#')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold bg-[#CF3F29] hover:bg-[#b83420] text-white border-2 border-[#CF3F29] transition-colors cursor-pointer w-full sm:w-auto"
                    >
                      <span>{defaultFallbackLabel}</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>
                <p className="text-xs text-[#5C5F73]">
                  These open the original site in a new tab.
                </p>
              </div>

              {/* Why I recommend it */}
              {item.recommendation_note && item.recommendation_note.trim().length > 0 && (
                <blockquote className="border-l-3 border-[#EF5B45] bg-white rounded-r-xl p-4 sm:p-5 shadow-2xs">
                  <small className="block text-[11px] font-bold uppercase tracking-wider text-[#5C5F73] mb-1.5">
                    Why I recommend it
                  </small>
                  <p className="text-base sm:text-lg italic text-[#232536] leading-relaxed">
                    &ldquo;{item.recommendation_note}&rdquo;
                  </p>
                </blockquote>
              )}
            </div>
          </div>
        )}

        {/* f) "My take" section */}
        {take && (
          <section
            className="max-w-[720px] pt-4 border-t border-[#F0E4D2]"
            aria-labelledby="take-heading"
          >
            <h2
              id="take-heading"
              className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] mb-5 tracking-tight"
            >
              My take
            </h2>
            <LibraryTakeExpander wordCount={takeWordCount}>
              <TipTapRenderer content={take} />
            </LibraryTakeExpander>
          </section>
        )}

        {/* g) Previous and next item links */}
        <nav
          aria-label={`More in ${typeInfo.plural}`}
          className="border-t border-[#F0E4D2] pt-8 flex flex-col sm:flex-row justify-between gap-6"
        >
          {neighbours.prev ? (
            <Link
              href={`/library/${neighbours.prev.slug}`}
              className="group flex flex-col gap-1 max-w-sm text-left"
            >
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#5C5F73]">
                <ArrowLeft size={12} aria-hidden="true" />
                Previous {item.type.toLowerCase()}
              </span>
              <span className="font-['MTN_Brighter_Sans',_sans-serif] text-base font-bold text-[#232536] group-hover:text-coral-text transition-colors line-clamp-2">
                {neighbours.prev.title}
              </span>
            </Link>
          ) : (
            <span />
          )}

          {neighbours.next ? (
            <Link
              href={`/library/${neighbours.next.slug}`}
              className="group flex flex-col gap-1 max-w-sm text-left sm:text-right sm:items-end"
            >
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#5C5F73]">
                Next {item.type.toLowerCase()}
                <ArrowRight size={12} aria-hidden="true" />
              </span>
              <span className="font-['MTN_Brighter_Sans',_sans-serif] text-base font-bold text-[#232536] group-hover:text-coral-text transition-colors line-clamp-2">
                {neighbours.next.title}
              </span>
            </Link>
          ) : null}
        </nav>

        {/* h) "More on <first topic>" */}
        {topics.length > 0 && relatedItems.length > 0 && (
          <section className="border-t border-[#F0E4D2] pt-8 space-y-6">
            <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-bold text-[#232536]">
              More on {topics[0].name}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedItems.map((relItem) => (
                <Link
                  key={relItem.id}
                  href={`/library/${relItem.slug}`}
                  className="group flex flex-col bg-white rounded-lg border border-[#F5ECDE] hover:border-[#232536]/25 overflow-hidden shadow-2xs hover:shadow-md hover:-translate-y-1 transition-all duration-300 min-w-0"
                >
                  {/* Top media header area */}
                  {relItem.type === 'book' ? (
                    <div className="relative aspect-video w-full bg-[#FAF3E8] flex items-center justify-center p-3 overflow-hidden">
                      {relItem.thumbnail_url ? (
                        <div className="relative h-full aspect-[2/3] rounded shadow-xs overflow-hidden">
                          <Image
                            src={relItem.thumbnail_url}
                            alt={relItem.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-16 aspect-[2/3] bg-[#EAE0D0] rounded shadow-xs flex items-center justify-center text-[10px] font-bold text-[#5C5F73] text-center p-1 uppercase">
                          {relItem.creator}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative aspect-video w-full bg-[#FAF3E8] overflow-hidden">
                      {relItem.thumbnail_url ? (
                        <Image
                          src={relItem.thumbnail_url}
                          alt={relItem.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center">
                          <span className="font-['MTN_Brighter_Sans',_sans-serif] text-sm font-bold text-[#5C5F73]">
                            {relItem.creator}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card body */}
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    <span className="inline-block self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E8F4F1] text-teal-text border border-[#2AA198]/20">
                      {relItem.type}
                    </span>
                    <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base font-bold text-[#232536] group-hover:text-coral-text transition-colors leading-snug line-clamp-2">
                      {relItem.title}
                    </h3>
                    <p className="text-xs text-[#5C5F73]">
                      by <span className="font-semibold text-[#232536]">{relItem.creator}</span>
                    </p>

                    <div className="pt-3 mt-auto border-t border-[#F5ECDE]/80 flex items-center justify-between text-xs text-[#5C5F73]">
                      <span className="text-teal-text font-bold text-xs">
                        {relItem.take_published ? 'My take inside' : ''}
                      </span>
                      <span className="font-bold inline-flex items-center gap-1.5 text-xs text-[#5C5F73] group-hover:text-coral-text transition-colors ml-auto">
                        <span>View details</span>
                        <ArrowRight
                          size={14}
                          strokeWidth={2.5}
                          aria-hidden="true"
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
