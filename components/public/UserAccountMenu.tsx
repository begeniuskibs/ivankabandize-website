'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/auth/actions'

export function getInitials(name?: string | null, email?: string | null): string {
  const trimmedName = (name || '').trim()
  if (trimmedName) {
    const words = trimmedName.split(/\s+/).filter(Boolean)
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase()
    }
    if (words.length > 1) {
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase()
    }
  }
  const trimmedEmail = (email || '').trim()
  if (trimmedEmail) {
    return trimmedEmail.charAt(0).toUpperCase()
  }
  return 'U'
}

interface UserAccountMenuProps {
  displayName: string | null
  email: string | null
  isOwner: boolean
}

export default function UserAccountMenu({
  displayName,
  email,
  isOwner,
}: UserAccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const pathname = usePathname()

  const initials = getInitials(displayName, email)
  const fullName = displayName?.trim() || email || 'Account'

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Close menu on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsOpen(false)
        buttonRef.current?.focus()
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const menuItems = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
        if (!menuItems || menuItems.length === 0) return

        const itemsArray = Array.from(menuItems)
        const currentIndex = itemsArray.indexOf(document.activeElement as HTMLElement)

        if (e.key === 'ArrowDown') {
          const nextIndex = currentIndex + 1 < itemsArray.length ? currentIndex + 1 : 0
          itemsArray[nextIndex]?.focus()
        } else if (e.key === 'ArrowUp') {
          const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : itemsArray.length - 1
          itemsArray[prevIndex]?.focus()
        }
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleMenu = () => {
    setIsOpen((prev) => !prev)
  }

  return (
    <div className="relative inline-block text-left">
      {/* 36px Initials Circle Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={toggleMenu}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="w-9 h-9 rounded-full bg-[#232536] text-white text-[13px] font-semibold flex items-center justify-center cursor-pointer transition-all hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EF5B45] focus-visible:ring-offset-2 select-none shadow-sm"
      >
        {initials}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="account-menu-button"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-[16px] bg-white border border-[#F0E6D6] shadow-[0_10px_30px_rgba(35,37,54,0.10)] py-2 z-50 focus:outline-none"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#F0E6D6] mb-1">
            <p className="text-sm font-bold text-[#232536] truncate leading-tight">
              {fullName}
            </p>
            {email && (
              <p className="text-xs text-[#5A5D70] truncate mt-0.5">
                {email}
              </p>
            )}
          </div>

          {/* Role-based Links */}
          <div className="py-1">
            {isOwner && (
              <>
                <Link
                  href="/admin"
                  role="menuitem"
                  tabIndex={0}
                  className="block px-4 py-2 text-sm font-medium text-[#232536] hover:bg-[#FDF8F1] focus:bg-[#FDF8F1] focus:outline-none transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Admin Console
                </Link>
                <Link
                  href="/admin/posts/editor"
                  role="menuitem"
                  tabIndex={0}
                  className="block px-4 py-2 text-sm font-medium text-[#232536] hover:bg-[#FDF8F1] focus:bg-[#FDF8F1] focus:outline-none transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Write a post
                </Link>
              </>
            )}

            <Link
              href="/auth/account"
              role="menuitem"
              tabIndex={0}
              className="block px-4 py-2 text-sm font-medium text-[#232536] hover:bg-[#FDF8F1] focus:bg-[#FDF8F1] focus:outline-none transition-colors"
              onClick={() => setIsOpen(false)}
            >
              My account
            </Link>
          </div>

          {/* Divider */}
          <div className="border-t border-[#F0E6D6] my-1" />

          {/* Sign Out */}
          <div className="py-1">
            <form action={signOut} className="w-full">
              <button
                type="submit"
                role="menuitem"
                tabIndex={0}
                className="w-full text-left px-4 py-2 text-sm font-medium text-[#EF5B45] hover:bg-[#FDF8F1] focus:bg-[#FDF8F1] focus:outline-none transition-colors cursor-pointer"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
