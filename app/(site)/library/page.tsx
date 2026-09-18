import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import ScrollReveal from '@/components/public/ScrollReveal'

export const dynamic = 'force-dynamic'

interface LibraryItem {
  id: string
  title: string
  creator: string
  type: 'podcast' | 'book' | 'newsletter'
  url: string
  thumbnail_url: string | null
  recommendation_note: string | null
  created_at: string
}

export default async function LibraryPage() {
  const supabase = await createClient()

  const { data: items, error } = await supabase
    .from('library_items')
    .select('*')
    .order('created_at', { ascending: true })

  const allItems: LibraryItem[] = items || []

  const podcasts = allItems.filter((item) => item.type === 'podcast')
  const books = allItems.filter((item) => item.type === 'book')
  const newsletters = allItems.filter((item) => item.type === 'newsletter')

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
          </div>
        </div>
      </section>

      {/* ================= CONTENT SECTIONS ================= */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20">
        {/* PODCASTS SECTION */}
        <section id="podcasts" className="space-y-8">
          <ScrollReveal>
            <div className="flex items-center gap-3 border-b border-[#F5ECDE] pb-4">
              <span className="text-2xl" aria-hidden="true">🎙️</span>
              <div>
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                  Podcasts & Conversations
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
                  className="group flex flex-col h-full bg-white rounded-2xl border border-[#F5ECDE] overflow-hidden shadow-[0_4px_14px_rgba(35,37,54,0.04)] hover:shadow-[0_12px_28px_rgba(35,37,54,0.1)] hover:-translate-y-1 transition-all duration-300"
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
                      <div className="w-full h-full flex items-center justify-center text-3xl text-[#5A5D70]/40">
                        🎙️
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

                    <div className="pt-2 flex items-center text-xs font-bold text-[#5A5D70] group-hover:text-[#232536] transition-colors">
                      <span>Listen / Watch</span>
                      <span className="ml-1.5 transition-transform group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
                    </div>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* BOOKS SECTION */}
        <section id="books" className="space-y-8">
          <ScrollReveal>
            <div className="flex items-center gap-3 border-b border-[#F5ECDE] pb-4">
              <span className="text-2xl" aria-hidden="true">📚</span>
              <div>
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                  Books & Reading
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
                  className="group flex flex-col h-full bg-white rounded-2xl border border-[#F5ECDE] p-5 shadow-[0_4px_14px_rgba(35,37,54,0.04)] hover:shadow-[0_12px_28px_rgba(35,37,54,0.1)] hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex flex-col sm:flex-row gap-5 items-start flex-grow">
                    {/* Book Cover */}
                    <div className="relative w-28 sm:w-32 flex-shrink-0 aspect-[2/3] bg-[#FAF3E8] rounded-lg overflow-hidden border border-[#F5ECDE] shadow-[0_6px_16px_rgba(35,37,54,0.08)] group-hover:shadow-[0_10px_22px_rgba(35,37,54,0.14)] transition-all">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl text-[#5A5D70]/40">
                          📚
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

                      <div className="pt-2 flex items-center text-xs font-bold text-[#5A5D70] group-hover:text-[#232536] transition-colors">
                        <span>View Details</span>
                        <span className="ml-1.5 transition-transform group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
                      </div>
                    </div>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* NEWSLETTERS SECTION */}
        <section id="newsletters" className="space-y-8">
          <ScrollReveal>
            <div className="flex items-center gap-3 border-b border-[#F5ECDE] pb-4">
              <span className="text-2xl" aria-hidden="true">📬</span>
              <div>
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                  Newsletters & Dispatches
                </h2>
                <p className="text-sm text-[#5A5D70] mt-0.5">
                  Regular writing on faith & work, neuroscience, and personal growth.
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
                  className="group flex flex-col h-full bg-white rounded-2xl border border-[#F5ECDE] overflow-hidden shadow-[0_4px_14px_rgba(35,37,54,0.04)] hover:shadow-[0_12px_28px_rgba(35,37,54,0.1)] hover:-translate-y-1 transition-all duration-300"
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
                      <div className="w-full h-full flex items-center justify-center text-3xl text-[#5A5D70]/40">
                        📬
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

                    <div className="pt-2 flex items-center text-xs font-bold text-[#5A5D70] group-hover:text-[#232536] transition-colors">
                      <span>Read & Subscribe</span>
                      <span className="ml-1.5 transition-transform group-hover:translate-x-1" aria-hidden="true">&rarr;</span>
                    </div>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
