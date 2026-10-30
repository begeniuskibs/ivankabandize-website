import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/public/ScrollReveal'
import { NOW_ENTRIES, type NowEntry } from '@/lib/nowEntries'
import { SITE_URL } from '@/lib/siteUrl'

export const metadata: Metadata = {
  title: 'Now',
  description:
    'A sporadically updated log of what Ivan Kabandize is building, reading, learning and thinking about.',
  alternates: {
    canonical: `${SITE_URL}/now`,
  },
}

const TOP_NOW_ENTRIES = NOW_ENTRIES.slice(0, 2)
const OLDER_NOW_ENTRIES = NOW_ENTRIES.slice(2)

function renderDataEntry(entry: NowEntry, delayMs?: number) {
  return (
    <ScrollReveal key={entry.dateLabel} delayMs={delayMs}>
      <div className="relative">
        {/* Date Dot */}
        <div
          className={`absolute -left-12 sm:-left-16 top-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border-[3px] ${
            entry.showCurrently ? 'border-[#2AA198]' : 'border-[#F5ECDE]'
          } flex items-center justify-center shadow-sm z-10`}
        >
          <Image
            src={`/icons/3d/${entry.icon}`}
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
        </div>

        <div className="space-y-4">
          <span
            className={`inline-block text-xs sm:text-sm font-bold ${
              entry.showCurrently ? 'text-[#2AA198]' : 'text-[#A9ACBC]'
            } uppercase tracking-wider`}
          >
            {entry.dateLabel}
          </span>
          <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] leading-snug">
            {entry.title}
          </h2>
          <div className="px-4 py-3 rounded-xl bg-[#FCEBE7] border border-[#EF5B45]/20 text-[#232536] text-xs sm:text-sm leading-relaxed">
            {entry.callout}
          </div>
          {entry.paragraphs.map((paragraph, idx) => (
            <div key={idx} className="space-y-4">
              <p className="text-[#3A3D4E] text-base sm:text-lg leading-relaxed">
                {paragraph}
              </p>
              {idx === 0 && entry.explainer && (
                <div className="p-4 sm:p-5 rounded-xl bg-[#EAF4F3] border border-[#2AA198]/20 text-[#232536] text-sm sm:text-base leading-relaxed space-y-2">
                  <p className="font-bold text-[#232536]">{entry.explainer.heading}</p>
                  {entry.explainer.paragraphs.map((expParagraph, expIdx) => (
                    <p key={expIdx} className="text-[#3A3D4E]">
                      {expParagraph}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}

          {entry.showCurrently && (
            /* "Currently..." Card */
            <div className="mt-6 p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-white border border-[#F5ECDE] shadow-[0_10px_30px_rgba(35,37,54,0.06)] space-y-4">
              <p className="text-xs font-bold uppercase tracking-widest text-[#5A5D70]">
                Currently&hellip;
              </p>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 text-sm sm:text-base text-[#3A3D4E]">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                    <Image
                      src="/icons/3d/tools.svg"
                      alt=""
                      aria-hidden="true"
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                  </span>
                  <p>
                    <strong className="text-[#232536]">Building:</strong> this website - a custom garden + CMS, designed to make publishing frictionless.
                  </p>
                </div>
                <div className="flex items-start gap-3 text-sm sm:text-base text-[#3A3D4E]">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                    <Image
                      src="/icons/3d/graduation-cap.svg"
                      alt=""
                      aria-hidden="true"
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                  </span>
                  <p>
                    <strong className="text-[#232536]">Learning:</strong> the Generative AI Leader course by Google Cloud and the AI Fundamentals journeys from the Google AI Professional Certificate on Coursera (started October 2026) - and publishing what I learn as I go.
                  </p>
                </div>
                <div className="flex items-start gap-3 text-sm sm:text-base text-[#3A3D4E]">
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center mt-0.5">
                    <Image
                      src="/icons/3d/pen.svg"
                      alt=""
                      aria-hidden="true"
                      width={24}
                      height={24}
                      className="w-6 h-6 object-contain"
                    />
                  </span>
                  <p>
                    <strong className="text-[#232536]">Writing:</strong> continuing to share my reflections on the Generative AI Leader series.
                  </p>
                </div>
                <div className="flex items-start gap-3 text-sm sm:text-base text-[#3A3D4E]">
                  <span className="text-lg flex-shrink-0">📻</span>
                  <p>
                    <strong className="text-[#232536]">On air:</strong> regular conversations on Power FM about systems, leadership, and work that matters.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ScrollReveal>
  )
}

export default function NowPage() {
  return (
    <div className="min-h-full bg-[#FDF8F1] text-[#232536] font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
      {/* Page Header */}
      <section className="py-14 sm:py-20 border-b border-[#F5ECDE]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCEBE7] border border-[#EF5B45]/20 text-[#EF5B45] text-xs font-bold uppercase tracking-widest mb-6">
              <Link href="/" className="hover:underline text-[#5A5D70]">
                Home
              </Link>
              <span className="text-[#5A5D70]">/</span>
              <span>Now</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#232536] leading-tight">
              <span className="text-[#EF5B45]">Now</span>
            </h1>
          </ScrollReveal>

          <ScrollReveal delayMs={140}>
            <p className="mt-6 text-lg sm:text-xl text-[#5A5D70] leading-relaxed">
              A sporadically updated log of what I&rsquo;m building, learning, and thinking about. Inspired by the{' '}
              <a
                href="https://nownownow.com/about"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#EF5B45] font-semibold hover:underline"
              >
                /now page movement
              </a>{' '}
              - because &ldquo;what are you up to these days?&rdquo; deserves a better answer than a LinkedIn profile.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative pl-12 sm:pl-16 space-y-16 sm:space-y-20 before:content-[''] before:absolute before:left-[19px] sm:before:left-[21px] before:top-3 before:bottom-3 before:w-[3px] before:bg-[#F5ECDE] before:rounded-full">
            
            {TOP_NOW_ENTRIES.map((entry, idx) => renderDataEntry(entry, idx * 40))}

            {/* Entry 2: March 2026 */}
            <ScrollReveal delayMs={60}>
              <div className="relative">
                {/* Date Dot */}
                <div className="absolute -left-12 sm:-left-16 top-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border-[3px] border-[#F5ECDE] flex items-center justify-center shadow-sm z-10">
                  <Image
                    src="/icons/3d/books.svg"
                    alt=""
                    aria-hidden="true"
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                  />
                </div>

                <div className="space-y-4">
                  <span className="inline-block text-xs sm:text-sm font-bold text-[#A9ACBC] uppercase tracking-wider">
                    March 2026
                  </span>
                  <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] leading-snug">
                    Deep in the systems, quietly planning
                  </h2>
                  <p className="text-[#3A3D4E] text-base sm:text-lg leading-relaxed">
                    A season of heads-down work: serving organisations through my consulting practice, leading training at Watoto Church, and quietly sketching what this website should become. I audited everything I&rsquo;ve published since 2022 and realised my writing already had a garden&rsquo;s shape - random thoughts, structured thoughts, tools for thought - it just needed a garden&rsquo;s home.
                  </p>
                  <p className="text-[#3A3D4E] text-base sm:text-lg leading-relaxed">
                    The lesson of the quarter: content velocity beats infrastructure purity. Whatever I build next has to make publishing easier, not more impressive.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Entry 3: December 2025 */}
            <ScrollReveal delayMs={120}>
              <div className="relative">
                {/* Date Dot */}
                <div className="absolute -left-12 sm:-left-16 top-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white border-[3px] border-[#F5ECDE] flex items-center justify-center shadow-sm z-10">
                  <Image
                    src="/icons/3d/robot.svg"
                    alt=""
                    aria-hidden="true"
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                  />
                </div>

                <div className="space-y-4">
                  <span className="inline-block text-xs sm:text-sm font-bold text-[#A9ACBC] uppercase tracking-wider">
                    December 2025
                  </span>
                  <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536] leading-snug">
                    Started the Generative AI Leader series
                  </h2>
                  <p className="text-[#3A3D4E] text-base sm:text-lg leading-relaxed">
                    Enrolled in Google Cloud&rsquo;s Generative AI Leader course and made myself a promise: don&rsquo;t just consume - interpret. The first two parts are planted in the garden: The AI You Already Use and The Research That Changed Everything. The aim of the whole series is translation - taking dense material and making it actionable for leaders who don&rsquo;t have time for the hype cycle.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {OLDER_NOW_ENTRIES.map((entry, idx) => renderDataEntry(entry, 160 + idx * 40))}

          </div>

          {/* Last tended footnote & CTA */}
          <ScrollReveal delayMs={200}>
            <div className="mt-20 pt-10 border-t border-[#F5ECDE] text-center space-y-6">
              <p className="text-sm sm:text-base text-[#5A5D70]">
                This page updates when life does - roughly every season. Last tended:{' '}
                <strong className="text-[#232536]">November 2026</strong>.
              </p>
              <div>
                <Link
                  href="/lets-talk"
                  className="group inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-full bg-[#CF3F29] hover:bg-[#b83420] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Working on something similar? Let&rsquo;s Talk</span>
                  <ArrowRight
                    size={14}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                  />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
