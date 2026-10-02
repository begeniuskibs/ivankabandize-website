'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [isValidSession, setIsValidSession] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const supabase = createClient()

    // 1. Check for errors in searchParams (e.g. Supabase redirect errors)
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error || errorDescription) {
      if (isMounted) {
        setErrorMessage(
          errorDescription
            ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
            : 'This reset link is invalid or has expired.'
        )
        setIsValidSession(false)
        setVerifying(false)
      }
      return
    }

    // 2. Check for errors in URL hash fragment
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const hashError = hashParams.get('error')
      const hashErrorDesc = hashParams.get('error_description')
      if (hashError || hashErrorDesc) {
        if (isMounted) {
          setErrorMessage(
            hashErrorDesc
              ? decodeURIComponent(hashErrorDesc.replace(/\+/g, ' '))
              : 'This reset link is invalid or has expired.'
          )
          setIsValidSession(false)
          setVerifying(false)
        }
        return
      }
    }

    // 3. Listen to auth state changes for PASSWORD_RECOVERY or SIGNED_IN
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      if (event === 'PASSWORD_RECOVERY' || (session && event === 'SIGNED_IN')) {
        setIsValidSession(true)
        setVerifying(false)
        setErrorMessage(null)
      }
    })

    // 4. Also check current session directly
    const checkInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (!isMounted) return

        if (sessionError) {
          setErrorMessage('This reset link is invalid or has expired.')
          setIsValidSession(false)
        } else if (session) {
          setIsValidSession(true)
          setErrorMessage(null)
        } else {
          // If no session found immediately, allow brief grace period for hash / code parsing
          setTimeout(async () => {
            if (!isMounted) return
            const {
              data: { session: delayedSession },
            } = await supabase.auth.getSession()
            if (delayedSession) {
              setIsValidSession(true)
              setErrorMessage(null)
            } else {
              setIsValidSession(false)
              setErrorMessage('This reset link is invalid or has expired.')
            }
            setVerifying(false)
          }, 1200)
          return
        }
      } catch (err) {
        console.error('Session check error:', err)
        if (isMounted) {
          setErrorMessage('This reset link is invalid or has expired.')
          setIsValidSession(false)
        }
      } finally {
        if (isMounted) {
          setVerifying(false)
        }
      }
    }

    checkInitialSession()

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please try again.')
      return
    }

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setErrorMessage(error.message)
        setLoading(false)
        return
      }

      setSuccessMessage('Password reset successfully! Redirecting to sign in...')

      // Sign out to clear recovery session and ensure clean login with new credentials
      await supabase.auth.signOut()

      setTimeout(() => {
        router.push(
          '/login?message=' +
            encodeURIComponent('Password updated successfully. Please sign in with your new password.')
        )
      }, 1500)
    } catch (err) {
      console.error('Password update exception:', err)
      setErrorMessage('An unexpected error occurred while resetting your password. Please try again.')
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div className="text-center py-8">
        <div className="w-10 h-10 border-3 border-[#232536] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#5A5D70] font-sans">Verifying your reset link...</p>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#FDF0EE] text-[#EF5B45] border border-[#EF5B45]/20 flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>
        <div>
          <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
            Invalid or Expired Link
          </h2>
          <p className="mt-3 text-sm text-[#5A5D70] leading-relaxed font-sans">
            {errorMessage || 'This password reset link is invalid or has already been used.'}
          </p>
          <p className="mt-2 text-xs text-[#82869C] leading-relaxed font-sans">
            For security reasons, password reset links are single - use and expire quickly.
          </p>
        </div>
        <div className="pt-4 border-t border-[#F5ECDE] flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#232536] text-white hover:bg-black transition font-sans"
          >
            Request New Link
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FDF8F1] text-[#232536] border border-[#F5ECDE] hover:bg-white transition font-sans"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header Branding */}
      <div className="mb-6">
        <Link
          href="/garden"
          className="inline-block font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-[#232536] hover:opacity-80 transition tracking-tight"
        >
          The Garden
        </Link>
        <p className="text-xs uppercase tracking-widest font-semibold text-[#5A5D70] mt-1 font-sans">
          Set New Password
        </p>
      </div>

      <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] mb-2">
        Create new password
      </h2>
      <p className="text-sm text-[#5A5D70] mb-6 font-sans leading-relaxed">
        Please choose a strong password that is at least 6 characters long.
      </p>

      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-sans">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-sans">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1 font-sans"
            htmlFor="new-password"
          >
            New Password
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536] font-sans"
          />
        </div>

        <div>
          <label
            className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1 font-sans"
            htmlFor="confirm-password"
          >
            Confirm New Password
          </label>
          <input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536] font-sans"
          />
        </div>

        <button
          type="submit"
          disabled={loading || Boolean(successMessage)}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#232536] hover:bg-black transition shadow-sm font-sans cursor-pointer mt-2 disabled:opacity-50"
        >
          {loading ? 'Updating password...' : 'Update Password'}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-[#F5ECDE] text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-[#5A5D70] hover:text-[#232536] transition font-sans"
        >
          &larr; Cancel and return to Sign In
        </Link>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[#FDF8F1] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E8DCC4]">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-[#F5ECDE]">
        <Suspense
          fallback={
            <div className="text-center py-8">
              <div className="w-10 h-10 border-3 border-[#232536] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm text-[#5A5D70] font-sans">Loading...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
