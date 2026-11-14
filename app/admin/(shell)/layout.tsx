import React from 'react'
import { cookies } from 'next/headers'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'

export default async function AdminShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const initialCollapsed = cookieStore.get('admin_sidebar_collapsed')?.value === '1'

  return (
    <div className="min-h-screen flex bg-[#FAFAF9] font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
      {/* Persistent Left Sidebar */}
      <AdminSidebar initialCollapsed={initialCollapsed} />

      {/* Main Management Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
