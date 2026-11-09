import type { Metadata } from 'next'
import { BookOpen } from 'lucide-react'
import GardenHubHero from '@/components/public/GardenHubHero'
import { SITE_URL } from '@/lib/siteUrl'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report Digests - The Garden',
  description:
    'Plain-language summaries of the research leaders should read, with a button to get the original.',
  alternates: {
    canonical: `${SITE_URL}/garden/report-digests`,
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ReportDigestsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
      {/* Hub Hero */}
      <GardenHubHero
        title="Report Digests"
        intro="Plain-language summaries of the research leaders should read, with a button to get the original."
        imageSrc="/garden-heroes/digests.jpg"
        breadcrumb={{
          parentLabel: 'The Garden',
          parentHref: '/garden',
          currentLabel: 'Report Digests',
        }}
      />

      {/* Main Content: Empty State */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="border-2 border-dashed border-[#EFDFB8] bg-[#FBF4E4]/40 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div
            className="w-12 h-12 rounded-full bg-[#EFDFB8]/60 text-[#A97B1A] flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-2">
            The first digest is still growing
          </h2>
          <p className="text-sm text-[#5C5F73] max-w-md mx-auto leading-relaxed">
            Each one will explain a major report in plain language, with a button to get the original.
          </p>
        </div>
      </main>
    </div>
  )
}

