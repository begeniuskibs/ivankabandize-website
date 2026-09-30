import { createBrowserClient } from '@supabase/ssr'

export function createClient(options?: { remember?: boolean }) {
  const isBrowser = typeof window !== 'undefined'

  let remember = options?.remember
  if (isBrowser) {
    if (remember !== undefined) {
      if (remember) {
        const maxAge = 60 * 60 * 24 * 30
        document.cookie = `sb-remember=true; path=/; max-age=${maxAge}; SameSite=Lax${
          window.location.protocol === 'https:' ? '; Secure' : ''
        }`
      } else {
        document.cookie = `sb-remember=false; path=/; SameSite=Lax${
          window.location.protocol === 'https:' ? '; Secure' : ''
        }`
      }
    } else {
      const match = document.cookie.match(/(?:^|;\s*)sb-remember=([^;]+)/)
      if (match) {
        remember = match[1] === 'true'
      }
    }
  }

  const storage = isBrowser
    ? remember === false
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
        maxAge: remember === false ? undefined : 60 * 60 * 24 * 30,
      },
    }
  )
}
