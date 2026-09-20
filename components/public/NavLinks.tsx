'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserAccountMenu from './UserAccountMenu'

interface NavLinksProps {
  user: any
  displayName: string | null
  email?: string | null
  isOwner?: boolean
}

export default function NavLinks({
  user,
  displayName,
  email = null,
  isOwner = false,
}: NavLinksProps) {
  const pathname = usePathname()

  const isWorkActive = pathname === '/workwithme' || pathname.startsWith('/workwithme/')
  const isMeActive = pathname === '/me' || pathname.startsWith('/me/')
  const isGardenActive =
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
  const isNowActive = pathname === '/now' || pathname.startsWith('/now/')
  const isAuthActive =
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/signup' ||
    pathname.startsWith('/signup/')

  const standardLinkClass = (isActive: boolean) =>
    `transition ${
      isActive
        ? 'text-[#232536] underline decoration-2 decoration-[#EF5B45] underline-offset-[6px]'
        : 'text-[#5A5D70] hover:text-[#232536]'
    }`

  const signInClass = (isActive: boolean) =>
    `text-[#EF5B45] hover:text-[#D94834] transition ${
      isActive
        ? 'underline decoration-2 decoration-[#EF5B45] underline-offset-[6px]'
        : ''
    }`

  return (
    <nav className="flex items-center gap-5 sm:gap-7 text-sm sm:text-[15px] font-semibold">
      <Link
        href="/workwithme"
        className={standardLinkClass(isWorkActive)}
        {...(isWorkActive ? { 'aria-current': 'page' } : {})}
      >
        Work with Me
      </Link>
      <Link
        href="/me"
        className={standardLinkClass(isMeActive)}
        {...(isMeActive ? { 'aria-current': 'page' } : {})}
      >
        Me
      </Link>
      <Link
        href="/garden"
        className={standardLinkClass(isGardenActive)}
        {...(isGardenActive ? { 'aria-current': 'page' } : {})}
      >
        The Garden
      </Link>
      <Link
        href="/now"
        className={standardLinkClass(isNowActive)}
        {...(isNowActive ? { 'aria-current': 'page' } : {})}
      >
        Now
      </Link>
      {user ? (
        <UserAccountMenu
          displayName={displayName}
          email={email}
          isOwner={isOwner}
        />
      ) : (
        <Link
          href="/login"
          className={signInClass(isAuthActive)}
          {...(isAuthActive ? { 'aria-current': 'page' } : {})}
        >
          Sign-in
        </Link>
      )}
    </nav>
  )
}

