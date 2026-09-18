import SlidingAuthCard from '@/components/auth/SlidingAuthCard'
import { AUTH_IMAGE_POOL } from '@/components/auth/auth-images'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    error?: string
    message?: string
    mode?: string
    email?: string
    redirectTo?: string
  }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const error = params.error
  const message = params.message
  const isSignupSuccess = params.mode === 'signup-success'
  const signupEmail = params.email
  const initialMode = params.mode === 'signup' ? 'signup' : 'signin'
  const redirectTo = params.redirectTo

  // Pick a random image from the curated 12-image pool on every request
  const randomIndex = Math.floor(Math.random() * AUTH_IMAGE_POOL.length)
  const selectedImage = AUTH_IMAGE_POOL[randomIndex]

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[#FDF8F1] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E8DCC4]">
      <SlidingAuthCard
        initialMode={initialMode}
        error={error}
        message={message}
        isSignupSuccess={isSignupSuccess}
        signupEmail={signupEmail}
        selectedImage={selectedImage}
        redirectTo={redirectTo}
      />
    </div>
  )
}
