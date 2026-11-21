import React from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Digest, DigestHeroArt } from '@/lib/digests/types'

function CardCoverArt({ heroArt, slug }: { heroArt: DigestHeroArt; slug: string }) {
  const maskId = `card-art-mask-${slug}`
  const gradId = `card-art-grad-${slug}`

  return (
    <svg
      viewBox="0 0 320 140"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{
        maskImage:
          'linear-gradient(to right, transparent 0%, transparent 36%, rgba(0,0,0,0.45) 62%, rgba(0,0,0,1) 100%)',
        WebkitMaskImage:
          'linear-gradient(to right, transparent 0%, transparent 36%, rgba(0,0,0,0.45) 62%, rgba(0,0,0,1) 100%)',
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="36%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="65%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
        <mask id={maskId}>
          <rect x="0" y="0" width="320" height="140" fill={`url(#${gradId})`} />
        </mask>
      </defs>

      <g mask={`url(#${maskId})`} fill="#ffffff" stroke="#ffffff">
        {heroArt === 'models' &&
          Array.from({ length: 40 }, (_, i) => {
            const col = i % 8
            const row = Math.floor(i / 8)
            const cx = 138 + col * 23.5
            const cy = 18 + row * 26
            const r = i % 5 === 0 ? 6.5 : 4.8
            const op = i % 7 === 3 ? 0.16 : i % 4 === 1 ? 0.13 : 0.1
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fillOpacity={op}
                stroke="none"
              />
            )
          })}

        {heroArt === 'trends' &&
          (() => {
            const inner: [number, number][] = [
              [244, 42],
              [274, 70],
              [244, 98],
              [214, 70],
            ]
            const outer: [number, number][] = Array.from({ length: 10 }, (_, idx) => {
              const angle = (idx * 2 * Math.PI) / 10 - Math.PI / 2
              return [
                Math.round(244 + Math.cos(angle) * 56),
                Math.round(70 + Math.sin(angle) * 52),
              ]
            })
            return (
              <>
                <circle
                  cx="244"
                  cy="70"
                  r="29"
                  fill="none"
                  strokeOpacity="0.12"
                  strokeWidth="1"
                  strokeDasharray="3 4"
                />
                <circle
                  cx="244"
                  cy="70"
                  r="55"
                  fill="none"
                  strokeOpacity="0.1"
                  strokeWidth="1"
                  strokeDasharray="3 5"
                />
                {inner.map(([x, y], i) => {
                  const [ox, oy] = outer[(i * 2) % 10]
                  return (
                    <line
                      key={`l-${i}`}
                      x1={x}
                      y1={y}
                      x2={ox}
                      y2={oy}
                      strokeOpacity="0.11"
                      strokeWidth="1"
                    />
                  )
                })}
                {inner.map(([cx, cy], i) => (
                  <circle
                    key={`in-${i}`}
                    cx={cx}
                    cy={cy}
                    r={6.8}
                    fillOpacity="0.16"
                    stroke="none"
                  />
                ))}
                {outer.map(([cx, cy], i) => (
                  <circle
                    key={`out-${i}`}
                    cx={cx}
                    cy={cy}
                    r={i % 3 === 0 ? 5.5 : 4.4}
                    fillOpacity="0.12"
                    stroke="none"
                  />
                ))}
              </>
            )
          })()}

        {heroArt === 'coverage' &&
          Array.from({ length: 45 }, (_, i) => {
            const col = i % 9
            const row = Math.floor(i / 9)
            const cx = 138 + col * 21
            const cy = 18 + row * 26
            const isFilled = i < 16
            const isRing = i >= 16 && i < 42
            if (isFilled) {
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={5.2}
                  fillOpacity="0.16"
                  stroke="none"
                />
              )
            }
            if (isRing) {
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={4.8}
                  fillOpacity="0.06"
                  strokeOpacity="0.14"
                  strokeWidth="1.4"
                />
              )
            }
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={4.4}
                fill="none"
                strokeOpacity="0.09"
                strokeWidth="1.2"
              />
            )
          })}
      </g>
    </svg>
  )
}

interface DigestIndexViewProps {
  digests: Digest[]
}

export default function DigestIndexView({ digests }: DigestIndexViewProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {digests.map((digest) => (
          <article
            key={digest.slug}
            className="flex flex-col bg-white border border-[#F0E4D2] rounded-2xl p-6 transition-all duration-200 hover:border-[#CF3F29] hover:shadow-md"
          >
            {/* Color Cover Box */}
            <div
              className="relative overflow-hidden rounded-xl p-5 mb-5 text-white flex flex-col justify-between min-h-[140px]"
              style={{ backgroundColor: digest.color }}
            >
              <CardCoverArt heroArt={digest.heroArt} slug={digest.slug} />

              <div className="relative z-10 flex items-center gap-2 mb-4">
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                  {digest.topic}
                </span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-xs">
                  {digest.mins} min
                </span>
              </div>
              <h2 className="relative z-10 font-['MTN_Brighter_Sans',_sans-serif] text-lg sm:text-xl font-bold leading-snug line-clamp-2">
                {digest.title}
              </h2>
            </div>

            {/* Publisher */}
            <p className="text-xs sm:text-sm font-medium text-[#5C5F73] mb-4">
              {digest.pub}
            </p>

            {/* Key takeaway bullets with hanging indent */}
            <ul className="text-sm text-[#232536] space-y-2 mb-6 list-disc list-outside pl-4">
              {digest.key.map((bullet, idx) => (
                <li key={idx} className="leading-snug">
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 mt-auto pt-4 border-t border-[#F5ECDE]">
              <Link
                href={`/garden/report-digests/${digest.slug}?v=2min`}
                className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#CF3F29] text-white hover:bg-[#b83420] transition-colors"
              >
                <span>2-minute version</span>
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                />
              </Link>
              <Link
                href={`/garden/report-digests/${digest.slug}`}
                className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-[#F0E4D2] text-[#232536] hover:border-[#CF3F29] hover:text-[#CF3F29] transition-colors"
              >
                <span>Full digest</span>
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
