import { createClient } from '@/utils/supabase/server'
import PostCard from '@/components/public/PostCard'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface SeriesPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: SeriesPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: series } = await supabase
    .from('series')
    .select('title, description, header_image_url')
    .eq('slug', slug)
    .maybeSingle()

  if (!series) {
    return { title: 'Series Not Found | Ivan Kabandize' }
  }

  return {
    title: `${series.title} | Series | Ivan Kabandize`,
    description: series.description || undefined,
    openGraph: {
      title: `${series.title} | Series | Ivan Kabandize`,
      description: series.description || undefined,
      images: series.header_image_url ? [{ url: series.header_image_url }] : undefined,
    },
  }
}

export default async function SeriesLandingPage({ params }: SeriesPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch series metadata
  const { data: series, error: seriesError } = await supabase
    .from('series')
    .select('id, title, slug, description, intro, status, header_image_url, cover_emoji, card_tint')
    .eq('slug', slug)
    .maybeSingle()

  if (seriesError || !series) {
    notFound()
  }

  // Fetch strictly published parts in publish-date order (published_at ascending)
  const now = new Date().toISOString()
  const { data: parts, error: partsError } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, featured_image_url, content_type')
    .eq('series_id', series.id)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: true })

  if (partsError) {
    console.error('Error fetching series parts:', partsError)
  }

  const publishedParts = parts || []

  return (
    <div className="flex flex-col min-h-full font-sans bg-[#FDF8F1] py-16 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {/* Navigation Breadcrumb */}
        <div className="mb-10">
          <Link
            href="/garden"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-[#5A5D70] hover:text-[#232536] transition"
          >
            <span>&larr; Back to The Garden</span>
          </Link>
        </div>

        {/* Series Header Card / Intro */}
        <header className="mb-14">
          {/* Badge & Emoji */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span
              className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full ${
                series.status === 'complete'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              SERIES - {series.status === 'complete' ? 'COMPLETE' : 'GROWING'}
            </span>
            {series.cover_emoji && (
              <span className="text-2xl" aria-hidden="true">
                {series.cover_emoji}
              </span>
            )}
            <span className="text-xs text-[#5A5D70] font-semibold">
              {publishedParts.length}{' '}
              {publishedParts.length === 1 ? 'entry' : 'entries'}
              {series.status === 'growing' ? ' and counting' : ''}
            </span>
          </div>

          {/* Title */}
          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl font-bold text-[#232536] leading-tight mb-6 tracking-tight">
            {series.title}
          </h1>

          {/* Intro Text or Description */}
          {series.intro ? (
            <div className="text-base sm:text-lg text-[#5A5D70] max-w-3xl leading-relaxed whitespace-pre-line mb-8">
              {series.intro}
            </div>
          ) : series.description ? (
            <p className="text-base sm:text-lg text-[#5A5D70] max-w-3xl leading-relaxed mb-8">
              {series.description}
            </p>
          ) : null}

          {/* Header Image if set */}
          {series.header_image_url && (
            <div className="relative aspect-[16/9] w-full rounded-[5px] overflow-hidden mb-8 border border-[#F5ECDE] shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={series.header_image_url}
                alt={series.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </header>

        {/* Parts Section */}
        <section className="border-t border-[#F5ECDE] pt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-[#232536]">
              Series Parts
            </h2>
            <span className="text-xs font-semibold text-[#5A5D70]">
              Ordered chronologically
            </span>
          </div>

          {publishedParts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-[#F5ECDE] max-w-lg mx-auto p-8 shadow-sm">
              <div className="text-3xl mb-3">&#127793;</div>
              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-1">
                Entries coming soon
              </h3>
              <p className="text-xs text-[#5A5D70] leading-relaxed">
                Parts for this series are currently being prepared. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {publishedParts.map((post, index) => (
                <div key={post.id} className="flex flex-col h-full">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-xs font-bold font-mono tracking-wider text-[#EF5B45] uppercase">
                      Part {index + 1}
                    </span>
                    {post.published_at && (
                      <span className="text-[11px] text-[#5A5D70]/60">
                        • {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <PostCard post={post} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
