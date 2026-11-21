import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Minus, Plus } from 'lucide-react'
import { SITE_URL } from '@/lib/siteUrl'
import { getPublishedResourceBySlug } from '@/lib/resources'
import { kindLabel } from '@/lib/resourceUi'
import ResourceFlow, {
  ResourceHeroCta,
  ResourceStickyBar,
} from '@/components/public/ResourceFlow'
import ResourceDemo from '@/components/public/ResourceDemo'

// Single resource detail page and inline download gate
// House style: spaced hyphen " - " only

export const dynamic = 'force-dynamic'

interface ResourcePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params
  const resource = await getPublishedResourceBySlug(slug)

  if (!resource) {
    return {
      title: 'Resource Not Found',
    }
  }

  const title = `${resource.title} - Resources`
  const description = resource.summary

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/garden/resources/${resource.slug}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params
  const resource = await getPublishedResourceBySlug(slug)

  if (!resource) {
    notFound()
  }

  const { details } = resource

  // Overview sections (What it is, Who it is for, What it helps with)
  const overviewCards = [
    details.what_it_is
      ? { title: 'What it is', content: details.what_it_is }
      : null,
    details.who_for
      ? { title: 'Who it is for', content: details.who_for }
      : null,
    details.helps_with
      ? { title: 'What it helps with', content: details.helps_with }
      : null,
  ].filter(
    (card): card is { title: string; content: string } => card !== null
  )

  const hasWorksWell = details.works_well && details.works_well.length > 0
  const hasNotFit = details.not_fit && details.not_fit.length > 0
  const hasFitSection = hasWorksWell || hasNotFit
  const hasSteps = details.steps && details.steps.length > 0
  const hasFaq = details.faq && details.faq.length > 0
  const hasFacts = details.facts && details.facts.length > 0

  return (
    <ResourceFlow resource={resource}>
      <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4] text-[#232536]">
        <main className="max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-28 md:pb-16">
          {/* Back Link */}
          <div className="mb-6">
            {/* Mobile back link */}
            <Link
              href="/garden/resources"
              className="group inline-flex md:hidden items-center gap-1 text-[12px] font-bold uppercase tracking-[0.12em] text-[#5C5F73] hover:text-[#232536] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#232536] focus-visible:outline-offset-2 rounded-xs transition-colors"
            >
              <ArrowLeft
                size={12}
                strokeWidth={2.5}
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
              />
              <span>Resources</span>
            </Link>

            {/* Desktop back link */}
            <Link
              href="/garden/resources"
              className="hidden md:inline-flex group items-center gap-1.5 text-sm font-semibold text-[#5C5F73] hover:text-[#232536] transition cursor-pointer"
            >
              <ArrowLeft
                size={16}
                strokeWidth={2.5}
                aria-hidden="true"
                className="transition-transform group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
              />
              <span>All resources</span>
            </Link>
          </div>

          {/* Hero Block: 2 columns on desktop, single column on mobile */}
          <section
            aria-label="Resource introduction"
            className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center md:items-stretch mb-12"
          >
            {/* Left Column: chips, title, summary, facts row, CTA button */}
            <div>
              {/* Kind and category chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3.5">
                <span className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#EF5B45]/10 text-[#CF3F29]">
                  {kindLabel(resource.kind)}
                </span>
                {resource.category && (
                  <span className="inline-block text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F7EDE0] text-[#5C5F73]">
                    {resource.category}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight mb-4 leading-[1.14]">
                {resource.title}
              </h1>

              {/* Summary */}
              <p className="text-base sm:text-lg text-[#5C5F73] leading-relaxed mb-6">
                {resource.summary}
              </p>

              {/* Facts row: only rendered from details.facts if data exists */}
              {hasFacts && (
                <div className="flex flex-wrap items-center gap-6 sm:gap-8 py-4 my-6 border-y border-[#F0E4D2]">
                  {details.facts.map((fact, idx) => (
                    <div key={idx}>
                      <b className="block font-['MTN_Brighter_Sans',_sans-serif] text-lg sm:text-xl font-bold text-[#232536]">
                        {fact.value}
                      </b>
                      <span className="text-xs sm:text-sm text-[#5C5F73]">
                        {fact.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Primary Action Button and "See how it works" */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <ResourceHeroCta />
                {hasSteps && (
                  <a
                    href="#how"
                    className="inline-flex items-center justify-center min-h-[48px] px-6 py-3.5 text-base max-md:min-h-[40px] max-md:px-4 max-md:py-2.5 max-md:text-sm font-semibold text-[#232536] bg-white hover:bg-[#FAF3E8] border border-[#F0E4D2] rounded-xl shadow-2xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
                  >
                    See how it works
                  </a>
                )}
              </div>
            </div>

            {/* Right/top Visual: cover_image_url if present, otherwise decorative brand-colour grid illustration */}
            <div className="w-full max-md:order-first max-md:mb-6 md:h-full">
              {resource.cover_image_url ? (
                <div className="relative w-full aspect-[16/9] md:aspect-auto md:h-full md:min-h-[260px] rounded-2xl overflow-hidden border border-[#F0E4D2] bg-white shadow-xs">
                  <Image
                    src={resource.cover_image_url}
                    alt={resource.title}
                    fill
                    priority
                    unoptimized
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className="w-full aspect-[16/9] md:aspect-auto md:h-full md:min-h-[260px] rounded-2xl border border-[#F0E4D2] bg-[#FAF3E8]/60 p-6 sm:p-8 flex items-center justify-center shadow-xs"
                >
                  <div className="w-full max-w-sm grid grid-cols-3 gap-3.5">
                    <div className="h-20 sm:h-24 rounded-xl bg-white border border-[#F0E4D2] p-3 flex flex-col justify-between shadow-2xs">
                      <div className="w-8 h-2 rounded bg-[#EF5B45]" />
                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded bg-[#F0E4D2]" />
                        <div className="w-3/4 h-1.5 rounded bg-[#F0E4D2]" />
                      </div>
                    </div>
                    <div className="h-20 sm:h-24 rounded-xl bg-white border border-[#F0E4D2] p-3 flex flex-col justify-between shadow-2xs">
                      <div className="w-6 h-2 rounded bg-[#232536]" />
                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded bg-[#F0E4D2]" />
                        <div className="w-1/2 h-1.5 rounded bg-[#F0E4D2]" />
                      </div>
                    </div>
                    <div className="h-20 sm:h-24 rounded-xl bg-white border border-[#F0E4D2] p-3 flex flex-col justify-between shadow-2xs">
                      <div className="w-10 h-2 rounded bg-[#CF3F29]" />
                      <div className="space-y-1">
                        <div className="w-4/5 h-1.5 rounded bg-[#F0E4D2]" />
                        <div className="w-2/3 h-1.5 rounded bg-[#F0E4D2]" />
                      </div>
                    </div>
                    <div className="col-span-2 h-14 rounded-xl bg-white border border-[#F0E4D2] p-3 flex items-center gap-3 shadow-2xs">
                      <div className="w-7 h-7 rounded-lg bg-[#EF5B45]/15 flex items-center justify-center shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#CF3F29]" />
                      </div>
                      <div className="w-full space-y-1.5">
                        <div className="w-4/5 h-2 rounded bg-[#232536]/20" />
                        <div className="w-1/2 h-1.5 rounded bg-[#F0E4D2]" />
                      </div>
                    </div>
                    <div className="col-span-1 h-14 rounded-xl bg-white border border-[#F0E4D2] p-3 flex items-center justify-center shadow-2xs">
                      <div className="w-full h-2 rounded bg-[#232536]/15" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 1. What it is, 2. Who it is for, 3. What it helps with (only if data exists) */}
          {overviewCards.length > 0 && (
            <section aria-label="Resource overview" className="my-12">
              <div
                className={`grid grid-cols-1 ${overviewCards.length === 3
                  ? 'md:grid-cols-3'
                  : overviewCards.length === 2
                    ? 'md:grid-cols-2'
                    : ''
                  } gap-6`}
              >
                {overviewCards.map((card, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#F0E4D2] rounded-2xl p-6 shadow-xs flex flex-col"
                  >
                    <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-2.5">
                      {card.title}
                    </h2>
                    <p className="text-sm sm:text-base text-[#5C5F73] leading-relaxed">
                      {card.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Steps (numbered): only if data exists */}
          {hasSteps && (
            <section id="how" aria-label="Steps" className="my-12 scroll-mt-6">
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] mb-6">
                How to use it
              </h2>
              <ol className="space-y-3.5 list-none p-0 m-0">
                {details.steps.map((step, idx) => (
                  <li
                    key={idx}
                    className="bg-white border border-[#F0E4D2] rounded-2xl p-4 sm:p-5 flex items-start gap-4 shadow-xs"
                  >
                    <span
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#CF3F29] text-white font-['MTN_Brighter_Sans',_sans-serif] font-bold text-base sm:text-lg flex items-center justify-center shrink-0 mt-0.5"
                      aria-hidden="true"
                    >
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <strong className="block text-base font-bold text-[#232536] mb-1">
                        {step.title}
                      </strong>
                      <p className="text-sm text-[#5C5F73] leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {/* Interactive demo tabs: only if data exists */}
          {details.demo && details.demo.length > 0 && (
            <section aria-label="Interactive preview" className="my-12">
              <ResourceDemo demo={details.demo} />
            </section>
          )}

          {/* 5. Works well when / Does not fit when: two columns on desktop, only if data exists */}
          {hasFitSection && (
            <section aria-label="Fit and suitability" className="my-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {hasWorksWell && (
                  <div className="bg-white border border-[#F0E4D2] rounded-2xl p-6 shadow-xs">
                    <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-4">
                      Works well when...
                    </h2>
                    <ul className="space-y-2.5 text-sm sm:text-base text-[#5C5F73] leading-relaxed list-disc pl-5">
                      {details.works_well.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasNotFit && (
                  <div className="bg-white border border-[#F0E4D2] rounded-2xl p-6 shadow-xs">
                    <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536] mb-4">
                      Does not fit when...
                    </h2>
                    <ul className="space-y-2.5 text-sm sm:text-base text-[#5C5F73] leading-relaxed list-disc pl-5">
                      {details.not_fit.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* 6. FAQ: native details/summary, keyboard accessible, only if data exists */}
          {hasFaq && (
            <section
              aria-label="Frequently asked questions"
              className="my-12 max-w-2xl"
            >
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] mb-6">
                Questions people ask
              </h2>
              <div className="border-t border-[#F0E4D2]">
                {details.faq.map((item, idx) => (
                  <details
                    key={idx}
                    className="group border-b border-[#F0E4D2] py-4 transition-colors"
                  >
                    <summary className="font-bold text-base sm:text-lg text-[#232536] cursor-pointer list-none [&::-webkit-details-marker]:hidden flex justify-between items-center gap-4 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CF3F29] focus-visible:ring-offset-2 rounded-md">
                      <span>{item.q}</span>
                      <span
                        className="w-8 h-8 rounded-full border border-[#F0E4D2] hover:border-[#232536]/30 bg-white flex items-center justify-center shrink-0 text-[#232536]"
                        aria-hidden="true"
                      >
                        <Plus
                          size={16}
                          className="group-open:hidden"
                          aria-hidden="true"
                        />
                        <Minus
                          size={16}
                          className="hidden group-open:block"
                          aria-hidden="true"
                        />
                      </span>
                    </summary>
                    <p className="mt-3 text-sm sm:text-base text-[#5C5F73] leading-relaxed">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

        </main>

        {/* Mobile-only sticky bottom bar (max-md: scoping only) */}
        <ResourceStickyBar
          title={resource.title}
          subText={kindLabel(resource.kind)}
        />
      </div>
    </ResourceFlow>
  )
}
