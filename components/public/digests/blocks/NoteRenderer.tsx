import React from 'react'
import type { NoteBlock } from '@/lib/digests/types'

export default function NoteRenderer({ block }: { block: NoteBlock }) {
  return (
    <div className="bg-[#232536] text-[#FDF8F1] rounded-2xl p-6 md:p-8 mt-4 border-0 shadow-sm">
      <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-lg sm:text-xl font-bold tracking-tight text-white">
        {block.h}
      </h3>
      <p className="mt-3 text-[#C9CADA] text-sm sm:text-base leading-relaxed">{block.p}</p>
    </div>
  )
}
