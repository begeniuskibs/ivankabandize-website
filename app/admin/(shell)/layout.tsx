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
    <div className="min-h-screen flex bg-[#FAFAF9] font-sans selection:bg-[#F7C55C] selection:text-[#232536] relative md:bg-[linear-gradient(160deg,#FDF8F1,#F7EBDD)]">
      {/* Fixed soft background blobs for desktop glass look */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none hidden md:block z-0"
        style={{
          background:
            'radial-gradient(600px 420px at 78% 8%, rgba(247,197,92,.20), transparent 70%), radial-gradient(700px 500px at 30% 95%, rgba(70,96,200,.16), transparent 70%)',
        }}
      />

      {/* Persistent Left Sidebar */}
      <AdminSidebar initialCollapsed={initialCollapsed} />

      {/* Main Management Content Area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-x-hidden relative z-10">
        {children}
      </div>
    </div>
  )
}
