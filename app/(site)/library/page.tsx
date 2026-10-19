import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/public/ScrollReveal'

export const dynamic = 'force-dynamic'

interface LibraryItem {
  id: string
  title: string
  creator: string
  type: 'podcast' | 'book' | 'newsletter' | string
  url: string
  thumbnail_url: string | null
  recommendation_note: string | null
  created_at: string
}

interface LibraryPageProps {
  searchParams?: Promise<{ topic?: string }>
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const params = (await searchParams) || {}
  const activeTopicSlug = params.topic || null
  const supabase = await createClient()

  // 1. Fetch all library items
  const { data: items } = await supabase
    .from('library_items')
    .select('*')
    .order('created_at', { ascending: true })

  const allItems: LibraryItem[] = items || []

  // 2. Fetch non-internal tags for topic filter bar
  const { data: tagsData } = await supabase
    .from('tags')
    .select('id, name, slug, is_internal')
    .eq('is_internal', false)
    .order('name', { ascending: true })

  const topicTags = tagsData || []
  const activeTag = activeTopicSlug
    ? topicTags.find((t) => t.slug === activeTopicSlug)
    : null

  // 3. Filter items by topic if active
  let filteredItems = allItems
  if (activeTopicSlug && activeTag) {
    try {
      const { data: itemTagRows, error: itemTagError } = await supabase
        .from('library_item_tags')
        .select('library_item_id')
        .eq('tag_id', activeTag.id)

      if (!itemTagError && itemTagRows) {
        const matchingIds = new Set(itemTagRows.map((r: { library_item_id: string }) => r.library_item_id))
        filteredItems = allItems.filter((item) => matchingIds.has(item.id))
      } else {
        // If library_item_tags does not exist or returned error, default to empty for this topic
        filteredItems = []
      }
    } catch {
      // Guard against missing table
      filteredItems = []
    }
  }

  const podcasts = filteredItems.filter((item) => item.type === 'podcast')
  const books = filteredItems.filter((item) => item.type === 'book')
  const newsletters = filteredItems.filter((item) => item.type === 'newsletter')

  return (
    <div className="flex flex-col min-h-full bg-[#FDF8F1] text-[#232536] font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
      {/* ================= HERO HEADER ================= */}
      <section className="py-16 md:py-20 border-b border-[#F5ECDE] bg-[#FAF3E8]/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-4">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCEBE7] border border-[#EF5B45]/20 text-[#EF5B45] text-xs font-bold uppercase tracking-widest">
                <Link href="/" className="hover:underline text-[#5A5D70]">
                  Home
                </Link>
                <span className="text-[#5A5D70]">/</span>
                <span>Library</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={80}>
              <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#232536] leading-[1.15]">
                Curated <span className="text-[#EF5B45]">Library</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delayMs={140}>
              <p className="text-lg sm:text-xl font-medium text-[#5A5D70] leading-relaxed">
                A collection of podcasts, books, and newsletters that have shaped my thinking on systems, work, leadership, and craft.
              </p>
            </ScrollReveal>

            {/* Topic Filter Pills */}
            {topicTags.length > 0 && (
              <ScrollReveal delayMs={180}>
                <div className="pt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#5A5D70] mr-1">
                    Topics:
                  </span>
                  <Link
                    href="/library"
                    className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                      !activeTopicSlug
                        ? 'bg-[#232536] text-white font-bold'
                        : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
                    }`}
                  >
                    All Items
                  </Link>
                  {topicTags.map((tag) => (
                    <Link
                      key={tag.slug}
                      href={`/library?topic=${tag.slug}`}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                        activeTopicSlug === tag.slug
                          ? 'bg-[#2AA198] text-white font-bold'
                          : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#2AA198]'
                      }`}
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </ScrollReveal>
            )}
          </div>
        </div>
      </section>

      {/* ================= CONTENT SECTIONS ================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-[#F5ECDE] max-w-lg mx-auto p-8 shadow-xs">
            <Image
              src="/icons/3d/books.svg"
              alt=""
              aria-hidden="true"
              width={48}
              height={48}
              className="w-12 h-12 object-contain drop-shadow-md mx-auto mb-3"
              unoptimized
            />
            <h3 className="font-bold text-lg text-[#232536] mb-1">
              No library items found
            </h3>
            <p className="text-sm text-[#5A5D70] mb-6">
              {activeTag
                ? `No items are currently tagged with ${activeTag.name}.`
                : 'No library items are currently available.'}
            </p>
            {activeTopicSlug && (
              <Link
                href="/library"
                className="inline-flex items-center px-4 py-2 text-xs font-semibold bg-[#232536] text-white rounded-lg hover:bg-[#191A23] transition"
              >
                Clear topic filter
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* PODCASTS SECTION */}
            {podcasts.length > 0 && (
              <section id="podcasts" className="space-y-8">
                <ScrollReveal>
                  <div className="flex items-center gap-3 border-b border-[#F5ECDE] pb-4">
                    <Image
                      src="/icons/3d/microphone.svg"
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain shrink-0"
                      aria-hidden="true"
                      unoptimized
                    />
                    <div>
                      <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                        Podcasts &amp; Conversations
                      </h2>
                      <p className="text-sm text-[#5A5D70] mt-0.5">
                        Deep-dive episodes and shows on strategy, operations, and mastery.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {podcasts.map((item, idx) => (
                    <ScrollReveal key={item.id} delayMs={idx * 60}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col h-full bg-white rounded-[5px] overflow-hidden hover:-translate-y-1 transition-all duration-300"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-video w-full bg-[#FAF3E8] overflow-hidden">
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#5A5D70]/40">
                              <Image
                                src="/icons/3d/microphone.svg"
                                alt=""
                                width={48}
                                height={48}
                                className="w-12 h-12 object-contain opacity-40"
                                aria-hidden="true"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                            Podcast
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 flex flex-col flex-grow justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-[#EF5B45] tracking-wide uppercase">
                              {item.creator}
                            </p>
                            <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-semibold text-[#232536] group-hover:text-[#EF5B45] transition-colors leading-snug line-clamp-2">
                              {item.title}
                            </h3>
                          </div>

                          <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#5A5D70] group-hover:text-[#232536] transition-colors">
                            <span>Listen / Watch</span>
                            <ArrowRight
                              size={14}
                              strokeWidth={2.5}
                              aria-hidden="true"
                              className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                            />
                          </div>
                        </div>
                      </a>
                    </ScrollReveal>
                  ))}
                </div>
              </section>
            )}

            {/* BOOKS SECTION */}
            {books.length > 0 && (
              <section id="books" className="space-y-8">
                <ScrollReveal>
                  <div className="flex items-center gap-3 border-b border-[#F5ECDE] pb-4">
                    <Image
                      src="/icons/3d/books.svg"
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain shrink-0"
                      aria-hidden="true"
                      unoptimized
                    />
                    <div>
                      <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                        Books &amp; Reading
                      </h2>
                      <p className="text-sm text-[#5A5D70] mt-0.5">
                        Essential volumes on life design, systems, family, and productivity.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {books.map((item, idx) => (
                    <ScrollReveal key={item.id} delayMs={idx * 80}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col h-full bg-white rounded-[5px] p-5 hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row gap-5 items-start flex-grow">
                          {/* Book Cover */}
                          <div className="relative w-28 sm:w-32 flex-shrink-0 aspect-[2/3] bg-[#FAF3E8] rounded-[5px] overflow-hidden transition-all">
                            {item.thumbnail_url ? (
                              <img
                                src={item.thumbnail_url}
                                alt={item.title}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#5A5D70]/40">
                                <Image
                                  src="/icons/3d/books.svg"
                                  alt=""
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-contain opacity-40"
                                  aria-hidden="true"
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex flex-col justify-between h-full space-y-3 flex-grow">
                            <div className="space-y-1.5">
                              <span className="inline-block px-2 py-0.5 rounded-full bg-[#E8F4F1] text-[#2AA198] text-[10px] font-bold uppercase tracking-wider">
                                Book
                              </span>
                              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-semibold text-[#232536] group-hover:text-[#EF5B45] transition-colors leading-snug">
                                {item.title}
                              </h3>
                              <p className="text-xs font-medium text-[#5A5D70]">
                                by <span className="font-semibold text-[#232536]">{item.creator}</span>
                              </p>
                            </div>

                            <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#5A5D70] group-hover:text-[#232536] transition-colors">
                              <span>View Details</span>
                              <ArrowRight
                                size={14}
                                strokeWidth={2.5}
                                aria-hidden="true"
                                className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                              />
                            </div>
                          </div>
                        </div>
                      </a>
                    </ScrollReveal>
                  ))}
                </div>
              </section>
            )}

            {/* NEWSLETTERS SECTION */}
            {newsletters.length > 0 && (
              <section id="newsletters" className="space-y-8">
                <ScrollReveal>
                  <div className="flex items-center gap-3 border-b border-[#F5ECDE] pb-4">
                    <Image
                      src="/icons/3d/newsletter.svg"
                      alt=""
                      width={32}
                      height={32}
                      className="w-8 h-8 object-contain shrink-0"
                      aria-hidden="true"
                      unoptimized
                    />
                    <div>
                      <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                        Newsletters &amp; Dispatches
                      </h2>
                      <p className="text-sm text-[#5A5D70] mt-0.5">
                        Regular writing on faith &amp; work, neuroscience, and personal growth.
                      </p>
                    </div>
                  </div>
                </ScrollReveal>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {newsletters.map((item, idx) => (
                    <ScrollReveal key={item.id} delayMs={idx * 80}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col h-full bg-white rounded-[5px] overflow-hidden hover:-translate-y-1 transition-all duration-300"
                      >
                        {/* Thumbnail / Header Graphic */}
                        <div className="relative aspect-[16/9] w-full bg-[#FAF3E8] overflow-hidden">
                          {item.thumbnail_url ? (
                            <img
                              src={item.thumbnail_url}
                              alt={item.title}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#5A5D70]/40">
                              <Image
                                src="/icons/3d/newsletter.svg"
                                alt=""
                                width={48}
                                height={48}
                                className="w-12 h-12 object-contain opacity-40"
                                aria-hidden="true"
                                unoptimized
                              />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
                            Newsletter
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 flex flex-col flex-grow justify-between gap-4">
                          <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-[#2AA198] tracking-wide uppercase">
                              {item.creator}
                            </p>
                            <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-semibold text-[#232536] group-hover:text-[#EF5B45] transition-colors leading-snug">
                              {item.title}
                            </h3>
                          </div>

                          <div className="pt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#5A5D70] group-hover:text-[#232536] transition-colors">
                            <span>Read &amp; Subscribe</span>
                            <ArrowRight
                              size={14}
                              strokeWidth={2.5}
                              aria-hidden="true"
                              className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                            />
                          </div>
                        </div>
                      </a>
                    </ScrollReveal>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
