import SlidingAuthCard from '@/components/auth/SlidingAuthCard'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    error?: string
    message?: string
    mode?: string
    email?: string
  }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  const error = params.error
  const message = params.message
  const isSignupSuccess = params.mode === 'signup-success'
  const signupEmail = params.email
  const initialMode = params.mode === 'signup' ? 'signup' : 'signin'

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[#FDF8F1] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E8DCC4]">
      <SlidingAuthCard
        initialMode={initialMode}
        error={error}
        message={message}
        isSignupSuccess={isSignupSuccess}
        signupEmail={signupEmail}
      />
    </div>
  )
}
