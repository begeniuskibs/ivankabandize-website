import { createClient } from '@/utils/supabase/server'

interface GetAuthenticatedOwnerOptions {
  checkMfa?: boolean
}

export async function getAuthenticatedOwner(options: GetAuthenticatedOwnerOptions = {}) {
  const { checkMfa = true } = options
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

  if (checkMfa && process.env.ADMIN_REQUIRE_MFA === 'true') {
    const { data: aalData, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (aalError || aalData?.currentLevel !== 'aal2') {
      return {
        supabase,
        user,
        isOwner: false,
        error: 'Forbidden: Multi-factor authentication (AAL2) required',
        status: 403 as const,
      }
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

export const requireOwner = getAuthenticatedOwner

