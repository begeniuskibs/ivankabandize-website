/* eslint-disable @next/next/no-img-element */
'use client'

import React from 'react'
import { safeHref } from '@/lib/safeUrl'
import KTile from '@/components/brand/KTile'

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

function isSameSiteUrl(urlStr: string): boolean {
  if (!urlStr) return false
  const trimmed = urlStr.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  return /^(https?:\/\/)?(www\.)?ivankabandize\.com(\/.*)?$/i.test(trimmed)
}

function getSameSiteSection(urlStr: string): string {
  if (!urlStr) return 'Ivan Kabandize'
  const trimmed = urlStr.trim()
  let pathname = trimmed
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      pathname = new URL(trimmed).pathname
    } catch {
      // fallback to pathname
    }
  } else if (/^(www\.)?ivankabandize\.com/i.test(trimmed)) {
    pathname = trimmed.replace(/^(www\.)?ivankabandize\.com/i, '')
    if (!pathname.startsWith('/')) {
      pathname = `/${pathname}`
    }
  }

  // Normalize: remove trailing slash unless root
  const cleanPath = pathname.replace(/\/+$/, '') || '/'

  if (cleanPath === '/garden') {
    return 'The Garden'
  }
  if (cleanPath.startsWith('/garden/')) {
    return 'Articles'
  }
  if (cleanPath === '/library' || cleanPath.startsWith('/library/')) {
    return 'Library'
  }
  if (cleanPath === '/me' || cleanPath.startsWith('/me/')) {
    return 'Me'
  }
  if (cleanPath === '/now' || cleanPath.startsWith('/now/')) {
    return 'Now'
  }
  if (
    cleanPath === '/work-with-me' ||
    cleanPath.startsWith('/work-with-me/') ||
    cleanPath === '/workwithme' ||
    cleanPath.startsWith('/workwithme/')
  ) {
    return 'Work with Me'
  }
  return 'Ivan Kabandize'
}

function cleanTitle(rawTitle: string, isSameSite: boolean): string {
  if (!isSameSite || !rawTitle) return rawTitle
  const cleaned = rawTitle.replace(/\s*[-|\u2014\u2013]\s*Ivan\s+Kabandize\s*$/i, '').trim()
  return cleaned || rawTitle
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
  const isSameSite = isSameSiteUrl(url)
  const rawTitle = title || url || 'Bookmark'
  const displayTitle = cleanTitle(rawTitle, isSameSite)

  const sectionName = isSameSite ? getSameSiteSection(url) : ''
  const showAuthor = isSameSite ? sectionName !== 'Ivan Kabandize' : Boolean(author)

  return (
    <figure className={`kg-card kg-bookmark-card my-8 w-full ${className}`}>
      <a
        href={safeHref(url, '#')}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={displayTitle}
        onClick={isEditor ? (e) => e.preventDefault() : undefined}
        className="kg-bookmark-container group flex flex-row items-stretch justify-between w-full bg-white rounded-lg border border-[#F5ECDE] shadow-sm hover:border-[#232536]/25 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#232536] focus-visible:ring-offset-2 transition overflow-hidden text-left no-underline text-[#232536]"
      >
        {/* Content Column */}
        <div className="kg-bookmark-content flex flex-col justify-between flex-1 min-w-0 p-5 overflow-hidden">
          <div className="w-full">
            <div className="kg-bookmark-title font-['MTN_Brighter_Sans',_sans-serif] text-[15px] font-semibold text-[#232536] leading-[1.4] line-clamp-2 break-words group-hover:text-coral-text transition-colors">
              {displayTitle}
            </div>
            {description ? (
              <div className="kg-bookmark-description mt-1 text-[14px] text-[#5A5D70] leading-[1.5] line-clamp-2 break-words opacity-80">
                {description}
              </div>
            ) : null}
          </div>

          {isSameSite ? (
            <div className="kg-bookmark-metadata flex items-center gap-1.5 mt-5 text-[14px] text-[#5A5D70] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              <KTile size={20} className="shrink-0" />
              <span className="kg-bookmark-publisher truncate max-w-[240px] text-[#232536]/80 font-medium">
                {sectionName}
              </span>
              {showAuthor ? (
                <span className="kg-bookmark-author truncate text-[#5A5D70] font-normal">
                  {' - Ivan Kabandize'}
                </span>
              ) : null}
            </div>
          ) : (icon || publisher || author) ? (
            <div className="kg-bookmark-metadata flex items-center gap-1.5 mt-5 text-[14px] text-[#5A5D70] font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {icon ? (
                <img
                  src={icon}
                  alt=""
                  className="kg-bookmark-icon w-5 h-5 object-contain rounded-sm shrink-0"
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
