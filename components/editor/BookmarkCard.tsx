/* eslint-disable @next/next/no-img-element */
'use client'

import React from 'react'

export interface BookmarkCardProps {
  url?: string
  title?: string
  description?: string
  author?: string
  publisher?: string
  thumbnail?: string
  icon?: string
  caption?: string
  isEditor?: boolean
  className?: string
}

export function isInternalBookmarkUrl(url?: string): boolean {
  if (!url) return false
  const trimmed = url.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return true
  try {
    const parsed = new URL(trimmed)
    const host = parsed.hostname.toLowerCase()
    return host === 'ivankabandize.com' || host === 'www.ivankabandize.com'
  } catch {
    return false
  }
}

export default function BookmarkCard({
  url = '',
  title = '',
  description = '',
  author = '',
  publisher = '',
  thumbnail = '',
  icon = '',
  caption = '',
  isEditor = false,
  className = '',
}: BookmarkCardProps) {
  const isInternal = isInternalBookmarkUrl(url)
  const displayTitle = title || url || 'Bookmark'

  return (
    <figure className={`kg-card kg-bookmark-card my-8 w-full ${className}`}>
      <a
        href={url || '#'}
        target={isInternal ? undefined : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
        aria-label={displayTitle}
        onClick={isEditor ? (e) => e.preventDefault() : undefined}
        className="kg-bookmark-container group flex flex-row items-stretch justify-between w-full bg-white rounded-[5px] border border-[#F5ECDE] shadow-sm hover:border-[#EF5B45]/40 hover:shadow-md transition overflow-hidden text-left no-underline text-[#232536]"
      >
        {/* Content Column */}
        <div className="kg-bookmark-content flex flex-col justify-between flex-1 min-w-0 p-5 overflow-hidden">
          <div className="w-full">
            <div className="kg-bookmark-title font-['MTN_Brighter_Sans',_sans-serif] text-[15px] font-semibold text-[#232536] leading-[1.4] line-clamp-2 break-words group-hover:text-[#EF5B45] transition-colors">
              {displayTitle}
            </div>
            {description ? (
              <div className="kg-bookmark-description mt-1 text-[14px] text-[#5A5D70] leading-[1.5] line-clamp-2 break-words opacity-80">
                {description}
              </div>
            ) : null}
          </div>

          {(icon || publisher || author) ? (
            <div className="kg-bookmark-metadata flex items-center gap-1.5 mt-5 text-[14px] text-[#5A5D70] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {icon ? (
                <img
                  src={icon}
                  alt=""
                  className="kg-bookmark-icon w-5 h-5 object-contain rounded-xs shrink-0"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLElement).style.display = 'none'
                  }}
                />
              ) : null}
              {publisher ? (
                <span className="kg-bookmark-publisher truncate max-w-[240px] text-[#232536]/80 font-medium">
                  {publisher}
                </span>
              ) : null}
              {publisher && author ? (
                <span className="text-[#5A5D70]/60 select-none">&bull;</span>
              ) : null}
              {author ? (
                <span className="kg-bookmark-author truncate text-[#5A5D70] font-normal">
                  {author}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Thumbnail Column */}
        {thumbnail ? (
          <div className="kg-bookmark-thumbnail relative shrink-0 w-1/3 min-w-[33%] max-w-[40%] bg-[#FAF5EC] overflow-hidden">
            <img
              src={thumbnail}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const parent = (e.currentTarget as HTMLElement).parentElement
                if (parent) parent.style.display = 'none'
              }}
            />
          </div>
        ) : null}
      </a>

      {caption ? (
        <figcaption className="mt-2.5 text-center text-xs sm:text-sm text-[#5A5D70]">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}
