'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { signOut } from '@/app/auth/actions'

interface SidebarItem {
  label: string
  href?: string
  icon: string
  badge?: string
  isExternal?: boolean
  isDeferred?: boolean
  subItems?: { label: string; href: string }[]
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [newInquiriesCount, setNewInquiriesCount] = useState<number>(0)
  const [userData, setUserData] = useState<{
    fullName: string
    email: string
    initials: string
    role: string
  }>({
    fullName: 'Ivan Kabandize',
    email: 'ivan@ivankabandize.com',
    initials: 'IK',
    role: 'Owner',
  })

  const accountMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const email = user.email || 'ivan@ivankabandize.com'
          const { data: profile } = await supabase
            .from('users')
            .select('full_name, role')
            .eq('id', user.id)
            .maybeSingle()

          const fullName =
            profile?.full_name?.trim() ||
            (user.user_metadata?.full_name as string)?.trim() ||
            'Ivan Kabandize'

          const initials = fullName
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase() || 'IK'

          setUserData({
            fullName,
            email,
            initials,
            role: profile?.role === 'owner' ? 'Owner' : 'Owner',
          })

          const { count } = await supabase
            .from('inquiries')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'new')

          if (typeof count === 'number') {
            setNewInquiriesCount(count)
          }
        }
      } catch (err) {
        console.error('Failed to load user in sidebar', err)
      }
    }

    loadUser()
  }, [])

  // Auto-refresh new inquiries count on focus or status update event
  useEffect(() => {
    async function refreshInquiriesCount() {
      try {
        const supabase = createClient()
        const { count } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new')

        if (typeof count === 'number') {
          setNewInquiriesCount(count)
        }
      } catch (err) {
        console.error('Failed to refresh inquiries count', err)
      }
    }

    window.addEventListener('inquiries-updated', refreshInquiriesCount)
    window.addEventListener('focus', refreshInquiriesCount)
    return () => {
      window.removeEventListener('inquiries-updated', refreshInquiriesCount)
      window.removeEventListener('focus', refreshInquiriesCount)
    }
  }, [])

  // Close account popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(e.target as Node)
      ) {
        setIsAccountMenuOpen(false)
      }
    }

    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAccountMenuOpen])

  const mainNav: SidebarItem[] = [
    {
      label: 'Analytics',
      href: '/admin/analytics',
      icon: '📊',
    },
    {
      label: 'Network',
      icon: '🌐',
      isDeferred: true,
      badge: 'later',
    },
    {
      label: 'View site',
      href: '/',
      icon: '↗',
      isExternal: true,
    },
  ]

  const contentNav: SidebarItem[] = [
    {
      label: 'Posts',
      href: '/admin/posts',
      icon: '📝',
      subItems: [
        { label: 'Drafts', href: '/admin/posts?status=draft' },
        { label: 'Scheduled', href: '/admin/posts?status=scheduled' },
        { label: 'Published', href: '/admin/posts?status=published' },
      ],
    },
    {
      label: 'Pages',
      href: '/admin/pages',
      icon: '📄',
    },
    {
      label: 'Tags',
      href: '/admin/tags',
      icon: '🏷️',
    },
    {
      label: 'Members',
      href: '/admin/members',
      icon: '👥',
    },
    {
      label: 'Comments',
      href: '/admin/comments',
      icon: '💬',
    },
    {
      label: 'Enquiries',
      href: '/admin/enquiries',
      icon: '📬',
      badge: newInquiriesCount > 0 ? String(newInquiriesCount) : undefined,
    },
  ]

  const automationsNav: SidebarItem[] = [
    {
      label: 'Automations',
      icon: '⚡',
      isDeferred: true,
      badge: 'later',
    },
  ]

  const bottomNav: SidebarItem[] = [
    {
      label: 'Settings',
      href: '/admin/settings',
      icon: '⚙️',
    },
    {
      label: 'Help & Docs',
      href: '/admin/help',
      icon: '❓',
    },
  ]

  function isItemActive(item: SidebarItem): boolean {
    if (!item.href) return false
    if (item.href === '/admin/posts') {
      return pathname.startsWith('/admin/posts') && !pathname.includes('/editor')
    }
    if (item.href === '/admin/pages') {
      return pathname.startsWith('/admin/pages') && !pathname.includes('/edit')
    }
    if (item.href === '/admin/enquiries') {
      return pathname.startsWith('/admin/enquiries')
    }
    return pathname === item.href
  }

  return (
    <aside className="w-64 bg-[#191A23] text-[#E0E2EC] flex flex-col shrink-0 border-r border-[#262837] select-none min-h-screen relative">
      {/* 1. Wordmark */}
      <div className="p-5 pb-4 border-b border-[#262837]/60 flex items-center justify-between">
        <Link href="/admin/pages" className="group flex items-center gap-1">
          <span className="font-['MTN_Brighter_Sans',_sans-serif] font-bold text-lg text-white tracking-tight group-hover:text-[#EF5B45] transition-colors">
            Ivan Kabandize<span className="text-[#EF5B45]">.</span>
          </span>
        </Link>
        <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-[#27293B] text-[#9A9DB2]">
          Admin
        </span>
      </div>

      {/* 2. Visual Search Bar */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#222432] border border-[#2D3042] text-xs text-[#82869C]">
          <div className="flex items-center gap-2">
            <span className="text-sm">🔍</span>
            <span>Search...</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-[#191A23] text-[#9A9DB2] border border-[#2D3042]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Navigation Groups (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {/* Top Group */}
        <div className="space-y-1">
          {mainNav.map((item) => renderNavItem(item, pathname, isItemActive(item)))}
        </div>

        {/* Content Group */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7287]">
            Content
          </div>
          <div className="space-y-1">
            {contentNav.map((item) => renderNavItem(item, pathname, isItemActive(item)))}
          </div>
        </div>

        {/* Automations Group */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7287]">
            Workflow
          </div>
          <div className="space-y-1">
            {automationsNav.map((item) => renderNavItem(item, pathname, isItemActive(item)))}
          </div>
        </div>

        {/* Bottom Group */}
        <div>
          <div className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#6E7287]">
            System
          </div>
          <div className="space-y-1">
            {bottomNav.map((item) => renderNavItem(item, pathname, isItemActive(item)))}
          </div>
        </div>
      </div>

      {/* 7. Clickable Account Footer & Popover Menu */}
      <div className="p-3 border-t border-[#262837] bg-[#15161E] relative" ref={accountMenuRef}>
        {/* Ghost-Style Popover Menu (Opens Upward) */}
        {isAccountMenuOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#222432] border border-[#2D3042] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            {/* Popover Header: Avatar, Name, Email */}
            <div className="p-3.5 pb-3 border-b border-[#2D3042] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#EF5B45] text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {userData.initials}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {userData.fullName}
                </div>
                <div className="text-[11px] text-[#8E92A6] truncate">
                  {userData.email}
                </div>
              </div>
            </div>

            {/* Section 1: What's new? & Profile */}
            <div className="p-1.5 space-y-0.5">
              <Link
                href="/admin/whats-new"
                onClick={() => setIsAccountMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#C5C8D8] hover:text-white hover:bg-[#2A2D3E] rounded-xl transition font-medium"
              >
                <span>✨</span>
                <span>What&apos;s new?</span>
              </Link>
              <Link
                href="/auth/account"
                onClick={() => setIsAccountMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#C5C8D8] hover:text-white hover:bg-[#2A2D3E] rounded-xl transition font-medium"
              >
                <span>👤</span>
                <span>Your profile</span>
              </Link>
            </div>

            <div className="h-[1px] bg-[#2D3042] mx-2" />

            {/* Section 2: Resources & Appearance */}
            <div className="p-1.5 space-y-0.5">
              <Link
                href="/admin/help"
                onClick={() => setIsAccountMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#C5C8D8] hover:text-white hover:bg-[#2A2D3E] rounded-xl transition font-medium"
              >
                <span>📖</span>
                <span>Resources &amp; guides</span>
              </Link>

              {/* Appearance Mode (Visual-only indicator) */}
              <div
                className="flex items-center justify-between px-3 py-2 text-xs text-[#7A7E94] rounded-xl cursor-default select-none"
                title="Theme switching is currently locked to Dark"
              >
                <div className="flex items-center gap-2.5">
                  <span>🌙</span>
                  <span>Appearance</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8E92A6]">
                  <span>Dark</span>
                  <span className="text-xs text-[#5D6176]">›</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] bg-[#2D3042] mx-2" />

            {/* Section 3: Sign Out */}
            <div className="p-1.5">
              <form action={signOut} className="w-full">
                <button
                  type="submit"
                  className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                >
                  <span>🚪</span>
                  <span>Sign out</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
          className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left cursor-pointer ${
            isAccountMenuOpen ? 'bg-[#222432]' : 'hover:bg-[#222432]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#EF5B45] text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
              {userData.initials}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {userData.fullName}
              </div>
              <div className="text-[11px] text-[#9A9DB2] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{userData.role}</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-[#82869C] px-1">
            <span className={`inline-block transition-transform duration-200 ${isAccountMenuOpen ? 'rotate-180 text-white' : ''}`}>
              ▲
            </span>
          </div>
        </button>
      </div>
    </aside>
  )
}

function renderNavItem(item: SidebarItem, pathname: string, active: boolean) {
  if (item.isDeferred) {
    return (
      <div
        key={item.label}
        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#5E6278] cursor-not-allowed opacity-60"
        title="Coming in a future sprint"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm opacity-50">{item.icon}</span>
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#222432] text-[#82869C]">
            {item.badge}
          </span>
        )}
      </div>
    )
  }

  if (item.isExternal) {
    return (
      <a
        key={item.label}
        href={item.href || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-[#B2B5C6] hover:text-white hover:bg-[#222432] transition group"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-[#82869C] group-hover:text-white transition-colors">{item.icon}</span>
          <span>{item.label}</span>
        </div>
        <span className="text-[11px] text-[#6E7287] group-hover:text-[#B2B5C6]">↗</span>
      </a>
    )
  }

  const href = item.href || '#'

  return (
    <div key={item.label} className="space-y-0.5">
      <Link
        href={href}
        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
          active
            ? 'bg-[#EF5B45] text-white font-semibold shadow-sm'
            : 'text-[#B2B5C6] hover:text-white hover:bg-[#222432]'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-sm ${active ? 'text-white' : 'text-[#82869C]'}`}>
            {item.icon}
          </span>
          <span>{item.label}</span>
        </div>
        {item.badge && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
              active ? 'bg-white/20 text-white' : 'bg-[#27293B] text-[#9A9DB2]'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>

      {/* Sub items if present and active */}
      {active && item.subItems && (
        <div className="pl-8 pr-2 py-1 space-y-1">
          {item.subItems.map((sub) => {
            const isSubActive = pathname === sub.href
            return (
              <Link
                key={sub.label}
                href={sub.href}
                className={`block px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                  isSubActive
                    ? 'text-white font-semibold bg-[#27293B]'
                    : 'text-[#9A9DB2] hover:text-white hover:bg-[#222432]'
                }`}
              >
                {sub.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
