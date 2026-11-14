'use client'

import React from 'react'
import type { TopArticleItem, ShareChartStyle } from '@/lib/adminAnalytics'
import { BRAND_PALETTE } from '@/lib/adminAnalytics'

interface TopArticlesCardProps {
  articles: TopArticleItem[]
  totalViews: number
  shareStyle: ShareChartStyle
  onNavigateTab: (tab: 'articles') => void
}

export function TopArticlesCard({
  articles,
  totalViews,
  shareStyle,
  onNavigateTab,
}: TopArticlesCardProps) {
  const topList = articles.slice(0, 8)
  const maxShare = topList[0]?.share || 1

  return (
    <div className="bg-white border border-[#F0E4D2] rounded-2xl p-5 md:p-6 flex flex-col mt-4">
      {/* Header */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <div>
          <h2 className="text-sm font-semibold text-[#232536] m-0">
            Top articles
          </h2>
          <p className="text-xs text-[#5C5F73] mt-0.5 mb-0">
            Most read in the period
          </p>
        </div>
        <span className="text-xs text-[#5C5F73] inline-flex items-center gap-1.5 flex-none">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2F9E7A]" />
          Own counter
        </span>
      </div>

      {/* Table */}
      {topList.length === 0 || totalViews === 0 ? (
        <div className="py-8 text-center text-sm text-[#5C5F73]">
          No article views recorded in this period yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#F0E4D2]">
                <th className="text-left text-xs text-[#5C5F73] font-medium py-1.5 px-2 uppercase tracking-wider text-[11px]">
                  Article
                </th>
                <th className="text-right text-xs text-[#5C5F73] font-medium py-1.5 px-2 uppercase tracking-wider text-[11px] w-[90px]">
                  Views
                </th>
                <th className="text-left text-xs text-[#5C5F73] font-medium py-1.5 px-2 uppercase tracking-wider text-[11px] w-[34%]">
                  % of total
                </th>
              </tr>
            </thead>
            <tbody>
              {topList.map((art, ix) => {
                const color = BRAND_PALETTE[ix % BRAND_PALETTE.length]
                const pct = Math.round(art.share * 100)
                const barWidthPct = Math.min(
                  100,
                  Math.round((art.share / maxShare) * 100)
                )

                return (
                  <tr
                    key={art.id}
                    className="border-b border-[#F0E4D2] last:border-b-0"
                  >
                    <td className="py-2.5 px-2 text-[13.5px]">
                      <span
                        className="inline-block w-2 h-2 rounded-full mr-2.5 align-middle flex-none"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-medium text-[#232536]">
                        {art.title}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-[13.5px] font-semibold text-[#232536] tabular-nums">
                      {art.views.toLocaleString('en-US')}
                    </td>
                    <td className="py-2.5 px-2">
                      {shareStyle === 'bars' ? (
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-2 bg-[#F3EBDD] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${barWidthPct}%`,
                                backgroundColor: color,
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#5C5F73] tabular-nums min-w-[34px] text-right">
                            {pct}%
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <svg
                            viewBox="0 0 42 42"
                            className="w-[26px] h-[26px] flex-none select-none"
                            role="img"
                            aria-label={`${pct}% share`}
                          >
                            <circle
                              cx="21"
                              cy="21"
                              r="15.9155"
                              fill="none"
                              stroke="#F3EBDD"
                              strokeWidth="7"
                            />
                            <circle
                              cx="21"
                              cy="21"
                              r="15.9155"
                              fill="none"
                              stroke={color}
                              strokeWidth="7"
                              strokeDasharray={`${pct} ${100 - pct}`}
                              strokeDashoffset="25"
                            />
                          </svg>
                          <span className="text-xs text-[#5C5F73] tabular-nums min-w-[34px]">
                            {pct}%
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View all articles link */}
      <div className="mt-auto pt-4">
        <button
          type="button"
          onClick={() => onNavigateTab('articles')}
          className="text-[13px] font-medium text-[#CF3F29] hover:text-[#b83420] transition-colors cursor-pointer"
        >
          View all articles &rarr;
        </button>
      </div>
    </div>
  )
}

