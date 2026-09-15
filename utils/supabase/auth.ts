import { createClient } from '@/utils/supabase/server'

export async function getAuthenticatedOwner() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      supabase,
      user: null,
      isOwner: false,
      error: 'Unauthorized: Authentication required',
      status: 401 as const,
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_owner')
    .eq('id', user.id)
    .single()

  if (!profile || (!profile.is_owner && profile.role !== 'owner')) {
    return {
      supabase,
      user,
      isOwner: false,
      error: 'Forbidden: Owner privileges required',
      status: 403 as const,
    }
  }

  return {
    supabase,
    user,
    isOwner: true,
    error: null,
    status: 200 as const,
  }
}
