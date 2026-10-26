import Link from 'next/link'
import Image from 'next/image'
import { Leaf, BookOpen, ArrowRight } from 'lucide-react'

export interface GardenA2Article {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  preview?: string | null
  content_type?: string | null
  featured_image_url?: string | null
  published_at?: string | null
  readTime?: number | null
}

export interface GardenA2LibraryItem {
  id: string
  title: string
  creator: string
  type: string
  url: string
  thumbnail_url?: string | null
}

export interface GardenA2TopicTag {
  name: string
  slug: string
}

interface GardenLandingA2Props {
  articles: GardenA2Article[]
  totalArticlesCount: number
  libraryItems: GardenA2LibraryItem[]
  totalLibraryCount: number
  topicTags: GardenA2TopicTag[]
}

const STREAM_NAMES: Record<string, string> = {
  random_thoughts: 'Random Thoughts',
  structured_thoughts: 'Structured Thoughts',
  tools_for_thought: 'Tools for Thought',
}

export default function GardenLandingA2({
  articles,
  totalArticlesCount,
  libraryItems,
  totalLibraryCount,
  topicTags,
}: GardenLandingA2Props) {
  return (
    <div className="flex flex-col min-h-full font-sans bg-[#FDF8F1]">
      {/* 1. Hero Section */}
      <section className="relative pt-16 pb-12 md:pt-24 md:pb-16 border-b border-[#F5ECDE] bg-[#FDF8F1]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest font-bold mb-3 text-[#A97B1A]">
            DIGITAL GARDEN &amp; NOTEBOOK
          </p>
          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4 text-[#232536]">
            The Garden
          </h1>
          <p className="text-lg sm:text-xl text-[#5A5D70] max-w-2xl leading-relaxed">
            Everything I write, collect and share, in one place. Choose where to start.
          </p>

          {/* 2. Four Category Cards */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Articles Card (Coral) */}
            <Link
              href="/garden?view=articles"
              className="group relative flex flex-col justify-between p-4 rounded-[20px] overflow-hidden min-h-[260px] md:min-h-[300px] bg-[#FEF1ED] border border-[#F7D6CC] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lg motion-reduce:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2"
            >
              {/* Full-card Background Art */}
              <Image
                src="/garden-card-art/articles.svg"
                alt=""
                fill
                className="object-cover pointer-events-none transition-transform duration-500 motion-reduce:transition-none group-hover:scale-110 motion-reduce:group-hover:scale-100"
                unoptimized
              />

              {/* Top-left 3D Icon */}
              <div className="relative z-10 shrink-0">
                <Image
                  src="/garden-icons-3d/articles.svg"
                  alt=""
                  width={64}
                  height={64}
                  className="w-[64px] h-[64px] object-contain drop-shadow-md"
                  unoptimized
                />
              </div>

              {/* Bottom Frosted Plate */}
              <div className="relative z-10 mt-auto rounded-[14px] bg-white/64 border border-white/60 shadow-xs backdrop-blur-md px-4 py-3.5">
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-[22px] font-bold text-[#232536] leading-tight mb-1">
                  Articles
                </h2>
                <p className="text-[14px] text-[#5A5D70] leading-snug mb-3 line-clamp-3 min-h-[58px]">
                  Essays, sparks and tools for thinking, plus series that read in order.
                </p>
                <div className="pt-2.5 border-t border-[#F7D6CC]/60 flex items-center justify-between text-xs font-semibold min-h-[28px]">
                  <span className="text-[#CF3F29] font-bold">
                    {totalArticlesCount} articles
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#CF3F29] font-bold">
                    <span>Open</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 motion-reduce:transition-none"
                    />
                  </span>
                </div>
              </div>
            </Link>

            {/* Curated Library Card (Teal) */}
            <Link
              href="/library"
              className="group relative flex flex-col justify-between p-4 rounded-[20px] overflow-hidden min-h-[260px] md:min-h-[300px] bg-[#EAF6F4] border border-[#C5E4E0] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lg motion-reduce:hover:translate-y-0 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B7F7A] focus-visible:ring-offset-2"
            >
              {/* Full-card Background Art */}
              <Image
                src="/garden-card-art/library.svg"
                alt=""
                fill
                className="object-cover pointer-events-none transition-transform duration-500 motion-reduce:transition-none group-hover:scale-110 motion-reduce:group-hover:scale-100"
                unoptimized
              />

              {/* Top-left 3D Icon */}
              <div className="relative z-10 shrink-0">
                <Image
                  src="/garden-icons-3d/library.svg"
                  alt=""
                  width={64}
                  height={64}
                  className="w-[64px] h-[64px] object-contain drop-shadow-md"
                  unoptimized
                />
              </div>

              {/* Bottom Frosted Plate */}
              <div className="relative z-10 mt-auto rounded-[14px] bg-white/64 border border-white/60 shadow-xs backdrop-blur-md px-4 py-3.5">
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-[22px] font-bold text-[#232536] leading-tight mb-1">
                  Curated Library
                </h2>
                <p className="text-[14px] text-[#5A5D70] leading-snug mb-3 line-clamp-3 min-h-[58px]">
                  Podcasts, books and newsletters that shaped my thinking.
                </p>
                <div className="pt-2.5 border-t border-[#C5E4E0]/60 flex items-center justify-between text-xs font-semibold min-h-[28px]">
                  <span className="text-[#1B7F7A] font-bold">
                    {totalLibraryCount} items
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#1B7F7A] font-bold">
                    <span>Open</span>
                    <ArrowRight
                      size={14}
                      strokeWidth={2.5}
                      aria-hidden="true"
                      className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0 motion-reduce:transition-none"
                    />
                  </span>
                </div>
              </div>
            </Link>

            {/* Report Digests Card (Gold) - Non-link */}
            <div className="group relative flex flex-col justify-between p-4 rounded-[20px] overflow-hidden min-h-[260px] md:min-h-[300px] bg-[#FBF4E4] border border-[#EFDFB8] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lg motion-reduce:hover:translate-y-0 motion-reduce:transition-none">
              {/* Full-card Background Art */}
              <Image
                src="/garden-card-art/digests.svg"
                alt=""
                fill
                className="object-cover pointer-events-none transition-transform duration-500 motion-reduce:transition-none group-hover:scale-110 motion-reduce:group-hover:scale-100"
                unoptimized
              />

              {/* Top-left 3D Icon */}
              <div className="relative z-10 shrink-0">
                <Image
                  src="/garden-icons-3d/digests.svg"
                  alt=""
                  width={64}
                  height={64}
                  className="w-[64px] h-[64px] object-contain drop-shadow-md"
                  unoptimized
                />
              </div>

              {/* Bottom Frosted Plate */}
              <div className="relative z-10 mt-auto rounded-[14px] bg-white/64 border border-white/60 shadow-xs backdrop-blur-md px-4 py-3.5">
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-[22px] font-bold text-[#232536] leading-tight mb-1">
                  Report Digests
                </h2>
                <p className="text-[14px] text-[#5A5D70] leading-snug mb-3 line-clamp-3 min-h-[58px]">
                  Plain-language summaries of the research leaders should read.
                </p>
                <div className="pt-2.5 border-t border-[#EFDFB8]/60 flex items-center justify-between text-xs min-h-[28px]">
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 text-[#A97B1A] border border-[#A97B1A]/20">
                    Coming soon
                  </span>
                </div>
              </div>
            </div>

            {/* Resources Card (Slate) - Non-link */}
            <div className="group relative flex flex-col justify-between p-4 rounded-[20px] overflow-hidden min-h-[260px] md:min-h-[300px] bg-[#EEEFF6] border border-[#D5D8E8] transition-all duration-300 hover:-translate-y-[3px] hover:shadow-lg motion-reduce:hover:translate-y-0 motion-reduce:transition-none">
              {/* Full-card Background Art */}
              <Image
                src="/garden-card-art/resources.svg"
                alt=""
                fill
                className="object-cover pointer-events-none transition-transform duration-500 motion-reduce:transition-none group-hover:scale-110 motion-reduce:group-hover:scale-100"
                unoptimized
              />

              {/* Top-left 3D Icon */}
              <div className="relative z-10 shrink-0">
                <Image
                  src="/garden-icons-3d/resources.svg"
                  alt=""
                  width={64}
                  height={64}
                  className="w-[64px] h-[64px] object-contain drop-shadow-md"
                  unoptimized
                />
              </div>

              {/* Bottom Frosted Plate */}
              <div className="relative z-10 mt-auto rounded-[14px] bg-white/64 border border-white/60 shadow-xs backdrop-blur-md px-4 py-3.5">
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-[22px] font-bold text-[#232536] leading-tight mb-1">
                  Resources
                </h2>
                <p className="text-[14px] text-[#5A5D70] leading-snug mb-3 line-clamp-3 min-h-[58px]">
                  Templates and downloads you can put to work today.
                </p>
                <div className="pt-2.5 border-t border-[#D5D8E8]/60 flex items-center justify-between text-xs min-h-[28px]">
                  <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 text-[#5C5F73] border border-[#5C5F73]/20">
                    Coming soon
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Browse by Topic Strip */}
          {topicTags.length > 0 && (
            <div className="mt-10 pt-6 border-t border-[#F5ECDE] flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#5A5D70] mr-1">
                Browse by topic:
              </span>
              {topicTags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/garden/topics/${tag.slug}`}
                  className="text-xs px-3 py-1 rounded-full font-medium bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#1B7F7A] hover:text-[#1B7F7A] transition"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="py-12 md:py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* 4. Section Articles */}
        <section id="articles" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#F5ECDE] pb-4">
            <div>
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                Articles
              </h2>
            </div>
            {/* Stream filters row */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/random-thoughts"
                className="text-xs font-semibold text-[#5A5D70] hover:text-[#CF3F29] px-3 py-1 rounded-full bg-white border border-[#F5ECDE] transition"
              >
                Random Thoughts
              </Link>
              <Link
                href="/structured-thoughts"
                className="text-xs font-semibold text-[#5A5D70] hover:text-[#CF3F29] px-3 py-1 rounded-full bg-white border border-[#F5ECDE] transition"
              >
                Structured Thoughts
              </Link>
              <Link
                href="/tools-for-thought"
                className="text-xs font-semibold text-[#5A5D70] hover:text-[#CF3F29] px-3 py-1 rounded-full bg-white border border-[#F5ECDE] transition"
              >
                Tools for Thought
              </Link>
            </div>
          </div>

          {/* 6 latest published articles grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.slice(0, 6).map((post) => {
              const streamTag = post.content_type
                ? STREAM_NAMES[post.content_type] || post.content_type
                : 'Article'
              const previewText =
                (post.preview && post.preview.trim()) ||
                (post.excerpt && post.excerpt.trim()) ||
                ''

              let formattedDate: string | null = null
              if (post.published_at) {
                try {
                  const d = new Date(post.published_at)
                  if (!isNaN(d.getTime())) {
                    formattedDate = d.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  }
                } catch {
                  formattedDate = null
                }
              }

              const readTimeText =
                typeof post.readTime === 'number' && post.readTime > 0
                  ? `${post.readTime} min read`
                  : null

              const metaText =
                formattedDate && readTimeText
                  ? `${formattedDate} - ${readTimeText}`
                  : formattedDate || readTimeText || null

              return (
                <Link
                  key={post.id}
                  href={`/garden/${post.slug}`}
                  className="group flex flex-col h-full bg-white rounded-[5px] border border-[#F5ECDE] hover:border-[#F7D6CC] hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#FDF3DC] shrink-0">
                    {post.featured_image_url ? (
                      <Image
                        src={post.featured_image_url}
                        alt=""
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FEF1ED] flex items-center justify-center">
                        <Leaf className="w-8 h-8 text-[#CF3F29]/60" />
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#CF3F29] block mb-2">
                        {streamTag}
                      </span>
                      <h3
                        className="font-['MTN_Brighter_Sans',_sans-serif] text-lg font-bold text-[#232536] group-hover:text-[#CF3F29] transition-colors leading-snug mb-2 line-clamp-1"
                        title={post.title}
                      >
                        {post.title}
                      </h3>
                      {previewText ? (
                        <p className="text-xs text-[#5A5D70] leading-relaxed line-clamp-2 mt-2">
                          {previewText}
                        </p>
                      ) : null}
                    </div>
                    {metaText ? (
                      <div className="text-xs text-[#A97B1A] mt-2">
                        {metaText}
                      </div>
                    ) : null}
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Button See all articles */}
          <div className="pt-4 flex justify-center">
            <Link
              href="/garden?view=articles"
              className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm border border-[#CF3F29] text-[#CF3F29] hover:bg-[#CF3F29] hover:text-white transition"
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
        </section>

        {/* 5. Section Curated Library */}
        <section id="library" className="space-y-6">
          <div className="border-b border-[#F5ECDE] pb-4">
            <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
              Curated Library
            </h2>
          </div>

          {/* 6 latest items grid (2 rows of 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {libraryItems.slice(0, 6).map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col h-full bg-white rounded-[5px] border border-[#F5ECDE] hover:border-[#C5E4E0] hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#EAF6F4] shrink-0">
                  {item.thumbnail_url ? (
                    <Image
                      src={item.thumbnail_url}
                      alt=""
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-[#1B7F7A]/60" />
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EAF6F4] text-[#1B7F7A] border border-[#C5E4E0] inline-block mb-2">
                      {item.type}
                    </span>
                    <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base font-bold text-[#232536] group-hover:text-[#1B7F7A] transition-colors leading-snug line-clamp-2 mb-1">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#5A5D70] mt-2">
                    by <span className="font-semibold text-[#232536]">{item.creator}</span>
                  </p>
                </div>
              </a>
            ))}
          </div>

          {/* Button See the full Library */}
          <div className="pt-4 flex justify-center">
            <Link
              href="/library"
              className="group inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm border border-[#1B7F7A] text-[#1B7F7A] hover:bg-[#1B7F7A] hover:text-white transition"
            >
              <span>See the full Library</span>
              <ArrowRight
                size={14}
                strokeWidth={2.5}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
              />
            </Link>
          </div>
        </section>

        {/* 6. Section Report Digests & Section Resources (Coming Soon Panels) */}
        <section id="digests-and-resources" className="space-y-12">
          {/* Report Digests */}
          <div className="space-y-4">
            <div className="border-b border-[#F5ECDE] pb-3">
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-[#232536]">
                Report Digests
              </h2>
            </div>
            <div className="border-2 border-dashed border-[#EFDFB8] bg-[#FBF4E4]/40 rounded-[5px] p-8 sm:p-10 text-center">
              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-lg font-bold text-[#232536] mb-2">
                The first digest is still growing
              </h3>
              <p className="text-sm text-[#5A5D70] max-w-lg mx-auto leading-relaxed">
                Each one will explain a major report in plain language, with a button to get the original.
              </p>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <div className="border-b border-[#F5ECDE] pb-3">
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-[#232536]">
                Resources
              </h2>
            </div>
            <div className="border-2 border-dashed border-[#D5D8E8] bg-[#EEEFF6]/40 rounded-[5px] p-8 sm:p-10 text-center">
              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-lg font-bold text-[#232536] mb-2">
                Seeds are being packed
              </h3>
              <p className="text-sm text-[#5A5D70] max-w-lg mx-auto leading-relaxed">
                Free templates and frameworks will land here. Members will be able to download them.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
