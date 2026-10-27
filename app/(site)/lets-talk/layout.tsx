import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/siteUrl'

export const metadata: Metadata = {
  title: "Let's Talk",
  description:
    'Get in touch with Ivan Kabandize regarding advisory work, operational challenges or speaking engagements.',
  alternates: {
    canonical: `${SITE_URL}/lets-talk`,
  },
}

export default function LetsTalkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
