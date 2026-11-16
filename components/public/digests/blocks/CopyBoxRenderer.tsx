'use client'

import React, { useState } from 'react'
import type { CopyBoxBlock } from '@/lib/digests/types'

export default function CopyBoxRenderer({ block }: { block: CopyBoxBlock }) {
  const [copied, setCopied] = useState<boolean>(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(block.text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } else {
        // Fallback
        const textarea = document.createElement('textarea')
        textarea.value = block.text
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      }
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F5ECDE] p-5 md:p-6 shadow-2xs mt-4">
      <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536]">
        {block.h}
      </h3>
      <p className="text-xs sm:text-sm text-[#5A5D70] mt-1.5 leading-relaxed">{block.p}</p>

      <div className="bg-[#232536] text-[#FDF8F1] p-4 rounded-xl font-mono text-xs sm:text-sm leading-relaxed my-3.5 select-all overflow-x-auto whitespace-pre-wrap">
        {block.text}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center min-h-[38px] px-4 py-2 rounded-xl text-xs font-semibold bg-[#CF3F29] hover:bg-[#b83420] text-white transition-colors cursor-pointer shadow-2xs"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        {copied && (
          <span className="text-xs text-[#1F8A5B] font-semibold animate-in fade-in duration-200">
            ✓ Copied to clipboard.
          </span>
        )}
      </div>
    </div>
  )
}
