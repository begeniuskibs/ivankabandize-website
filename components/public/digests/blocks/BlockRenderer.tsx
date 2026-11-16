'use client'

import React from 'react'
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

export default function BlockRenderer({ block }: { block: DigestBlock }) {
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
    case 'take':
      // Prompt requirement: "render the block only when approved is true. No DRAFT text may appear on the live site."
      if (!block.approved) return null
      return (
        <div className="border-l-4 border-[#EF5B45] pl-5 py-1 text-base sm:text-lg space-y-3.5 my-6">
          {block.paras.map((p, idx) => (
            <p key={idx} className="text-[#232536] leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      )
    default:
      return null
  }
}
