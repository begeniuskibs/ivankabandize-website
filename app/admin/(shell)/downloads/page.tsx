import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Download, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import {
  calculateDownloadsSummary,
  calculatePerResourceStats,
  parseDownloadsFilterParams,
  formatDownloadDateTime,
  formatResourceKind,
  formatShortError,
  getIntendedUseLabel,
  buildDownloadsExportHref,
} from '@/lib/adminDownloads'
import DownloadsFilters from '@/components/admin/DownloadsFilters'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Downloads - Admin Console',
  robots: {
    index: false,
    follow: false,
  },
}

interface PageProps {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}

const PAGE_SIZE = 25

export default async function AdminDownloadsPage({ searchParams }: PageProps) {
  const { supabase, user, isOwner } = await getAuthenticatedOwner({ checkMfa: false })

  if (!user) {
    redirect(
      '/login?redirectTo=/admin/downloads&error=Please+sign+in+to+access+the+Admin+Console'
    )
  }

  if (!isOwner) {
    redirect(
      '/auth/account?error=Access+restricted.+Owner+privileges+required+for+Admin+Console.'
    )
  }

  const rawParams = (await searchParams) || {}
  const filters = parseDownloadsFilterParams(rawParams)

  // 1. Fetch all resources for dropdown and stats
  const { data: resourcesData } = await supabase
    .from('resources')
    .select('id, title, kind, status')
    .order('title')

  const resources = resourcesData || []

  // 2. Fetch lightweight summary rows for top stats and per-resource totals
  const { data: allSummaryRows } = await supabase
    .from('resource_downloads')
    .select('id, resource_id, created_at, email, email_sent_at, email_error')

  const summary = calculateDownloadsSummary(allSummaryRows || [])
  const perResourceStats = calculatePerResourceStats(resources, allSummaryRows || [])

  // 3. Query paginated and filtered download records
  let logQuery = supabase
    .from('resource_downloads')
    .select(
      `
      id,
      resource_id,
      name,
      email,
      anonymised_at,
      intended_use,
      email_sent_at,
      email_error,
      created_at,
      resource:resources(id, title, kind)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  if (filters.resource) {
    logQuery = logQuery.eq('resource_id', filters.resource)
  }

  if (filters.use) {
    if (filters.use === 'none') {
      logQuery = logQuery.is('intended_use', null)
    } else {
      logQuery = logQuery.eq('intended_use', filters.use)
    }
  }

  if (filters.from) {
    logQuery = logQuery.gte('created_at', `${filters.from}T00:00:00.000Z`)
  }

  if (filters.to) {
    logQuery = logQuery.lte('created_at', `${filters.to}T23:59:59.999Z`)
  }

  if (filters.q) {
    logQuery = logQuery.or(`name.imatch.${filters.q},email.imatch.${filters.q}`)
  }

  const fromOffset = (filters.page - 1) * PAGE_SIZE
  const toOffset = fromOffset + PAGE_SIZE - 1
  logQuery = logQuery.range(fromOffset, toOffset)

  const { data: logRows, count: totalFilteredCount, error: logError } = await logQuery

  if (logError) {
    // Note: Never log personal emails or names
    console.error('[admin/downloads] Query error:', logError.message)
  }

  const downloads = logRows || []
  const totalCount = totalFilteredCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const isCapped = totalCount > 5000

  const exportHref = buildDownloadsExportHref({
    resource: filters.resource,
    use: filters.use,
    from: filters.from,
    to: filters.to,
    q: filters.q,
  })

  function buildPageHref(targetPage: number): string {
    const p = new URLSearchParams()
    if (filters.resource) p.set('resource', filters.resource)
    if (filters.use) p.set('use', filters.use)
    if (filters.from) p.set('from', filters.from)
    if (filters.to) p.set('to', filters.to)
    if (filters.q) p.set('q', filters.q)
    p.set('page', String(targetPage))
    return `/admin/downloads?${p.toString()}`
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-gray-900">Downloads</h1>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {summary.totalDownloads} total
          </span>
          {summary.emailProblems > 0 && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
              {summary.emailProblems} email problems
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href={exportHref}
            download
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#191A23] text-white hover:bg-[#262837] transition shadow-sm cursor-pointer"
          >
            <Download size={14} />
            <span>Download CSV</span>
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto w-full px-6 sm:px-10 py-8 flex-1 space-y-8">
        {/* Top Summary Cards (No coloured top-border bars) */}
        <section aria-label="Downloads Summary">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-medium text-gray-500">Total downloads</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.totalDownloads}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-medium text-gray-500">Last 30 days</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.downloadsLast30Days}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-medium text-gray-500">Distinct emails</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.distinctEmails}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <span className="text-xs font-medium text-gray-500">Email problems</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.emailProblems}</p>
            </div>
          </div>
        </section>

        {/* Per-Resource Table */}
        <section aria-label="Downloads by Resource" className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Downloads by Resource</h2>
            <span className="text-xs text-gray-500">{perResourceStats.length} resources</span>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="w-full max-md:overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-600">
                <thead className="bg-gray-50/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Resource</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Kind</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-right">Total Downloads</th>
                    <th scope="col" className="px-5 py-3 font-semibold text-right">Last Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {perResourceStats.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                        No resources available.
                      </td>
                    </tr>
                  ) : (
                    perResourceStats.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-3 font-medium text-gray-900">
                          {item.title}
                        </td>
                        <td className="px-5 py-3 text-gray-500">
                          <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-gray-100 text-gray-700">
                            {formatResourceKind(item.kind)}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">
                          {item.totalDownloads}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500">
                          {item.lastDownloadDate ? formatDownloadDateTime(item.lastDownloadDate) : 'None'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Download Log Section */}
        <section aria-label="Download Log" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-gray-900">Download Log</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {totalCount} matching
              </span>
              {isCapped && (
                <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Export is capped at 5,000 rows.
                </span>
              )}
            </div>
          </div>

          {/* Filters Bar */}
          <DownloadsFilters
            key={`${filters.resource || 'all'}|${filters.use || ''}|${filters.from || ''}|${filters.to || ''}`}
            resources={resources}
            filters={filters}
          />

          {/* Empty states or Log table */}
          {summary.totalDownloads === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <div className="flex justify-center mb-2">
                <Download size={24} className="text-[#EF5B45]" />
              </div>
              <p className="text-gray-500 text-sm font-medium">No downloads yet.</p>
            </div>
          ) : downloads.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <p className="text-gray-500 text-sm font-medium">
                No downloads match your search or filter.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
              <div className="w-full max-md:overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-600">
                  <thead className="bg-gray-50/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-semibold">Date &amp; Time (UTC)</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Resource</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Name</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Email</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Intended Use</th>
                      <th scope="col" className="px-5 py-3 font-semibold">Email Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {downloads.map((d) => {
                      const resourceObj = d.resource as { title?: string } | null
                      const isAnonymised = Boolean(d.anonymised_at)
                      const displayName = isAnonymised ? 'Anonymised' : d.name || '-'
                      const displayEmail = isAnonymised ? 'Anonymised' : d.email || '-'
                      const hasEmailError = Boolean(d.email_error)
                      const isSent = Boolean(d.email_sent_at) && !hasEmailError

                      return (
                        <tr key={d.id} className="hover:bg-gray-50/50 transition">
                          <td className="px-5 py-3 font-medium text-gray-900 whitespace-nowrap">
                            {formatDownloadDateTime(d.created_at)}
                          </td>
                          <td className="px-5 py-3 text-gray-900 font-medium">
                            {resourceObj?.title || 'Unknown Resource'}
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {isAnonymised ? (
                              <span className="italic text-gray-400">Anonymised</span>
                            ) : (
                              displayName
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {isAnonymised ? (
                              <span className="italic text-gray-400">Anonymised</span>
                            ) : (
                              displayEmail
                            )}
                          </td>
                          <td className="px-5 py-3 text-gray-700">
                            {getIntendedUseLabel(d.intended_use)}
                          </td>
                          <td className="px-5 py-3 whitespace-nowrap">
                            {hasEmailError ? (
                              <span
                                title={d.email_error || 'Email error'}
                                className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-red-100 text-red-800 border border-red-200"
                              >
                                <span>Failed</span>
                                {d.email_error && (
                                  <span className="font-normal lowercase">
                                    ({formatShortError(d.email_error, 24)})
                                  </span>
                                )}
                              </span>
                            ) : isSent ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Sent
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                Not sent
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-2 text-xs text-gray-500">
              <span>
                Page {filters.page} of {totalPages} ({totalCount} total)
              </span>
              <div className="flex items-center gap-2">
                {filters.page > 1 ? (
                  <Link
                    href={buildPageHref(filters.page - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-gray-400 font-medium cursor-not-allowed">
                    <ChevronLeft size={14} />
                    <span>Previous</span>
                  </span>
                )}

                {filters.page < totalPages ? (
                  <Link
                    href={buildPageHref(filters.page + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium transition cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-100 bg-gray-50 text-gray-400 font-medium cursor-not-allowed">
                    <span>Next</span>
                    <ChevronRight size={14} />
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
