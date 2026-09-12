import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  const supabase = await createClient()

  // Query posts table directly — relying on Supabase RLS to filter to visibility='public' AND publish_status='published'
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, visibility, publish_status, post_tags(tag:tags(name, slug))')
    .order('published_at', { ascending: false })

  return (
    <div className="flex flex-col min-h-full font-sans">
      {/* Header */}
      <section className="py-16 md:py-20 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-2">
            Writing & Insights
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-tight mb-4">
            Articles
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Essays, reflections, and deep dives on software architecture, systems thinking, and development workflows.
          </p>
        </div>
      </section>

      {/* Articles Listing */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm mb-6">
              Failed to load articles: {error.message}
            </div>
          )}

          {posts && posts.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {posts.map((post) => (
                <article key={post.id} className="py-8 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-2">
                    <time dateTime={post.published_at || ''}>
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Recently published'}
                    </time>
                    {post.post_tags && post.post_tags.length > 0 && (
                      <>
                        <span>•</span>
                        <div className="flex flex-wrap gap-2">
                          {(post.post_tags as any[]).map((pt: any, idx: number) => (
                            <span
                              key={idx}
                              className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium"
                            >
                              {pt.tag?.name}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  <Link href={`/blog/${post.slug}`} className="group">
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-gray-600 transition mb-2">
                      {post.title}
                    </h2>
                  </Link>

                  {post.excerpt && (
                    <p className="text-gray-600 text-base leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}

                  <div className="mt-4">
                    <Link
                      href={`/blog/${post.slug}`}
                      className="text-sm font-semibold text-black hover:underline"
                    >
                      Read article &rarr;
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-gray-600 font-medium">No published articles yet.</p>
              <p className="text-sm text-gray-400 mt-1">Check back soon for new insights and essays.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
