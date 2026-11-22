'use client'

import React, {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  ReactNode,
} from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Download } from 'lucide-react'
import type { PublicResource } from '@/lib/resources'
import {
  ctaLabels,
  kindLabel,
  getDownloadErrorMessage,
} from '@/lib/resourceUi'
import {
  EMAIL_REGEX,
  RESOURCE_DOWNLOAD_LIMITS,
} from '@/lib/resourceDownload'
import {
  INTENDED_USE_OPTIONS,
  getFirstName,
} from '@/lib/resourceFlow'
import { RESOURCE_CONSENT_TEXT } from '@/lib/resourceConsent'
import ResourceConfetti from '@/components/public/ResourceConfetti'
import PostCard from '@/components/public/PostCard'

// Three-screen resource flow controller (detail, form, success)
// House style: spaced hyphen " - " only

const consentParts = RESOURCE_CONSENT_TEXT.split('See the Privacy Policy.')

type ViewMode = 'detail' | 'form' | 'success'

interface SuccessState {
  isMember: boolean
  firstName: string
  email: string
  delivery: 'file' | 'link'
  url: string
  expiresInSeconds: number
}

interface ResourceFlowContextType {
  currentView: ViewMode
  startFlow: () => void
  returnToDetail: () => void
  isSubmitting: boolean
  isMember: boolean
  memberError: string | null
  ctaText: string
}

const ResourceFlowContext = createContext<ResourceFlowContextType | null>(null)

export function useResourceFlow(): ResourceFlowContextType {
  const ctx = useContext(ResourceFlowContext)
  if (!ctx) {
    throw new Error('useResourceFlow must be used within a ResourceFlow provider')
  }
  return ctx
}

export function ResourceHeroCta() {
  const { startFlow, isSubmitting, memberError, ctaText } = useResourceFlow()

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={startFlow}
        disabled={isSubmitting}
        className="inline-flex items-center justify-center min-h-[48px] px-8 py-3.5 text-base max-md:min-h-[40px] max-md:px-5 max-md:py-2.5 max-md:text-sm bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold rounded-xl shadow-xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Sending...</span>
          </span>
        ) : (
          ctaText
        )}
      </button>
      {memberError && (
        <p className="text-xs font-semibold text-[#CF3F29]">
          {memberError}
        </p>
      )}
    </div>
  )
}

export function ResourceStickyBar({
  title,
  subText,
}: {
  title: string
  subText?: string
}) {
  const { startFlow, isSubmitting, ctaText, currentView } = useResourceFlow()
  if (currentView !== 'detail') return null

  return (
    <aside
      aria-label="Action bar"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#F0E4D2] px-4 py-3 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#232536] truncate">
            {title}
          </span>
          {subText && (
            <span className="block text-xs text-[#5C5F73] truncate">
              {subText}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={startFlow}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center min-h-[40px] px-5 py-2.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-sm rounded-xl shadow-xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2 shrink-0 disabled:opacity-60"
        >
          {isSubmitting ? 'Sending...' : ctaText}
        </button>
      </div>
    </aside>
  )
}

interface ResourceFlowProps {
  resource: PublicResource
  children: ReactNode
}

export default function ResourceFlow({ resource, children }: ResourceFlowProps) {
  const [currentView, setCurrentView] = useState<ViewMode>('detail')
  const [isMember, setIsMember] = useState(false)
  const [viewerFirstName, setViewerFirstName] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Visitor form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [intendedUse, setIntendedUse] = useState('')
  const [website, setWebsite] = useState('') // Honeypot
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string }>({})

  // Success state
  const [successState, setSuccessState] = useState<SuccessState | null>(null)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60)

  const scrollPosRef = useRef(0)
  const formHeadingRef = useRef<HTMLHeadingElement>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)

  const labels = ctaLabels(resource.kind, resource.delivery_type)

  // 1. Viewer check on mount: GET /api/resources/viewer
  useEffect(() => {
    let active = true

    async function checkViewer() {
      try {
        const res = await fetch('/api/resources/viewer', {
          method: 'GET',
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = await res.json()
        if (active && data) {
          setIsMember(Boolean(data.isMember))
          setViewerFirstName(data.firstName || null)
        }
      } catch {
        // Leave isMember as false
      }
    }

    checkViewer()
    return () => {
      active = false
    }
  }, [])

  // 2. Browser Back handling (popstate)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const targetView = (e.state?.resourceFlowView as ViewMode) || 'detail'
      if (targetView === 'detail') {
        setCurrentView('detail')
        setTimeout(() => {
          window.scrollTo(0, scrollPosRef.current)
        }, 10)
      } else {
        setCurrentView(targetView)
        window.scrollTo(0, 0)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // 3. Countdown timer for file downloads in success view
  useEffect(() => {
    if (
      currentView !== 'success' ||
      !successState ||
      successState.delivery === 'link'
    ) {
      return
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentView, successState])

  const transitionTo = (view: ViewMode) => {
    if (currentView === 'detail') {
      scrollPosRef.current = window.scrollY
    }
    window.history.pushState({ resourceFlowView: view }, '')
    setCurrentView(view)
    window.scrollTo(0, 0)

    setTimeout(() => {
      if (view === 'form') {
        formHeadingRef.current?.focus()
      } else if (view === 'success') {
        successHeadingRef.current?.focus()
      }
    }, 50)
  }

  const returnToDetail = () => {
    if (window.history.state?.resourceFlowView) {
      window.history.back()
    } else {
      setCurrentView('detail')
      window.scrollTo(0, scrollPosRef.current)
    }
  }

  // Member instant download handler
  const executeMemberDownload = async () => {
    setIsSubmitting(true)
    setMemberError(null)

    try {
      const res = await fetch('/api/resources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: resource.slug }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setMemberError(getDownloadErrorMessage(res.status, data.error))
        setIsSubmitting(false)
        return
      }

      setSecondsRemaining(data.expiresInSeconds || 60)
      setSuccessState({
        isMember: true,
        firstName: data.firstName || viewerFirstName || '',
        email: data.email || '',
        delivery: data.delivery || resource.delivery_type,
        url: data.url || '',
        expiresInSeconds: data.expiresInSeconds || 60,
      })
      setIsSubmitting(false)
      transitionTo('success')
    } catch {
      setMemberError('Something went wrong. Please try again in a moment.')
      setIsSubmitting(false)
    }
  }

  const startFlow = () => {
    if (isMember) {
      executeMemberDownload()
    } else {
      transitionTo('form')
    }
  }

  // Visitor form validation and submission
  const validateField = (field: 'name' | 'email', val: string) => {
    const nextErrors = { ...formErrors }
    if (field === 'name') {
      const trimmed = val.trim()
      if (!trimmed) {
        nextErrors.name = 'Please tell me your first name.'
      } else if (trimmed.length > RESOURCE_DOWNLOAD_LIMITS.NAME_MAX) {
        nextErrors.name = `Name must not exceed ${RESOURCE_DOWNLOAD_LIMITS.NAME_MAX} characters.`
      } else {
        delete nextErrors.name
      }
    } else if (field === 'email') {
      const trimmed = val.trim().toLowerCase()
      if (!trimmed) {
        nextErrors.email = 'A valid email is required.'
      } else if (trimmed.length > RESOURCE_DOWNLOAD_LIMITS.EMAIL_MAX) {
        nextErrors.email = `Email must not exceed ${RESOURCE_DOWNLOAD_LIMITS.EMAIL_MAX} characters.`
      } else if (!EMAIL_REGEX.test(trimmed)) {
        nextErrors.email = 'Please enter a valid email address.'
      } else {
        delete nextErrors.email
      }
    }
    setFormErrors(nextErrors)
    return nextErrors
  }

  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const nameErr = validateField('name', name)
    const emailErr = validateField('email', email)
    if (nameErr.name) {
      nameInputRef.current?.focus()
      return
    }
    if (emailErr.email) {
      emailInputRef.current?.focus()
      return
    }

    setIsSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/resources/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: resource.slug,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          website: website.trim(),
          intendedUse: intendedUse || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.ok) {
        setServerError(getDownloadErrorMessage(res.status, data.error))
        setIsSubmitting(false)
        return
      }

      const confirmedEmail = data.email ? data.email : email.trim().toLowerCase()
      const confirmedFirstName = data.email
        ? (data.firstName || getFirstName(name))
        : getFirstName(name)
      const confirmedIsMember = Boolean(data.email)

      setSecondsRemaining(data.expiresInSeconds || 60)
      setSuccessState({
        isMember: confirmedIsMember,
        firstName: confirmedFirstName,
        email: confirmedEmail,
        delivery: data.delivery || resource.delivery_type,
        url: data.url || '',
        expiresInSeconds: data.expiresInSeconds || 60,
      })
      setIsSubmitting(false)
      transitionTo('success')
    } catch {
      setServerError('Something went wrong. Please try again in a moment.')
      setIsSubmitting(false)
    }
  }

  // Construct sub-line for small resource card: kind label + first fact
  const kindText = kindLabel(resource.kind)
  const firstFact = resource.details?.facts?.[0]
  const cardSubLine = firstFact
    ? `${kindText} - ${firstFact.value} ${firstFact.label}`.trim()
    : kindText

  const contextValue: ResourceFlowContextType = {
    currentView,
    startFlow,
    returnToDetail,
    isSubmitting,
    isMember,
    memberError,
    ctaText: labels.open,
  }

  return (
    <ResourceFlowContext.Provider value={contextValue}>
      {/* 1. Detail View: rendered as children, hidden when in form or success */}
      <div hidden={currentView !== 'detail'} aria-hidden={currentView !== 'detail'}>
        {children}
      </div>

      {/* 2. Form View (visitors only) */}
      {currentView === 'form' && (
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24 font-sans text-[#232536]">
          {/* Back link */}
          <button
            type="button"
            onClick={returnToDetail}
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#5C5F73] hover:text-[#232536] transition cursor-pointer mb-6"
          >
            <ArrowLeft
              size={16}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
            />
            <span>Back to the resource</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left Column: Heading and Resource Preview */}
            <div>
              <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EF5B45]/10 text-[#CF3F29] mb-3">
                ALMOST THERE
              </span>
              <h1
                ref={formHeadingRef}
                tabIndex={-1}
                className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight mb-3 leading-[1.14] outline-none"
              >
                Where should I send it?
              </h1>
              <p className="text-base sm:text-lg text-[#5C5F73] leading-relaxed mb-6">
                {resource.delivery_type === 'file'
                  ? 'You will get the download straight away on the next screen, and a copy of the link by email so you can find it later.'
                  : 'You will get the template straight away on the next screen, and a copy of the link by email so you can find it later.'}
              </p>

              {/* Small resource card */}
              <div className="bg-white border border-[#F0E4D2] rounded-2xl p-4 sm:p-5 flex items-center gap-4 shadow-xs">
                <div className="relative w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border border-[#F0E4D2] bg-[#FAF3E8]/60 flex items-center justify-center shrink-0">
                  {resource.cover_image_url ? (
                    <Image
                      src={resource.cover_image_url}
                      alt={resource.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-12 h-9 grid grid-cols-3 gap-1 p-1">
                      <div className="bg-[#EF5B45] rounded-xs" />
                      <div className="bg-[#232536] rounded-xs" />
                      <div className="bg-[#CF3F29] rounded-xs" />
                      <div className="col-span-2 bg-[#F0E4D2] rounded-xs" />
                      <div className="bg-[#FAF3E8] rounded-xs" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <b className="block font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536] truncate">
                    {resource.title}
                  </b>
                  <p className="text-xs sm:text-sm text-[#5C5F73] mt-0.5">
                    {cardSubLine}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Form card */}
            <div className="bg-white border border-[#F0E4D2] rounded-2xl p-6 sm:p-8 shadow-xs">
              <form onSubmit={handleVisitorSubmit} noValidate>
                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <label htmlFor="website">Website</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                {serverError && (
                  <div
                    role="alert"
                    className="mb-5 p-4 rounded-xl border border-[#CF3F29]/30 bg-[#CF3F29]/5 text-[#CF3F29] text-sm leading-relaxed"
                  >
                    {serverError}
                  </div>
                )}

                {/* First name */}
                <div className="mb-4">
                  <label
                    htmlFor="fn"
                    className="block text-sm font-bold text-[#232536] mb-1.5"
                  >
                    First name
                  </label>
                  <input
                    ref={nameInputRef}
                    id="fn"
                    type="text"
                    autoComplete="given-name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (formErrors.name) validateField('name', e.target.value)
                    }}
                    onBlur={() => validateField('name', name)}
                    aria-invalid={Boolean(formErrors.name)}
                    className={`w-full min-h-[48px] px-4 rounded-xl border bg-[#FDF8F1] text-[#232536] placeholder-[#5C5F73]/50 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#CF3F29] ${
                      formErrors.name ? 'border-[#CF3F29]' : 'border-[#F0E4D2]'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1.5 text-xs font-semibold text-[#CF3F29]">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label
                    htmlFor="em"
                    className="block text-sm font-bold text-[#232536] mb-1.5"
                  >
                    Email
                  </label>
                  <input
                    ref={emailInputRef}
                    id="em"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="off"
                    enterKeyHint="send"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      if (formErrors.email) validateField('email', e.target.value)
                    }}
                    onBlur={() => validateField('email', email)}
                    aria-invalid={Boolean(formErrors.email)}
                    className={`w-full min-h-[48px] px-4 rounded-xl border bg-[#FDF8F1] text-[#232536] placeholder-[#5C5F73]/50 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#CF3F29] ${
                      formErrors.email ? 'border-[#CF3F29]' : 'border-[#F0E4D2]'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1.5 text-xs font-semibold text-[#CF3F29]">
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* How will you use it? (optional) */}
                <div className="mb-6">
                  <label
                    htmlFor="use"
                    className="block text-sm font-bold text-[#232536] mb-1.5"
                  >
                    How will you use it?{' '}
                    <span className="font-normal text-[#5C5F73]">(optional)</span>
                  </label>
                  <select
                    id="use"
                    value={intendedUse}
                    onChange={(e) => setIntendedUse(e.target.value)}
                    className="w-full min-h-[48px] px-4 rounded-xl border border-[#F0E4D2] bg-[#FDF8F1] text-[#232536] text-base transition-colors focus:outline-none focus:ring-2 focus:ring-[#CF3F29] cursor-pointer"
                  >
                    {INTENDED_USE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] px-8 py-3.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-base rounded-xl shadow-xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </span>
                  ) : (
                    labels.submit
                  )}
                </button>

                {/* Approved consent text v1 rendered from constant */}
                <p className="text-xs text-[#5C5F73] mt-3 leading-relaxed">
                  {consentParts[0]}
                  <Link
                    href="/privacy-policy"
                    className="underline hover:text-[#232536] transition-colors"
                  >
                    See the Privacy Policy
                  </Link>
                  .{consentParts[1] || ''}
                </p>

                {/* Sign-in link for existing members */}
                <div className="mt-5 pt-5 border-t border-[#F0E4D2] text-sm text-[#5C5F73]">
                  Already a member?{' '}
                  <Link
                    href={`/login?redirectTo=${encodeURIComponent(`/garden/resources/${resource.slug}`)}`}
                    className="font-semibold text-[#CF3F29] hover:underline transition-colors"
                  >
                    Sign in and skip this form
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </main>
      )}

      {/* 3. Success View (visitors after submit, members after click) */}
      {currentView === 'success' && successState && (
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 text-center font-sans text-[#232536]">
          <div className="max-w-2xl mx-auto">
            <ResourceConfetti />

            {/* Green tick circle */}
            <div
              className="w-16 h-16 rounded-full bg-[#EBF7F2] border-2 border-[#1E7E5A] text-[#1E7E5A] flex items-center justify-center mx-auto mb-6 shadow-xs animate-pop motion-reduce:animate-none"
              aria-hidden="true"
            >
              <svg
                className="w-8 h-8 stroke-current fill-none"
                viewBox="0 0 24 24"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            {/* Heading */}
            <h1
              ref={successHeadingRef}
              tabIndex={-1}
              className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight mb-3 leading-[1.14] outline-none"
            >
              {successState.isMember
                ? 'Welcome back. It is yours.'
                : `It is yours, ${successState.firstName}.`}
            </h1>

            {/* Line under heading */}
            <p className="text-base sm:text-lg text-[#5C5F73] leading-relaxed max-w-xl mx-auto mb-8">
              {successState.isMember ? (
                <>
                  You are signed in, so there is no form to fill. I have also sent the
                  link to{' '}
                  <strong className="font-bold text-[#232536]">
                    {successState.email}
                  </strong>
                  , in case you are not sure which address it went to.
                </>
              ) : (
                <>
                  I have also sent the link to{' '}
                  <strong className="font-bold text-[#232536]">
                    {successState.email}
                  </strong>{' '}
                  so you can find it later.
                </>
              )}
            </p>

            {/* Primary Action Button */}
            <div className="mb-10">
              {successState.delivery === 'link' ? (
                <a
                  href={successState.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center min-h-[48px] px-8 py-3.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-base rounded-xl shadow-xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
                >
                  {labels.success}
                </a>
              ) : (
                <div>
                  {secondsRemaining > 0 ? (
                    <>
                      <a
                        href={successState.url}
                        download
                        className="inline-flex items-center justify-center gap-2 min-h-[48px] px-8 py-3.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-base rounded-xl shadow-xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
                      >
                        <Download size={18} aria-hidden="true" />
                        <span>{labels.success}</span>
                      </a>
                      <p className="text-xs text-[#5C5F73] mt-2">
                        This link expires in {secondsRemaining} seconds.
                      </p>
                    </>
                  ) : (
                    <div>
                      <p className="text-sm text-[#CF3F29] font-semibold mb-3">
                        This download link has expired.
                      </p>
                      <button
                        type="button"
                        onClick={startFlow}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-sm rounded-xl shadow-xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
                      >
                        Get a new link
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Your next 10 minutes (success_steps) */}
          {resource.details?.success_steps &&
            resource.details.success_steps.length > 0 && (
              <div className="max-w-2xl mx-auto">
                <section
                  aria-label="Your next 10 minutes"
                  className="my-12 text-left pt-8 border-t border-[#F0E4D2]"
                >
                  <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-[#232536] mb-6 text-center">
                    Your next 10 minutes
                  </h2>
                  <ol className="space-y-3.5 list-none p-0 m-0">
                    {resource.details.success_steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="bg-white border border-[#F0E4D2] rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-xs"
                      >
                        <span
                          className="w-8 h-8 rounded-full bg-[#CF3F29] text-white font-['MTN_Brighter_Sans',_sans-serif] font-bold text-base flex items-center justify-center shrink-0 mt-0.5"
                          aria-hidden="true"
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <strong className="block text-base font-bold text-[#232536] mb-1">
                            {step.title}
                          </strong>
                          <p className="text-sm text-[#5C5F73] leading-relaxed">
                            {step.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            )}

          {/* Section: Read the thinking behind it (related) */}
          {resource.details?.related && resource.details.related.length > 0 && (
            <section
              aria-label="Read the thinking behind it"
              className="my-12 text-left pt-8 border-t border-[#F0E4D2] max-w-5xl mx-auto w-full"
            >
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-[#232536] mb-6 text-center">
                Read the thinking behind it
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {resource.details.related.map((item, idx) => (
                  <div key={idx} className="flex flex-col h-full text-left">
                    {item.label && (
                      <span className="block text-xs text-[#5C5F73] mb-1.5 font-medium">
                        {item.label}
                      </span>
                    )}
                    {item.post ? (
                      <div className="flex-1 flex flex-col min-w-0">
                        <PostCard post={item.post} />
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className="group block bg-white border border-[#F0E4D2] rounded-2xl p-5 shadow-xs hover:border-[#CF3F29]/40 transition cursor-pointer flex-1 flex flex-col justify-between"
                      >
                        <div>
                          <strong className="block font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536] group-hover:text-[#CF3F29] transition-colors leading-snug">
                            {item.title}
                          </strong>
                        </div>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Centered link back to all resources */}
          <p className="mt-10 max-w-2xl mx-auto">
            <Link
              href="/garden/resources"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5C5F73] hover:text-[#232536] transition cursor-pointer"
            >
              <span>Back to all resources</span>
            </Link>
          </p>
        </main>
      )}
    </ResourceFlowContext.Provider>
  )
}
