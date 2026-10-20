import type { Metadata } from 'next'
import NotFoundContent from '@/components/public/NotFoundContent'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return <NotFoundContent />
}
