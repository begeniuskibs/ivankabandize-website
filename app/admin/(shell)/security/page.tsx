'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Trash2,
  Copy,
  Check,
  Loader2,
  ArrowLeft,
  Plus,
  AlertCircle,
  KeyRound,
} from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import Button from '@/components/Button'

interface FactorRecord {
  id: string
  friendly_name?: string
  factor_type: string
  status: string
  created_at: string
}

interface EnrollData {
  factorId: string
  qrCode: string
  secret: string
}

export default function AdminSecurityPage() {
  const [factors, setFactors] = useState<FactorRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  // Enrollment modal state
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [enrollFriendlyName, setEnrollFriendlyName] = useState('')
  const [enrollData, setEnrollData] = useState<EnrollData | null>(null)
  const [enrollCode, setEnrollCode] = useState('')
  const [enrollLoading, setEnrollLoading] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Removal modal state
  const [factorToRemove, setFactorToRemove] = useState<FactorRecord | null>(null)
  const [removeCode, setRemoveCode] = useState('')
  const [removeLoading, setRemoveLoading] = useState(false)
  const [removeError, setRemoveError] = useState<string | null>(null)

  const refreshFactors = useCallback(async () => {
    try {
      setLoading(true)
      setPageError(null)
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) {
        setPageError('Failed to load authentication factors. Please refresh the page.')
        return
      }

      const verified = ((data?.totp || []) as FactorRecord[]).filter(
        (f) => f.status === 'verified'
      )
      setFactors(verified)
    } catch {
      setPageError('Unexpected error loading security settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let ignore = false

    async function init() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (ignore) return
        if (error) {
          setPageError('Failed to load authentication factors. Please refresh the page.')
          setLoading(false)
          return
        }

        const verified = ((data?.totp || []) as FactorRecord[]).filter(
          (f) => f.status === 'verified'
        )
        setFactors(verified)
      } catch {
        if (!ignore) {
          setPageError('Unexpected error loading security settings.')
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    init()

    return () => {
      ignore = true
    }
  }, [])

  // Start enrollment
  async function handleStartEnrollment(e: React.FormEvent) {
    e.preventDefault()
    setEnrollLoading(true)
    setEnrollError(null)

    try {
      const supabase = createClient()
      const friendlyName =
        enrollFriendlyName.trim() ||
        (factors.length === 0 ? 'Primary Authenticator' : 'Secondary Authenticator')

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName,
      })

      if (error || !data || !data.totp) {
        setEnrollError(error?.message || 'Failed to start enrollment. Please try again.')
        setEnrollLoading(false)
        return
      }

      setEnrollData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      })
    } catch {
      setEnrollError('Failed to connect to authentication service.')
    } finally {
      setEnrollLoading(false)
    }
  }

  // Confirm enrollment
  async function handleConfirmEnrollment(e: React.FormEvent) {
    e.preventDefault()
    if (!enrollData) return

    const trimmed = enrollCode.trim()
    if (trimmed.length !== 6) {
      setEnrollError('Please enter the 6-digit code from your authenticator app.')
      return
    }

    setEnrollLoading(true)
    setEnrollError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId: enrollData.factorId,
        code: trimmed,
      })

      if (error) {
        setEnrollError('Invalid code. Please check your authenticator app and try again.')
        setEnrollLoading(false)
        return
      }

      // Enrollment completed successfully - wipe QR code and secret from state immediately
      setEnrollData(null)
      setEnrollCode('')
      setEnrollFriendlyName('')
      setIsEnrollModalOpen(false)
      setSuccessBanner('Authenticator device enrolled and verified successfully.')
      setTimeout(() => setSuccessBanner(null), 5000)
      await refreshFactors()
    } catch {
      setEnrollError('Verification failed. Please try again.')
    } finally {
      setEnrollLoading(false)
    }
  }

  // Cancel enrollment
  async function handleCancelEnrollment() {
    if (enrollData) {
      try {
        const supabase = createClient()
        await supabase.auth.mfa.unenroll({ factorId: enrollData.factorId })
      } catch {
        // Ignored cleanup error
      }
    }
    setEnrollData(null)
    setEnrollCode('')
    setEnrollFriendlyName('')
    setEnrollError(null)
    setIsEnrollModalOpen(false)
  }

  // Copy secret to clipboard
  async function handleCopySecret() {
    if (!enrollData?.secret) return
    try {
      await navigator.clipboard.writeText(enrollData.secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Ignored clipboard error
    }
  }

  // Confirm removal with fresh TOTP code
  async function handleConfirmRemoval(e: React.FormEvent) {
    e.preventDefault()
    if (!factorToRemove) return

    const trimmed = removeCode.trim()
    if (trimmed.length !== 6) {
      setRemoveError('Please enter the 6-digit code from your authenticator app.')
      return
    }

    setRemoveLoading(true)
    setRemoveError(null)

    try {
      const supabase = createClient()

      // Require fresh verification before unenrollment
      const { error: challengeError } = await supabase.auth.mfa.challengeAndVerify({
        factorId: factorToRemove.id,
        code: trimmed,
      })

      if (challengeError) {
        setRemoveError('Invalid code. Fresh verification is required to remove this device.')
        setRemoveLoading(false)
        return
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: factorToRemove.id,
      })

      if (unenrollError) {
        setRemoveError(unenrollError.message || 'Could not remove factor. Please try again.')
        setRemoveLoading(false)
        return
      }

      setFactorToRemove(null)
      setRemoveCode('')
      setSuccessBanner('Authenticator device removed successfully.')
      setTimeout(() => setSuccessBanner(null), 5000)
      await refreshFactors()
    } catch {
      setRemoveError('Failed to remove factor. Please try again.')
    } finally {
      setRemoveLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-gray-50/50">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 sm:px-10 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="text-gray-400 hover:text-gray-600 transition text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Settings</span>
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-base font-bold text-gray-900">
            Security - Two - Step Verification
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full px-6 sm:px-10 py-8 space-y-6">
        {pageError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{pageError}</span>
          </div>
        )}

        {successBanner && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-medium">
            <Check className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successBanner}</span>
          </div>
        )}

        {/* Status Card */}
        {loading ? (
          <div className="p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin mr-2" />
            <span className="text-xs font-semibold text-gray-500">
              Loading security factors...
            </span>
          </div>
        ) : factors.length > 0 ? (
          <div className="p-5 sm:p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900">
                    Two - Step Verification is enabled
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                  Sign in requests for the owner account require both your password (or Google OAuth) and a 6-digit verification code from your authenticator app.
                </p>
              </div>
            </div>

            {factors.length < 2 && (
              <Button
                variant="primary"
                onClick={() => {
                  setIsEnrollModalOpen(true)
                  setEnrollError(null)
                  setEnrollData(null)
                }}
                className="shrink-0 text-xs py-2 px-3.5"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span>Add backup device</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="p-5 sm:p-6 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Two - Step Verification is not set up
                </h2>
                <p className="text-xs text-gray-500 mt-1 max-w-xl leading-relaxed">
                  Add an authenticator app (such as Google Authenticator, 1Password, or Apple Passwords) to protect access to the Admin Console.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => {
                setIsEnrollModalOpen(true)
                setEnrollError(null)
                setEnrollData(null)
              }}
              className="shrink-0 text-xs py-2.5 px-4"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              <span>Enroll authenticator app</span>
            </Button>
          </div>
        )}

        {/* Devices List Card */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Enrolled Authenticator Devices
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Up to 2 devices can be registered so you can sign in with your primary phone or backup hardware.
              </p>
            </div>
            <span className="text-xs font-semibold text-gray-400">
              {factors.length} of 2 registered
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {factors.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">
                No authenticator apps enrolled yet. Click &quot;Enroll authenticator app&quot; to begin.
              </div>
            ) : (
              factors.map((factor) => (
                <div
                  key={factor.id}
                  className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-gray-900 truncate">
                        {factor.friendly_name || 'Authenticator Device'}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">
                        Added on{' '}
                        {factor.created_at
                          ? new Date(factor.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Recent'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                      <Check className="w-3 h-3" />
                      Verified
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFactorToRemove(factor)
                        setRemoveCode('')
                        setRemoveError(null)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                      title="Remove device"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Information Guidance Box */}
        <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm text-xs space-y-2">
          <h4 className="font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-gray-600" />
            <span>Account Recovery &amp; Safety Guidelines</span>
          </h4>
          <p className="text-gray-500 leading-relaxed">
            If you ever lose access to your authenticator devices, you can remove lost factors directly from your Supabase Dashboard under <strong>Authentication &gt; Users &gt; [Your Account] &gt; Multi-Factor Authentication</strong>.
          </p>
          <p className="text-gray-500 leading-relaxed">
            Ensure that <strong>MFA (TOTP)</strong> remains enabled in your Supabase Auth configuration settings.
          </p>
        </div>
      </main>

      {/* Enrollment Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-gray-200 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Enroll Authenticator App
            </h3>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Use Google Authenticator, 1Password, Apple Passwords, or any compatible TOTP app.
            </p>

            {enrollError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{enrollError}</span>
              </div>
            )}

            {!enrollData ? (
              <form onSubmit={handleStartEnrollment} className="space-y-4">
                <div>
                  <label htmlFor="device-name" className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Device name (optional)
                  </label>
                  <input
                    id="device-name"
                    type="text"
                    value={enrollFriendlyName}
                    onChange={(e) => setEnrollFriendlyName(e.target.value)}
                    placeholder="e.g. Primary iPhone, iPad Pro"
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Giving your device a friendly name helps you recognize it later.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCancelEnrollment}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={enrollLoading}
                    className="text-xs py-2 px-4"
                  >
                    {enrollLoading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating QR...
                      </span>
                    ) : (
                      'Generate QR Code'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmEnrollment} className="space-y-5">
                {/* QR Code Presentation */}
                <div className="flex flex-col items-center text-center">
                  <div className="p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs mb-3 inline-block">
                    {/* Render data uri QR code generated by Supabase */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={enrollData.qrCode}
                      alt="Authenticator QR Code"
                      className="w-44 h-44 object-contain mx-auto"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 max-w-xs">
                    Scan this QR code with your authenticator app camera.
                  </p>
                </div>

                {/* Secret Key Monospace Fallback */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1">
                    <span>Manual entry key:</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 transition cursor-pointer font-medium"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy key</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-gray-800 font-semibold tracking-wider break-all select-all">
                    {enrollData.secret}
                  </div>
                </div>

                {/* 6-Digit Code Confirmation */}
                <div>
                  <label htmlFor="confirm-code" className="block text-xs font-semibold text-gray-700 mb-1.5 text-center">
                    Enter the 6 - digit code from your app to confirm
                  </label>
                  <input
                    id="confirm-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    placeholder="000000"
                    value={enrollCode}
                    onChange={(e) => setEnrollCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black text-[#232536] transition"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEnrollment}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={enrollLoading || enrollCode.trim().length !== 6}
                    className="text-xs py-2 px-4"
                  >
                    {enrollLoading ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Activate'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Removal Modal */}
      {factorToRemove && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-gray-200 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              Remove Authenticator Device
            </h3>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              To confirm removal of &quot;{factorToRemove.friendly_name || 'this authenticator'}&quot;, enter the current 6 - digit code from your authenticator app.
            </p>

            {removeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{removeError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmRemoval} className="space-y-4">
              <div>
                <label htmlFor="removal-code" className="block text-xs font-semibold text-gray-700 mb-1.5 text-center">
                  Current 6 - digit code
                </label>
                <input
                  id="removal-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                  maxLength={6}
                  placeholder="000000"
                  value={removeCode}
                  onChange={(e) => setRemoveCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full text-center tracking-[0.4em] font-mono text-xl py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black text-[#232536] transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFactorToRemove(null)
                    setRemoveCode('')
                    setRemoveError(null)
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={removeLoading || removeCode.trim().length !== 6}
                  className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  {removeLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Confirm Removal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
