'use client'

import React from 'react'
import type { AnalyticsData } from './types'
import { ChipOwn } from './AnalyticsChips'
import { formatKampalaDisplayDate } from '@/lib/adminAnalytics'
import { GLASS_CARD } from '../glass'

function formatContentType(contentType: string | null | undefined): string {
  switch (contentType) {
    case 'random_thoughts':
      return 'Random Thoughts'
    case 'structured_thoughts':
      return 'Structured Thoughts'
    case 'tools_for_thought':
      return 'Tools for Thought'
    default:
      return contentType || ''
  }
}

interface ArticlesTabProps {
  data: AnalyticsData
}

export function ArticlesTab({ data }: ArticlesTabProps) {
  const topViews =
    data.allArticles.length > 0 ? data.allArticles[0].views : 0

  return (
    <div className="space-y-3.5">
      {/* All articles card */}
      <div className={`bg-white border border-[#F0E4D2] rounded-2xl p-5 min-w-0 ${GLASS_CARD}`}>
        <div className="flex justify-between items-start gap-2.5 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-[#232536] m-0">
              All articles
            </h2>
            <p className="text-[#5C5F73] text-[12.5px] m-0 mt-0.5">
              Published articles ranked by reads in the period
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <ChipOwn />
          </div>
        </div>

        {data.allArticles.length === 0 || data.totalViewsCurrent === 0 ? (
          <div className="py-12 text-center text-sm text-[#5C5F73]">
            No views counted in this period yet. Counting began on 12 Nov 2026.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#F0E4D2]">
                  <th className="py-2 px-3 text-xs font-medium text-[#5C5F73]">
                    Article
                  </th>
                  <th className="py-2 px-3 text-xs font-medium text-[#5C5F73]">
                    Type
                  </th>
                  <th className="py-2 px-3 text-xs font-medium text-[#5C5F73] text-right tabular-nums">
                    Published
                  </th>
                  <th className="py-2 px-3 text-xs font-medium text-[#5C5F73] text-right tabular-nums">
                    Views
                  </th>
                  <th className="py-2 px-3 text-xs font-medium text-[#5C5F73] w-40">
                    Share of reads
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.allArticles.map((article) => {
                  const barWidth =
                    topViews > 0 ? (article.views / topViews) * 100 : 0
                  const sharePct = Math.round(article.share * 100)

                  return (
                    <tr
                      key={article.id}
                      className="border-b border-[#F0E4D2] last:border-b-0 hover:bg-[#FAF7F2]/50 transition-colors"
                    >
                      <td className="py-3 px-3 align-middle">
                        <span className="font-medium text-[#232536] block">
                          {article.title}
                        </span>
                        {article.slug && (
                          <span className="text-xs text-[#5C5F73]">
                            /{article.slug}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 align-middle text-xs text-[#5C5F73] whitespace-nowrap">
                        {formatContentType(article.contentType)}
                      </td>
                      <td className="py-3 px-3 align-middle text-xs text-[#5C5F73] text-right tabular-nums whitespace-nowrap">
                        {article.publishedAt
                          ? formatKampalaDisplayDate(article.publishedAt.slice(0, 10), true)
                          : '-'}
                      </td>
                      <td className="py-3 px-3 align-middle text-right font-medium text-[#232536] tabular-nums whitespace-nowrap">
                        {article.views.toLocaleString('en-US')}
                      </td>
                      <td className="py-3 px-3 align-middle">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 bg-[#F3EBDD] rounded-full overflow-hidden md:bg-[#232536]/[0.05]">
                            <i
                              className="block h-full bg-[#CF3F29] rounded-full transition-all md:bg-[#232536]"
                              style={{ width: `${Math.max(barWidth > 0 ? 2 : 0, barWidth)}%` }}
                            />
                          </div>
                          <span className="text-xs text-[#5C5F73] tabular-nums w-8 text-right">
                            {sharePct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

