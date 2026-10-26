import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SITE_URL } from '@/lib/siteUrl'

interface BlogPostRedirectProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: BlogPostRedirectProps): Promise<Metadata> {
  const { slug } = await params
  return {
    alternates: {
      canonical: `${SITE_URL}/garden/${slug}`,
    },
  }
}

export default async function BlogPostRedirectPage({ params }: BlogPostRedirectProps) {
  const { slug } = await params
  redirect(`/garden/${slug}`)
}
