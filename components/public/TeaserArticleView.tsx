import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import WideContainer from '@/components/public/WideContainer'
import type { TeaserPost } from '@/lib/postTeaser'

interface TeaserArticleViewProps {
  teaser: TeaserPost
  isUpgrade?: boolean
}

const TYPE_CONFIG: Record<string, { label: string; href: string; badgeColor: string }> = {
  random_thoughts: {
    label: 'Random Thoughts',
    href: '/random-thoughts',
    badgeColor: 'bg-[#FDF3DC] text-[#C99424] border-[#F7C55C]/30',
  },
  structured_thoughts: {
    label: 'Structured Thoughts',
    href: '/structured-thoughts',
    badgeColor: 'bg-[#FDF0EE] text-[#EF5B45] border-[#EF5B45]/20',
  },
  tools_for_thought: {
    label: 'Tools for Thought',
    href: '/tools-for-thought',
    badgeColor: 'bg-[#EEEDF9] text-[#6B66C4] border-[#6B66C4]/20',
  },
}

export default function TeaserArticleView({ teaser, isUpgrade = false }: TeaserArticleViewProps) {
  const typeInfo = teaser.content_type && TYPE_CONFIG[teaser.content_type] ? TYPE_CONFIG[teaser.content_type] : null
  const headerImageWidth = teaser.header_image_width || 'standard'

  return (
    <article className="min-h-full font-sans py-12 md:py-24 bg-[#FDF8F1]">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="mb-10">
          <Link
            href="/garden"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold text-[#5A5D70] hover:text-[#232536] transition"
          >
            <span>&larr; Back to The Garden</span>
          </Link>
        </div>

        {/* 1. Primary Tag & Categories ABOVE Headline */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs mb-4">
          {typeInfo && (
            <Link
              href={typeInfo.href}
              className={`font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border text-[11px] hover:opacity-80 transition ${typeInfo.badgeColor}`}
            >
              {typeInfo.label}
            </Link>
          )}

          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#2AA198]/10 text-[#2AA198] border border-[#2AA198]/20">
            Members
          </span>

          {teaser.post_tags && teaser.post_tags.length > 0 && (() => {
            const secondaryTags = teaser.post_tags.filter((pt) => {
              const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
              return tagObj?.name && tagObj.name.toLowerCase() !== typeInfo?.label.toLowerCase()
            })
            if (secondaryTags.length === 0) return null
            return (
              <div className="flex flex-wrap gap-2">
                {secondaryTags.map((pt, idx) => {
                  const tagObj = Array.isArray(pt.tag) ? pt.tag[0] : pt.tag
                  return (
                    <span
                      key={idx}
                      className="bg-white text-[#2AA198] border border-[#F5ECDE] px-3 py-1 rounded-full text-[11px] font-semibold"
                    >
                      {tagObj?.name}
                    </span>
                  )
                })}
              </div>
            )
          })()}
        </div>

        {/* 2. Main Headline */}
        <header className="mb-6">
          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl md:text-5xl font-bold text-[#232536] leading-[1.18] mb-6 tracking-tight">
            {teaser.title}
          </h1>

          {/* 3. Combined Byline */}
          <div className="flex items-center gap-3.5 text-sm text-[#5A5D70] pb-8 border-b border-[#F5ECDE]">
            <Image
              src="/images/ivan-portrait.jpg"
              alt="Ivan Kabandize"
              width={42}
              height={42}
              className="w-10 h-10 rounded-full object-cover border border-[#F5ECDE] shadow-sm"
            />
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-bold text-[#232536]">Ivan Kabandize</span>
              <span className="text-[#5A5D70]/50">•</span>
              <time dateTime={teaser.published_at || ''}>
                {teaser.published_at
                  ? new Date(teaser.published_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Recently published'}
              </time>
              <span className="text-[#5A5D70]/50">•</span>
              <span className="font-bold text-[#2AA198]">Members Preview</span>
            </div>
          </div>
        </header>

        {/* 4. Header Image (reusing ArticleView styling) */}
        {teaser.featured_image_url && (() => {
          const figureElement = (
            <figure className={headerImageWidth === 'wide' ? '' : 'mb-10'}>
              <div className="relative aspect-[16/9] w-full rounded-[5px] overflow-hidden">
                <Image
                  src={teaser.featured_image_url}
                  alt={teaser.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            </figure>
          )

          if (headerImageWidth === 'wide') {
            return <WideContainer className="mb-10">{figureElement}</WideContainer>
          }
          return figureElement
        })()}

        {/* 5. Teaser Body: First Paragraph + Fade-out */}
        <main id="article-body" className="relative">
          {teaser.firstParagraph ? (
            <div className="relative">
              <p className="text-[#232536] text-[17px] sm:text-[18px] md:text-lg leading-[1.65]">
                {teaser.firstParagraph}
              </p>
              <div className="h-24 bg-gradient-to-b from-transparent to-[#FDF8F1] pointer-events-none -mt-16 relative" />
            </div>
          ) : (
            teaser.excerpt && (
              <div className="relative">
                <p className="text-[#232536] text-[17px] sm:text-[18px] md:text-lg leading-[1.65]">
                  {teaser.excerpt}
                </p>
                <div className="h-24 bg-gradient-to-b from-transparent to-[#FDF8F1] pointer-events-none -mt-16 relative" />
              </div>
            )
          )}

          {/* 6. Signup or Upgrade Card */}
          <div className="my-10 p-8 sm:p-10 rounded-3xl bg-white border border-[#F0E4D2] shadow-[0_10px_30px_rgba(35,37,54,0.06)] text-center max-w-xl mx-auto">
            {isUpgrade ? (
              <>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#2AA198]/10 text-[#2AA198] border border-[#2AA198]/20 mb-4">
                  Members Only
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#232536] mb-3 font-['MTN_Brighter_Sans',_sans-serif]">
                  Upgrade your membership to keep reading
                </h2>
                <p className="text-[#5A5D70] text-sm sm:text-base leading-relaxed mb-6">
                  This post requires a higher membership tier. Upgrade your account to unlock full access.
                </p>
                <Link
                  href="/auth/account"
                  className="inline-block px-6 py-3 rounded-xl bg-[#232536] hover:bg-[#CF3F29] text-white font-bold text-sm tracking-wide transition shadow-sm hover:shadow"
                >
                  Manage Membership
                </Link>
              </>
            ) : (
              <>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#CF3F29]/10 text-[#CF3F29] border border-[#CF3F29]/20 mb-4">
                  Members Only
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-[#232536] mb-3 font-['MTN_Brighter_Sans',_sans-serif]">
                  Keep reading, it&apos;s free to join
                </h2>
                <p className="text-[#5A5D70] text-sm sm:text-base leading-relaxed mb-6">
                  Join a curious community of readers exploring systems, technology, and life.
                </p>
                <div className="space-y-4">
                  <div>
                    <Link
                      href={`/signup?redirectTo=${encodeURIComponent(`/garden/${teaser.slug}`)}`}
                      className="inline-block w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#CF3F29] hover:bg-[#b53420] text-white font-bold text-sm sm:text-base tracking-wide transition shadow-sm hover:shadow"
                    >
                      Sign up
                    </Link>
                  </div>
                  <p className="text-sm text-[#5A5D70]">
                    Already a member?{' '}
                    <Link
                      href={`/login?redirectTo=${encodeURIComponent(`/garden/${teaser.slug}`)}`}
                      className="text-[#CF3F29] hover:underline font-semibold"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </article>
  )
}
