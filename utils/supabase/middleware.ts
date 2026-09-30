import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return supabaseResponse
  }

  try {
    const rememberCookie = request.cookies.get('sb-remember')?.value
    const isSessionOnly = rememberCookie === 'false'
    const isRemembered = rememberCookie === 'true'

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = { ...options }
              if (isSessionOnly) {
                delete opts.maxAge
                delete opts.expires
              } else if (isRemembered) {
                opts.maxAge = 60 * 60 * 24 * 30
              }
              supabaseResponse.cookies.set(name, value, opts)
            })

            // Preserve the sb-remember cookie with the same lifetime rule
            if (isSessionOnly) {
              supabaseResponse.cookies.set('sb-remember', 'false', {
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            } else if (isRemembered) {
              supabaseResponse.cookies.set('sb-remember', 'true', {
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              })
            }
          },
        },
      }
    )

    await supabase.auth.getUser()
  } catch (err) {
    console.error('Middleware updateSession fallback:', err)
  }

  return supabaseResponse
}
