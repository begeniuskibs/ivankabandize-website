'use client'

import React from 'react'
import { Download } from 'lucide-react'
import type { DigestBlock } from '@/lib/digests/types'
import StatsRenderer from './StatsRenderer'
import NoteRenderer from './NoteRenderer'
import CardsRenderer from './CardsRenderer'
import CompareSliderRenderer from './CompareSliderRenderer'
import CopyBoxRenderer from './CopyBoxRenderer'
import HorizontalBarsRenderer from './HorizontalBarsRenderer'
import RingsRenderer from './RingsRenderer'
import SegmentedTabsRenderer from './SegmentedTabsRenderer'
import RoleSwitcherRenderer from './RoleSwitcherRenderer'
import QuizRenderer from './QuizRenderer'
import ScrollStoryRenderer from './ScrollStoryRenderer'
import AskRenderer from './AskRenderer'
import HeatmapRenderer from './HeatmapRenderer'
import AttachmentRenderer from './AttachmentRenderer'
import PluralismRenderer from './PluralismRenderer'
import JargonRenderer from './JargonRenderer'

export default function BlockRenderer({
  block,
  pdfUrl,
  digestSlug,
}: {
  block: DigestBlock
  pdfUrl?: string | null
  digestSlug?: string
}) {
  switch (block.k) {
    case 'stats':
      return <StatsRenderer block={block} />
    case 'note':
      return <NoteRenderer block={block} />
    case 'cards':
      return <CardsRenderer block={block} />
    case 'cmp':
      return <CompareSliderRenderer block={block} />
    case 'copy':
      return <CopyBoxRenderer block={block} />
    case 'hbars':
      return <HorizontalBarsRenderer block={block} />
    case 'rings':
      return <RingsRenderer block={block} />
    case 'segs':
      return <SegmentedTabsRenderer block={block} />
    case 'roles':
      return <RoleSwitcherRenderer block={block} />
    case 'quiz':
      return <QuizRenderer block={block} />
    case 'story':
      return <ScrollStoryRenderer block={block} />
    case 'ask':
      return <AskRenderer />
    case 'heat':
      return <HeatmapRenderer />
    case 'attach':
      return <AttachmentRenderer />
    case 'plural':
      return <PluralismRenderer />
    case 'jargon':
      return <JargonRenderer block={block} />
    case 'take': {
      // Prompt requirement: "render the block only when approved is true. No DRAFT text may appear on the live site."
      if (!block.approved) return null
      const keepLine =
        digestSlug === 'ai-christian-benchmark'
          ? 'A two-page summary with the prompt sentence and the seven boundaries.'
          : 'A printable summary of this digest.'
      return (
        <>
          <div
            data-take-block="true"
            className="py-1 text-base sm:text-lg space-y-4 my-4 max-w-[700px]"
          >
            {block.paras.map((p, idx) => (
              <p key={idx} className="text-[#232536] leading-relaxed">
                {p}
              </p>
            ))}
          </div>
          {pdfUrl ? (
            <div
              data-keep-digest="true"
              className="bg-white rounded-2xl border border-[#F0E4D2] p-6 sm:p-7 text-center max-w-[700px] mt-6"
            >
              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536]">
                Keep this digest
              </h3>
              <p className="text-sm sm:text-base text-[#5C5F73] mt-2 mb-4 max-w-md mx-auto">
                {keepLine}
              </p>
              <a
                href={pdfUrl}
                download
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-[#CF3F29] text-white hover:bg-[#b83420] transition-colors min-h-[44px]"
              >
                <Download size={15} strokeWidth={2.2} aria-hidden="true" />
                <span>Download the digest (PDF)</span>
              </a>
            </div>
          ) : null}
        </>
      )
    }
    default:
      return null
  }
}
