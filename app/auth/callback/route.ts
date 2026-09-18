import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  // 1. Check for cookie destination first, then query param fallback, then default
  const cookieStore = await cookies()
  const cookieRedirect = cookieStore.get('post_login_redirect')?.value
  const decodedCookieRedirect = cookieRedirect ? decodeURIComponent(cookieRedirect) : null

  let next =
    (decodedCookieRedirect && decodedCookieRedirect.startsWith('/') ? decodedCookieRedirect : null) ||
    searchParams.get('next') ||
    searchParams.get('redirectTo') ||
    '/auth/account'

  if (!next.startsWith('/')) {
    // protect against open redirect attacks
    next = '/auth/account'
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      const targetUrl = isLocalEnv
        ? `${origin}${next}`
        : forwardedHost
        ? `https://${forwardedHost}${next}`
        : `${origin}${next}`

      const response = NextResponse.redirect(targetUrl)
      // Delete the post_login_redirect cookie so it doesn't leak to future logins
      response.cookies.delete('post_login_redirect')
      return response
    }
  }

  // return the user to an error page with instructions
  const errorResponse = NextResponse.redirect(
    `${origin}/login?error=Could+not+authenticate+user+with+OAuth+provider${
      next !== '/auth/account' ? `&redirectTo=${encodeURIComponent(next)}` : ''
    }`
  )
  errorResponse.cookies.delete('post_login_redirect')
  return errorResponse
}
