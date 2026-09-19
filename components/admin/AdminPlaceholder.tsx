import React from 'react'
import Link from 'next/link'

export default function AdminPlaceholder({
  title,
  description,
  icon,
  futureSprint,
}: {
  title: string
  description: string
  icon: string
  futureSprint?: string
}) {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">{title}</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 sm:px-10 py-16 flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl mb-6 shadow-sm">
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-semibold mb-8">
          <span>⏳</span>
          <span>{futureSprint || 'Coming in a future sprint'}</span>
        </div>
        <div>
          <Link
            href="/admin/pages"
            className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition shadow-sm"
          >
            &larr; Back to Pages
          </Link>
        </div>
      </main>
    </div>
  )
}
