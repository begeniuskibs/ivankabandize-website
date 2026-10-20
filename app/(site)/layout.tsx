import React from 'react'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import BackToTop from '@/components/public/BackToTop'
import { Analytics } from '@vercel/analytics/next'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
      <Analytics />
    </>
  )
}
