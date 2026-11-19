'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Check, Download, ArrowRight } from 'lucide-react'
import {
  EMAIL_REGEX,
  RESOURCE_DOWNLOAD_LIMITS,
} from '@/lib/resourceDownload'
import { RESOURCE_CONSENT_TEXT } from '@/lib/resourceConsent'
import { ctaLabels, getDownloadErrorMessage } from '@/lib/resourceUi'

// Interactive download gate form and mobile sticky action bar
// House style: spaced hyphen " - " only

export interface ResourceDownloadFormProps {
  slug: string
  title: string
  kind?: string
  delivery?: 'file' | 'link'
}

export default function ResourceDownloadForm({
  slug,
  title,
  kind,
  delivery = 'file',
}: ResourceDownloadFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('') // Honeypot
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Success state
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [deliveryType, setDeliveryType] = useState<'file' | 'link'>(delivery)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(60)

  const nameInputRef = useRef<HTMLInputElement>(null)
  const emailInputRef = useRef<HTMLInputElement>(null)
  const successHeadingRef = useRef<HTMLHeadingElement>(null)

  // Validate fields pure helper
  const validateFields = (n: string, e: string) => {
    const nextErrors: { name?: string; email?: string } = {}
    const trimmedName = n.trim()
    if (!trimmedName) {
      nextErrors.name = 'Please enter your name.'
    } else if (trimmedName.length < RESOURCE_DOWNLOAD_LIMITS.NAME_MIN) {
      nextErrors.name = `Name must be at least ${RESOURCE_DOWNLOAD_LIMITS.NAME_MIN} characters.`
    } else if (trimmedName.length > RESOURCE_DOWNLOAD_LIMITS.NAME_MAX) {
      nextErrors.name = `Name must not exceed ${RESOURCE_DOWNLOAD_LIMITS.NAME_MAX} characters.`
    }

    const trimmedEmail = e.trim().toLowerCase()
    if (!trimmedEmail) {
      nextErrors.email = 'A valid email is required.'
    } else if (trimmedEmail.length > RESOURCE_DOWNLOAD_LIMITS.EMAIL_MAX) {
      nextErrors.email = `Email must not exceed ${RESOURCE_DOWNLOAD_LIMITS.EMAIL_MAX} characters.`
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address.'
    }

    return nextErrors
  }

  // Handle countdown timer once URL is issued (for file downloads only)
  useEffect(() => {
    if (!downloadUrl || deliveryType === 'link') return

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    // Move focus to success heading for screen readers
    successHeadingRef.current?.focus()

    return () => clearInterval(timer)
  }, [downloadUrl, deliveryType])

  // Move focus to success heading for link delivery
  useEffect(() => {
    if (downloadUrl && deliveryType === 'link') {
      successHeadingRef.current?.focus()
    }
  }, [downloadUrl, deliveryType])

  const handleBlur = (field: 'name' | 'email') => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const currentErrors = validateFields(name, email)
    setErrors((prev) => ({ ...prev, [field]: currentErrors[field] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    const formErrors = validateFields(name, email)
    setErrors(formErrors)
    setTouched({ name: true, email: true })

    if (formErrors.name) {
      nameInputRef.current?.focus()
      return
    }
    if (formErrors.email) {
      emailInputRef.current?.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/resources/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          website: website.trim(),
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setServerError(getDownloadErrorMessage(response.status, data?.error))
        setIsSubmitting(false)
        return
      }

      // Check honeypot response: ok:true without url is treated as generic failure
      if (!data?.url) {
        setServerError(getDownloadErrorMessage(500))
        setIsSubmitting(false)
        return
      }

      // Successful download / link generation
      setDeliveryType(data?.delivery === 'link' ? 'link' : 'file')
      setSecondsRemaining(60)
      setDownloadUrl(data.url)
      // Clear personal fields from component state
      setName('')
      setEmail('')
      setWebsite('')
      setErrors({})
      setTouched({})
    } catch {
      setServerError(getDownloadErrorMessage(null))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setDownloadUrl(null)
    setDeliveryType(delivery)
    setSecondsRemaining(60)
    setServerError(null)
    setName('')
    setEmail('')
    setWebsite('')
    setErrors({})
    setTouched({})
  }

  // Verbatim consent text with Privacy Policy link
  const consentParts = RESOURCE_CONSENT_TEXT.split('See the Privacy Policy.')

  // ================= SUCCESS PANEL =================
  if (downloadUrl) {
    if (deliveryType === 'link') {
      const labels = ctaLabels(kind, 'link')
      return (
        <div className="bg-white border border-[#F0E4D2] rounded-xl p-6 sm:p-10 shadow-sm max-w-xl mx-auto text-center motion-safe:transition-opacity">
          <div
            className="w-14 h-14 rounded-full bg-[#EBF7F2] text-[#1E7E5A] flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <Check className="w-7 h-7 stroke-[2.5]" />
          </div>

          <h2
            ref={successHeadingRef}
            tabIndex={-1}
            className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] outline-none mb-3"
          >
            It is yours.
          </h2>

          <p className="text-sm sm:text-base text-[#5C5F73] leading-relaxed max-w-md mx-auto mb-6">
            I have also sent the link to your inbox.
          </p>

          <div className="space-y-4">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] px-6 py-3.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-base rounded-md transition shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
            >
              <span>{labels.success}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </a>
          </div>
        </div>
      )
    }

    const isExpired = secondsRemaining === 0

    return (
      <div className="bg-white border border-[#F0E4D2] rounded-xl p-6 sm:p-10 shadow-sm max-w-xl mx-auto text-center motion-safe:transition-opacity">
        <div
          className="w-14 h-14 rounded-full bg-[#EBF7F2] text-[#1E7E5A] flex items-center justify-center mx-auto mb-4"
          aria-hidden="true"
        >
          <Check className="w-7 h-7 stroke-[2.5]" />
        </div>

        <h2
          ref={successHeadingRef}
          tabIndex={-1}
          className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] outline-none mb-3"
        >
          It is yours.
        </h2>

        <p className="text-sm sm:text-base text-[#5C5F73] leading-relaxed max-w-md mx-auto mb-6">
          Your download is ready. This button works for 60 seconds. We also email
          you a copy of the link, so check your spam folder if you do not see it.
        </p>

        {!isExpired ? (
          <div className="space-y-4">
            <a
              href={downloadUrl}
              rel="noopener"
              download
              className="inline-flex items-center justify-center gap-2 w-full min-h-[48px] px-6 py-3.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-base rounded-md transition shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
            >
              <Download className="w-5 h-5" aria-hidden="true" />
              <span>Download now</span>
            </a>

            <p
              className="text-xs text-[#5C5F73] font-medium"
              aria-live="polite"
            >
              Link expires in {secondsRemaining}s
            </p>
          </div>
        ) : (
          <div className="space-y-4 bg-[#FAF3E8]/80 p-5 rounded-lg border border-[#F0E4D2]">
            <p className="text-sm text-[#232536] font-medium leading-relaxed">
              That link has expired. Your emailed copy works for 24 hours, or you
              can ask for a new link.
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center justify-center min-h-[48px] px-6 py-2.5 bg-white border border-[#F0E4D2] hover:border-[#232536]/30 text-[#232536] font-bold text-sm rounded-md transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29]"
            >
              Get a new link
            </button>
          </div>
        )}
      </div>
    )
  }

  // ================= GATE FORM =================
  const currentCta = ctaLabels(kind, delivery)

  return (
    <div className="bg-white border border-[#F0E4D2] rounded-xl p-6 sm:p-10 shadow-sm max-w-xl mx-auto">
      <div className="mb-6">
        <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] mb-2">
          Get {title}
        </h2>
        <p className="text-sm text-[#5C5F73] leading-relaxed">
          Where should I send your download link?
        </p>
      </div>

      {serverError && (
        <div
          role="alert"
          className="p-3.5 mb-5 rounded-md bg-[#FDF0ED] border border-[#F6C6BC] text-sm text-[#CF3F29] font-medium leading-relaxed"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Honeypot field (hidden off-screen with CSS, never display:none) */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] opacity-0 h-0 w-0 pointer-events-none overflow-hidden"
        >
          <label htmlFor="resource-website">Website</label>
          <input
            id="resource-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {/* Name input */}
        <div>
          <label
            htmlFor="resource-name"
            className="block text-sm font-bold text-[#232536] mb-1.5"
          >
            Your name
          </label>
          <input
            id="resource-name"
            ref={nameInputRef}
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            onBlur={() => handleBlur('name')}
            aria-invalid={Boolean(touched.name && errors.name)}
            aria-describedby={
              touched.name && errors.name ? 'resource-name-error' : undefined
            }
            placeholder="e.g. Maya"
            className={`w-full min-h-[48px] px-4 py-3 rounded-md border text-base text-[#232536] bg-[#FDF8F1] focus:bg-white transition focus:outline-none focus:ring-2 ${
              touched.name && errors.name
                ? 'border-[#CF3F29] focus:ring-[#CF3F29]'
                : 'border-[#F0E4D2] focus:border-[#232536] focus:ring-[#232536]/20'
            }`}
          />
          <div aria-live="polite">
            {touched.name && errors.name && (
              <p
                id="resource-name-error"
                className="text-xs text-[#CF3F29] font-medium mt-1.5"
              >
                {errors.name}
              </p>
            )}
          </div>
        </div>

        {/* Email input */}
        <div>
          <label
            htmlFor="resource-email"
            className="block text-sm font-bold text-[#232536] mb-1.5"
          >
            Email
          </label>
          <input
            id="resource-email"
            ref={emailInputRef}
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email)
                setErrors((prev) => ({ ...prev, email: undefined }))
            }}
            onBlur={() => handleBlur('email')}
            aria-invalid={Boolean(touched.email && errors.email)}
            aria-describedby={
              touched.email && errors.email ? 'resource-email-error' : undefined
            }
            placeholder="you@domain.com"
            className={`w-full min-h-[48px] px-4 py-3 rounded-md border text-base text-[#232536] bg-[#FDF8F1] focus:bg-white transition focus:outline-none focus:ring-2 ${
              touched.email && errors.email
                ? 'border-[#CF3F29] focus:ring-[#CF3F29]'
                : 'border-[#F0E4D2] focus:border-[#232536] focus:ring-[#232536]/20'
            }`}
          />
          <div aria-live="polite">
            {touched.email && errors.email && (
              <p
                id="resource-email-error"
                className="text-xs text-[#CF3F29] font-medium mt-1.5"
              >
                {errors.email}
              </p>
            )}
          </div>
        </div>

        {/* Verbatim Consent Text */}
        <p className="text-xs text-[#5C5F73] leading-relaxed pt-1">
          {consentParts[0]}
          <Link
            href="/privacy-policy"
            className="text-[#CF3F29] hover:text-[#b83420] underline transition"
          >
            See the Privacy Policy
          </Link>
          .{consentParts[1] || ''}
        </p>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] px-6 py-3.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-base rounded-md transition shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <span>Getting your file...</span>
            </>
          ) : (
            <>
              <span>{currentCta.submit}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

/**
 * Mobile-only sticky bottom bar with title and action button.
 * Hides automatically when the form section is in view.
 */
export function ResourceStickyBar({
  title,
  kind,
  delivery = 'file',
  formTargetId = 'get',
}: {
  title: string
  kind?: string
  delivery?: 'file' | 'link'
  formTargetId?: string
}) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const target = document.getElementById(formTargetId)
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        // Hide bar when the form section is intersecting
        setIsVisible(!entry.isIntersecting)
      },
      { threshold: 0.1 }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [formTargetId])

  if (!isVisible) return null

  const currentCta = ctaLabels(kind, delivery)

  return (
    <aside
      aria-label="Quick download"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[#FDF8F1]/95 backdrop-blur-md border-t border-[#F0E4D2] p-3 px-4 shadow-lg motion-safe:transition-all"
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <p className="text-xs font-bold text-[#232536] truncate flex-1">
          {title}
        </p>
        <a
          href={`#${formTargetId}`}
          className="inline-flex items-center justify-center min-h-[48px] px-5 py-2.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-xs rounded-md shadow-sm transition whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#CF3F29]"
        >
          {currentCta.open}
        </a>
      </div>
    </aside>
  )
}
