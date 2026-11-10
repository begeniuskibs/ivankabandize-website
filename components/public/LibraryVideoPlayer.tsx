'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Play } from 'lucide-react'
import { getYouTubeEmbedUrl } from '@/lib/youtube'

interface LibraryVideoPlayerProps {
  videoUrl: string
  title: string
  creator: string
  thumbnailUrl?: string | null
}

export default function LibraryVideoPlayer({
  videoUrl,
  title,
  creator,
  thumbnailUrl,
}: LibraryVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const embedUrl = getYouTubeEmbedUrl(videoUrl)

  if (!embedUrl) {
    return null
  }

  const iframeSrc = `${embedUrl}?autoplay=1`

  return (
    <div className="w-full">
      <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#232536] shadow-md border border-[#F0E4D2]/40">
        {!isPlaying ? (
          <>
            {/* Poster / Thumbnail image or gradient fallback */}
            {thumbnailUrl ? (
              <Image
                src={thumbnailUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                unoptimized
                className="object-cover"
              />
            ) : null}

            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />

            {/* Poster text */}
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 flex flex-col justify-end pointer-events-none">
              <span className="text-xs uppercase tracking-widest text-[#FDF8F1]/80 font-bold mb-1">
                {creator}
              </span>
              <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-lg sm:text-2xl font-bold text-[#FDF8F1] line-clamp-2 max-w-xl">
                {title}
              </h3>
            </div>

            {/* Play Button */}
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label={`Play video for ${title}`}
              className="absolute inset-0 m-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-[#CF3F29] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            >
              <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-1" aria-hidden="true" />
            </button>
          </>
        ) : (
          <iframe
            src={iframeSrc}
            title={`${title} - video player`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        )}
      </div>

      <p className="text-xs text-[#5C5F73] mt-2.5">
        Video loads only after you press play
      </p>
    </div>
  )
}
