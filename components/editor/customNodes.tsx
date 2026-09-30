'use client'

import React, { useState } from 'react'
import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'

export interface GalleryImageEntry {
  url: string
  caption?: string
}

export function validateYouTubeUrl(input: string): { valid: boolean; embedUrl?: string; error?: string } {
  const trimmed = (input || '').trim()
  if (!trimmed) {
    return { valid: false, error: 'YouTube URL cannot be empty.' }
  }

  try {
    const parsed = new URL(trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`)
    const host = parsed.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '')

    if (host !== 'youtube.com' && host !== 'youtu.be') {
      return { valid: false, error: 'Only youtube.com and youtu.be addresses are allowed.' }
    }

    let videoId: string | null = null

    if (host === 'youtu.be') {
      videoId = parsed.pathname.slice(1).split('/')[0] || null
    } else if (host === 'youtube.com') {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v')
      } else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.replace('/embed/', '').split('/')[0] || null
      } else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.replace('/shorts/', '').split('/')[0] || null
      }
    }

    if (!videoId) {
      return { valid: false, error: 'Could not extract YouTube video ID from the provided URL.' }
    }

    const cleanId = videoId.replace(/[^a-zA-Z0-9_-]/g, '')
    if (!cleanId) {
      return { valid: false, error: 'Invalid YouTube video ID format.' }
    }

    return {
      valid: true,
      embedUrl: `https://www.youtube.com/embed/${cleanId}`,
    }
  } catch {
    return { valid: false, error: 'Invalid URL format.' }
  }
}

export function getYouTubeEmbedUrl(input: string): string | null {
  const res = validateYouTubeUrl(input)
  return res.valid && res.embedUrl ? res.embedUrl : null
}

// React NodeView: Video
function VideoComponent({ node, updateAttributes, deleteNode }: any) {
  const url = node.attrs.url || ''
  const caption = node.attrs.caption || ''

  return (
    <NodeViewWrapper className="video-node-view my-6 p-3 rounded-2xl border border-gray-200 bg-gray-50/50 relative group">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/80 text-xs text-gray-500">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span>Video Block</span>
        </span>
        <button
          type="button"
          onClick={deleteNode}
          className="text-red-500 hover:text-red-700 px-2 py-0.5 rounded hover:bg-red-50 text-xs transition"
          title="Remove video"
        >
          Remove
        </button>
      </div>
      {url ? (
        <video
          src={url}
          controls
          preload="metadata"
          className="w-full rounded-xl border border-gray-200 bg-black/5"
        />
      ) : (
        <div className="p-8 text-center text-sm text-gray-400 bg-gray-100 rounded-xl">
          No video URL provided
        </div>
      )}
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

// React NodeView: Gallery
function GalleryComponent({ node, updateAttributes, deleteNode }: any) {
  const images: GalleryImageEntry[] = Array.isArray(node.attrs.images) ? node.attrs.images : []
  const caption = node.attrs.caption || ''

  const handleAddImage = () => {
    const url = window.prompt('Enter image URL for gallery:')
    if (!url || !url.trim()) return
    const imgCaption = window.prompt('Enter image caption/alt (optional):') || ''
    updateAttributes({
      images: [...images, { url: url.trim(), caption: imgCaption.trim() }],
    })
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

  const gridClass =
    images.length === 1
      ? 'grid-cols-1'
      : images.length === 2
      ? 'grid-cols-2'
      : images.length === 3
      ? 'grid-cols-2 sm:grid-cols-3'
      : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'

  return (
    <NodeViewWrapper className="gallery-node-view my-6 p-3 rounded-2xl border border-gray-200 bg-gray-50/50 relative group">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-200/80 text-xs text-gray-500">
        <span className="font-semibold text-gray-700 flex items-center gap-1.5">
          <span>Gallery Block ({images.length} {images.length === 1 ? 'image' : 'images'})</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddImage}
            className="text-blue-600 hover:text-blue-800 px-2 py-0.5 rounded hover:bg-blue-50 text-xs font-medium transition"
          >
            + Add Image
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

      {images.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-400 bg-gray-100 rounded-xl">
          Gallery is empty. Click "+ Add Image" above to add image URLs.
        </div>
      ) : (
        <div className={`grid ${gridClass} gap-2.5`}>
          {images.map((img, i) => (
            <div key={i} className="relative group/img rounded-xl overflow-hidden border border-gray-200 bg-white aspect-square shadow-sm">
              <img src={img.url} alt={img.caption || ''} className="w-full h-full object-cover" />
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
          ))}
        </div>
      )}

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
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-gray-200 bg-black">
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
          return {
            url: video?.getAttribute('src') || '',
            caption: figcaption?.textContent || '',
          }
        },
      },
      {
        tag: 'video',
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
    return [
      'figure',
      mergeAttributes({ 'data-type': 'video', class: 'video-block my-8' }),
      [
        'video',
        {
          src: HTMLAttributes.url,
          controls: 'true',
          preload: 'metadata',
          class: 'w-full rounded-2xl border border-[#F5ECDE] shadow-sm',
        },
      ],
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
          const imgs = Array.from(el.querySelectorAll('img')).map((img) => ({
            url: img.getAttribute('src') || '',
            caption: img.getAttribute('alt') || '',
          }))
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
    return [
      'figure',
      mergeAttributes({ 'data-type': 'gallery', class: 'gallery-block my-8' }),
      [
        'div',
        { class: 'grid grid-cols-2 md:grid-cols-4 gap-3' },
        ...images.map((img) => [
          'a',
          { href: img.url, target: '_blank', rel: 'noopener noreferrer' },
          ['img', { src: img.url, alt: img.caption || '' }],
        ]),
      ],
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
        class: 'youtube-block my-8 aspect-video w-full rounded-2xl overflow-hidden border border-[#F5ECDE]',
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
