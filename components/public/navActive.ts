/**
 * Pure active route helpers shared between desktop NavLinks and MobileNav.
 * Exactly mirrors desktop NavLinks logic so navigation behavior is identical.
 */

export function isWorkActive(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === '/workwithme' || pathname.startsWith('/workwithme/')
}

export function isMeActive(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === '/me' || pathname.startsWith('/me/')
}

export function isGardenActive(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (
    pathname === '/garden' ||
    pathname.startsWith('/garden/') ||
    pathname === '/random-thoughts' ||
    pathname.startsWith('/random-thoughts/') ||
    pathname === '/structured-thoughts' ||
    pathname.startsWith('/structured-thoughts/') ||
    pathname === '/tools-for-thought' ||
    pathname.startsWith('/tools-for-thought/') ||
    pathname === '/library' ||
    pathname.startsWith('/library/') ||
    pathname === '/blog' ||
    pathname.startsWith('/blog/')
  )
}

export function isNowActive(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return pathname === '/now' || pathname.startsWith('/now/')
}

export function isAuthActive(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/')
  )
}
