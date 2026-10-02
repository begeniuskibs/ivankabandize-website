import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient(options?: { remember?: boolean }) {
  const cookieStore = await cookies()

  const rememberVal = cookieStore.get('sb-remember')?.value
  const isSessionOnly =
    options?.remember === false ||
    (options?.remember === undefined && rememberVal === 'false')
  const isRemembered =
    options?.remember === true ||
    (options?.remember === undefined && rememberVal === 'true')

  // If explicit remember option was passed (e.g. at login), set or update the sb-remember cookie
  if (options?.remember !== undefined) {
    try {
      if (options.remember === false) {
        cookieStore.set('sb-remember', 'false', {
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      } else if (options.remember === true) {
        cookieStore.set('sb-remember', 'true', {
          path: '/',
          maxAge: 60 * 60 * 24 * 30,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        })
      }
    } catch {
      // Ignored if called in read-only Server Component context
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
              const opts = { ...cookieOptions }
              if (isSessionOnly) {
                delete opts.maxAge
                delete opts.expires
              } else if (isRemembered) {
                opts.maxAge = 60 * 60 * 24 * 30
              }
              cookieStore.set(name, value, opts)
            })
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
