'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserAccountMenu from './UserAccountMenu'
import {
  isWorkActive,
  isMeActive,
  isGardenActive,
  isNowActive,
  isAuthActive,
} from './navActive'
import { openSearch } from './searchStore'

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
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  const workActive = isWorkActive(pathname)
  const meActive = isMeActive(pathname)
  const gardenActive = isGardenActive(pathname)
  const nowActive = isNowActive(pathname)
  const authActive = isAuthActive(pathname)

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
        className={standardLinkClass(workActive)}
        {...(workActive ? { 'aria-current': 'page' } : {})}
      >
        Work with Me
      </Link>
      <Link
        href="/me"
        className={standardLinkClass(meActive)}
        {...(meActive ? { 'aria-current': 'page' } : {})}
      >
        Me
      </Link>
      <Link
        href="/garden"
        className={standardLinkClass(gardenActive)}
        {...(gardenActive ? { 'aria-current': 'page' } : {})}
      >
        The Garden
      </Link>
      <Link
        href="/now"
        className={standardLinkClass(nowActive)}
        {...(nowActive ? { 'aria-current': 'page' } : {})}
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
          className={signInClass(authActive)}
          {...(authActive ? { 'aria-current': 'page' } : {})}
        >
          Sign-in
        </Link>
      )}

      {/* Desktop Search Button */}
      <button
        ref={searchButtonRef}
        type="button"
        onClick={() => openSearch(searchButtonRef.current)}
        aria-label="Search"
        className="w-[44px] h-[44px] min-w-[44px] min-h-[44px] rounded-[12px] bg-white border border-[#F0E4D2] flex items-center justify-center cursor-pointer shadow-sm hover:border-[#EF5B45]/40 hover:bg-[#FAF3E8] transition active:scale-95"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#232536"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </nav>
  )
}

