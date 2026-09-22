import { createBrowserClient } from '@supabase/ssr'

export function createClient(options?: { remember?: boolean }) {
  const isBrowser = typeof window !== 'undefined'
  const storage = isBrowser
    ? options?.remember === false
      ? window.sessionStorage
      : window.localStorage
    : undefined

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        storage,
        persistSession: true,
      },
      cookieOptions: {
        maxAge: options?.remember === false ? undefined : 60 * 60 * 24 * 30,
      },
    }
  )
}
