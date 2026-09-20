import { createClient } from '@/utils/supabase/server'
import TipTapRenderer from '@/components/editor/TipTapRenderer'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

interface GardenPostPageProps {
  params: Promise<{ slug: string }>
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
function calculateReadTime(content: any, excerpt?: string | null): number {
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

export async function generateMetadata({ params }: GardenPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('title, excerpt')
    .eq('slug', slug)
    .maybeSingle()

  if (!post) {
    return { title: 'Post Not Found | Ivan Kabandize' }
  }

  return {
    title: `${post.title} | The Garden`,
    description: post.excerpt || undefined,
  }
}

export default async function GardenPostPage({ params }: GardenPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Query post by slug - RLS restricts anon users to visibility='public' AND publish_status='published'
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, content, excerpt, published_at, content_type, featured_image_url, post_tags(tag:tags(name, slug))')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !post) {
    notFound()
  }

  // Fetch a related/recent post for the optional "You might have missed" bookmark card
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, content_type, featured_image_url')
    .neq('slug', slug)
    .order('published_at', { ascending: false })
    .limit(1)

  const relatedPost = relatedPosts && relatedPosts.length > 0 ? relatedPosts[0] : null
  const typeInfo = post.content_type && TYPE_CONFIG[post.content_type] ? TYPE_CONFIG[post.content_type] : null
  const readTime = calculateReadTime(post.content, post.excerpt)

  // Extract optional series metadata if embedded in content
  const seriesInfo = (post.content as any)?.series as { title: string; part?: number | string; href?: string } | undefined

  // Extract optional featured image caption if present in content
  const featuredImageCaption = (post.content as any)?.featured_image_caption || null

  return (
    <article className="min-h-full font-sans py-16 md:py-24 bg-[#FDF8F1]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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
              (pt: any) => pt.tag?.name && pt.tag.name.toLowerCase() !== typeInfo?.label.toLowerCase()
            )
            if (secondaryTags.length === 0) return null
            return (
              <div className="flex flex-wrap gap-2">
                {secondaryTags.map((pt: any, idx: number) => (
                  <span
                    key={idx}
                    className="bg-white text-[#2AA198] border border-[#F5ECDE] px-3 py-1 rounded-full text-[11px] font-semibold"
                  >
                    {pt.tag?.name}
                  </span>
                ))}
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

        {/* 4. Optional Series Callout Box */}
        {seriesInfo && (
          <div className="mb-8 p-5 rounded-3xl bg-white border-2 border-[#2AA198]/20 shadow-[0_4px_16px_rgba(42,161,152,0.06)] flex items-start gap-3.5">
            <span className="text-2xl" aria-hidden="true">📖</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#2AA198] mb-0.5">
                Series {seriesInfo.part ? `· Part ${seriesInfo.part}` : ''}
              </p>
              <p className="font-bold text-base text-[#232536]">
                {seriesInfo.title}
              </p>
              {seriesInfo.href && (
                <Link href={seriesInfo.href} className="text-xs font-semibold text-[#2AA198] hover:underline mt-1 inline-block">
                  View full series &rarr;
                </Link>
              )}
            </div>
          </div>
        )}

        {/* 5. Header Image rendered AFTER Byline */}
        {post.featured_image_url && (
          <figure className="mb-10">
            <div className="relative aspect-[16/9] w-full rounded-3xl overflow-hidden border border-[#F5ECDE] shadow-[0_10px_30px_rgba(35,37,54,0.06)]">
              <img
                src={post.featured_image_url}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
            {featuredImageCaption && (
              <figcaption
                className="mt-2.5 text-center text-xs text-[#5A5D70]"
                dangerouslySetInnerHTML={{ __html: featuredImageCaption }}
              />
            )}
          </figure>
        )}

        {/* 6. Post TipTap Content */}
        <main className="text-[#232536] leading-relaxed prose max-w-none">
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
                <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-bold text-[#232536] group-hover:text-[#EF5B45] transition-colors">
                  {relatedPost.title}
                </h3>
                {relatedPost.excerpt && (
                  <p className="text-sm text-[#5A5D70] line-clamp-2 leading-relaxed">
                    {relatedPost.excerpt}
                  </p>
                )}
              </div>
              {relatedPost.featured_image_url ? (
                <div className="w-full sm:w-36 h-28 flex-shrink-0 rounded-2xl overflow-hidden bg-black/5 border border-[#F5ECDE]">
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
  )
}
