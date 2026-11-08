import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { response, user, aal } = await updateSession(request)
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      const res = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      response.cookies.getAll().forEach((cookie) => {
        res.cookies.set(cookie)
      })
      return res
    }
  }

  if (pathname.startsWith('/admin')) {
    if (!user) {
      const redirectUrl = new URL('/login', request.url)
      const fullPath = pathname + request.nextUrl.search
      redirectUrl.searchParams.set('redirectTo', fullPath)
      const res = NextResponse.redirect(redirectUrl)
      response.cookies.getAll().forEach((cookie) => {
        res.cookies.set(cookie)
      })
      return res
    }

    if (process.env.ADMIN_REQUIRE_MFA === 'true') {
      const currentLevel = aal?.currentLevel
      const nextLevel = aal?.nextLevel

      if (currentLevel !== 'aal2') {
        if (nextLevel === 'aal2') {
          const challengeUrl = new URL('/auth/mfa-challenge', request.url)
          const fullPath = pathname + request.nextUrl.search
          challengeUrl.searchParams.set('redirectTo', fullPath)
          const res = NextResponse.redirect(challengeUrl)
          response.cookies.getAll().forEach((cookie) => {
            res.cookies.set(cookie)
          })
          return res
        } else if (pathname !== '/admin/security') {
          const securityUrl = new URL('/admin/security', request.url)
          const res = NextResponse.redirect(securityUrl)
          response.cookies.getAll().forEach((cookie) => {
            res.cookies.set(cookie)
          })
          return res
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
