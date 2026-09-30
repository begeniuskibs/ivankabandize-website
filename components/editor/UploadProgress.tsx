'use client'

import React from 'react'

export interface UploadProgressInfo {
  loaded: number
  total: number
  percent: number
  formattedLoaded: string
  formattedTotal: string
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export async function uploadFileDirect({
  file,
  bucket,
  onProgress,
}: {
  file: File
  bucket: 'post-images' | 'post-videos'
  onProgress?: (p: UploadProgressInfo) => void
}): Promise<{ url: string; path: string }> {
  // Step 1: Call API route to get signed upload URL
  const signRes = await fetch('/api/admin/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      bucket,
    }),
  })

  if (!signRes.ok) {
    const err = await signRes.json().catch(() => ({}))
    throw new Error(err.error || 'Failed to get signed upload URL')
  }

  const { signedUrl, publicUrl, path } = await signRes.json()

  // Step 2: Upload raw file bytes directly to Supabase Storage signed URL using XMLHttpRequest
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', signedUrl, true)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
        onProgress({
          loaded: event.loaded,
          total: event.total,
          percent,
          formattedLoaded: formatBytes(event.loaded),
          formattedTotal: formatBytes(event.total),
        })
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) {
          onProgress({
            loaded: file.size,
            total: file.size,
            percent: 100,
            formattedLoaded: formatBytes(file.size),
            formattedTotal: formatBytes(file.size),
          })
        }
        resolve({ url: publicUrl, path })
      } else {
        reject(new Error(`Storage direct upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Network error during storage direct upload'))
    }

    xhr.ontimeout = () => {
      reject(new Error('Storage direct upload timed out'))
    }

    xhr.send(file)
  })
}

interface UploadProgressCardProps {
  filename: string
  percent: number
  loadedText?: string
  totalText?: string
  className?: string
}

export function UploadProgressCard({
  filename,
  percent,
  loadedText,
  totalText,
  className = '',
}: UploadProgressCardProps) {
  // SVG circular ring calculation (r = 26, viewBox 0 0 64 64)
  const radius = 26
  const circumference = 2 * Math.PI * radius // ~163.36
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percent))) / 100

  const sizeFigure = loadedText && totalText ? `${loadedText} / ${totalText}` : totalText || ''

  return (
    <div
      style={{ backgroundColor: '#232536' }}
      className={`text-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-xl border border-white/10 w-44 sm:w-48 text-center select-none ${className}`}
    >
      {/* Circular Progress Ring */}
      <div className="relative w-16 h-16 flex items-center justify-center mb-2.5">
        <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
          {/* Gray Track */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#3d3f52"
            strokeWidth="5"
          />
          {/* Coral Progress Stroke */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="#EF5B45"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-150 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white tracking-tight">{percent}%</span>
        </div>
      </div>

      {/* Filename beneath, truncated with ellipsis, never wrapped */}
      <div className="w-full text-center px-1">
        <p className="text-xs font-medium text-gray-200 truncate w-full" title={filename}>
          {filename}
        </p>
        {sizeFigure && (
          <p className="text-[10px] text-gray-400 mt-1 font-mono tracking-tight">
            {sizeFigure}
          </p>
        )}
      </div>
    </div>
  )
}
