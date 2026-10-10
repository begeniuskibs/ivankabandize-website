import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/auth/actions'

export default async function Footer() {
  let displayName: string | null = null
  let user = null

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    user = error ? null : data?.user ?? null

    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle()

      displayName =
        profile?.full_name?.trim() ||
        (user.user_metadata?.full_name as string)?.trim() ||
        'Account'
    }
  } catch (err: unknown) {
    // Re-throw Next.js internal control flow errors (dynamic rendering / redirects)
    if (
      typeof err === 'object' &&
      err !== null &&
      'digest' in err &&
      typeof (err as { digest?: unknown }).digest === 'string' &&
      (err as { digest: string }).digest.startsWith('DYNAMIC_SERVER_USAGE')
    ) {
      throw err
    }
    // Fail gracefully to unauthenticated state on all runtime auth/network failures
    user = null
    displayName = null
  }

  return (
    <footer className="bg-[#232536] text-[#B8BAC9] py-14 mt-auto font-sans text-sm">
      <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center md:justify-between gap-8 md:gap-6">
        <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
          <p className="font-['MTN_Brighter_Sans',_sans-serif] font-bold text-lg text-white">
            Ivan Kabandize<span className="text-[#EF5B45]">.</span>
          </p>
          <p className="text-[#8A8D9F] text-xs sm:text-sm">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>

        <div className="flex flex-col md:flex-row md:flex-wrap items-center justify-center gap-1 md:gap-6 font-medium w-full md:w-auto">
          <Link href="/workwithme" className="min-h-[44px] flex items-center justify-center hover:text-white transition px-2 py-1">
            Work with Me
          </Link>
          <Link href="/me" className="min-h-[44px] flex items-center justify-center hover:text-white transition px-2 py-1">
            Me
          </Link>
          <Link href="/garden" className="min-h-[44px] flex items-center justify-center hover:text-white transition px-2 py-1">
            The Garden
          </Link>
          <Link href="/now" className="min-h-[44px] flex items-center justify-center hover:text-white transition px-2 py-1">
            Now
          </Link>
          <Link href="/lets-talk" className="min-h-[44px] flex items-center justify-center hover:text-white transition px-2 py-1">
            Contact
          </Link>
          {user ? (
            <>
              <Link href="/auth/account" className="min-h-[44px] flex items-center justify-center hover:text-white transition px-2 py-1">
                {displayName}
              </Link>
              <form action={signOut} className="inline-flex items-center">
                <button
                  type="submit"
                  className="min-h-[44px] flex items-center justify-center hover:text-white transition text-xs sm:text-sm text-[#EF5B45] cursor-pointer font-medium px-2 py-1"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="min-h-[44px] flex items-center justify-center hover:text-white transition text-xs sm:text-sm text-[#EF5B45] px-2 py-1">
              Sign-in
            </Link>
          )}
        </div>
      </div>
    </footer>
  )
}
