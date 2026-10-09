'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { UploadProgressCard, uploadFileDirect, formatBytes } from './UploadProgress'
import BookmarkCard from './BookmarkCard'
import ButtonCard, { isValidButtonUrl, sanitizeButtonUrl } from './ButtonCard'
export { ButtonCard, isValidButtonUrl, sanitizeButtonUrl }

export interface GalleryImageEntry {
  url: string
  caption?: string
  width?: number
  height?: number
}

export { validateYouTubeUrl, getYouTubeEmbedUrl } from '@/lib/youtube'
import { validateYouTubeUrl, getYouTubeEmbedUrl } from '@/lib/youtube'
import CaptionInput from './CaptionInput'

// React NodeView: Image
interface ImageComponentProps {
  node: {
    attrs: {
      src?: string
      alt?: string
      title?: string
      caption?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  selected: boolean
}

export function ImageComponent({ node, updateAttributes, selected }: ImageComponentProps) {
  const src = node.attrs?.src || ''
  const alt = node.attrs?.alt || ''
  const title = node.attrs?.title || ''
  const caption = node.attrs?.caption || ''

  return (
    <NodeViewWrapper className="image-node-view my-6 relative group text-center">
      <img
        src={src}
        alt={alt}
        title={title}
        className={`rounded-[5px] max-w-full mx-auto shadow-sm border border-gray-100 ${
          selected ? 'ring-2 ring-[#232536] ring-offset-2' : ''
        }`}
      />
      <CaptionInput
        value={caption}
        onChange={(val) => updateAttributes({ caption: val })}
        placeholder="Add a caption (optional). Link with [text](https://...)"
        className="w-full text-center text-xs text-gray-600 mt-2 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none py-1"
      />
    </NodeViewWrapper>
  )
}

// React NodeView: Video
function VideoComponent({ node, updateAttributes, deleteNode }: any) {
  const url = node.attrs.url || ''
  const caption = node.attrs.caption || ''
  const playAsGif = Boolean(node.attrs.playAsGif)
  const flushBackground = Boolean(node.attrs.flushBackground)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<{
    filename: string
    percent: number
    loadedText?: string
    totalText?: string
  } | null>(null)

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadProgress({
      filename: file.name,
      percent: 0,
      loadedText: '0 B',
      totalText: formatBytes(file.size),
    })

    try {
      const res = await uploadFileDirect({
        file,
        bucket: 'post-videos',
        onProgress: (p) => {
          setUploadProgress({
            filename: file.name,
            percent: p.percent,
            loadedText: p.formattedLoaded,
            totalText: p.formattedTotal,
          })
        },
      })
      updateAttributes({ url: res.url })
    } catch (err: any) {
      console.error('Video direct upload error:', err)
      alert(`Video upload failed: ${err?.message || 'Unknown error'}`)
    } finally {
      setUploadProgress(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const videoClass = flushBackground
    ? 'w-full'
    : 'w-full rounded-[5px] border border-gray-200 bg-black/5'

  return (
    <NodeViewWrapper className="video-node-view my-6 p-3 rounded-2xl border border-gray-200 bg-gray-50/50 relative group">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoFile}
        className="hidden"
      />
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/80 text-xs text-gray-500">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span>Video Block</span>
        </span>
        <div className="flex items-center gap-2">
          {!uploadProgress && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 text-xs font-medium transition"
            >
              {url ? 'Replace Video' : 'Upload Video'}
            </button>
          )}
          <button
            type="button"
            onClick={deleteNode}
            className="text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 text-xs transition"
            title="Remove video"
          >
            Remove
          </button>
        </div>
      </div>
      {uploadProgress ? (
        <div className="p-6 flex flex-col items-center justify-center">
          <UploadProgressCard
            filename={uploadProgress.filename}
            percent={uploadProgress.percent}
            loadedText={uploadProgress.loadedText}
            totalText={uploadProgress.totalText}
          />
        </div>
      ) : url ? (
        playAsGif ? (
          <video
            src={url}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className={videoClass}
          />
        ) : (
          <video
            src={url}
            controls
            preload="metadata"
            className={videoClass}
          />
        )
      ) : (
        <div className="p-8 text-center text-sm text-gray-400 bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2">
          <span>No video URL provided</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 px-3 py-1 bg-[#EF5B45] text-white rounded-lg text-xs font-medium hover:bg-[#d84a35] transition"
          >
            Upload Video File
          </button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4 mt-2 px-1 text-xs text-gray-600">
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={playAsGif}
            onChange={(e) => updateAttributes({ playAsGif: e.target.checked })}
            className="rounded border-gray-300 text-[#EF5B45] focus:ring-[#EF5B45]"
          />
          <span>Play as GIF (autoplay, loop, muted, no controls)</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={flushBackground}
            onChange={(e) => updateAttributes({ flushBackground: e.target.checked })}
            className="rounded border-gray-300 text-[#EF5B45] focus:ring-[#EF5B45]"
          />
          <span>Flush background</span>
        </label>
      </div>
      <CaptionInput
        value={caption}
        onChange={(val) => updateAttributes({ caption: val })}
        placeholder="Add a caption (optional). Link with [text](https://...)"
        className="w-full text-center text-xs text-gray-600 mt-2 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none py-1"
      />
    </NodeViewWrapper>
  )
}

// Image dimension extraction helpers
export function getImageDimensionsFromFile(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve({ width: 800, height: 600 })
    }
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth || 800
      const h = img.naturalHeight || 600
      URL.revokeObjectURL(url)
      resolve({ width: w, height: h })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve({ width: 800, height: 600 })
    }
    img.src = url
  })
}

export function getImageDimensionsFromUrl(url: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !url) {
      return resolve({ width: 800, height: 600 })
    }
    const img = new Image()
    img.onload = () => {
      const w = img.naturalWidth || 800
      const h = img.naturalHeight || 600
      resolve({ width: w, height: h })
    }
    img.onerror = () => {
      resolve({ width: 800, height: 600 })
    }
    img.src = url
  })
}

// React NodeView: Gallery
interface ActiveUploadItem {
  id: string
  filename: string
  percent: number
  loadedText?: string
  totalText?: string
}

function GalleryComponent({ node, updateAttributes, deleteNode }: any) {
  const images: GalleryImageEntry[] = Array.isArray(node.attrs.images) ? node.attrs.images : []
  const caption = node.attrs.caption || ''
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeUploads, setActiveUploads] = useState<Record<string, ActiveUploadItem>>({})
  const imagesRef = useRef(images)

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  // Self-heal: If any existing image is missing dimensions, measure natural dimensions client-side and backfill
  useEffect(() => {
    const missingDims = images.some((img) => !img.width || !img.height)
    if (!missingDims) return

    let isMounted = true
    Promise.all(
      images.map(async (img) => {
        if (img.width && img.height && img.width > 0 && img.height > 0) return img
        try {
          const dims = await getImageDimensionsFromUrl(img.url)
          return { ...img, width: dims.width, height: dims.height }
        } catch {
          return { ...img, width: 800, height: 600 }
        }
      })
    ).then((healedImages) => {
      if (isMounted) {
        imagesRef.current = healedImages
        updateAttributes({ images: healedImages })
      }
    })

    return () => {
      isMounted = false
    }
  }, [images, updateAttributes])

  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileList = Array.from(files)
    const initialUploads: Record<string, ActiveUploadItem> = {}
    const fileTasks: { id: string; file: File; dimsPromise: Promise<{ width: number; height: number }> }[] = []

    fileList.forEach((file, index) => {
      const id = `${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`
      initialUploads[id] = {
        id,
        filename: file.name,
        percent: 0,
        loadedText: '0 B',
        totalText: formatBytes(file.size),
      }
      fileTasks.push({
        id,
        file,
        dimsPromise: getImageDimensionsFromFile(file),
      })
    })

    setActiveUploads((prev) => ({ ...prev, ...initialUploads }))

    // Fire all uploads concurrently directly to Supabase storage
    fileTasks.forEach(({ id, file, dimsPromise }) => {
      uploadFileDirect({
        file,
        bucket: 'post-images',
        onProgress: (p) => {
          setActiveUploads((prev) => {
            if (!prev[id]) return prev
            return {
              ...prev,
              [id]: {
                ...prev[id],
                percent: p.percent,
                loadedText: p.formattedLoaded,
                totalText: p.formattedTotal,
              },
            }
          })
        },
      })
        .then(async (res) => {
          // 1. Remove this completed file's progress card
          setActiveUploads((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          })
          // 2. Measure real natural dimensions and add completed thumbnail into gallery immediately
          let dims = { width: 800, height: 600 }
          try {
            dims = await dimsPromise
          } catch (e) {
            console.warn('Could not read image dimensions:', e)
          }

          const nextImages = [
            ...imagesRef.current,
            {
              url: res.url,
              caption: file.name.replace(/\.[^/.]+$/, ''),
              width: dims.width,
              height: dims.height,
            },
          ]
          imagesRef.current = nextImages
          updateAttributes({ images: nextImages })
        })
        .catch((err: any) => {
          console.error(`Gallery direct upload failed for ${file.name}:`, err)
          setActiveUploads((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
          })
          alert(`Failed to upload ${file.name}: ${err?.message || 'Upload error'}`)
        })
    })

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleAddByUrl = async () => {
    const url = window.prompt('Enter image URL:')
    if (!url || !url.trim()) return
    const cleanUrl = url.trim()
    const dims = await getImageDimensionsFromUrl(cleanUrl)
    const nextImages = [
      ...imagesRef.current,
      {
        url: cleanUrl,
        caption: '',
        width: dims.width,
        height: dims.height,
      },
    ]
    imagesRef.current = nextImages
    updateAttributes({ images: nextImages })
  }

  const handleRemoveImage = (indexToRemove: number) => {
    updateAttributes({
      images: images.filter((_, i) => i !== indexToRemove),
    })
  }

  const handleMove = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= images.length) return
    const nextImages = [...images]
    const temp = nextImages[index]
    nextImages[index] = nextImages[targetIndex]
    nextImages[targetIndex] = temp
    updateAttributes({ images: nextImages })
  }

  const hasActiveUploads = Object.keys(activeUploads).length > 0

  // Group images into justified pairs of 2, odd image as group of 1
  const groups: { item: GalleryImageEntry; index: number }[][] = []
  for (let i = 0; i < images.length; i += 2) {
    if (i + 1 < images.length) {
      groups.push([
        { item: images[i], index: i },
        { item: images[i + 1], index: i + 1 },
      ])
    } else {
      groups.push([{ item: images[i], index: i }])
    }
  }

  return (
    <NodeViewWrapper className="gallery-node-view my-6 p-3 rounded-2xl border border-gray-200 bg-gray-50/50 relative group">
      {/* Hidden native multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFilesUpload}
        className="hidden"
      />

      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/80 text-xs text-gray-500">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span>Gallery Block ({images.length} {images.length === 1 ? 'image' : 'images'})</span>
        </span>
        <div className="flex items-center gap-2">
          {hasActiveUploads && (
            <span className="text-xs text-[#EF5B45] font-medium animate-pulse">
              Uploading {Object.keys(activeUploads).length} {Object.keys(activeUploads).length === 1 ? 'image' : 'images'}...
            </span>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 text-xs font-medium transition"
          >
            + Add Images
          </button>
          <button
            type="button"
            onClick={handleAddByUrl}
            className="text-gray-600 hover:text-gray-800 px-2 py-0.5 rounded hover:bg-gray-100 text-xs font-medium transition"
          >
            + Add via URL
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 text-xs transition"
            title="Remove gallery"
          >
            Remove Gallery
          </button>
        </div>
      </div>

      {/* Multi-upload circular progress rings: side by side in a wrapping row */}
      {hasActiveUploads && (
        <div className="flex flex-wrap gap-3 items-center justify-start my-3 p-3 bg-gray-100/80 rounded-xl border border-gray-200/80">
          {Object.values(activeUploads).map((item) => (
            <UploadProgressCard
              key={item.id}
              filename={item.filename}
              percent={item.percent}
              loadedText={item.loadedText}
              totalText={item.totalText}
            />
          ))}
        </div>
      )}

      {images.length === 0 && !hasActiveUploads ? (
        <div className="p-8 text-center text-sm text-gray-400 bg-gray-100 rounded-xl">
          Gallery is empty. Click "+ Add Images" above to upload photos.
        </div>
      ) : images.length > 0 ? (
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 w-full">
          {groups.map((group, groupIdx) => {
            if (group.length === 2) {
              return (
                <div key={groupIdx} className="flex flex-row gap-3 sm:gap-4 md:gap-5 w-full items-start">
                  {group.map(({ item: img, index: i }) => {
                    const w = img.width && img.width > 0 ? img.width : 4
                    const h = img.height && img.height > 0 ? img.height : 3
                    const ratio = w / h
                    return (
                      <div
                        key={i}
                        style={{
                          flexGrow: ratio,
                          flexBasis: 0,
                          minWidth: 0,
                          aspectRatio: `${w} / ${h}`,
                        }}
                        className="relative group/img rounded-[4px] overflow-hidden border border-[#F5ECDE] bg-[#FAF5EC] shadow-sm hover:shadow-md transition"
                      >
                        <img
                          src={img.url}
                          alt={img.caption || ''}
                          className="w-full h-full block"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMove(i, 'left')}
                              className="p-1 bg-white/90 rounded text-gray-800 hover:bg-white text-xs"
                              title="Move Left"
                            >
                              &larr;
                            </button>
                          )}
                          {i < images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMove(i, 'right')}
                              className="p-1 bg-white/90 rounded text-gray-800 hover:bg-white text-xs"
                              title="Move Right"
                            >
                              &rarr;
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="p-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            title="Remove image"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            }

            // Group of 1 (odd one out)
            const { item: img, index: i } = group[0]
            const w = img.width && img.width > 0 ? img.width : 4
            const h = img.height && img.height > 0 ? img.height : 3
            return (
              <div key={groupIdx} className="w-full">
                <div
                  style={{
                    aspectRatio: `${w} / ${h}`,
                  }}
                  className="relative group/img rounded-[4px] overflow-hidden border border-[#F5ECDE] bg-[#FAF5EC] shadow-sm hover:shadow-md transition w-full"
                >
                  <img
                    src={img.url}
                    alt={img.caption || ''}
                    className="w-full h-full block"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMove(i, 'left')}
                        className="p-1 bg-white/90 rounded text-gray-800 hover:bg-white text-xs"
                        title="Move Left"
                      >
                        &larr;
                      </button>
                    )}
                    {i < images.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMove(i, 'right')}
                        className="p-1 bg-white/90 rounded text-gray-800 hover:bg-white text-xs"
                        title="Move Right"
                      >
                        &rarr;
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="p-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                      title="Remove image"
                    >
                      &times;
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      <CaptionInput
        value={caption}
        onChange={(val) => updateAttributes({ caption: val })}
        placeholder="Add a caption (optional). Link with [text](https://...)"
        className="w-full text-center text-xs text-gray-600 mt-2 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none py-1"
      />
    </NodeViewWrapper>
  )
}

// React NodeView: YouTube
function YouTubeComponent({ node, updateAttributes, deleteNode }: any) {
  const url = node.attrs.url || ''
  const embedUrl = getYouTubeEmbedUrl(url)
  const [isEditing, setIsEditing] = useState(false)
  const [tempUrl, setTempUrl] = useState(url)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSave = () => {
    const res = validateYouTubeUrl(tempUrl)
    if (!res.valid) {
      setErrorMsg(res.error || 'Invalid YouTube URL')
      return
    }
    setErrorMsg(null)
    updateAttributes({ url: tempUrl.trim() })
    setIsEditing(false)
  }

  return (
    <NodeViewWrapper className="youtube-node-view my-6 p-3 rounded-2xl border border-gray-200 bg-gray-50/50 relative group">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/80 text-xs text-gray-500">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span>YouTube Embed</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-gray-600 hover:text-gray-900 px-2 py-0.5 rounded hover:bg-gray-200 text-xs transition"
          >
            {isEditing ? 'Cancel' : 'Edit URL'}
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 text-xs transition"
            title="Remove embed"
          >
            Remove
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-2">
          <label className="block text-xs font-semibold text-gray-700">YouTube URL</label>
          <input
            type="text"
            value={tempUrl}
            onChange={(e) => setTempUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
          {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition"
          >
            Save URL
          </button>
        </div>
      ) : embedUrl ? (
        <div className="aspect-video w-full overflow-hidden rounded-[5px] border border-gray-200 bg-black">
          <iframe
            src={embedUrl}
            title="YouTube video player"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      ) : (
        <div className="p-8 text-center text-sm text-gray-400 bg-gray-100 rounded-xl">
          Invalid or missing YouTube URL
        </div>
      )}
    </NodeViewWrapper>
  )
}

// React NodeView: Bookmark
interface BookmarkComponentProps {
  node: {
    attrs: {
      url?: string
      title?: string
      description?: string
      author?: string
      publisher?: string
      thumbnail?: string
      icon?: string
      caption?: string
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

function BookmarkComponent({ node, updateAttributes, deleteNode }: BookmarkComponentProps) {
  const url = node.attrs.url || ''
  const title = node.attrs.title || ''
  const description = node.attrs.description || ''
  const author = node.attrs.author || ''
  const publisher = node.attrs.publisher || ''
  const thumbnail = node.attrs.thumbnail || ''
  const icon = node.attrs.icon || ''
  const caption = node.attrs.caption || ''

  const [isEditingUrl, setIsEditingUrl] = useState(!url)
  const [inputUrl, setInputUrl] = useState(url)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isManualEditing, setIsManualEditing] = useState(false)

  useEffect(() => {
    console.info('[bookmark] BookmarkComponent mount', { url: node.attrs?.url || '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFetchMetadata = async (targetUrl: string) => {
    const trimmed = targetUrl.trim()
    if (!trimmed) {
      const msg = 'Please enter a URL.'
      console.error('[bookmark-metadata]', msg)
      setErrorMessage(msg)
      return
    }

    console.info('[bookmark] fetch start', { url: trimmed })
    setIsLoading(true)
    setErrorMessage(null)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, 30000)

    try {
      const res = await fetch('/api/admin/bookmark-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
        signal: controller.signal,
      })

      let data: {
        url?: string
        title?: string
        description?: string
        author?: string
        publisher?: string
        thumbnail?: string
        icon?: string
        error?: string
      } | null = null
      let isJson = false
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        try {
          data = await res.json()
          isJson = true
        } catch {
          isJson = false
          data = null
        }
      }

      if (!isJson) {
        const errorMsg = `The server took too long or failed (HTTP ${res.status}). Try again.`
        console.error('[bookmark-metadata]', errorMsg)
        console.info('[bookmark] fetch failure', { reason: 'non-json', status: res.status })
        setErrorMessage(errorMsg)
        return
      }

      if (!res.ok) {
        const errorMsg =
          data?.error || `The server took too long or failed (HTTP ${res.status}). Try again.`
        console.error('[bookmark-metadata]', errorMsg)
        console.info('[bookmark] fetch failure', { reason: 'not-ok', status: res.status, error: errorMsg })
        setErrorMessage(errorMsg)
        return
      }

      if (!data) {
        const errorMsg = `The server took too long or failed (HTTP ${res.status}). Try again.`
        console.error('[bookmark-metadata]', errorMsg)
        console.info('[bookmark] fetch failure', { reason: 'empty-data', status: res.status })
        setErrorMessage(errorMsg)
        return
      }

      updateAttributes({
        url: data.url || trimmed,
        title: data.title || trimmed,
        description: data.description || '',
        author: data.author || '',
        publisher: data.publisher || '',
        thumbnail: data.thumbnail || '',
        icon: data.icon || '',
      })
      setIsEditingUrl(false)
      setIsManualEditing(false)
      console.info('[bookmark] fetch success', { url: data.url || trimmed })
    } catch (err: unknown) {
      let message = ''
      if (err instanceof Error && err.name === 'AbortError') {
        message = 'The server took too long or failed (HTTP 504). Try again.'
      } else {
        message = err instanceof Error ? err.message : 'Failed to fetch bookmark metadata'
      }
      console.error('[bookmark-metadata]', message)
      console.info('[bookmark] fetch failure', { reason: 'exception', error: message })
      setErrorMessage(message)
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }

  const handleFallbackUseUrl = () => {
    const trimmed = inputUrl.trim()
    if (!trimmed) return
    updateAttributes({
      url: trimmed,
      title: trimmed,
      description: '',
      author: '',
      publisher: '',
      thumbnail: '',
      icon: '',
    })
    setIsEditingUrl(false)
    setIsManualEditing(true)
    setErrorMessage(null)
  }

  return (
    <NodeViewWrapper className="bookmark-node-view my-6 p-3 rounded-2xl border border-gray-200 bg-gray-50/50 relative group">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/80 text-xs text-gray-500">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span>Bookmark Block</span>
        </span>
        <div className="flex items-center gap-2">
          {url && !isEditingUrl && (
            <>
              <button
                type="button"
                onClick={() => {
                  setInputUrl(url)
                  setIsEditingUrl(true)
                  setErrorMessage(null)
                }}
                className="text-gray-600 hover:text-gray-900 px-2 py-0.5 rounded hover:bg-gray-200 text-xs transition"
              >
                Replace URL
              </button>
              <button
                type="button"
                onClick={() => setIsManualEditing(!isManualEditing)}
                className="text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 text-xs font-medium transition"
              >
                {isManualEditing ? 'Close Details' : 'Edit Details'}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={deleteNode}
            className="text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 text-xs transition"
            title="Remove bookmark"
          >
            Remove
          </button>
        </div>
      </div>

      {/* URL Input Form (on insert or when replacing URL) */}
      {isEditingUrl || !url ? (
        <div className="p-4 bg-white rounded-xl border border-gray-200 space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Paste a URL to add a bookmark
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleFetchMetadata(inputUrl)
                }
              }}
              placeholder="https://example.com/article"
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#232536]"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleFetchMetadata(inputUrl)}
              disabled={isLoading || !inputUrl.trim()}
              className="px-3 py-1.5 bg-[#232536] text-white text-xs font-medium rounded-lg hover:bg-black transition disabled:opacity-50"
            >
              {isLoading ? 'Fetching...' : 'Add Bookmark'}
            </button>
            {url && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingUrl(false)
                  setErrorMessage(null)
                }}
                className="px-2 py-1.5 text-gray-500 hover:text-gray-700 text-xs"
              >
                Cancel
              </button>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-500 animate-pulse pt-1">
              <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Fetching page metadata...</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs space-y-2">
              <p className="text-red-700 font-medium">{errorMessage}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFallbackUseUrl}
                  className="px-2.5 py-1 bg-white border border-gray-300 rounded shadow-xs text-gray-700 hover:bg-gray-50 font-medium transition"
                >
                  Use URL anyway (edit manually)
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Card Presentation */}
          <BookmarkCard
            url={url}
            title={title}
            description={description}
            author={author}
            publisher={publisher}
            thumbnail={thumbnail}
            icon={icon}
            isEditor={true}
          />

          {/* Editable Caption */}
          <input
            type="text"
            value={caption}
            onChange={(e) => updateAttributes({ caption: e.target.value })}
            placeholder="Add a caption (optional)..."
            className="w-full text-center text-xs text-gray-600 mt-2 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-gray-500 focus:outline-none py-1"
          />

          {/* Manual editing drawer */}
          {isManualEditing && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 space-y-3 text-xs">
              <div className="font-semibold text-gray-800 pb-1 border-b border-gray-100">
                Edit Bookmark Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => updateAttributes({ title: e.target.value })}
                    className="w-full px-2.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Publisher</label>
                  <input
                    type="text"
                    value={publisher}
                    onChange={(e) => updateAttributes({ publisher: e.target.value })}
                    className="w-full px-2.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Author</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => updateAttributes({ author: e.target.value })}
                    className="w-full px-2.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Icon URL</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => updateAttributes({ icon: e.target.value })}
                    className="w-full px-2.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-gray-600 font-medium mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => updateAttributes({ description: e.target.value })}
                    className="w-full px-2.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-gray-600 font-medium mb-1">Thumbnail URL</label>
                  <input
                    type="text"
                    value={thumbnail}
                    onChange={(e) => updateAttributes({ thumbnail: e.target.value })}
                    className="w-full px-2.5 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsManualEditing(false)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded font-medium transition"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  )
}

// 1. TipTap Video Node
export const Video = Node.create({
  name: 'video',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: '',
      },
      caption: {
        default: '',
      },
      playAsGif: {
        default: false,
      },
      flushBackground: {
        default: false,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="video"]',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const video = el.querySelector('video')
          const figcaption = el.querySelector('figcaption')
          const isGif = video?.hasAttribute('autoplay') || video?.hasAttribute('loop')
          const isFlush = video ? !video.classList.contains('border') : false
          return {
            url: video?.getAttribute('src') || '',
            caption: figcaption?.textContent || '',
            playAsGif: Boolean(isGif),
            flushBackground: Boolean(isFlush),
          }
        },
      },
      {
        tag: 'video',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const isGif = el.hasAttribute('autoplay') || el.hasAttribute('loop')
          const isFlush = !el.classList.contains('border')
          return {
            url: el.getAttribute('src') || '',
            playAsGif: Boolean(isGif),
            flushBackground: Boolean(isFlush),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const isFlush = Boolean(HTMLAttributes.flushBackground)
    const isGif = Boolean(HTMLAttributes.playAsGif)
    const videoAttrs: Record<string, string> = {
      src: HTMLAttributes.url,
      preload: isGif ? 'auto' : 'metadata',
      class: isFlush
        ? 'w-full'
        : 'w-full rounded-[5px] border border-[#F5ECDE] shadow-sm',
    }
    if (isGif) {
      videoAttrs.autoplay = 'true'
      videoAttrs.muted = 'true'
      videoAttrs.loop = 'true'
      videoAttrs.playsinline = 'true'
    } else {
      videoAttrs.controls = 'true'
    }

    return [
      'figure',
      mergeAttributes({ 'data-type': 'video', class: 'video-block my-8' }),
      ['video', videoAttrs],
      HTMLAttributes.caption
        ? [
            'figcaption',
            { class: 'mt-2.5 text-center text-xs sm:text-sm text-[#5A5D70]' },
            HTMLAttributes.caption,
          ]
        : '',
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoComponent)
  },
})

// 2. TipTap Gallery Node
export const Gallery = Node.create({
  name: 'gallery',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [] as GalleryImageEntry[],
      },
      caption: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="gallery"]',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const imgs = Array.from(el.querySelectorAll('img')).map((img) => {
            const w = parseInt(img.getAttribute('data-width') || img.getAttribute('width') || '', 10)
            const h = parseInt(img.getAttribute('data-height') || img.getAttribute('height') || '', 10)
            return {
              url: img.getAttribute('src') || '',
              caption: img.getAttribute('alt') || '',
              ...(w > 0 && h > 0 ? { width: w, height: h } : {}),
            }
          })
          const figcaption = el.querySelector('figcaption')
          return {
            images: imgs,
            caption: figcaption?.textContent || '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const images: GalleryImageEntry[] = Array.isArray(HTMLAttributes.images) ? HTMLAttributes.images : []
    const groups: GalleryImageEntry[][] = []
    for (let i = 0; i < images.length; i += 2) {
      if (i + 1 < images.length) {
        groups.push([images[i], images[i + 1]])
      } else {
        groups.push([images[i]])
      }
    }

    const groupElements = groups.map((group) => {
      if (group.length === 2) {
        return [
          'div',
          { class: 'flex flex-row gap-3 sm:gap-4 md:gap-5 w-full items-start' },
          ...group.map((img) => {
            const w = img.width && img.width > 0 ? img.width : 4
            const h = img.height && img.height > 0 ? img.height : 3
            const ratio = w / h
            return [
              'a',
              {
                href: img.url,
                target: '_blank',
                rel: 'noopener noreferrer',
                class: 'group block overflow-hidden rounded-[4px] border border-[#F5ECDE] bg-[#FAF5EC] shadow-sm',
                style: `flex-grow: ${ratio}; flex-basis: 0; min-width: 0; aspect-ratio: ${w} / ${h};`,
              },
              [
                'img',
                {
                  src: img.url,
                  alt: img.caption || '',
                  class: 'w-full h-full block',
                  'data-width': String(w),
                  'data-height': String(h),
                },
              ],
            ]
          }),
        ]
      }

      const img = group[0]
      const w = img.width && img.width > 0 ? img.width : 4
      const h = img.height && img.height > 0 ? img.height : 3
      return [
        'div',
        { class: 'w-full' },
        [
          'a',
          {
            href: img.url,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'group block overflow-hidden rounded-[4px] border border-[#F5ECDE] bg-[#FAF5EC] shadow-sm w-full',
            style: `aspect-ratio: ${w} / ${h};`,
          },
          [
            'img',
            {
              src: img.url,
              alt: img.caption || '',
              class: 'w-full h-full block',
              'data-width': String(w),
              'data-height': String(h),
            },
          ],
        ],
      ]
    })

    return [
      'figure',
      mergeAttributes({ 'data-type': 'gallery', class: 'gallery-block my-8' }),
      ['div', { class: 'flex flex-col gap-3 sm:gap-4 md:gap-5 w-full' }, ...groupElements],
      HTMLAttributes.caption
        ? [
            'figcaption',
            { class: 'mt-2.5 text-center text-xs sm:text-sm text-[#5A5D70]' },
            HTMLAttributes.caption,
          ]
        : '',
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(GalleryComponent)
  },
})

// 3. TipTap YouTube Node
export const YouTube = Node.create({
  name: 'youtube',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="youtube"]',
        getAttrs: (element) => {
          const el = element as HTMLElement
          return {
            url: el.getAttribute('data-url') || '',
          }
        },
      },
      {
        tag: 'iframe[src*="youtube.com"], iframe[src*="youtu.be"]',
        getAttrs: (element) => {
          const el = element as HTMLElement
          return {
            url: el.getAttribute('src') || '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const embedUrl = getYouTubeEmbedUrl(HTMLAttributes.url) || ''
    return [
      'div',
      mergeAttributes({
        'data-type': 'youtube',
        'data-url': HTMLAttributes.url,
        class: 'youtube-block my-8 aspect-video w-full rounded-[5px] overflow-hidden border border-[#F5ECDE]',
      }),
      [
        'iframe',
        {
          src: embedUrl,
          title: 'YouTube video player',
          allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
          allowfullscreen: 'true',
          class: 'w-full h-full border-0',
        },
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(YouTubeComponent)
  },
})

// 3.5. TipTap Bookmark Node
export const Bookmark = Node.create({
  name: 'bookmark',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      url: { default: '' },
      title: { default: '' },
      description: { default: '' },
      author: { default: '' },
      publisher: { default: '' },
      thumbnail: { default: '' },
      icon: { default: '' },
      caption: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="bookmark"]',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const a = el.querySelector('a.kg-bookmark-container') || el.querySelector('a')
          const titleEl = el.querySelector('.kg-bookmark-title')
          const descEl = el.querySelector('.kg-bookmark-description')
          const authorEl = el.querySelector('.kg-bookmark-author')
          const pubEl = el.querySelector('.kg-bookmark-publisher')
          const iconEl = el.querySelector('.kg-bookmark-icon') as HTMLImageElement | null
          const thumbEl = el.querySelector('.kg-bookmark-thumbnail img') as HTMLImageElement | null
          const figcaption = el.querySelector('figcaption')
          return {
            url: el.getAttribute('data-url') || a?.getAttribute('href') || '',
            title: el.getAttribute('data-title') || titleEl?.textContent || '',
            description: el.getAttribute('data-description') || descEl?.textContent || '',
            author: el.getAttribute('data-author') || authorEl?.textContent || '',
            publisher: el.getAttribute('data-publisher') || pubEl?.textContent || '',
            thumbnail: el.getAttribute('data-thumbnail') || thumbEl?.getAttribute('src') || '',
            icon: el.getAttribute('data-icon') || iconEl?.getAttribute('src') || '',
            caption: figcaption?.textContent || '',
          }
        },
      },
      {
        tag: 'figure.kg-bookmark-card',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const a = el.querySelector('a.kg-bookmark-container') || el.querySelector('a')
          const titleEl = el.querySelector('.kg-bookmark-title')
          const descEl = el.querySelector('.kg-bookmark-description')
          const authorEl = el.querySelector('.kg-bookmark-author')
          const pubEl = el.querySelector('.kg-bookmark-publisher')
          const iconEl = el.querySelector('.kg-bookmark-icon') as HTMLImageElement | null
          const thumbEl = el.querySelector('.kg-bookmark-thumbnail img') as HTMLImageElement | null
          const figcaption = el.querySelector('figcaption')
          // Ghost inverted author/publisher: .kg-bookmark-author has publisher text, .kg-bookmark-publisher has author text
          return {
            url: a?.getAttribute('href') || '',
            title: titleEl?.textContent || '',
            description: descEl?.textContent || '',
            author: pubEl?.textContent || '',
            publisher: authorEl?.textContent || '',
            thumbnail: thumbEl?.getAttribute('src') || '',
            icon: iconEl?.getAttribute('src') || '',
            caption: figcaption?.textContent || '',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      mergeAttributes({
        'data-type': 'bookmark',
        'data-url': HTMLAttributes.url,
        'data-title': HTMLAttributes.title,
        'data-description': HTMLAttributes.description,
        'data-author': HTMLAttributes.author,
        'data-publisher': HTMLAttributes.publisher,
        'data-thumbnail': HTMLAttributes.thumbnail,
        'data-icon': HTMLAttributes.icon,
        class: 'kg-card kg-bookmark-card my-8 w-full',
      }),
      [
        'a',
        {
          href: HTMLAttributes.url || '#',
          class: 'kg-bookmark-container group flex flex-row items-stretch justify-between w-full bg-white rounded-[5px] border border-[#F5ECDE] shadow-sm hover:border-[#EF5B45]/40 hover:shadow-md transition overflow-hidden text-left no-underline text-[#232536]',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        [
          'div',
          { class: 'kg-bookmark-content flex flex-col justify-between flex-1 min-w-0 p-5 overflow-hidden' },
          [
            'div',
            { class: 'w-full' },
            ['div', { class: 'kg-bookmark-title font-[\'MTN_Brighter_Sans\',_sans-serif] text-[15px] font-semibold text-[#232536] leading-[1.4] line-clamp-2 break-words' }, HTMLAttributes.title || HTMLAttributes.url],
            HTMLAttributes.description
              ? ['div', { class: 'kg-bookmark-description mt-1 text-[14px] text-[#5A5D70] leading-[1.5] line-clamp-2 break-words opacity-80' }, HTMLAttributes.description]
              : '',
          ],
          (HTMLAttributes.icon || HTMLAttributes.publisher || HTMLAttributes.author)
            ? [
                'div',
                { class: 'kg-bookmark-metadata flex items-center gap-1.5 mt-5 text-[14px] text-[#5A5D70] font-medium whitespace-nowrap overflow-hidden text-ellipsis' },
                HTMLAttributes.icon
                  ? ['img', { class: 'kg-bookmark-icon w-5 h-5 object-contain rounded-xs shrink-0', src: HTMLAttributes.icon, alt: '' }]
                  : '',
                HTMLAttributes.publisher
                  ? ['span', { class: 'kg-bookmark-publisher truncate max-w-[240px] text-[#232536]/80 font-medium' }, HTMLAttributes.publisher]
                  : '',
                HTMLAttributes.publisher && HTMLAttributes.author
                  ? ['span', { class: 'text-[#5A5D70]/60 select-none' }, '•']
                  : '',
                HTMLAttributes.author
                  ? ['span', { class: 'kg-bookmark-author truncate text-[#5A5D70] font-normal' }, HTMLAttributes.author]
                  : '',
              ]
            : '',
        ],
        HTMLAttributes.thumbnail
          ? [
              'div',
              { class: 'kg-bookmark-thumbnail relative shrink-0 w-1/3 min-w-[33%] max-w-[40%] bg-[#FAF5EC] overflow-hidden' },
              ['img', { class: 'absolute inset-0 w-full h-full object-cover', src: HTMLAttributes.thumbnail, alt: '' }],
            ]
          : '',
      ],
      HTMLAttributes.caption
        ? ['figcaption', { class: 'mt-2.5 text-center text-xs sm:text-sm text-[#5A5D70]' }, HTMLAttributes.caption]
        : '',
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(BookmarkComponent)
  },
})

// 4. TipTap Callout Node
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      toggleCallout: () => ReturnType
      setCallout: () => ReturnType
      unsetCallout: () => ReturnType
    }
  }
}

export const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout"]',
      },
      {
        tag: 'div.callout-block',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout',
        class: 'callout-block',
        style: 'background-color: #FAECE7; border: 1px solid #D85A30; border-radius: 10px; padding: 16px 18px;',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      toggleCallout: () => ({ commands }) => {
        return commands.toggleWrap(this.name)
      },
      setCallout: () => ({ commands }) => {
        return commands.wrapIn(this.name)
      },
      unsetCallout: () => ({ commands }) => {
        return commands.lift(this.name)
      },
    }
  },
})

// 5. TipTap Button Node (Ghost-style button card)
interface ButtonComponentProps {
  node: {
    attrs: {
      label?: string
      url?: string
      alignment?: 'left' | 'center'
    }
  }
  updateAttributes: (attrs: Record<string, unknown>) => void
  deleteNode: () => void
}

function ButtonComponent({ node, updateAttributes, deleteNode }: ButtonComponentProps) {
  const label = node.attrs.label ?? 'Click here'
  const url = node.attrs.url ?? ''
  const alignment = (node.attrs.alignment === 'center' ? 'center' : 'left') as 'left' | 'center'

  useEffect(() => {
    console.info('[button] ButtonComponent mount', { label, url, alignment })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const urlIsInvalid = Boolean(url && !isValidButtonUrl(url))

  return (
    <NodeViewWrapper className="button-node-view my-6 p-4 rounded-2xl border border-gray-200 bg-gray-50/50 relative group">
      {/* Top action bar */}
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-gray-200/80 text-xs text-gray-500">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span>🔘 Button Block</span>
        </span>
        <button
          type="button"
          onClick={deleteNode}
          className="text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 text-xs transition cursor-pointer"
          title="Remove button"
        >
          Remove
        </button>
      </div>

      {/* Inline editing form */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-white p-3 rounded-xl border border-gray-200">
        {/* Label field */}
        <div className="sm:col-span-5">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Button Text</label>
          <input
            type="text"
            value={label}
            onChange={(e) => updateAttributes({ label: e.target.value })}
            placeholder="e.g. Download Template"
            className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#232536]"
          />
        </div>

        {/* URL field */}
        <div className="sm:col-span-5">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Button Link</label>
          <input
            type="text"
            value={url}
            onChange={(e) => updateAttributes({ url: e.target.value })}
            placeholder="https://example.com or /garden"
            className={`w-full px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#232536] ${
              urlIsInvalid ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
            }`}
          />
        </div>

        {/* Alignment toggle */}
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-semibold text-gray-600 mb-1">Alignment</label>
          <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-gray-100">
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: 'left' })}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                alignment === 'left'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Align left"
            >
              Left
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: 'center' })}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition cursor-pointer ${
                alignment === 'center'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Align center"
            >
              Center
            </button>
          </div>
        </div>
      </div>

      {urlIsInvalid && (
        <p className="mt-2 text-xs text-red-600 font-medium">
          Invalid link. URLs must start with http://, https://, or / (e.g. /blog)
        </p>
      )}

      {/* Button Preview */}
      <div className="mt-4 pt-3 border-t border-gray-200/60">
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
          Preview
        </div>
        <div className="bg-white/60 p-4 rounded-xl border border-dashed border-gray-200">
          <ButtonCard
            label={label || 'Button text'}
            url={url}
            alignment={alignment}
            isEditor={true}
          />
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export const Button = Node.create({
  name: 'button',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      label: {
        default: 'Click here',
      },
      url: {
        default: '',
      },
      alignment: {
        default: 'left',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div.kg-button-card',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const a = el.querySelector('a.kg-btn') || el.querySelector('a')
          const isCenter = el.classList.contains('kg-align-center')
          const alignment = isCenter ? 'center' : 'left'
          return {
            label: a?.textContent?.trim() || '',
            url: a?.getAttribute('href') || '',
            alignment,
          }
        },
      },
      {
        tag: 'div[data-type="button"]',
        getAttrs: (element) => {
          const el = element as HTMLElement
          const a = el.querySelector('a')
          const alignment = el.getAttribute('data-alignment') === 'center' ? 'center' : 'left'
          return {
            label: el.getAttribute('data-label') || a?.textContent?.trim() || '',
            url: el.getAttribute('data-url') || a?.getAttribute('href') || '',
            alignment,
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const alignment = HTMLAttributes.alignment === 'center' ? 'center' : 'left'
    const isCenter = alignment === 'center'
    const alignClass = isCenter ? 'kg-align-center' : 'kg-align-left'
    const url = HTMLAttributes.url || ''
    const safeUrl = sanitizeButtonUrl(url)

    const anchorAttrs: Record<string, string> = {
      href: safeUrl,
      class: 'kg-btn kg-btn-accent',
    }
    if (safeUrl !== '#') {
      anchorAttrs.target = '_blank'
      anchorAttrs.rel = 'noopener noreferrer'
    }

    return [
      'div',
      mergeAttributes({
        class: `kg-card kg-button-card ${alignClass}`,
        'data-type': 'button',
        'data-alignment': alignment,
      }),
      [
        'a',
        anchorAttrs,
        HTMLAttributes.label || 'Button',
      ],
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ButtonComponent)
  },
})

