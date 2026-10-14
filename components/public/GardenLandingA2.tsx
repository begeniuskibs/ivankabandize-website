import Link from 'next/link'
import Image from 'next/image'
import { Leaf, BookOpen } from 'lucide-react'

export interface GardenA2Article {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  preview?: string | null
  content_type?: string | null
  featured_image_url?: string | null
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
              className="group flex flex-col justify-between p-6 rounded-[5px] transition-all duration-[180ms] bg-[#FEF1ED] border border-[#F7D6CC] hover:bg-[#FBD3C8] hover:shadow-[0_0_0_1px_#EF5B45] hover:-translate-y-[3px]"
            >
              <div>
                <Image
                  src="/garden-icons/articles.png"
                  alt=""
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain mb-4"
                  unoptimized
                />
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-2 leading-snug">
                  Articles
                </h2>
                <p className="text-xs text-[#5A5D70] leading-relaxed mb-4">
                  Essays, sparks and tools for thinking, plus series that read in order.
                </p>
              </div>
              <div className="pt-4 border-t border-[#F7D6CC] flex items-center justify-between text-xs font-semibold">
                <span className="text-[#CF3F29] font-bold">
                  {totalArticlesCount} articles
                </span>
                <span className="text-[#CF3F29] font-bold group-hover:translate-x-0.5 transition-transform">
                  Open -&gt;
                </span>
              </div>
            </Link>

            {/* Curated Library Card (Teal) */}
            <Link
              href="/library"
              className="group flex flex-col justify-between p-6 rounded-[5px] transition-all duration-[180ms] bg-[#EAF6F4] border border-[#C5E4E0] hover:bg-[#BFE3DF] hover:shadow-[0_0_0_1px_#1B7F7A] hover:-translate-y-[3px]"
            >
              <div>
                <Image
                  src="/garden-icons/library.png"
                  alt=""
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain mb-4"
                  unoptimized
                />
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-2 leading-snug">
                  Curated Library
                </h2>
                <p className="text-xs text-[#5A5D70] leading-relaxed mb-4">
                  Podcasts, books and newsletters that shaped my thinking.
                </p>
              </div>
              <div className="pt-4 border-t border-[#C5E4E0] flex items-center justify-between text-xs font-semibold">
                <span className="text-[#1B7F7A] font-bold">
                  {totalLibraryCount} items
                </span>
                <span className="text-[#1B7F7A] font-bold group-hover:translate-x-0.5 transition-transform">
                  Open -&gt;
                </span>
              </div>
            </Link>

            {/* Report Digests Card (Gold) - Non-link */}
            <div className="flex flex-col justify-between p-6 rounded-[5px] transition-all duration-[180ms] bg-[#FBF4E4] border border-[#EFDFB8] hover:bg-[#F2DEAA] hover:shadow-[0_0_0_1px_#A97B1A] hover:-translate-y-[3px]">
              <div>
                <Image
                  src="/garden-icons/digests.png"
                  alt=""
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain mb-4"
                  unoptimized
                />
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-2 leading-snug">
                  Report Digests
                </h2>
                <p className="text-xs text-[#5A5D70] leading-relaxed mb-4">
                  Plain-language summaries of the research leaders should read.
                </p>
              </div>
              <div className="pt-4 border-t border-[#EFDFB8] flex items-center justify-between text-xs">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 text-[#A97B1A] border border-[#A97B1A]/20">
                  Coming soon
                </span>
              </div>
            </div>

            {/* Resources Card (Slate) - Non-link */}
            <div className="flex flex-col justify-between p-6 rounded-[5px] transition-all duration-[180ms] bg-[#EEEFF6] border border-[#D5D8E8] hover:bg-[#CDD0E3] hover:shadow-[0_0_0_1px_#5C5F73] hover:-translate-y-[3px]">
              <div>
                <Image
                  src="/garden-icons/resources.png"
                  alt=""
                  width={64}
                  height={64}
                  className="w-16 h-16 object-contain mb-4"
                  unoptimized
                />
                <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-2 leading-snug">
                  Resources
                </h2>
                <p className="text-xs text-[#5A5D70] leading-relaxed mb-4">
                  Templates and downloads you can put to work today.
                </p>
              </div>
              <div className="pt-4 border-t border-[#D5D8E8] flex items-center justify-between text-xs">
                <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/80 text-[#5C5F73] border border-[#5C5F73]/20">
                  Coming soon
                </span>
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
                    </div>
                    {((post.preview && post.preview.trim()) || (post.excerpt && post.excerpt.trim())) ? (
                      <p className="text-xs text-[#5A5D70] leading-relaxed line-clamp-2 mt-2">
                        {post.preview || post.excerpt}
                      </p>
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm border border-[#CF3F29] text-[#CF3F29] hover:bg-[#CF3F29] hover:text-white transition"
            >
              See all articles -&gt;
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm border border-[#1B7F7A] text-[#1B7F7A] hover:bg-[#1B7F7A] hover:text-white transition"
            >
              See the full Library -&gt;
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
