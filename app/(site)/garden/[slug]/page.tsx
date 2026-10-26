import type { Metadata } from 'next'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import ArticleView, { RelatedPostData, ArticleSeriesContext } from '@/components/public/ArticleView'
import TeaserArticleView from '@/components/public/TeaserArticleView'
import { getPostTeaser } from '@/lib/postTeaser'
import { notFound } from 'next/navigation'

import { getPostDescription, formatDescription, DEFAULT_SITE_DESCRIPTION } from '@/lib/postDescription'
import { SITE_URL } from '@/lib/siteUrl'
import JsonLd from '@/components/seo/JsonLd'

export const dynamic = 'force-dynamic'

interface GardenPostPageProps {
  params: Promise<{ slug: string }>
}

function buildArticleJsonLd({
  title,
  slug,
  excerpt,
  publishedAt,
  updatedAt,
  featuredImageUrl,
  isPublic,
}: {
  title: string
  slug: string
  excerpt?: string | null
  publishedAt?: string | null
  updatedAt?: string | null
  featuredImageUrl?: string | null
  isPublic: boolean
}) {
  const url = `${SITE_URL}/garden/${slug}`
  const personId = `${SITE_URL}/#person`

  // For members-only posts use the excerpt only, or a generic description if no excerpt.
  // NEVER put article body text, first paragraph or teaser text into JSON-LD.
  const description =
    excerpt && excerpt.trim()
      ? formatDescription(excerpt)
      : DEFAULT_SITE_DESCRIPTION

  const articleJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    url,
    author: {
      '@type': 'Person',
      '@id': personId,
      name: 'Ivan Kabandize',
    },
    publisher: {
      '@type': 'Person',
      '@id': personId,
      name: 'Ivan Kabandize',
    },
  }

  if (publishedAt) {
    articleJsonLd.datePublished = publishedAt
    articleJsonLd.dateModified = updatedAt || publishedAt
  }

  if (featuredImageUrl) {
    articleJsonLd.image = featuredImageUrl
  }

  if (!isPublic) {
    articleJsonLd.isAccessibleForFree = false
  }

  return articleJsonLd
}

export async function generateMetadata({ params }: GardenPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const adminClient = createAdminClient()
  const now = new Date().toISOString()

  // SECURITY RULE: select only whitelisted fields, never select content.
  const { data: post } = await adminClient
    .from('posts')
    .select('id, slug, title, excerpt, published_at, updated_at, featured_image_url, visibility, publish_status')
    .eq('slug', slug)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .maybeSingle()

  let targetPost = post
  if (!targetPost) {
    const teaser = await getPostTeaser(slug)
    if (teaser) {
      targetPost = {
        id: teaser.id,
        slug: teaser.slug,
        title: teaser.title,
        excerpt: teaser.excerpt,
        published_at: teaser.published_at,
        updated_at: null,
        featured_image_url: teaser.featured_image_url,
        visibility: teaser.visibility,
        publish_status: 'published',
      }
    }
  }

  if (!targetPost) {
    return {
      title: 'Post Not Found',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const isPublic = targetPost.visibility === 'public'
  const description = await getPostDescription(targetPost)
  const ogImages = targetPost.featured_image_url ? [{ url: targetPost.featured_image_url }] : undefined

  return {
    title: {
      absolute: `${targetPost.title} - Ivan Kabandize`,
    },
    description,
    alternates: {
      canonical: `${SITE_URL}/garden/${targetPost.slug}`,
    },
    openGraph: {
      title: `${targetPost.title} - Ivan Kabandize`,
      description,
      type: 'article',
      url: `${SITE_URL}/garden/${targetPost.slug}`,
      publishedTime: targetPost.published_at || undefined,
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${targetPost.title} - Ivan Kabandize`,
      description,
      images: targetPost.featured_image_url ? [targetPost.featured_image_url] : undefined,
    },
    ...(isPublic
      ? {}
      : {
          robots: {
            index: false,
            follow: false,
          },
        }),
  }
}

export default async function GardenPostPage({ params }: GardenPostPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Query post by slug - RLS restricts anon users to visibility='public' AND publish_status='published'
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, title, slug, content, excerpt, published_at, updated_at, visibility, content_type, featured_image_url, header_image_width, series_id, post_tags(tag:tags(name, slug))')
    .eq('slug', slug)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .maybeSingle()

  if (error || !post) {
    const teaser = await getPostTeaser(slug)
    if (!teaser) {
      notFound()
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const isUpgrade = Boolean(user)

    const teaserJsonLd = buildArticleJsonLd({
      title: teaser.title,
      slug: teaser.slug,
      excerpt: teaser.excerpt,
      publishedAt: teaser.published_at,
      updatedAt: null,
      featuredImageUrl: teaser.featured_image_url,
      isPublic: teaser.visibility === 'public',
    })

    return (
      <>
        <JsonLd data={teaserJsonLd} />
        <TeaserArticleView teaser={teaser} isUpgrade={isUpgrade} />
      </>
    )
  }

  // Fetch series context if post belongs to a series
  let seriesContext: ArticleSeriesContext | null = null
  if (post.series_id) {
    const now = new Date().toISOString()
    const { data: seriesData } = await supabase
      .from('series')
      .select('id, title, slug, status')
      .eq('id', post.series_id)
      .maybeSingle()

    if (seriesData) {
      // Query published siblings in published_at ascending order
      const { data: siblings } = await supabase
        .from('posts')
        .select('id, title, slug, published_at')
        .eq('series_id', post.series_id)
        .eq('publish_status', 'published')
        .not('published_at', 'is', null)
        .lte('published_at', now)
        .order('published_at', { ascending: true })

      if (siblings && siblings.length > 0) {
        const currentIndex = siblings.findIndex((s) => s.id === post.id)
        if (currentIndex !== -1) {
          seriesContext = {
            series: seriesData,
            partNumber: currentIndex + 1,
            totalParts: siblings.length,
            prevPost:
              currentIndex > 0
                ? { title: siblings[currentIndex - 1].title, slug: siblings[currentIndex - 1].slug }
                : null,
            nextPost:
              currentIndex < siblings.length - 1
                ? { title: siblings[currentIndex + 1].title, slug: siblings[currentIndex + 1].slug }
                : null,
          }
        }
      }
    }
  }

  // Fetch a related/recent post for the optional "You might have missed" bookmark card
  const { data: relatedPosts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, content_type, featured_image_url')
    .neq('slug', slug)
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(1)

  const relatedPost = (relatedPosts && relatedPosts.length > 0 ? relatedPosts[0] : null) as RelatedPostData | null

  const postJsonLd = buildArticleJsonLd({
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    publishedAt: post.published_at,
    updatedAt: post.updated_at,
    featuredImageUrl: post.featured_image_url,
    isPublic: post.visibility === 'public',
  })

  return (
    <>
      <JsonLd data={postJsonLd} />
      <ArticleView post={post} relatedPost={relatedPost} seriesContext={seriesContext} />
    </>
  )
}
