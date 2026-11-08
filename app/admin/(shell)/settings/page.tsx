import React from 'react'
import Link from 'next/link'
import { ShieldCheck, ArrowRight } from 'lucide-react'
import { SettingsIcon } from '@/components/admin/icons'

export default function SettingsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <h1 className="text-base font-bold text-gray-900">Settings &amp; Configuration</h1>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 sm:px-10 py-8 space-y-6">
        {/* Security & 2FA Card */}
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#EF5B45]/10 text-[#EF5B45] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Two-step verification (TOTP)
              </h2>
              <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                Protect your admin console with authenticator apps. Register your primary phone and a backup device.
              </p>
            </div>
          </div>

          <Link
            href="/admin/security"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition shadow-sm shrink-0"
          >
            <span>Manage Two-step verification</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* General Settings Placeholder */}
        <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-center">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl mx-auto mb-3 text-gray-600">
            <SettingsIcon size={20} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">
            Publication &amp; Integration Settings
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
            Manage publication metadata, API integrations, Unsplash credentials, email templates, and environment settings.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[11px] font-semibold">
            <span>⏳</span>
            <span>Scheduled for Settings Sprint</span>
          </div>
        </div>
      </main>
    </div>
  )
}
