import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { signOut } from '@/app/auth/actions'

export default async function AccountPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect('/auth/login?error=Please+sign+in+to+access+your+account')
  }

  // Query matching user profile and member record from database
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: member } = await supabase
    .from('members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-md border border-gray-100 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Authenticated Account</h1>
            <p className="text-sm text-gray-500">Server-Side Session Verified</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Sign Out
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Supabase Auth Session (Server Component Verified)
            </h2>
            <div className="mt-2 bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-xs space-y-1">
              <div><span className="text-gray-500">User ID:</span> {user.id}</div>
              <div><span className="text-gray-500">Email:</span> {user.email}</div>
              <div><span className="text-gray-500">Role:</span> {user.role}</div>
              <div><span className="text-gray-500">Created:</span> {user.created_at}</div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              public.users Row (Auto-Created by Trigger)
            </h2>
            <div className="mt-2 bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-xs space-y-1">
              <div><span className="text-gray-500">ID:</span> {profile?.id ?? 'Not Found'}</div>
              <div><span className="text-gray-500">Full Name:</span> {profile?.full_name || '(empty)'}</div>
              <div><span className="text-gray-500">Role:</span> {profile?.role ?? 'N/A'}</div>
              <div><span className="text-gray-500">Is Owner:</span> {String(profile?.is_owner)}</div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              public.members Row (Auto-Created by Trigger)
            </h2>
            <div className="mt-2 bg-gray-50 p-4 rounded-md border border-gray-200 font-mono text-xs space-y-1">
              <div><span className="text-gray-500">Member ID:</span> {member?.id ?? 'Not Found'}</div>
              <div><span className="text-gray-500">User ID:</span> {member?.user_id ?? 'N/A'}</div>
              <div><span className="text-gray-500">Tier Status:</span> {member?.tier_status ?? 'N/A'}</div>
              <div><span className="text-gray-500">Signup Source:</span> {member?.signup_source || 'web'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
