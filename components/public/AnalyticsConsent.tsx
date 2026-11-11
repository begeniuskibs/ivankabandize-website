'use client'

import React, { Suspense, useEffect, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  clearGoogleAnalyticsCookies,
  ensureGtagStub,
  isValidMeasurementId,
  readConsent,
  writeConsent,
  type ConsentValue,
} from '@/lib/analyticsConsent'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

let gtagConfigured = false

function initGtag(gaId: string) {
  if (typeof window === 'undefined') return
  ensureGtagStub(window)
  if (!gtagConfigured) {
    window.gtag?.('js', new Date())
    window.gtag?.('config', gaId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    })
    gtagConfigured = true
  }
}

function sendPageView(pathname: string, searchParams: URLSearchParams | null) {
  if (typeof window === 'undefined') return
  ensureGtagStub(window)
  const searchStr = searchParams ? searchParams.toString() : ''
  const url = searchStr ? `${pathname}?${searchStr}` : pathname

  window.gtag?.('event', 'page_view', {
    page_path: url,
    page_location: window.location.href,
    page_title: document.title,
  })
}

function subscribeConsent(callback: () => void) {
  if (typeof window === 'undefined') return () => {}
  window.addEventListener('storage', callback)
  window.addEventListener('ik-consent-change', callback)
  return () => {
    window.removeEventListener('storage', callback)
    window.removeEventListener('ik-consent-change', callback)
  }
}

function getConsentSnapshot(): ConsentValue | null {
  return readConsent()
}

function getConsentServerSnapshot(): ConsentValue | null {
  return null
}

function subscribeMount() {
  return () => {}
}

function getMountClientSnapshot(): boolean {
  return true
}

function getMountServerSnapshot(): boolean {
  return false
}

function PageViewTracker({
  gaId,
  consent,
}: {
  gaId: string
  consent: ConsentValue | null
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (consent !== 'granted') return
    initGtag(gaId)
    sendPageView(pathname, searchParams)
  }, [pathname, searchParams, consent, gaId])

  return null
}

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('ik-open-cookie-settings'))
        }
      }}
      className="hover:text-white transition cursor-pointer"
    >
      Cookie settings
    </button>
  )
}

function AnalyticsConsentInner({ gaId }: { gaId: string }) {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot
  )
  const isMounted = useSyncExternalStore(
    subscribeMount,
    getMountClientSnapshot,
    getMountServerSnapshot
  )
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => {
      setIsSettingsOpen(true)
    }
    window.addEventListener('ik-open-cookie-settings', handleOpen)
    return () => {
      window.removeEventListener('ik-open-cookie-settings', handleOpen)
    }
  }, [])

  useEffect(() => {
    if (consent === 'denied') {
      gtagConfigured = false
      if (typeof window !== 'undefined') {
        ;(window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true
      }
      clearGoogleAnalyticsCookies()
    } else if (consent === 'granted') {
      if (typeof window !== 'undefined') {
        ;(window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = false
      }
      initGtag(gaId)
    }
  }, [consent, gaId])

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = false
    }
    writeConsent('granted')
    window.dispatchEvent(new Event('ik-consent-change'))
    setIsSettingsOpen(false)
  }

  const handleDecline = () => {
    gtagConfigured = false
    if (typeof window !== 'undefined') {
      ;(window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = true
    }
    clearGoogleAnalyticsCookies()
    writeConsent('denied')
    window.dispatchEvent(new Event('ik-consent-change'))
    setIsSettingsOpen(false)
  }

  const showBanner = isMounted && (consent === null || isSettingsOpen)

  return (
    <>
      {consent === 'granted' && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          strategy="afterInteractive"
        />
      )}

      <Suspense fallback={null}>
        <PageViewTracker gaId={gaId} consent={consent} />
      </Suspense>

      {showBanner && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#FDF8F1] border-t border-[#F0E4D2] text-[#232536] shadow-lg"
          style={{
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#232536] leading-relaxed text-center sm:text-left">
              We use Google Analytics cookies to understand which articles are read. No advertising, and you can change your mind any time.{' '}
              <Link
                href="/cookie-policy"
                className="underline underline-offset-2 hover:text-[#CF3F29] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF3F29] rounded-sm"
              >
                Cookie Policy
              </Link>
              .
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-center">
              <button
                type="button"
                onClick={handleDecline}
                className="min-h-[44px] flex-1 sm:flex-none px-5 py-2.5 border border-[#232536] text-[#232536] hover:bg-[#232536]/5 rounded text-sm font-medium transition cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#232536] focus-visible:ring-offset-2"
              >
                Decline
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="min-h-[44px] flex-1 sm:flex-none px-5 py-2.5 bg-[#CF3F29] hover:bg-[#b83420] text-white rounded text-sm font-medium transition cursor-pointer flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CF3F29] focus-visible:ring-offset-2"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AnalyticsConsent() {
  if (!isValidMeasurementId(GA_MEASUREMENT_ID)) {
    return null
  }
  return <AnalyticsConsentInner gaId={GA_MEASUREMENT_ID} />
}

