'use client'

import React, { useState, use } from 'react'
import Link from 'next/link'

interface PreviewShellProps {
  params: Promise<{ id: string }>
}

export default function PostPreviewShellPage({ params }: PreviewShellProps) {
  const { id } = use(params)
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop')

  return (
    <div className="min-h-screen bg-[#F5F5F4] flex flex-col font-sans">
      {/* Top Header / Control Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm">
        {/* Left: Navigation & Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/posts/editor?id=${id}`}
            className="text-xs font-semibold text-gray-600 hover:text-gray-900 transition flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <span>&larr;</span>
            <span>Back to editor</span>
          </Link>
          <div className="h-4 w-[1px] bg-gray-200" />
          <h1 className="text-sm font-bold text-gray-900">Preview</h1>
          <span className="hidden sm:inline-block text-xs text-[#5A5D70] bg-gray-100 px-2 py-0.5 rounded-md">
            Shows the last saved version
          </span>
        </div>

        {/* Center: Device Toggle & Email Tab */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
          <button
            type="button"
            onClick={() => setDeviceView('desktop')}
            aria-pressed={deviceView === 'desktop'}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              deviceView === 'desktop'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDeviceView('mobile')}
            aria-pressed={deviceView === 'mobile'}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              deviceView === 'mobile'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            <span>Mobile</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-300 mx-0.5" />

          <button
            type="button"
            disabled
            title="Comes with newsletters"
            className="px-3 py-1 text-xs font-semibold text-gray-400 cursor-not-allowed opacity-60 rounded-lg flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>Email</span>
          </button>
        </div>

        {/* Right placeholder for balance */}
        <div className="w-20 hidden sm:block" />
      </header>

      {/* Main Preview Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-auto">
        {deviceView === 'desktop' ? (
          <div className="w-full max-w-[1280px] h-[calc(100vh-5rem)] bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <iframe
              src={`/preview/${id}`}
              title="Desktop Article Preview"
              className="w-full h-full border-0"
            />
          </div>
        ) : (
          <div className="w-[390px] h-[844px] bg-white rounded-[40px] shadow-2xl border-[8px] border-gray-800 overflow-hidden my-4">
            <iframe
              src={`/preview/${id}`}
              title="Mobile Article Preview"
              className="w-full h-full border-0"
            />
          </div>
        )}
      </main>
    </div>
  )
}
