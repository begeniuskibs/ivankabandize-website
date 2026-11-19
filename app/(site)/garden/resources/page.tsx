import type { Metadata } from 'next'
import { FileText } from 'lucide-react'
import GardenHubHero from '@/components/public/GardenHubHero'
import ResourcesShelfList from '@/components/public/ResourcesShelfList'
import { SITE_URL } from '@/lib/siteUrl'
import { getPublishedResources } from '@/lib/resources'

// Public shelf for downloadable resources
// House style: spaced hyphen " - " only

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

export default async function ResourcesPage() {
  const allResources = await getPublishedResources()

  // Empty state: keeps existing "Seeds are being packed" unchanged
  if (allResources.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
        <GardenHubHero
          title="Resources"
          intro="Templates and downloads you can put to work today."
          imageSrc="/garden-heroes/resources.jpg"
          breadcrumb={{
            parentLabel: 'The Garden',
            parentHref: '/garden',
            currentLabel: 'Resources',
          }}
        />

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
              Free templates and frameworks will land here. Members will be able
              to download them.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
      {/* Existing Garden Hero */}
      <GardenHubHero
        title="Resources"
        intro="Templates and downloads you can put to work today."
        imageSrc="/garden-heroes/resources.jpg"
        breadcrumb={{
          parentLabel: 'The Garden',
          parentHref: '/garden',
          currentLabel: 'Resources',
        }}
      />

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Short lead sentence under the hero */}
        <p className="text-base sm:text-lg text-[#5C5F73] max-w-2xl mb-8 leading-relaxed">
          Templates and guides I built for my own work first. Each one has its
          own page that tells you what it is, who it is for and how to use it, so
          you know before you download.
        </p>

        {/* Client-side filtered resource cards list */}
        <ResourcesShelfList resources={allResources} />
      </main>
    </div>
  )
}
