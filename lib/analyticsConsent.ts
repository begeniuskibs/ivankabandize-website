export const CONSENT_KEY = 'ik_analytics_consent'

export type ConsentValue = 'granted' | 'denied'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem?(key: string): void
}

export interface CookieDocumentLike {
  cookie: string
  location?: {
    hostname?: string
  }
}

export interface GtagWindowLike {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

export function ensureGtagStub(win?: GtagWindowLike | null): void {
  const target =
    win !== undefined
      ? win
      : typeof window !== 'undefined'
        ? (window as unknown as GtagWindowLike)
        : null

  if (!target) return

  target.dataLayer = target.dataLayer || []
  if (!target.gtag) {
    target.gtag = function () {
      // eslint-disable-next-line prefer-rest-params
      target.dataLayer!.push(arguments)
    }
  }
}

function resolveStorage(storage?: StorageLike | null): StorageLike | null {
  if (storage !== undefined) {
    return storage
  }
  if (typeof window !== 'undefined') {
    try {
      return window.localStorage
    } catch {
      return null
    }
  }
  return null
}

export function readConsent(storage?: StorageLike | null): ConsentValue | null {
  try {
    const s = resolveStorage(storage)
    if (!s) return null
    const val = s.getItem(CONSENT_KEY)
    if (val === 'granted' || val === 'denied') {
      return val
    }
    return null
  } catch {
    return null
  }
}

export function writeConsent(value: ConsentValue, storage?: StorageLike | null): void {
  try {
    const s = resolveStorage(storage)
    if (!s) return
    s.setItem(CONSENT_KEY, value)
  } catch {
    // Fail safely if storage quota is exceeded or storage is disabled
  }
}

export function isValidMeasurementId(id: unknown): id is string {
  if (typeof id !== 'string') return false
  return /^G-[A-Z0-9]{6,}$/.test(id)
}

function getDomainCandidates(hostname?: string): string[] {
  if (!hostname) return ['']
  const candidates: string[] = ['', hostname, `.${hostname}`]
  const parts = hostname.split('.')
  if (parts.length >= 2) {
    const parent = parts.slice(-2).join('.')
    if (parent !== hostname) {
      candidates.push(parent)
      candidates.push(`.${parent}`)
    }
  }
  return Array.from(new Set(candidates))
}

export function clearGoogleAnalyticsCookies(
  cookieDocument?: CookieDocumentLike | null
): void {
  try {
    const doc =
      cookieDocument !== undefined
        ? cookieDocument
        : typeof document !== 'undefined'
          ? document
          : null

    if (!doc || typeof doc.cookie !== 'string') return

    const rawCookies = doc.cookie.split(';')
    const namesToExpire: string[] = []

    for (const raw of rawCookies) {
      const trimmed = raw.trim()
      if (!trimmed) continue
      const eqIndex = trimmed.indexOf('=')
      const name = eqIndex === -1 ? trimmed : trimmed.substring(0, eqIndex).trim()
      if (name === '_ga' || name.startsWith('_ga_')) {
        namesToExpire.push(name)
      }
    }

    if (namesToExpire.length === 0) return

    const hostname = doc.location?.hostname || ''
    const domainCandidates = getDomainCandidates(hostname)

    for (const name of namesToExpire) {
      for (const domain of domainCandidates) {
        const domainAttr = domain ? `; Domain=${domain}` : ''
        doc.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Max-Age=0${domainAttr}`
      }
    }
  } catch {
    // Fail safely if cookie operations throw
  }
}

