'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertCircle, X } from 'lucide-react'
import {
  INTENDED_USE_OPTIONS,
  type DownloadsFilterParams,
} from '@/lib/adminDownloads'

interface ResourceOption {
  id: string
  title: string
}

interface DownloadsFiltersProps {
  resources: ResourceOption[]
  filters: DownloadsFilterParams
}

function buildFilterUrl(params: {
  resource?: string
  use?: string
  from?: string
  to?: string
  q?: string
}): string {
  const p = new URLSearchParams()
  if (params.resource && params.resource !== 'all') {
    p.set('resource', params.resource)
  }
  if (params.use) {
    p.set('use', params.use)
  }
  if (params.from) {
    p.set('from', params.from)
  }
  if (params.to) {
    p.set('to', params.to)
  }
  const trimmed = (params.q || '').trim()
  if (trimmed) {
    p.set('q', trimmed)
  }
  const qStr = p.toString()
  return qStr ? `/admin/downloads?${qStr}` : '/admin/downloads'
}

export default function DownloadsFilters({
  resources,
  filters,
}: DownloadsFiltersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [searchQuery, setSearchQuery] = useState(filters.q || '')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Keep local search input in sync if URL query changes externally
  useEffect(() => {
    setSearchQuery(filters.q || '')
  }, [filters.q])

  // Cleanup pending debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  function applyFilters(overrides: {
    resource?: string
    use?: string
    from?: string
    to?: string
    q?: string
  }) {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    const currentResource =
      overrides.resource !== undefined
        ? overrides.resource
        : (filters.resource || 'all')
    const currentUse =
      overrides.use !== undefined ? overrides.use : (filters.use || '')
    const currentFrom =
      overrides.from !== undefined ? overrides.from : (filters.from || '')
    const currentTo =
      overrides.to !== undefined ? overrides.to : (filters.to || '')
    const currentQ = overrides.q !== undefined ? overrides.q : searchQuery

    const targetUrl = buildFilterUrl({
      resource: currentResource,
      use: currentUse,
      from: currentFrom,
      to: currentTo,
      q: currentQ,
    })

    startTransition(() => {
      router.replace(targetUrl)
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      applyFilters({ q: val })
    }, 400)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      applyFilters({ q: searchQuery })
    }
  }

  const handleClear = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    setSearchQuery('')
    startTransition(() => {
      router.replace('/admin/downloads')
    })
  }

  const hasActiveFilters = Boolean(
    (filters.resource && filters.resource !== 'all') ||
      filters.use ||
      filters.from ||
      filters.to ||
      filters.q ||
      searchQuery.trim()
  )

  return (
    <form
      method="GET"
      action="/admin/downloads"
      onSubmit={(e) => e.preventDefault()}
      className="bg-white border border-gray-200 rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-3"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Resource Filter */}
        <div>
          <label
            htmlFor="filter-resource"
            className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1"
          >
            Resource
          </label>
          <select
            id="filter-resource"
            name="resource"
            value={filters.resource || 'all'}
            onChange={(e) => applyFilters({ resource: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#EF5B45] transition cursor-pointer"
          >
            <option value="all">All resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>

        {/* Intended Use Filter */}
        <div>
          <label
            htmlFor="filter-use"
            className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1"
          >
            Intended Use
          </label>
          <select
            id="filter-use"
            name="use"
            value={filters.use || ''}
            onChange={(e) => applyFilters({ use: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#EF5B45] transition cursor-pointer"
          >
            <option value="">All intended uses</option>
            {INTENDED_USE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <label
            htmlFor="filter-from"
            className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1"
          >
            From
          </label>
          <input
            type="date"
            id="filter-from"
            name="from"
            value={filters.from || ''}
            onChange={(e) => applyFilters({ from: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#EF5B45] transition"
          />
        </div>

        {/* Date To */}
        <div>
          <label
            htmlFor="filter-to"
            className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1"
          >
            To
          </label>
          <input
            type="date"
            id="filter-to"
            name="to"
            value={filters.to || ''}
            onChange={(e) => applyFilters({ to: e.target.value })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#EF5B45] transition"
          />
        </div>

        {/* Search query */}
        <div>
          <label
            htmlFor="filter-q"
            className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1"
          >
            Search
          </label>
          <input
            type="text"
            id="filter-q"
            name="q"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            placeholder="Name or email..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#EF5B45] transition"
          />
        </div>
      </div>

      {/* Rejection notice if odd characters entered */}
      {filters.isSearchRejected && (
        <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <AlertCircle size={14} className="shrink-0" />
          <span>
            Search query contained unsupported characters and was safely ignored.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 min-h-[32px]">
        <div className="text-xs text-gray-500">
          {hasActiveFilters && (
            <Link
              href="/admin/downloads"
              onClick={(e) => {
                e.preventDefault()
                handleClear()
              }}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-900 transition"
            >
              <X size={12} />
              <span>Clear filters</span>
            </Link>
          )}
        </div>
        {isPending && (
          <span className="text-xs text-gray-400 font-medium animate-pulse flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#EF5B45]" />
            <span>Updating...</span>
          </span>
        )}
      </div>
    </form>
  )
}
