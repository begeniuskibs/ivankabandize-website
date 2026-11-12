import React from 'react'

export function ChipOwn({ label = 'Own counter' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap bg-[#E4F4EE] text-[#1C6B52]">
      <i className="w-1.5 h-1.5 rounded-full bg-current block" />
      <span>{label}</span>
    </span>
  )
}

export function ChipGA({ label = 'Google Analytics' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap bg-[#E6EEFB] text-[#2A55A5]">
      <i className="w-1.5 h-1.5 rounded-full bg-current block" />
      <span>{label}</span>
    </span>
  )
}

export function ChipV1({ label = 'v1' }: { label?: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap bg-[#232536] text-white">
      {label}
    </span>
  )
}

export function ChipLater({ label = 'Later' }: { label?: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap bg-[#EFE7D9] text-[#5C5F73]">
      {label}
    </span>
  )
}

