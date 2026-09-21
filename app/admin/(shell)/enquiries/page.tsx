'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { INQUIRY_STATUSES, type InquiryStatus } from '@/lib/inquiries'

interface InquiryRecord {
  id: string
  name: string
  email: string
  organisation: string | null
  problem: string
  help_type: string | null
  timing: string | null
  status: InquiryStatus
  created_at: string
  notified_at: string | null
  notify_error: string | null
}

type StatusTab = 'all' | InquiryStatus

function formatRelativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return 'just now'
    if (diffMins === 1) return '1 min ago'
    if (diffMins < 60) return `${diffMins} mins ago`
    if (diffHours === 1) return '1 hour ago'
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    })
  } catch {
    return dateStr
  }
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<InquiryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryRecord | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [editStatus, setEditStatus] = useState<InquiryStatus>('new')

  useEffect(() => {
    fetchEnquiries()
  }, [])

  async function fetchEnquiries() {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/enquiries')
      if (res.ok) {
        const data = await res.json()
        setEnquiries(data.enquiries || [])
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Failed to load enquiries')
      }
    } catch {
      setError('Network error fetching enquiries')
    } finally {
      setLoading(false)
    }
  }

  function handleSelect(inq: InquiryRecord) {
    setSelectedInquiry(inq)
    setEditStatus(inq.status)
  }

  async function updateInquiryStatus(newStatus: InquiryStatus) {
    if (!selectedInquiry) return
    try {
      setUpdatingStatus(true)
      const res = await fetch('/api/admin/enquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedInquiry.id, status: newStatus }),
      })

      if (res.ok) {
        const data = await res.json()
        const updated = data.inquiry as InquiryRecord
        setEnquiries((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        )
        setSelectedInquiry(updated)
        setEditStatus(updated.status)
      } else {
        const data = await res.json().catch(() => ({}))
        alert(data.error || 'Failed to update status')
      }
    } catch {
      alert('Network error updating status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter((item) => {
      const matchesTab = statusTab === 'all' ? true : item.status === statusTab
      if (!matchesTab) return false

      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase().trim()
      const matchName = item.name.toLowerCase().includes(q)
      const matchEmail = item.email.toLowerCase().includes(q)
      const matchOrg = item.organisation?.toLowerCase().includes(q) || false
      return matchName || matchEmail || matchOrg
    })
  }, [enquiries, statusTab, searchQuery])

  const counts = useMemo(() => {
    return {
      all: enquiries.length,
      new: enquiries.filter((e) => e.status === 'new').length,
      replied: enquiries.filter((e) => e.status === 'replied').length,
      closed: enquiries.filter((e) => e.status === 'closed').length,
    }
  }, [enquiries])

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900">Enquiries</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {enquiries.length} total
          </span>
          {counts.new > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#EF5B45] text-white">
              {counts.new} new
            </span>
          )}
        </div>

        {/* Search Input */}
        <div className="w-72">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name, org, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#EF5B45] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-6 sm:px-10 py-8 flex-1 flex gap-8 items-start">
        <div className="flex-1 min-w-0">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-3 overflow-x-auto">
            {(['all', 'new', 'replied', 'closed'] as const).map((tab) => {
              const isActive = statusTab === tab
              const label = tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)
              const count = counts[tab]

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-[#191A23] text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Error Notification */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : enquiries.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <span className="text-3xl block mb-2">📬</span>
              <p className="text-gray-500 text-sm font-medium">No enquiries yet.</p>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <p className="text-gray-500 text-sm font-medium">
                No enquiries match your search or filter.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="divide-y divide-gray-100">
                {filteredEnquiries.map((inq) => {
                  const isSelected = selectedInquiry?.id === inq.id
                  const isEmailMissing = !inq.notified_at

                  return (
                    <div
                      key={inq.id}
                      onClick={() => handleSelect(inq)}
                      className={`p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#FDF8F1] border-l-4 border-l-[#EF5B45]'
                          : 'hover:bg-gray-50/80'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          {/* Status Chip */}
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                              inq.status === 'new'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200 font-extrabold'
                                : inq.status === 'replied'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}
                          >
                            {inq.status}
                          </span>

                          {/* Email warning badge */}
                          {isEmailMissing && (
                            <span
                              title={inq.notify_error || 'Email notification failed'}
                              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1"
                            >
                              <span>⚠️</span>
                              <span>Email not sent</span>
                            </span>
                          )}

                          <h3 className="text-sm font-bold text-gray-900 truncate">
                            {inq.name}
                          </h3>

                          {inq.organisation && (
                            <span className="text-xs text-gray-500 font-medium">
                              ({inq.organisation})
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span title={new Date(inq.created_at).toUTCString()} className="text-gray-400">
                            {formatRelativeTime(inq.created_at)}
                          </span>

                          {inq.help_type && (
                            <>
                              <span>&bull;</span>
                              <span className="text-gray-700 font-medium">
                                {inq.help_type}
                              </span>
                            </>
                          )}

                          {inq.timing && (
                            <>
                              <span>&bull;</span>
                              <span className="text-gray-500">
                                {inq.timing}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-semibold text-[#EF5B45] transition flex items-center gap-1">
                          <span>View</span>
                          <span>&rarr;</span>
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Side Panel: Detail View */}
        {selectedInquiry && (
          <aside className="w-[420px] bg-white border border-gray-200 rounded-2xl p-6 shadow-xl shrink-0 sticky top-24 space-y-6 animate-in fade-in slide-in-from-right-3 duration-150">
            {/* Header: Name, Organisation, Close button */}
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {selectedInquiry.name}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedInquiry.organisation || 'No organisation specified'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInquiry(null)}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center text-xs transition cursor-pointer"
                title="Close panel"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Control Bar */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  Status
                </span>
                {selectedInquiry.status !== 'replied' && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => updateInquiryStatus('replied')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition border border-emerald-200 cursor-pointer disabled:opacity-50"
                  >
                    ✓ Mark as replied
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as InquiryStatus)}
                  className="flex-1 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:border-[#EF5B45]"
                >
                  {INQUIRY_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </option>
                  ))}
                </select>

                {editStatus !== selectedInquiry.status && (
                  <button
                    type="button"
                    disabled={updatingStatus}
                    onClick={() => updateInquiryStatus(editStatus)}
                    className="px-3 py-1.5 bg-[#191A23] hover:bg-black text-white text-xs font-bold rounded-lg shadow-sm transition cursor-pointer disabled:opacity-50"
                  >
                    {updatingStatus ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>

            {/* Notification Status Alert */}
            {!selectedInquiry.notified_at ? (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-800">
                  <span>⚠️</span>
                  <span>Email Notification Not Sent</span>
                </div>
                {selectedInquiry.notify_error && (
                  <p className="text-[11px] text-red-700 font-mono break-words">
                    {selectedInquiry.notify_error}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-1.5">
                <span>✓</span>
                <span>Notified on {new Date(selectedInquiry.notified_at).toLocaleDateString()}</span>
              </div>
            )}

            {/* Fields Grid */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">
                  Email
                </span>
                <a
                  href={`mailto:${selectedInquiry.email}`}
                  className="text-blue-600 hover:underline font-semibold mt-0.5 inline-block"
                >
                  {selectedInquiry.email} ↗
                </a>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">
                    Type of Help
                  </span>
                  <p className="text-gray-900 font-medium mt-0.5">
                    {selectedInquiry.help_type || '—'}
                  </p>
                </div>

                <div>
                  <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">
                    Timing
                  </span>
                  <p className="text-gray-900 font-medium mt-0.5">
                    {selectedInquiry.timing || '—'}
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <span className="font-bold text-gray-400 uppercase tracking-wider block text-[10px]">
                  Received At
                </span>
                <p className="text-gray-700 mt-0.5" title={selectedInquiry.created_at}>
                  {new Date(selectedInquiry.created_at).toLocaleString()} ({formatRelativeTime(selectedInquiry.created_at)})
                </p>
              </div>
            </div>

            {/* Message Body (Plain text with line breaks, never HTML) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <span className="font-bold text-gray-500 uppercase tracking-wider block text-[10px]">
                What&rsquo;s Not Working (Message)
              </span>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 leading-relaxed whitespace-pre-wrap font-sans max-h-72 overflow-y-auto selection:bg-[#F7C55C]">
                {selectedInquiry.problem}
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  )
}
