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
import GardenTopicBar from '@/components/public/GardenTopicBar'
import { buildTopicBarItems } from '@/lib/gardenTopicBar'
import {
  HERO_CHIP_ACTIVE,
  HERO_CHIP_INACTIVE,
  TOPIC_STRIP_WRAPPER,
  TOPIC_STRIP_CONTAINER,
} from '@/lib/gardenChipStyles'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Digests - The Garden',
  description:
    'Plain-language summaries of the reports, research and essays leaders should read, with a button to get the original.',
  alternates: {
    canonical: `${SITE_URL}/garden/digests`,
  },
}

interface DigestsPageProps {
  searchParams?: Promise<{ type?: string; topic?: string }>
}

export default async function DigestsPage({
  searchParams,
}: DigestsPageProps) {
  const params = (await searchParams) || {}
  const activeType = params.type || null
  const activeTopic = params.topic || null

  const availableKinds = getAvailableDigestKinds(DIGESTS)
  const distinctTopics = getDistinctDigestTopics(DIGESTS)
  const filteredDigests = filterDigests(DIGESTS, activeType, activeTopic)
  const topicBarItems = buildTopicBarItems(
    distinctTopics,
    (slug) => buildDigestHref(activeType, slug)
  )

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4]">
      {/* Hub Hero with Key Categories */}
      <GardenHubHero
        title="Digests"
        intro="I read the reports, research and essays leaders keep meaning to read, and turn each one into something you can take in over a cup of tea. Every digest has a 2-minute version."
        imageSrc="/garden-heroes/digests.jpg"
        breadcrumb={{
          parentLabel: 'The Garden',
          parentHref: '/garden',
          currentLabel: 'Digests',
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
            <GardenTopicBar
              items={topicBarItems}
              activeKey={activeTopic || 'all'}
            />
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
              href="/garden/digests"
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
