import type { Metadata } from 'next'
import MfaChallengeClient from './MfaChallengeClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Two - Step Verification',
  robots: {
    index: false,
    follow: false,
  },
}

interface Props {
  searchParams: Promise<{
    redirectTo?: string
  }>
}

export default async function MfaChallengePage({ searchParams }: Props) {
  const params = await searchParams
  const redirectTo = params.redirectTo

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-[#FDF8F1] py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#E8DCC4]">
      <MfaChallengeClient redirectTo={redirectTo} />
    </div>
  )
}
