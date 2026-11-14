'use client'

import React from 'react'

export function SetupCard() {
  const steps = [
    {
      title: 'Record reads on articles',
      description: 'Cookie-free, counts every visitor',
      done: true,
    },
    {
      title: 'Count member signups',
      description: 'Live from the database',
      done: true,
    },
    {
      title: 'Connect Search Console',
      description: 'Shows what people typed into Google',
      done: false,
    },
    {
      title: 'Bring Google numbers onto this page',
      description: 'Needs a Google service account',
      done: false,
    },
  ]

  return (
    <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 md:p-6 flex flex-col min-w-0">
      <div className="mb-2">
        <h2 className="text-sm font-semibold text-[#232536] m-0">
          Finish setting up analytics
        </h2>
        <div className="h-1.5 bg-[#F3EBDD] rounded-full overflow-hidden my-2.5">
          <div className="h-full w-1/2 bg-[#232536] rounded-full" />
        </div>
        <p className="text-xs text-[#5C5F73] mt-1 mb-0">2 of 4 complete</p>
      </div>

      <div className="flex flex-col mt-2">
        {steps.map((st, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 py-2.5 text-[13.5px] ${
              i > 0 ? 'border-t border-[#F0E4D2]' : ''
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-none ${
                st.done
                  ? 'bg-[#2F9E7A] text-white'
                  : 'border-[1.5px] border-[#CDBFA8] text-transparent'
              }`}
              aria-hidden="true"
            >
              ✓
            </span>
            <div className="min-w-0 flex-1">
              <span
                className={`block font-medium ${
                  st.done ? 'text-[#232536]' : 'text-[#5C5F73]'
                }`}
              >
                {st.title}
              </span>
              <small className="block text-xs text-[#5C5F73] mt-0.5">
                {st.description}
              </small>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

