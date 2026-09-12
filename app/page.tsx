import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageData {
  slug: string
  hero_headline: string | null
  hero_subheadline: string | null
  trust_bar_entities: Array<{ name: string; logo?: string }> | string[] | null
  testimonials: Array<{ quote: string; author: string; role?: string }> | null
  cta_text: string | null
  cta_url: string | null
}

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch page content from Supabase
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'homepage')
    .maybeSingle()

  // Fetch latest public published posts (RLS enforces visibility='public' AND publish_status='published')
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, post_tags(tag:tags(name, slug))')
    .order('published_at', { ascending: false })
    .limit(3)

  const headline = page?.hero_headline || 'Building Systems, Sharing Knowledge, Crafting Digital Experiences'
  const subheadline = page?.hero_subheadline || 'Explore articles on technology, design, productivity, and structured systems.'
  const ctaText = page?.cta_text || 'Explore Articles'
  const ctaUrl = page?.cta_url || '/blog'
  
  const trustEntities: string[] = Array.isArray(page?.trust_bar_entities)
    ? (page.trust_bar_entities as Array<any>).map((e: any) => (typeof e === 'string' ? e : e?.name || ''))
    : ['Trusted by innovative teams & creators', 'Global reach', 'Modern engineering']

  const testimonials: Array<{ quote: string; author: string; role?: string }> = Array.isArray(page?.testimonials)
    ? (page.testimonials as Array<any>)
    : [
        {
          quote: "Ivan's systematic approach brings absolute clarity and execution speed to complex projects.",
          author: "Collaborator & Partner",
          role: "Engineering Lead"
        }
      ]

  return (
    <div className="flex flex-col min-h-full font-sans">
      {/* Hero Section */}
      <section className="py-20 md:py-28 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left">
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-3">
            Portfolio & Insights
          </p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-[1.15] mb-6">
            {headline}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed mb-8">
            {subheadline}
          </p>
          <div className="flex flex-wrap gap-4 items-center justify-center sm:justify-start">
            <Link
              href={ctaUrl}
              className="px-6 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition text-sm"
            >
              {ctaText}
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 rounded-full border border-gray-200 text-gray-800 font-medium hover:border-black transition text-sm"
            >
              About Ivan
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bar Section */}
      {trustEntities.length > 0 && (
        <section className="py-8 bg-gray-50/50 border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-6 text-xs uppercase tracking-wider font-semibold text-gray-400">
              {trustEntities.map((entity, i) => (
                <span key={i} className="hover:text-gray-600 transition">
                  {entity}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Latest Articles Section */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Latest Articles</h2>
              <p className="text-sm text-gray-500 mt-1">Thoughts, essays, and technical breakdowns.</p>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-black hover:underline">
              View all &rarr;
            </Link>
          </div>

          {posts && posts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <article key={post.id} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <time dateTime={post.published_at || ''}>
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recent'}
                    </time>
                    {post.post_tags && post.post_tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex gap-2">
                          {(post.post_tags as any[]).map((pt: any, idx: number) => (
                            <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">
                              {pt.tag?.name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <Link href={`/blog/${post.slug}`} className="group">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-600 transition">
                      {post.title}
                    </h3>
                  </Link>
                  {post.excerpt && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center bg-gray-50 rounded-xl border border-gray-100 text-gray-500 text-sm">
              Articles will appear here once published.
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-8 text-center">
              Testimonials & Feedback
            </h2>
            <div className="grid gap-6 md:grid-cols-1">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
                  <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                    {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
