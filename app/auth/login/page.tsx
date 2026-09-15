import { signIn, signUp } from '@/app/auth/actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    error?: string
    message?: string
    mode?: string
    email?: string
  }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const error = params.error
  const message = params.message
  const isSignupSuccess = params.mode === 'signup-success'
  const signupEmail = params.email

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF8F1] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-[#F5ECDE]">
        {/* Top Branding Header */}
        <div className="text-center">
          <Link href="/" className="font-['Fraunces',_Georgia,_serif] text-2xl font-semibold text-[#232536] hover:opacity-80 transition">
            Ivan Kabandize
          </Link>
          <p className="mt-2 text-xs uppercase tracking-widest font-semibold text-[#5A5D70]">
            Member Access &amp; Sign In
          </p>
        </div>

        {/* Post-Signup Success Message State */}
        {isSignupSuccess ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#FDF0EE] text-[#EF5B45] border border-[#EF5B45]/20 flex items-center justify-center mx-auto text-2xl">
              ✉️
            </div>

            <div>
              <h2 className="font-['Fraunces',_Georgia,_serif] text-2xl font-semibold text-[#232536]">
                Check your email
              </h2>
              <p className="mt-2 text-sm text-[#5A5D70] leading-relaxed">
                We sent a confirmation link to{' '}
                {signupEmail ? <strong className="text-[#232536]">{signupEmail}</strong> : 'your email address'}.
              </p>
              <p className="mt-2 text-sm text-[#5A5D70] leading-relaxed">
                Please click the link in that email to confirm your account before signing in.
              </p>
            </div>

            <div className="pt-4 border-t border-[#F5ECDE]">
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#232536] text-white hover:bg-black transition"
              >
                &larr; Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-2xl text-sm">
                {message}
              </div>
            )}

            <div className="space-y-6">
              {/* Sign In Form */}
              <div className="border-b border-[#F5ECDE] pb-6">
                <h3 className="font-['Fraunces',_Georgia,_serif] text-xl font-semibold text-[#232536] mb-4">
                  Sign In
                </h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1" htmlFor="signin-email">
                      Email address
                    </label>
                    <input
                      id="signin-email"
                      name="email"
                      type="email"
                      required
                      className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536]"
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1" htmlFor="signin-password">
                      Password
                    </label>
                    <input
                      id="signin-password"
                      name="password"
                      type="password"
                      required
                      className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536]"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    formAction={signIn}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-white bg-[#232536] hover:bg-black transition shadow-sm"
                  >
                    Sign In
                  </button>
                </form>
              </div>

              {/* Sign Up Form */}
              <div>
                <h3 className="font-['Fraunces',_Georgia,_serif] text-xl font-semibold text-[#232536] mb-4">
                  Create New Account
                </h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1" htmlFor="signup-name">
                      Full Name
                    </label>
                    <input
                      id="signup-name"
                      name="full_name"
                      type="text"
                      className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536]"
                      placeholder="Jane Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1" htmlFor="signup-email">
                      Email address
                    </label>
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      required
                      className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536]"
                      placeholder="newuser@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#5A5D70] uppercase tracking-wider mb-1" htmlFor="signup-password">
                      Password
                    </label>
                    <input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      className="w-full px-3.5 py-2.5 border border-[#F5ECDE] rounded-xl text-sm text-[#232536] bg-[#FDF8F1]/30 focus:outline-none focus:ring-1 focus:ring-[#232536]"
                      placeholder="••••••••"
                    />
                  </div>

                  <button
                    formAction={signUp}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-sm text-[#232536] bg-white border border-[#F5ECDE] hover:bg-[#FDF8F1] transition shadow-sm"
                  >
                    Create Account
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
