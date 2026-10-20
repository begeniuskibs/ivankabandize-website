import type { Metadata } from 'next'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import NotFoundContent from '@/components/public/NotFoundContent'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: {
    index: false,
    follow: false,
  },
}

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">
        <NotFoundContent />
      </main>
      <Footer />
    </>
  )
}
