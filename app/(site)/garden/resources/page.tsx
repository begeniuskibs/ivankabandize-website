import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import GardenHubHero from '@/components/public/GardenHubHero'
import { SITE_URL } from '@/lib/siteUrl'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Resources - The Garden',
  description: 'Templates and downloads you can put to work today.',
  alternates: {
    canonical: `${SITE_URL}/garden/resources`,
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ResourcesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
      {/* Hub Hero */}
      <GardenHubHero
        eyebrow="The Garden"
        title="Resources"
        intro="Templates and downloads you can put to work today."
        tone="cream"
        breadcrumb={{
          parentLabel: 'The Garden',
          parentHref: '/garden',
          currentLabel: 'Resources',
        }}
      />

      {/* Main Content: Empty State */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="border-2 border-dashed border-[#D5D8E8] bg-[#EEEFF6]/40 rounded-xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
          <div
            className="w-12 h-12 rounded-full bg-[#D5D8E8]/60 text-[#5C5F73] flex items-center justify-center mx-auto mb-4"
            aria-hidden="true"
          >
            <FileText className="w-6 h-6" />
          </div>
          <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-2">
            Seeds are being packed
          </h2>
          <p className="text-sm text-[#5C5F73] max-w-md mx-auto leading-relaxed">
            Free templates and frameworks will land here. Members will be able to download them.
          </p>
        </div>
      </main>
    </div>
  )
}

