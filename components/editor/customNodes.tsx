'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { UploadProgressCard, uploadFileDirect, formatBytes } from './UploadProgress'

export interface GalleryImageEntry {
  url: string
  caption?: string
  width?: number
  height?: number
}

export { validateYouTubeUrl, getYouTubeEmbedUrl } from '@/lib/youtube'
import { validateYouTubeUrl, getYouTubeEmbedUrl } from '@/lib/youtube'

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
      <input
        type="text"
        value={caption}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        placeholder="Add video caption (optional)..."
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

      <input
        type="text"
        value={caption}
        onChange={(e) => updateAttributes({ caption: e.target.value })}
        placeholder="Add single gallery caption (optional)..."
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
