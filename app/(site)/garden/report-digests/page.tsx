import type { Metadata } from 'next'
import GardenHubHero from '@/components/public/GardenHubHero'
import DigestIndexView from '@/components/public/digests/DigestIndexView'
import { SITE_URL } from '@/lib/siteUrl'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report Digests - The Garden',
  description:
    'Plain-language summaries of the research leaders should read, with a button to get the original.',
  alternates: {
    canonical: `${SITE_URL}/garden/report-digests`,
  },
}

export default function ReportDigestsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
      {/* Hub Hero */}
      <GardenHubHero
        title="Report Digests"
        intro="I read the reports leaders keep meaning to read, and turn each one into something you can take in over a cup of tea. Every digest has a 2-minute version."
        imageSrc="/garden-heroes/digests.jpg"
        breadcrumb={{
          parentLabel: 'The Garden',
          parentHref: '/garden',
          currentLabel: 'Report Digests',
        }}
      />

      {/* Main Content: Digest Index View */}
      <main className="w-full">
        <DigestIndexView />
      </main>
    </div>
  )
}
