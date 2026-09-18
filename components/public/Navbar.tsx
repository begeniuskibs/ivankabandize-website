import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/auth/actions'

export default async function Navbar() {
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
    <header className="sticky top-0 z-50 bg-[#FDF8F1]/90 backdrop-blur-md border-b border-[#F5ECDE] font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo / Wordmark with trailing dot */}
        <Link
          href="/"
          className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#232536] hover:opacity-90 transition flex items-baseline"
        >
          <span>Ivan Kabandize</span>
          <span className="text-[#EF5B45] text-2xl sm:text-[26px] font-extrabold">.</span>
        </Link>

        {/* Navigation links */}
        <nav className="flex items-center gap-5 sm:gap-7 text-sm sm:text-[15px] font-semibold text-[#5A5D70]">
          <Link href="/workwithme" className="hover:text-[#232536] transition">
            Work with Me
          </Link>
          <Link href="/me" className="hover:text-[#232536] transition">
            Me
          </Link>
          <Link href="/garden" className="hover:text-[#232536] transition">
            The Garden
          </Link>
          <Link href="/now" className="hover:text-[#232536] transition">
            Now
          </Link>
          {user ? (
            <div className="flex items-center gap-5 sm:gap-7">
              <Link
                href="/auth/account"
                className="hover:text-[#232536] transition"
              >
                {displayName}
              </Link>
              <form action={signOut} className="inline-flex items-center">
                <button
                  type="submit"
                  className="text-[#EF5B45] hover:text-[#D94834] transition font-semibold text-sm sm:text-[15px] cursor-pointer"
                >
                  Sign Out
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-[#EF5B45] hover:text-[#D94834] transition"
            >
              Sign-in
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
