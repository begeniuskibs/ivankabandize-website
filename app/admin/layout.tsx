import { redirect } from 'next/navigation'
import { getAuthenticatedOwner } from '@/utils/supabase/auth'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isOwner } = await getAuthenticatedOwner()

  if (!user) {
    redirect('/login?error=Please+sign+in+to+access+the+Admin+Console')
  }

  if (!isOwner) {
    redirect('/auth/account?error=Access+restricted.+Owner+privileges+required+for+Admin+Console.')
  }

  return <>{children}</>
}
