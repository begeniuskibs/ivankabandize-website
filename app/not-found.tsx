import type { Metadata } from 'next'
import Link from 'next/link'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'

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
      <main className="flex-1 flex items-center justify-center bg-[#FDF8F1] px-4 sm:px-6 py-20 sm:py-28 font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
        <div className="max-w-lg w-full text-center space-y-6">
          <p className="text-xs uppercase font-mono tracking-widest text-[#CF3F29] font-bold">
            404
          </p>
          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#232536] tracking-tight leading-tight">
            This page has wandered off.
          </h1>
          <p className="text-base sm:text-lg text-[#5A5D70] leading-relaxed max-w-md mx-auto">
            The link you followed may be broken, or the page may have been moved or retired.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#CF3F29] hover:bg-[#b83420] text-white text-sm font-semibold transition active:scale-[0.98] shadow-sm text-center"
            >
              Go home
            </Link>
            <Link
              href="/garden"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white border border-[#F0E4D2] hover:bg-[#FAF3E8] text-[#232536] text-sm font-semibold transition active:scale-[0.98] shadow-sm text-center"
            >
              Browse the Garden
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
