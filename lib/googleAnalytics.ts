import 'server-only'
import crypto from 'crypto'

export type GoogleStatus = 'loading' | 'not_configured' | 'error' | 'empty' | 'ready'

export interface ChannelGroupRow {
  channelGroup: string
  sessions: number
  users: number
  share: number
}

export interface SourceMediumRow {
  sourceMedium: string
  sessions: number
  users: number
  share: number
}

export interface CountryRow {
  country: string
  users: number
  sessions: number
  share: number
}

export interface DeviceCategoryRow {
  deviceCategory: string
  users: number
  sessions: number
  share: number
}

export interface GoogleAnalyticsData {
  status: GoogleStatus
  errorMessage?: string
  channels: ChannelGroupRow[]
  sources: SourceMediumRow[]
  countries: CountryRow[]
  devices: DeviceCategoryRow[]
}

export interface SearchConsoleTotals {
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleItem {
  key: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface SearchConsoleData {
  status: GoogleStatus
  errorMessage?: string
  totals: SearchConsoleTotals
  queries: SearchConsoleItem[]
  pages: SearchConsoleItem[]
}

export interface GoogleDataBundle {
  configured: boolean
  setupStatus: {
    searchConsoleConnected: boolean
    googleAnalyticsConnected: boolean
  }
  ga: GoogleAnalyticsData
  gsc: SearchConsoleData
}

interface ServiceAccountCredentials {
  client_email: string
  private_key: string
}

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes cache
const cache = new Map<string, { data: GoogleDataBundle; expiresAt: number }>()

let cachedAccessToken: { token: string; expiresAt: number } | null = null

function getServiceAccount(): ServiceAccountCredentials | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw || typeof raw !== 'string' || raw.trim().length === 0) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    if (
      parsed &&
      typeof parsed.client_email === 'string' &&
      typeof parsed.private_key === 'string'
    ) {
      return {
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      }
    }
  } catch {
    // Sanitized: silently treat parse errors as not configured
    return null
  }
  return null
}

async function getAccessToken(sa: ServiceAccountCredentials): Promise<string> {
  const now = Date.now()
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60000) {
    return cachedAccessToken.token
  }

  const nowSec = Math.floor(now / 1000)
  const header = Buffer.from(
    JSON.stringify({ alg: 'RS256', typ: 'JWT' })
  ).toString('base64url')

  const payload = Buffer.from(
    JSON.stringify({
      iss: sa.client_email,
      scope:
        'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: nowSec + 3600,
      iat: nowSec,
    })
  ).toString('base64url')

  const unsignedToken = `${header}.${payload}`
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(unsignedToken)
  const signature = signer.sign(sa.private_key, 'base64url')
  const assertion = `${unsignedToken}.${signature}`

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  })

  if (!response.ok) {
    throw new Error('Could not obtain Google authentication token.')
  }

  const data = await response.json()
  if (!data.access_token) {
    throw new Error('Google token endpoint did not return an access token.')
  }

  const expiresIn = typeof data.expires_in === 'number' ? data.expires_in : 3600
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + expiresIn * 1000,
  }

  return cachedAccessToken.token
}

async function runGAReport(
  accessToken: string,
  rangeDays: number,
  dimensionName: string,
  metricNames: string[]
): Promise<{ rows: { dimension: string; metrics: number[] }[] }> {
  const url =
    'https://analyticsdata.googleapis.com/v1beta/properties/297881212:runReport'

  const body = {
    dateRanges: [
      {
        startDate: `${rangeDays}daysAgo`,
        endDate: 'yesterday',
      },
    ],
    dimensions: [{ name: dimensionName }],
    metrics: metricNames.map((name) => ({ name })),
    orderBys: [
      {
        metric: { metricName: metricNames[0] },
        desc: true,
      },
    ],
    limit: 10,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Google Analytics request failed.')
  }

  const json = await response.json()
  const rawRows = Array.isArray(json.rows) ? json.rows : []

  const rows = rawRows.map((r: {
    dimensionValues?: { value?: string }[]
    metricValues?: { value?: string }[]
  }) => {
    const dimension = r.dimensionValues?.[0]?.value || '(not set)'
    const metrics = (r.metricValues || []).map((m) =>
      Number(m?.value) || 0
    )
    return { dimension, metrics }
  })

  return { rows }
}

async function fetchGAData(
  accessToken: string,
  rangeDays: number
): Promise<GoogleAnalyticsData> {
  try {
    const [channelsRes, sourcesRes, countriesRes, devicesRes] =
      await Promise.all([
        runGAReport(accessToken, rangeDays, 'sessionDefaultChannelGroup', [
          'sessions',
          'totalUsers',
        ]),
        runGAReport(accessToken, rangeDays, 'sessionSourceMedium', [
          'sessions',
          'totalUsers',
        ]),
        runGAReport(accessToken, rangeDays, 'country', [
          'totalUsers',
          'sessions',
        ]),
        runGAReport(accessToken, rangeDays, 'deviceCategory', [
          'totalUsers',
          'sessions',
        ]),
      ])

    const totalChannelSessions =
      channelsRes.rows.reduce((sum, r) => sum + r.metrics[0], 0) || 1
    const channels: ChannelGroupRow[] = channelsRes.rows.map((r) => ({
      channelGroup: r.dimension,
      sessions: r.metrics[0],
      users: r.metrics[1] || 0,
      share: Math.round((r.metrics[0] / totalChannelSessions) * 100),
    }))

    const totalSourceSessions =
      sourcesRes.rows.reduce((sum, r) => sum + r.metrics[0], 0) || 1
    const sources: SourceMediumRow[] = sourcesRes.rows.map((r) => ({
      sourceMedium: r.dimension,
      sessions: r.metrics[0],
      users: r.metrics[1] || 0,
      share: Math.round((r.metrics[0] / totalSourceSessions) * 100),
    }))

    const totalCountryUsers =
      countriesRes.rows.reduce((sum, r) => sum + r.metrics[0], 0) || 1
    const countries: CountryRow[] = countriesRes.rows.map((r) => ({
      country: r.dimension,
      users: r.metrics[0],
      sessions: r.metrics[1] || 0,
      share: Math.round((r.metrics[0] / totalCountryUsers) * 100),
    }))

    const totalDeviceUsers =
      devicesRes.rows.reduce((sum, r) => sum + r.metrics[0], 0) || 1
    const devices: DeviceCategoryRow[] = devicesRes.rows.map((r) => ({
      deviceCategory: r.dimension,
      users: r.metrics[0],
      sessions: r.metrics[1] || 0,
      share: Math.round((r.metrics[0] / totalDeviceUsers) * 100),
    }))

    const isEmpty =
      channels.length === 0 &&
      sources.length === 0 &&
      countries.length === 0 &&
      devices.length === 0

    return {
      status: isEmpty ? 'empty' : 'ready',
      channels,
      sources,
      countries,
      devices,
    }
  } catch {
    return {
      status: 'error',
      errorMessage: 'Could not load Google Analytics data right now.',
      channels: [],
      sources: [],
      countries: [],
      devices: [],
    }
  }
}

async function querySearchConsole(
  accessToken: string,
  startDate: string,
  endDate: string,
  dimensions?: string[]
): Promise<{
  rows?: {
    keys?: string[]
    clicks?: number
    impressions?: number
    ctr?: number
    position?: number
  }[]
}> {
  const siteUrl = encodeURIComponent('sc-domain:ivankabandize.com')
  const url = `https://www.googleapis.com/webmasters/v3/sites/${siteUrl}/searchAnalytics/query`

  const body: Record<string, unknown> = {
    startDate,
    endDate,
  }
  if (dimensions && dimensions.length > 0) {
    body.dimensions = dimensions
    body.rowLimit = 10
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error('Search Console request failed.')
  }

  return response.json()
}

async function fetchGSCData(
  accessToken: string,
  rangeDays: number
): Promise<SearchConsoleData> {
  try {
    const end = new Date()
    const start = new Date(Date.now() - rangeDays * 24 * 3600 * 1000)
    const startDate = start.toISOString().split('T')[0]
    const endDate = end.toISOString().split('T')[0]

    const [totalsRes, queriesRes, pagesRes] = await Promise.all([
      querySearchConsole(accessToken, startDate, endDate),
      querySearchConsole(accessToken, startDate, endDate, ['query']),
      querySearchConsole(accessToken, startDate, endDate, ['page']),
    ])

    const totalsRow = totalsRes.rows?.[0] || {}
    const totals: SearchConsoleTotals = {
      clicks: totalsRow.clicks || 0,
      impressions: totalsRow.impressions || 0,
      ctr: totalsRow.ctr || 0,
      position: totalsRow.position || 0,
    }

    const queries: SearchConsoleItem[] = (queriesRes.rows || []).map((r) => ({
      key: r.keys?.[0] || '(unknown)',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: r.ctr || 0,
      position: Math.round((r.position || 0) * 10) / 10,
    }))

    const pages: SearchConsoleItem[] = (pagesRes.rows || []).map((r) => {
      let pageKey = r.keys?.[0] || '/'
      try {
        const u = new URL(pageKey)
        pageKey = u.pathname + u.search
      } catch {
        // Keep raw key
      }
      return {
        key: pageKey,
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: Math.round((r.position || 0) * 10) / 10,
      }
    })

    const isEmpty =
      totals.clicks === 0 &&
      totals.impressions === 0 &&
      queries.length === 0 &&
      pages.length === 0

    return {
      status: isEmpty ? 'empty' : 'ready',
      totals,
      queries,
      pages,
    }
  } catch {
    return {
      status: 'error',
      errorMessage: 'Could not load Search Console data right now.',
      totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      queries: [],
      pages: [],
    }
  }
}

export async function getGoogleDataBundle(
  rangeDays: number = 30
): Promise<GoogleDataBundle> {
  const cacheKey = `bundle:${rangeDays}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data
  }

  const sa = getServiceAccount()
  if (!sa) {
    const notConfiguredBundle: GoogleDataBundle = {
      configured: false,
      setupStatus: {
        searchConsoleConnected: false,
        googleAnalyticsConnected: false,
      },
      ga: {
        status: 'not_configured',
        channels: [],
        sources: [],
        countries: [],
        devices: [],
      },
      gsc: {
        status: 'not_configured',
        totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        queries: [],
        pages: [],
      },
    }
    cache.set(cacheKey, {
      data: notConfiguredBundle,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })
    return notConfiguredBundle
  }

  let accessToken: string
  try {
    accessToken = await getAccessToken(sa)
  } catch {
    const authErrorBundle: GoogleDataBundle = {
      configured: true,
      setupStatus: {
        searchConsoleConnected: false,
        googleAnalyticsConnected: false,
      },
      ga: {
        status: 'error',
        errorMessage: 'Authentication with Google failed.',
        channels: [],
        sources: [],
        countries: [],
        devices: [],
      },
      gsc: {
        status: 'error',
        errorMessage: 'Authentication with Google failed.',
        totals: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        queries: [],
        pages: [],
      },
    }
    cache.set(cacheKey, {
      data: authErrorBundle,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })
    return authErrorBundle
  }

  const [ga, gsc] = await Promise.all([
    fetchGAData(accessToken, rangeDays),
    fetchGSCData(accessToken, rangeDays),
  ])

  const bundle: GoogleDataBundle = {
    configured: true,
    setupStatus: {
      searchConsoleConnected: gsc.status === 'ready' || gsc.status === 'empty',
      googleAnalyticsConnected: ga.status === 'ready' || ga.status === 'empty',
    },
    ga,
    gsc,
  }

  cache.set(cacheKey, {
    data: bundle,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })

  return bundle
}
