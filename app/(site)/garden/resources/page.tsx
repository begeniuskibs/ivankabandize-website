import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, FileText } from 'lucide-react'
import GardenHubHero from '@/components/public/GardenHubHero'
import { SITE_URL } from '@/lib/siteUrl'
import { getPublishedResources } from '@/lib/resources'
import { formatFileSize, kindLabel } from '@/lib/resourceUi'

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

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams?: Promise<{ kind?: string }>
}) {
  const { kind: requestedKind } = (await searchParams) || {}
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

  // Filter chips: only include kinds that exist in the published list
  const availableKinds = Array.from(new Set(allResources.map((r) => r.kind)))
  const activeKind =
    requestedKind && availableKinds.includes(requestedKind)
      ? requestedKind
      : null

  const visibleResources = activeKind
    ? allResources.filter((r) => r.kind === activeKind)
    : allResources

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

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {/* Filter chips row (All + present kinds only) */}
        {availableKinds.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <Link
              href="/garden/resources"
              className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer ${
                !activeKind
                  ? 'bg-[#232536] text-[#FDF8F1] font-bold shadow-xs'
                  : 'bg-white text-[#5C5F73] border border-[#F0E4D2] hover:border-[#232536]/30 hover:text-[#232536]'
              }`}
            >
              All
            </Link>

            {availableKinds.map((k) => (
              <Link
                key={k}
                href={`/garden/resources?kind=${k}`}
                className={`text-xs px-3.5 py-1.5 rounded-full font-medium transition cursor-pointer ${
                  activeKind === k
                    ? 'bg-[#232536] text-[#FDF8F1] font-bold shadow-xs'
                    : 'bg-white text-[#5C5F73] border border-[#F0E4D2] hover:border-[#232536]/30 hover:text-[#232536]'
                }`}
              >
                {kindLabel(k)}
              </Link>
            ))}
          </div>
        )}

        {/* Resources Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleResources.map((item) => {
            const size = formatFileSize(item.file_size_bytes)
            return (
              <article
                key={item.id}
                className="flex flex-col justify-between bg-white border border-[#F0E4D2] hover:border-[#232536]/30 rounded-xl p-6 transition shadow-xs group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EEEFF6] text-[#232536]">
                      {kindLabel(item.kind)}
                    </span>
                    {size ? (
                      <span className="text-xs text-[#5C5F73] font-medium">
                        {size}
                      </span>
                    ) : null}
                  </div>

                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-2 group-hover:text-[#CF3F29] transition">
                    <Link
                      href={`/garden/resources/${item.slug}`}
                      className="focus:outline-none focus:underline"
                    >
                      {item.title}
                    </Link>
                  </h3>

                  <p className="text-sm text-[#5C5F73] leading-relaxed line-clamp-3">
                    {item.summary}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#F0E4D2]/70 flex items-center justify-between">
                  <Link
                    href={`/garden/resources/${item.slug}`}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#CF3F29] hover:text-[#b83420] transition focus:outline-none focus:underline"
                  >
                    <span>Open resource</span>
                    <ArrowRight
                      className="w-4 h-4 stroke-[2.5] transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                      aria-hidden="true"
                    />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </main>
    </div>
  )
}
