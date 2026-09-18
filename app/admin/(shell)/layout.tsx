import React from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'

export const dynamic = 'force-dynamic'

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-[#FAFAF9] font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
      {/* Persistent Left Sidebar */}
      <AdminSidebar />

      {/* Main Management Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
