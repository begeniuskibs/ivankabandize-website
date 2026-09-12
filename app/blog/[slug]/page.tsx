import { createClient } from '@/utils/supabase/server'
import TipTapRenderer from '@/components/editor/TipTapRenderer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Query post by slug — RLS restricts anon users to visibility='public' AND publish_status='published'
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, content, excerpt, published_at, post_tags(tag:tags(name, slug))')
    .eq('slug', slug)
    .maybeSingle()

  if (error || !post) {
    notFound()
  }

  return (
    <article className="min-h-full font-sans py-16 md:py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-xs uppercase tracking-wider font-semibold text-gray-400 hover:text-black transition"
          >
            &larr; Back to Articles
          </Link>
        </div>

        {/* Post Metadata & Title */}
        <header className="mb-12 border-b border-gray-100 pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 mb-4">
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

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-[1.2] mb-6">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="text-xl text-gray-600 leading-relaxed font-light">
              {post.excerpt}
            </p>
          )}
        </header>

        {/* Post TipTap Content */}
        <main className="text-gray-800 leading-relaxed">
          <TipTapRenderer content={post.content || {}} />
        </main>
      </div>
    </article>
  )
}
