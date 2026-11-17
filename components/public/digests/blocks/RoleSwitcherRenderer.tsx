'use client'

import React, { useState } from 'react'
import type { RoleSwitcherBlock } from '@/lib/digests/types'

export default function RoleSwitcherRenderer({ block }: { block: RoleSwitcherBlock }) {
  const roleNames = Object.keys(block.roles)
  const [selectedRole, setSelectedRole] = useState<string>(roleNames[0] || '')

  const currentPoints = block.roles[selectedRole] || []

  return (
    <div className="bg-white rounded-2xl border border-[#F5ECDE] max-md:p-3.5 p-5 md:p-7 shadow-2xs mt-4">
      {/* Role buttons */}
      <div className="flex max-md:gap-1 gap-1.5 max-md:p-0.5 p-1 bg-[#FDF8F1] border border-[#F5ECDE] rounded-xl overflow-x-auto">
        {roleNames.map((role) => (
          <button
            key={role}
            type="button"
            onClick={() => setSelectedRole(role)}
            className={`flex-1 min-h-[38px] max-md:px-1.5 px-3.5 py-1.5 rounded-lg max-md:text-[11px] text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedRole === role
                ? 'bg-[#232536] text-white shadow-xs'
                : 'text-[#5A5D70] hover:text-[#232536] hover:bg-[#F5ECDE]/40'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      {/* Numbered advice items */}
      <div className="mt-5 divide-y divide-[#F5ECDE]/80">
        {currentPoints.map((point, idx) => (
          <div key={idx} className="flex items-start gap-4 py-3.5 first:pt-0 last:pb-0">
            <span className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-bold text-[#CF3F29] shrink-0 w-6">
              {idx + 1}
            </span>
            <p className="text-xs sm:text-sm text-[#232536] leading-relaxed pt-0.5">{point}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
