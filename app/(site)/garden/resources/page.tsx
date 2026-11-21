import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'
import GardenHubHero from '@/components/public/GardenHubHero'
import ResourcesShelfList from '@/components/public/ResourcesShelfList'
import { SITE_URL } from '@/lib/siteUrl'
import { getPublishedResources } from '@/lib/resources'
import { kindPluralLabel, slugifyCategory } from '@/lib/resourceUi'

// Public shelf for downloadable resources
// House style: spaced hyphen " - " only

export const dynamic = 'force-dynamic'

const HERO_INTRO =
  'Templates and guides I built for my own work first. Every page tells you what it is, who it is for and how to use it, before you download anything.'

export const metadata: Metadata = {
  title: 'Resources - The Garden',
  description: HERO_INTRO,
  alternates: {
    canonical: `${SITE_URL}/garden/resources`,
  },
  robots: {
    index: false,
    follow: false,
  },
}

interface ResourcesPageProps {
  searchParams?: Promise<{ kind?: string; topic?: string }>
}

const CANONICAL_KINDS = ['template', 'guide', 'framework'] as const

function buildResourcesHref(
  kind: string | null,
  topic: string | null
): string {
  const params = new URLSearchParams()
  if (kind) params.set('kind', kind)
  if (topic) params.set('topic', topic)
  const qs = params.toString()
  return qs ? `/garden/resources?${qs}` : '/garden/resources'
}

export default async function ResourcesPage({
  searchParams,
}: ResourcesPageProps) {
  const params = (await searchParams) || {}
  const allResources = await getPublishedResources()

  // Empty state: keeps existing "Seeds are being packed" unchanged
  if (allResources.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
        <GardenHubHero
          title="Resources"
          intro={HERO_INTRO}
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
              Templates and guides will be added here as they are ready.
            </p>
          </div>
        </main>
      </div>
    )
  }

  // 1. Available kinds: only show a kind chip if at least one published resource has that kind.
  // Canonical order: Templates, Guides, Frameworks
  const presentKindsSet = new Set(
    allResources.map((r) => (r.kind || '').toLowerCase().trim())
  )
  const availableKinds = [
    ...CANONICAL_KINDS.filter((k) => presentKindsSet.has(k)),
    ...Array.from(presentKindsSet).filter(
      (k) =>
        !CANONICAL_KINDS.includes(k as (typeof CANONICAL_KINDS)[number]) &&
        k.length > 0
    ),
  ]

  // Validate activeKind from query params
  const rawKind = (params.kind || '').toLowerCase().trim()
  const activeKind = availableKinds.includes(rawKind) ? rawKind : null

  // 2. Distinct categories among published resources (case-insensitive unique, alphabetical)
  const categoryMap = new Map<string, { name: string; slug: string }>()
  for (const r of allResources) {
    if (r.category && r.category.trim()) {
      const raw = r.category.trim()
      const key = raw.toLowerCase()
      if (!categoryMap.has(key)) {
        categoryMap.set(key, { name: raw, slug: slugifyCategory(raw) })
      }
    }
  }
  const distinctCategories = Array.from(categoryMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  )

  // Validate activeTopic from query params against available category slugs
  const rawTopic = (params.topic || '').toLowerCase().trim()
  const activeCategory = distinctCategories.find((c) => c.slug === rawTopic)
  const activeTopic = activeCategory ? activeCategory.slug : null

  // 3. Filter resources
  let filteredResources = allResources
  if (activeKind) {
    filteredResources = filteredResources.filter(
      (r) => (r.kind || '').toLowerCase().trim() === activeKind
    )
  }
  if (activeTopic) {
    filteredResources = filteredResources.filter(
      (r) => r.category && slugifyCategory(r.category) === activeTopic
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
      {/* Existing Garden Hero with Key Categories chip slot */}
      <GardenHubHero
        title="Resources"
        intro={HERO_INTRO}
        imageSrc="/garden-heroes/resources.jpg"
        breadcrumb={{
          parentLabel: 'The Garden',
          parentHref: '/garden',
          currentLabel: 'Resources',
        }}
      >
        <Link
          href={buildResourcesHref(null, activeTopic)}
          className={`shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#FDF8F1] focus-visible:outline-offset-2 ${
            !activeKind
              ? 'bg-[#CF3F29] text-white shadow-sm'
              : 'bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10'
          }`}
        >
          All
        </Link>
        {availableKinds.map((k) => (
          <Link
            key={k}
            href={buildResourcesHref(k, activeTopic)}
            className={`shrink-0 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-colors duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#FDF8F1] focus-visible:outline-offset-2 ${
              activeKind === k
                ? 'bg-[#CF3F29] text-white shadow-sm'
                : 'bg-white/10 text-[#FDF8F1] hover:bg-white/20 border border-white/10'
            }`}
          >
            {kindPluralLabel(k)}
          </Link>
        ))}
      </GardenHubHero>

      {/* Topics Cream Strip directly under hero: only if at least one resource has a category */}
      {distinctCategories.length > 0 && (
        <section className="bg-[#FAF3E8]/60 border-b border-[#F5ECDE] py-4">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#5A5D70] mr-1">
                Topic:
              </span>
              <Link
                href={buildResourcesHref(activeKind, null)}
                className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                  !activeTopic
                    ? 'bg-[#232536] text-white font-bold'
                    : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#232536]/30 hover:text-[#232536]'
                }`}
              >
                All topics
              </Link>
              {distinctCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={buildResourcesHref(activeKind, cat.slug)}
                  className={`text-xs px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                    activeTopic === cat.slug
                      ? 'bg-[#2AA198] text-white font-bold'
                      : 'bg-white text-[#5A5D70] border border-[#F5ECDE] hover:border-[#2AA198]'
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        {filteredResources.length === 0 ? (
          <div className="py-12 text-center max-w-md mx-auto">
            <p className="text-base text-[#5C5F73] mb-4">
              No resources match these filters.
            </p>
            <Link
              href="/garden/resources"
              className="inline-flex items-center justify-center text-sm font-semibold text-[#CF3F29] hover:underline cursor-pointer"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <ResourcesShelfList resources={filteredResources} />
        )}
      </main>
    </div>
  )
}
