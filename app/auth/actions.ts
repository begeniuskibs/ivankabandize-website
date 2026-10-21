'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { safeRedirectPath } from '@/lib/safeRedirect'

export async function signIn(formData: FormData) {
  const remember = formData.get('remember') === 'on' || formData.get('remember') === 'true'
  const supabase = await createClient({ remember })

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rawRedirect = formData.get('redirectTo')
  const targetUrl = safeRedirectPath(rawRedirect, '/auth/account')
  const safeRedirect = typeof rawRedirect === 'string' && rawRedirect ? safeRedirectPath(rawRedirect, '') : ''

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}${
        safeRedirect ? `&redirectTo=${encodeURIComponent(safeRedirect)}` : ''
      }`
    )
  }

  revalidatePath('/', 'layout')
  redirect(targetUrl)
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = (formData.get('full_name') as string) || ''
  const rawRedirect = formData.get('redirectTo')
  const targetUrl = safeRedirectPath(rawRedirect, '/auth/account')
  const safeRedirect = typeof rawRedirect === 'string' && rawRedirect ? safeRedirectPath(rawRedirect, '') : ''

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    const errorMsg = (error.message || '').toLowerCase()
    if (
      errorMsg.includes('already registered') ||
      errorMsg.includes('already been registered')
    ) {
      redirect(
        `/login?mode=signup-success&email=${encodeURIComponent(email)}${
          safeRedirect ? `&redirectTo=${encodeURIComponent(safeRedirect)}` : ''
        }`
      )
    }

    redirect(
      `/login?error=${encodeURIComponent(error.message)}${
        safeRedirect ? `&redirectTo=${encodeURIComponent(safeRedirect)}` : ''
      }`
    )
  }

  if (data?.session) {
    revalidatePath('/', 'layout')
    redirect(targetUrl)
  }

  // Redirect to clear post-signup confirmation state
  redirect(
    `/login?mode=signup-success&email=${encodeURIComponent(email)}${
      safeRedirect ? `&redirectTo=${encodeURIComponent(safeRedirect)}` : ''
    }`
  )
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  try {
    const cookieStore = await cookies()
    cookieStore.delete('sb-remember')
  } catch {
    // ignore if cookie store cannot be mutated
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

