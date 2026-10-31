'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft } from 'lucide-react'
import { signIn, signUp } from '@/app/auth/actions'
import GoogleSignInButton from '@/components/auth/GoogleSignInButton'
import { AuthImage, AUTH_IMAGE_POOL } from '@/components/auth/auth-images'

interface AuthCardProps {
  initialMode?: 'signin' | 'signup'
  error?: string
  message?: string
  isSignupSuccess?: boolean
  signupEmail?: string
  selectedImage?: AuthImage
  redirectTo?: string
}

export default function SlidingAuthCard({
  initialMode = 'signin',
  error,
  message,
  isSignupSuccess = false,
  signupEmail = '',
  selectedImage = AUTH_IMAGE_POOL[0],
  redirectTo,
}: AuthCardProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup')
  const [isSwappingToSignUp, setIsSwappingToSignUp] = useState(false)
  const [isSwappingToSignIn, setIsSwappingToSignIn] = useState(false)

  const handleToggleMode = () => {
    const nextIsSignUp = !isSignUp
    setIsSignUp(nextIsSignUp)
    setIsSwappingToSignUp(nextIsSignUp)
    setIsSwappingToSignIn(!nextIsSignUp)
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsSwappingToSignUp(false)
          setIsSwappingToSignIn(false)
        })
      })
    } else {
      setIsSwappingToSignUp(false)
      setIsSwappingToSignIn(false)
    }
  }

  if (isSignupSuccess) {
    return (
      <div className="w-full max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-[#F5ECDE] text-center space-y-6">
        <Image
          src="/icons/3d/mail.svg"
          alt=""
          width={56}
          height={56}
          className="w-14 h-14 object-contain mx-auto my-1 drop-shadow-md"
          aria-hidden="true"
          unoptimized
        />
        <div>
          <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-[#232536]">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-[#5A5D70] leading-relaxed font-sans">
            We sent a confirmation link to{' '}
            {signupEmail ? <strong className="text-[#232536]">{signupEmail}</strong> : 'your email address'}.
          </p>
          <p className="mt-2 text-sm text-[#5A5D70] leading-relaxed font-sans">
            Please click the link in that email to confirm your account before signing in.
          </p>
        </div>
        <div className="pt-4 border-t border-[#F5ECDE]">
          <Link
            href="/login"
            className="group inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#232536] text-white hover:bg-black transition font-sans"
          >
            <ArrowLeft
              size={14}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
            />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#F5ECDE] min-h-[660px] max-md:min-h-0 max-md:grid max-md:grid-cols-1">
      {/* 
        DESKTOP TWO-PANEL SLIDING ARCHITECTURE:
        1. Form Container (takes 50% width on left, shifts to right on Sign Up)
        2. Overlay Panel (takes 50% width on right, shifts to left on Sign Up)
      */}

      {/* --- FORM SECTION --- */}
      <div
        className={`w-full md:w-1/2 min-h-[660px] p-8 sm:p-12 flex flex-col justify-center transition-transform duration-700 ease-in-out bg-white z-10 ${
          isSignUp ? 'md:translate-x-full' : 'md:translate-x-0'
        } max-md:min-h-0 max-md:p-6 max-md:motion-reduce:transition-none max-md:motion-reduce:translate-y-0 ${
          isSignUp ? 'max-md:order-2' : 'max-md:order-1'
        } ${
          isSwappingToSignUp
            ? 'max-md:transition-none max-md:-translate-y-[210px]'
            : isSwappingToSignIn
              ? 'max-md:transition-none max-md:translate-y-[210px]'
              : 'max-md:transition-transform max-md:duration-500 max-md:ease-in-out max-md:translate-y-0'
        }`}
      >
        <div className="w-full max-w-sm mx-auto">
          {/* Header Branding */}
          <div className="mb-6">
            <Link
              href="/garden"
              className="inline-block font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-[#232536] hover:opacity-80 transition tracking-tight"
            >
              The Garden
            </Link>
            <p className="text-xs uppercase tracking-widest font-semibold text-[#5A5D70] mt-1 font-sans">
              {isSignUp ? 'Join the community' : 'Member access'}
            </p>
          </div>

          {/* Dynamic Headline */}
          <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] mb-2">
            {isSignUp ? 'Create your account' : 'Sign In'}
          </h2>
          <p className="text-sm text-[#5A5D70] mb-6 font-sans">
            {isSignUp
              ? 'Create a free account to follow along as the garden grows.'
              : 'Enter your credentials to continue.'}
          </p>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-sans">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-xs sm:text-sm font-sans">
              {message}
            </div>
          )}

          {/* Google OAuth Button */}
          <GoogleSignInButton redirectTo={redirectTo} />
          {isSignUp && (
            <p className="mt-2 text-center text-sm text-[#5C5F73] font-sans">
              By creating an account you agree to the{' '}
              <Link
                href="/privacy-policy"
                className="text-[#CF3F29] hover:text-[#b83420] underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          )}

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F5ECDE]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider">
              <span className="bg-white px-3 font-semibold text-[#5A5D70] font-sans">
                Or with email
              </span>
            </div>
          </div>

          {/* Sign Up Form */}
          {isSignUp ? (
            <form className="space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo || ''} />
              <div>
                <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1 font-sans" htmlFor="card-signup-name">
                  Full Name
                </label>
                <input
                  id="card-signup-name"
                  name="full_name"
                  type="text"
                  required
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536] font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1 font-sans" htmlFor="card-signup-email">
                  Email Address
                </label>
                <input
                  id="card-signup-email"
                  name="email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536] font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1 font-sans" htmlFor="card-signup-password">
                  Password
                </label>
                <input
                  id="card-signup-password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536] font-sans"
                />
              </div>

              <button
                formAction={signUp}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#232536] hover:bg-black transition shadow-sm font-sans cursor-pointer mt-2"
              >
                Create Account
              </button>
            </form>
          ) : (
            <form className="space-y-4">
              <input type="hidden" name="redirectTo" value={redirectTo || ''} />
              <div>
                <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1 font-sans" htmlFor="card-signin-email">
                  Email Address
                </label>
                <input
                  id="card-signin-email"
                  name="email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536] font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider font-sans" htmlFor="card-signin-password">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-[#EF5B45] hover:underline font-sans"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="card-signin-password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536] font-sans"
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#5A5D70] font-sans select-none" htmlFor="card-signin-remember">
                  <input
                    id="card-signin-remember"
                    name="remember"
                    type="checkbox"
                    className="rounded border-[#F5ECDE] text-[#232536] focus:ring-[#232536] h-4 w-4 accent-[#232536] cursor-pointer"
                  />
                  <span>Keep me signed in</span>
                </label>
              </div>

              <button
                formAction={signIn}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#232536] hover:bg-black transition shadow-sm font-sans cursor-pointer mt-2"
              >
                Sign In
              </button>
            </form>
          )}

          {!isSignUp && (
            <p className="mt-3 text-center text-sm text-[#5C5F73] font-sans">
              See our{' '}
              <Link
                href="/privacy-policy"
                className="text-[#CF3F29] hover:text-[#b83420] underline"
              >
                Privacy Policy
              </Link>
              .
            </p>
          )}

          {/* Mobile Switch Link */}
          <div className="mt-6 text-center md:hidden">
            <p className="text-xs text-[#5A5D70] font-sans">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={handleToggleMode}
                className="font-semibold text-[#EF5B45] hover:underline cursor-pointer ml-1"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* --- OVERLAY / IMAGE PANEL (Desktop: absolute top-0 right-0 w-1/2; Mobile: below) --- */}
      <div
        className={`w-full md:w-1/2 min-h-[320px] md:min-h-[660px] md:absolute md:top-0 md:right-0 md:h-full transition-transform duration-700 ease-in-out overflow-hidden z-20 ${
          isSignUp ? 'md:-translate-x-full' : 'md:translate-x-0'
        } max-md:min-h-[200px] max-md:h-[210px] max-md:relative max-md:motion-reduce:transition-none max-md:motion-reduce:translate-y-0 ${
          isSignUp ? 'max-md:order-1' : 'max-md:order-2'
        } ${
          isSwappingToSignUp
            ? 'max-md:transition-none max-md:translate-y-full'
            : isSwappingToSignIn
              ? 'max-md:transition-none max-md:-translate-y-full'
              : 'max-md:transition-transform max-md:duration-500 max-md:ease-in-out max-md:translate-y-0'
        }`}
      >
        {/* Background Image from Rotating Pool */}
        <Image
          src={selectedImage.src}
          alt={selectedImage.alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-1000 scale-105"
        />

        {/* Lighter Gradient Overlay for balanced photo visibility + text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14151E]/90 via-[#1E202B]/60 to-[#14151E]/70" />
        <div className="absolute inset-0 bg-[#14151E]/20 backdrop-blur-[0.5px]" />

        {/* Dynamic Overlay Content */}
        <div className="absolute inset-0 p-8 sm:p-12 flex flex-col justify-between text-white z-30 max-md:p-5 max-md:[&>div:last-child]:flex max-md:[&>div:last-child]:items-center max-md:[&>div:last-child]:justify-between max-md:[&>div:last-child]:gap-3 max-md:[&>div:last-child]:pt-2.5">
          {/* Top subtle badge with Photographer Credit */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#EF5B45] animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-[#FDF8F1]/80">
                Personal Knowledge &amp; Essays
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] font-mono text-[#FDF8F1]/50 tracking-wider">
              Photo: {selectedImage.photographer}
            </span>
          </div>

          {/* Central Message */}
          <div className="space-y-4 my-auto py-8 max-md:space-y-1 max-md:py-1">
            <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-[#FDF8F1] max-md:text-2xl">
              {isSignUp ? 'Hey friend,' : 'Welcome back,'}
            </h3>
            <p className="text-sm sm:text-base text-[#FDF8F1]/85 max-w-sm leading-relaxed font-sans max-md:text-xs max-md:leading-snug max-md:line-clamp-2">
              {isSignUp ? (
                <>
                  Create an account to join the garden. The Garden is a collection of my thinking and resources.
                  <br />
                  Email updates are on the way, and I will let you know when they start.
                </>
              ) : (
                'Sign in to manage your account and pick up where you left off.'
              )}
            </p>
          </div>

          {/* Bottom Switch Button (Desktop Toggle) */}
          <div className="hidden md:block pt-6 border-t border-white/15">
            <p className="text-xs text-[#FDF8F1]/70 mb-3 font-sans max-md:mb-0">
              {isSignUp ? 'Already registered?' : 'Need an account?'}
            </p>
            <button
              type="button"
              onClick={handleToggleMode}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider text-[#232536] bg-[#FDF8F1] hover:bg-white transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] max-md:min-h-[44px] max-md:px-4 max-md:py-2 max-md:shrink-0 max-md:motion-reduce:transition-none"
            >
              {isSignUp ? 'Switch to Sign In' : 'Create New Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
