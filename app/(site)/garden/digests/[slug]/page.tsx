import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDigestBySlug, DIGESTS } from '@/lib/digests'
import DigestView from '@/components/public/digests/DigestView'
import { SITE_URL } from '@/lib/siteUrl'
import { digestKindSingularLabel } from '@/lib/digestUi'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return DIGESTS.map((d) => ({
    slug: d.slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const digest = getDigestBySlug(slug)

  if (!digest) {
    return {
      title: 'Digest Not Found - The Garden',
    }
  }

  const kindLabel = digestKindSingularLabel(digest.kind)
  const metaTitle = `${digest.title} - ${kindLabel}`

  return {
    title: metaTitle,
    description: digest.lead,
    alternates: {
      canonical: `${SITE_URL}/garden/digests/${digest.slug}`,
    },
    openGraph: {
      title: metaTitle,
      description: digest.lead,
      url: `${SITE_URL}/garden/digests/${digest.slug}`,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: digest.lead,
    },
  }
}

export default async function DigestDetailPage({ params }: PageProps) {
  const { slug } = await params
  const digest = getDigestBySlug(slug)

  if (!digest) {
    notFound()
  }

  return <DigestView slug={digest.slug} />
}
