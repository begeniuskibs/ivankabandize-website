'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const trimmedEmail = email.trim()
      if (!trimmedEmail) {
        setError('Please enter your email address.')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const siteUrl =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_SITE_URL || 'https://ivankabandize.com'

      const redirectTo = `${siteUrl}/auth/reset-password`

      // We call resetPasswordForEmail
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        {
          redirectTo,
        }
      )

      if (resetError) {
        // Log on console for debugging, but never reveal if an account exists to user
        console.error('Password reset request error:', resetError.message)
      }

      // Always show the same success message regardless of whether the email exists
      setSubmitted(true)
    } catch (err) {
      console.error('Unexpected password reset error:', err)
      // Even on unexpected error, show the generic success state to avoid timing attacks / user enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[#FDF8F1] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E8DCC4]">
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-[#F5ECDE]">
        {submitted ? (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[#FDF0EE] text-[#EF5B45] border border-[#EF5B45]/20 flex items-center justify-center mx-auto text-2xl">
              ✉️
            </div>
            <div>
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                Check your email
              </h2>
              <p className="mt-3 text-sm text-[#5A5D70] leading-relaxed font-sans">
                If an account exists for{' '}
                <strong className="text-[#232536]">{email}</strong>, we have sent
                password reset instructions to it.
              </p>
              <p className="mt-2 text-xs text-[#82869C] leading-relaxed font-sans">
                Please check your inbox (and spam folder). The link will expire shortly for security.
              </p>
            </div>
            <div className="pt-4 border-t border-[#F5ECDE]">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#232536] text-white hover:bg-black transition font-sans"
              >
                &larr; Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
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
                Account Recovery
              </p>
            </div>

            <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] mb-2">
              Forgot your password?
            </h2>
            <p className="text-sm text-[#5A5D70] mb-6 font-sans leading-relaxed">
              Enter your registered email address and we will send you a secure link to reset your password.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-sans">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1 font-sans"
                  htmlFor="forgot-email"
                >
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536] font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#232536] hover:bg-black transition shadow-sm font-sans cursor-pointer mt-2 disabled:opacity-50"
              >
                {loading ? 'Sending link...' : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-[#F5ECDE] text-center">
              <Link
                href="/login"
                className="text-xs font-semibold text-[#5A5D70] hover:text-[#232536] transition font-sans"
              >
                &larr; Remember your password? Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
