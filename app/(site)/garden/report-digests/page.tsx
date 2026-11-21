import type { Metadata } from 'next'
import Link from 'next/link'
import GardenHubHero from '@/components/public/GardenHubHero'
import DigestIndexView from '@/components/public/digests/DigestIndexView'
import { SITE_URL } from '@/lib/siteUrl'
import { DIGESTS } from '@/lib/digests'
import {
  getAvailableDigestKinds,
  getDistinctDigestTopics,
  filterDigests,
  buildDigestHref,
} from '@/lib/digestUi'
import {
  HERO_CHIP_ACTIVE,
  HERO_CHIP_INACTIVE,
  TOPIC_ALL_CHIP_ACTIVE,
  TOPIC_ALL_CHIP_INACTIVE,
  TOPIC_CHIP_ACTIVE,
  TOPIC_CHIP_INACTIVE,
  TOPIC_STRIP_WRAPPER,
  TOPIC_STRIP_CONTAINER,
  TOPIC_STRIP_ROW,
  TOPIC_STRIP_LABEL,
} from '@/lib/gardenChipStyles'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report Digests - The Garden',
  description:
    'Plain-language summaries of the research leaders should read, with a button to get the original.',
  alternates: {
    canonical: `${SITE_URL}/garden/report-digests`,
  },
}

interface ReportDigestsPageProps {
  searchParams?: Promise<{ type?: string; topic?: string }>
}

export default async function ReportDigestsPage({
  searchParams,
}: ReportDigestsPageProps) {
  const params = (await searchParams) || {}
  const activeType = params.type || null
  const activeTopic = params.topic || null

  const availableKinds = getAvailableDigestKinds(DIGESTS)
  const distinctTopics = getDistinctDigestTopics(DIGESTS)
  const filteredDigests = filterDigests(DIGESTS, activeType, activeTopic)

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
      {/* Hub Hero with Key Categories */}
      <GardenHubHero
        title="Report Digests"
        intro="I read the reports leaders keep meaning to read, and turn each one into something you can take in over a cup of tea. Every digest has a 2-minute version."
        imageSrc="/garden-heroes/digests.jpg"
        breadcrumb={{
          parentLabel: 'The Garden',
          parentHref: '/garden',
          currentLabel: 'Report Digests',
        }}
      >
        <Link
          href={buildDigestHref(null, activeTopic)}
          className={!activeType ? HERO_CHIP_ACTIVE : HERO_CHIP_INACTIVE}
        >
          All
        </Link>
        {availableKinds.map((k) => (
          <Link
            key={k.key}
            href={buildDigestHref(k.key, activeTopic)}
            className={activeType === k.key ? HERO_CHIP_ACTIVE : HERO_CHIP_INACTIVE}
          >
            {k.label}
          </Link>
        ))}
      </GardenHubHero>

      {/* Topics Cream Strip directly under hero: only if at least one digest has a topic */}
      {distinctTopics.length > 0 && (
        <section className={TOPIC_STRIP_WRAPPER}>
          <div className={TOPIC_STRIP_CONTAINER}>
            <div className={TOPIC_STRIP_ROW}>
              <span className={TOPIC_STRIP_LABEL}>
                Topic:
              </span>
              <Link
                href={buildDigestHref(activeType, null)}
                className={!activeTopic ? TOPIC_ALL_CHIP_ACTIVE : TOPIC_ALL_CHIP_INACTIVE}
              >
                All topics
              </Link>
              {distinctTopics.map((t) => (
                <Link
                  key={t.slug}
                  href={buildDigestHref(activeType, t.slug)}
                  className={activeTopic === t.slug ? TOPIC_CHIP_ACTIVE : TOPIC_CHIP_INACTIVE}
                >
                  {t.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content: Digest Index View or Zero Results State */}
      <main className="w-full">
        {filteredDigests.length === 0 ? (
          <div className="py-16 text-center max-w-md mx-auto">
            <p className="text-base text-[#232536] font-medium mb-3">
              No digests match these filters.
            </p>
            <Link
              href="/garden/report-digests"
              className="text-xs uppercase tracking-wider font-semibold text-[#CF3F29] hover:underline"
            >
              Clear filters
            </Link>
          </div>
        ) : (
          <DigestIndexView digests={filteredDigests} />
        )}
      </main>
    </div>
  )
}
