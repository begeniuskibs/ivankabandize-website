import { createClient } from '@/utils/supabase/server'
import TipTapRenderer from '@/components/editor/TipTapRenderer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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

  // Query post by slug — RLS restricts anon users to visibility='public' AND publish_status='published'
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, content, excerpt, published_at, content_type, post_tags(tag:tags(name, slug))')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !post) {
    notFound()
  }

  const typeInfo = post.content_type && TYPE_CONFIG[post.content_type] ? TYPE_CONFIG[post.content_type] : null

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

        {/* Post Metadata & Header */}
        <header className="mb-12 border-b border-[#F5ECDE] pb-10">
          <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
            {typeInfo && (
              <Link
                href={typeInfo.href}
                className={`font-bold uppercase tracking-wider px-3 py-1 rounded-full border text-[11px] hover:opacity-80 transition ${typeInfo.badgeColor}`}
              >
                {typeInfo.label}
              </Link>
            )}

            {post.post_tags && post.post_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(post.post_tags as any[]).map((pt: any, idx: number) => (
                  <span
                    key={idx}
                    className="bg-white text-[#2AA198] border border-[#F5ECDE] px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                  >
                    {pt.tag?.name}
                  </span>
                ))}
              </div>
            )}

            <span className="text-[#5A5D70]">•</span>

            <time dateTime={post.published_at || ''} className="text-[#5A5D70] font-medium">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Recently published'}
            </time>
          </div>

          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl font-semibold text-[#232536] leading-[1.2] mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-lg sm:text-xl text-[#5A5D70] leading-relaxed font-light">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Post TipTap Content */}
        <main className="text-[#232536] leading-relaxed prose max-w-none">
          <TipTapRenderer content={post.content || {}} />
        </main>
      </div>
    </article>
  )
}
