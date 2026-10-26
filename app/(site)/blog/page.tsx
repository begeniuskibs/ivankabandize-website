import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { SITE_URL } from '@/lib/siteUrl'

export const metadata: Metadata = {
  title: 'Blog',
  alternates: {
    canonical: `${SITE_URL}/garden`,
  },
}

export default function BlogRedirectPage() {
  redirect('/garden')
}
