import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export type GardenHubHeroTone = 'ink' | 'cream' | 'coral'

export interface GardenHubHeroBreadcrumb {
  parentLabel?: string
  parentHref?: string
  currentLabel?: string
}

export interface GardenHubHeroProps {
  eyebrow?: string
  title: string
  intro: string
  imageSrc?: string
  imageAlt?: string
  tone?: GardenHubHeroTone
  breadcrumb?: GardenHubHeroBreadcrumb
}

export default function GardenHubHero({
  eyebrow,
  title,
  intro,
  imageSrc,
  imageAlt = '',
  tone = 'cream',
  breadcrumb = {
    parentLabel: 'The Garden',
    parentHref: '/garden',
    currentLabel: title,
  },
}: GardenHubHeroProps) {
  const parentLabel = breadcrumb.parentLabel || 'The Garden'
  const parentHref = breadcrumb.parentHref || '/garden'
  const currentLabel = breadcrumb.currentLabel || title

  // Mode with background image: approved hero (Desktop look + Mobile Style B)
  if (imageSrc) {
    return (
      <section className="relative w-full bg-[#232536] text-[#FDF8F1] border-b border-white/15 overflow-hidden min-h-[230px] md:min-h-[270px] flex flex-col justify-center">
        {/* Background photo behind dark overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            quality={70}
            sizes="100vw"
            className="object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#232536]/60 via-[#232536]/80 to-[#232536]/92" />
        </div>

        {/* Content container */}
        <div className="relative z-10 max-w-6xl mx-auto w-full px-[18px] pt-[22px] pb-[26px] md:px-12 md:py-9">
          <div className="max-w-[620px] space-y-2 md:space-y-3">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb">
              <div className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.12em] text-[#E9E4F0]">
                <Link
                  href={parentHref}
                  className="group inline-flex items-center gap-1 hover:text-[#FDF8F1] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#FDF8F1] focus-visible:outline-offset-2 rounded-xs transition-colors"
                >
                  <ArrowLeft
                    size={12}
                    strokeWidth={2.5}
                    aria-hidden="true"
                    className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
                  />
                  <span>{parentLabel}</span>
                </Link>
                <span className="text-[#E9E4F0]/40" aria-hidden="true">
                  /
                </span>
                <span className="text-[#FDF8F1]">{currentLabel}</span>
              </div>
            </nav>

            {/* Optional eyebrow */}
            {eyebrow && eyebrow !== parentLabel && (
              <p className="text-[12px] uppercase tracking-[0.12em] font-bold text-[#E9E4F0]/80">
                {eyebrow}
              </p>
            )}

            {/* Single H1 per page */}
            <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-[30px] md:text-[44px] font-bold text-[#FDF8F1] leading-tight md:leading-[1.15] tracking-tight">
              {title}
            </h1>

            {/* Intro */}
            <p className="text-[15px] md:text-[18px] font-normal text-[#F3EFF7] leading-relaxed">
              {intro}
            </p>
          </div>
        </div>
      </section>
    )
  }

  // Plain branded hero without image (fallback)
  const toneStyles = {
    cream: {
      section: 'border-[#F0E4D2] bg-[#FAF3E8]/60 text-[#232536]',
      parentLink: 'text-[#5C5F73] hover:text-[#232536] focus-visible:outline-[#232536]',
      divider: 'text-[#5C5F73]/50',
      currentCrumb: 'text-[#232536]',
      eyebrow: 'text-[#8C6D23]',
      title: 'text-[#232536]',
      intro: 'text-[#5C5F73]',
    },
    ink: {
      section: 'border-white/10 bg-[#232536] text-[#FDF8F1]',
      parentLink: 'text-[#FDF8F1]/70 hover:text-[#FDF8F1] focus-visible:outline-[#FDF8F1]',
      divider: 'text-[#FDF8F1]/40',
      currentCrumb: 'text-[#FDF8F1]',
      eyebrow: 'text-[#FDF8F1]/75',
      title: 'text-[#FDF8F1]',
      intro: 'text-[#FDF8F1]/85',
    },
    coral: {
      section: 'border-[#F7D6CC] bg-[#FEF1ED] text-[#232536]',
      parentLink: 'text-[#5C5F73] hover:text-[#232536] focus-visible:outline-[#232536]',
      divider: 'text-[#F7D6CC]',
      currentCrumb: 'text-[#232536]',
      eyebrow: 'text-[#CF3F29]',
      title: 'text-[#232536]',
      intro: 'text-[#5C5F73]',
    },
  }[tone]

  return (
    <section className={`py-12 md:py-20 border-b ${toneStyles.section}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-3 md:space-y-4">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
              <Link
                href={parentHref}
                className={`group inline-flex items-center gap-1 ${toneStyles.parentLink} focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 rounded-xs transition-colors`}
              >
                <ArrowLeft
                  size={12}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
                />
                <span>{parentLabel}</span>
              </Link>
              <span className={toneStyles.divider} aria-hidden="true">
                /
              </span>
              <span className={toneStyles.currentCrumb}>{currentLabel}</span>
            </div>
          </nav>

          {/* Optional eyebrow */}
          {eyebrow && eyebrow !== parentLabel && (
            <p className={`text-xs uppercase tracking-widest font-bold ${toneStyles.eyebrow}`}>
              {eyebrow}
            </p>
          )}

          {/* Single H1 per page */}
          <h1 className={`font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight ${toneStyles.title} leading-[1.15]`}>
            {title}
          </h1>

          {/* Intro */}
          <p className={`text-base sm:text-lg md:text-xl font-medium ${toneStyles.intro} leading-relaxed`}>
            {intro}
          </p>
        </div>
      </div>
    </section>
  )
}
