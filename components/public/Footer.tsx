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
      <div className="max-w-6xl mx-auto max-md:px-5 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between max-md:gap-8 gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <p className="font-['MTN_Brighter_Sans',_sans-serif] font-bold text-lg text-white">
            Ivan Kabandize<span className="text-[#EF5B45]">.</span>
          </p>
          <p className="text-[#8A8D9F] text-xs sm:text-sm">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>

        <div className="flex max-md:flex-col flex-wrap items-center justify-center max-md:gap-1 gap-6 font-medium max-md:w-full">
          <Link href="/workwithme" className="max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:px-2 max-md:py-1 hover:text-white transition">
            Work with Me
          </Link>
          <Link href="/me" className="max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:px-2 max-md:py-1 hover:text-white transition">
            Me
          </Link>
          <Link href="/garden" className="max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:px-2 max-md:py-1 hover:text-white transition">
            The Garden
          </Link>
          <Link href="/now" className="max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:px-2 max-md:py-1 hover:text-white transition">
            Now
          </Link>
          <Link href="/lets-talk" className="max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:px-2 max-md:py-1 hover:text-white transition">
            Contact
          </Link>
          {user ? (
            <>
              <Link href="/auth/account" className="max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:px-2 max-md:py-1 hover:text-white transition">
                {displayName}
              </Link>
              <form action={signOut} className="inline-flex items-center">
                <button
                  type="submit"
                  className="max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:px-2 max-md:py-1 hover:text-white transition text-xs sm:text-sm text-[#EF5B45] cursor-pointer font-medium"
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="max-md:min-h-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:px-2 max-md:py-1 hover:text-white transition text-xs sm:text-sm text-[#EF5B45]">
              Sign-in
            </Link>
          )}
        </div>
      </div>
    </footer>
  )
}
