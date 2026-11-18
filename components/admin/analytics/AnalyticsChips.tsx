import React from 'react'

export function ChipOwn({ label = 'Own counter' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap bg-[#E4F4EE] text-[#1C6B52] md:bg-[#1F8A5B]/[0.12] md:text-[#1F8A5B]">
      <i className="w-1.5 h-1.5 rounded-full bg-current block" />
      <span>{label}</span>
    </span>
  )
}

export function ChipGA({ label = 'Google Analytics' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap bg-[#E6EEFB] text-[#2A55A5] md:bg-[#2A55A5]/[0.12] md:text-[#2A55A5]">
      <i className="w-1.5 h-1.5 rounded-full bg-current block" />
      <span>{label}</span>
    </span>
  )
}

