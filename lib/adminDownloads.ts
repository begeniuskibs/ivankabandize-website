/**
 * Pure helpers for the Admin Downloads Report.
 * All formatting, filtering, summary calculations, and CSV sanitization
 * are contained here to ensure safety, reliability, and testability.
 */

export type IntendedUseKey = 'myself' | 'team' | 'church_ministry' | 'curious'

export const INTENDED_USE_OPTIONS: Array<{ value: IntendedUseKey | 'none'; label: string }> = [
  { value: 'myself', label: 'For myself' },
  { value: 'team', label: 'For my team' },
  { value: 'church_ministry', label: 'For my church or ministry' },
  { value: 'curious', label: 'Just curious' },
  { value: 'none', label: 'Not given' },
]

export function getIntendedUseLabel(value: string | null | undefined): string {
  if (!value) return 'Not given'
  switch (value.trim()) {
    case 'myself':
      return 'For myself'
    case 'team':
      return 'For my team'
    case 'church_ministry':
      return 'For my church or ministry'
    case 'curious':
      return 'Just curious'
    default:
      return 'Not given'
  }
}

export function formatResourceKind(kind: string | null | undefined): string {
  if (!kind) return 'Resource'
  switch (kind) {
    case 'guide':
      return 'Guide'
    case 'digest_pdf':
      return 'Digest PDF'
    case 'template':
      return 'Template'
    case 'framework':
      return 'Framework'
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1)
  }
}

export function formatShortError(error: string | null | undefined, maxLength: number = 32): string | null {
  if (!error) return null
  const trimmed = error.trim()
  if (trimmed.length <= maxLength) return trimmed
  return trimmed.slice(0, maxLength).trimEnd() + '...'
}

export function formatDownloadDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC',
    })
  } catch {
    return dateStr
  }
}

/**
 * Neutralises spreadsheet formula injection and escapes CSV cell content.
 * Formula triggers (=, +, -, @, tab) are prepended with an apostrophe.
 * Cells containing quotes, commas, newlines, tabs, or starting with apostrophe
 * are wrapped in double quotes, with internal quotes escaped as "".
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""'
  }
  let str = String(value)
  // Neutralise spreadsheet formula injection
  const startsWithFormulaTrigger = /^[=+\-@\t]/.test(str)
  if (startsWithFormulaTrigger) {
    str = `'${str}`
  }
  // Wrap in quotes if it contains delimiter, quotes, newlines, tabs, or starts with apostrophe
  const needsQuotes = /[",\n\r\t]/.test(str) || str.startsWith("'")
  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export interface DownloadsSummary {
  totalDownloads: number
  downloadsLast30Days: number
  distinctEmails: number
  emailProblems: number
}

export function calculateDownloadsSummary(
  downloads: Array<{
    created_at: string
    email?: string | null
    email_sent_at?: string | null
    email_error?: string | null
  }>,
  now: Date = new Date()
): DownloadsSummary {
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000
  const cutoffTime = now.getTime() - thirtyDaysMs

  const distinctEmailSet = new Set<string>()
  let downloadsLast30Days = 0
  let emailProblems = 0

  for (const d of downloads) {
    const createdAtTime = new Date(d.created_at).getTime()
    if (!isNaN(createdAtTime) && createdAtTime >= cutoffTime) {
      downloadsLast30Days++
    }

    if (d.email) {
      const normalized = d.email.trim().toLowerCase()
      if (normalized.length > 0) {
        distinctEmailSet.add(normalized)
      }
    }

    if (d.email_sent_at === null || d.email_sent_at === undefined || Boolean(d.email_error)) {
      emailProblems++
    }
  }

  return {
    totalDownloads: downloads.length,
    downloadsLast30Days,
    distinctEmails: distinctEmailSet.size,
    emailProblems,
  }
}

export interface PerResourceStat {
  id: string
  title: string
  kind: string
  totalDownloads: number
  lastDownloadDate: string | null
}

export function calculatePerResourceStats(
  resources: Array<{ id: string; title: string; kind: string }>,
  downloads: Array<{ resource_id: string; created_at: string }>
): PerResourceStat[] {
  const statsMap = new Map<string, { total: number; lastDate: string | null }>()

  for (const d of downloads) {
    const existing = statsMap.get(d.resource_id)
    if (!existing) {
      statsMap.set(d.resource_id, { total: 1, lastDate: d.created_at })
    } else {
      existing.total++
      if (
        !existing.lastDate ||
        new Date(d.created_at).getTime() > new Date(existing.lastDate).getTime()
      ) {
        existing.lastDate = d.created_at
      }
    }
  }

  return resources
    .map((r) => {
      const stat = statsMap.get(r.id)
      return {
        id: r.id,
        title: r.title,
        kind: r.kind,
        totalDownloads: stat?.total ?? 0,
        lastDownloadDate: stat?.lastDate ?? null,
      }
    })
    .sort((a, b) => b.totalDownloads - a.totalDownloads || a.title.localeCompare(b.title))
}

export interface DownloadsFilterParams {
  resource?: string
  use?: string
  from?: string
  to?: string
  q?: string
  page: number
  isSearchRejected?: boolean
}

export function parseDownloadsFilterParams(
  rawParams: Record<string, string | string[] | undefined>
): DownloadsFilterParams {
  const getParam = (key: string): string | undefined => {
    const val = rawParams[key]
    if (Array.isArray(val)) return val[0]?.trim()
    return val?.trim()
  }

  // 1. Resource ID
  const rawResource = getParam('resource')
  const resource =
    rawResource && rawResource !== 'all' && rawResource !== ''
      ? rawResource
      : undefined

  // 2. Intended use
  const rawUse = getParam('use')
  const allowedUses = ['myself', 'team', 'church_ministry', 'curious', 'none']
  const use = rawUse && allowedUses.includes(rawUse) ? rawUse : undefined

  // 3. Date range
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  const rawFrom = getParam('from')
  const from = rawFrom && dateRegex.test(rawFrom) ? rawFrom : undefined

  const rawTo = getParam('to')
  const to = rawTo && dateRegex.test(rawTo) ? rawTo : undefined

  // 4. Search query (name or email)
  // Only allow standard alphanumeric, spaces, and safe email/name punctuation.
  // Reject %, _, commas, parens, quotes, regex chars, SQL/PostgREST delimiters.
  const rawQ = getParam('q')
  let q: string | undefined = undefined
  let isSearchRejected = false

  if (rawQ && rawQ.length > 0) {
    const hasOddCharacters = /[^a-zA-Z0-9\s.@_-]/.test(rawQ)
    if (hasOddCharacters || rawQ.length > 100) {
      isSearchRejected = true
      q = undefined
    } else {
      q = rawQ
    }
  }

  // 5. Page
  const rawPage = getParam('page')
  let page = 1
  if (rawPage) {
    const parsed = parseInt(rawPage, 10)
    if (!isNaN(parsed) && parsed >= 1) {
      page = parsed
    }
  }

  return {
    resource,
    use,
    from,
    to,
    q,
    page,
    isSearchRejected,
  }
}

export function buildDownloadsExportHref(filters: {
  resource?: string
  use?: string
  from?: string
  to?: string
  q?: string
}): string {
  const params = new URLSearchParams()
  if (filters.resource) params.set('resource', filters.resource)
  if (filters.use) params.set('use', filters.use)
  if (filters.from) params.set('from', filters.from)
  if (filters.to) params.set('to', filters.to)
  if (filters.q) params.set('q', filters.q)
  const qs = params.toString()
  return qs ? `/admin/downloads/export?${qs}` : '/admin/downloads/export'
}

export interface CsvExportRow {
  created_at: string
  resource_title: string
  name: string | null
  email: string | null
  anonymised_at: string | null
  intended_use: string | null
  email_sent_at: string | null
  email_error: string | null
}

export function buildDownloadsExportCsv(rows: CsvExportRow[]): string {
  const headers = [
    'Date (UTC)',
    'Resource',
    'Name',
    'Email',
    'Intended Use',
    'Email Status',
    'Error Details',
  ]
  const headerLine = headers.map(sanitizeCsvCell).join(',')

  const lines = rows.map((row) => {
    const isAnonymised = Boolean(row.anonymised_at)
    const displayName = isAnonymised ? 'Anonymised' : row.name || ''
    const displayEmail = isAnonymised ? 'Anonymised' : row.email || ''
    const intendedUse = getIntendedUseLabel(row.intended_use)

    let emailStatus = 'Not sent'
    if (row.email_error) {
      emailStatus = 'Failed'
    } else if (row.email_sent_at) {
      emailStatus = 'Sent'
    }

    const errorDetails = row.email_error || ''

    return [
      sanitizeCsvCell(formatDownloadDateTime(row.created_at)),
      sanitizeCsvCell(row.resource_title),
      sanitizeCsvCell(displayName),
      sanitizeCsvCell(displayEmail),
      sanitizeCsvCell(intendedUse),
      sanitizeCsvCell(emailStatus),
      sanitizeCsvCell(errorDetails),
    ].join(',')
  })

  return [headerLine, ...lines].join('\r\n')
}
