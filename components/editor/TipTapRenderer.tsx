import React from 'react'
import { getYouTubeEmbedUrl } from '@/lib/youtube'
import WideContainer from '@/components/public/WideContainer'
import BookmarkCard from './BookmarkCard'
import ButtonCard from './ButtonCard'

interface TipTapNode {
  type: string
  attrs?: Record<string, unknown>
  content?: TipTapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}

interface TipTapDoc {
  type?: string
  content?: TipTapNode[]
}

export default function TipTapRenderer({ content }: { content: TipTapDoc | Record<string, unknown> }) {
  if (!content || typeof content !== 'object' || !('content' in content) || !Array.isArray(content.content)) {
    return <p className="text-gray-500 italic">No content available.</p>
  }

  const renderNode = (node: TipTapNode, index: number): React.ReactNode => {
    switch (node.type) {
      case 'paragraph':
        return (
          <p key={index} className="text-gray-800 leading-relaxed mb-6 text-lg">
            {node.content?.map(renderInline) || <br />}
          </p>
        )
      case 'heading': {
        const level = (node.attrs?.level as number) || 2
        const headingText = node.content?.map(renderInline)
        if (level === 1) {
          return (
            <h1 key={index} className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl font-bold text-gray-900 mt-10 mb-4 tracking-tight">
              {headingText}
            </h1>
          )
        }
        if (level === 2) {
          return (
            <h2 key={index} className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-bold text-gray-900 mt-8 mb-4 tracking-tight">
              {headingText}
            </h2>
          )
        }
        return (
          <h3 key={index} className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-semibold text-gray-900 mt-6 mb-3">
            {headingText}
          </h3>
        )
      }
      case 'bulletList':
        return (
          <ul key={index} className="list-disc list-outside pl-6 space-y-2 mb-6 text-gray-800 text-lg">
            {node.content?.map((item, i) => (
              <li key={i}>{item.content?.map(renderNode)}</li>
            ))}
          </ul>
        )
      case 'orderedList':
        return (
          <ol key={index} className="list-decimal list-outside pl-6 space-y-2 mb-6 text-gray-800 text-lg">
            {node.content?.map((item, i) => (
              <li key={i}>{item.content?.map(renderNode)}</li>
            ))}
          </ol>
        )
      case 'image': {
        const src = String(node.attrs?.src || '')
        const alt = String(node.attrs?.alt || node.attrs?.title || 'Article image')
        const caption = node.attrs?.caption ? String(node.attrs?.caption) : (node.attrs?.title ? String(node.attrs?.title) : null)
        return (
          <figure key={index} className="my-8">
            <img src={src} alt={alt} className="w-full rounded-[5px] object-cover" />
            {caption && (
              <figcaption className="mt-2.5 text-center text-xs sm:text-sm text-[#5A5D70]">
                {caption}
              </figcaption>
            )}
          </figure>
        )
      }
      case 'video': {
        const url = String(node.attrs?.url || node.attrs?.src || '')
        const caption = node.attrs?.caption ? String(node.attrs?.caption) : null
        const playAsGif = Boolean(node.attrs?.playAsGif)
        const flushBackground = Boolean(node.attrs?.flushBackground)
        if (!url) return null

        const videoClassName = flushBackground
          ? 'w-full block'
          : 'w-full rounded-[5px] border border-[#F5ECDE] shadow-sm bg-black/5 block'

        return (
          <figure key={index} className="my-8">
            {playAsGif ? (
              <video
                src={url}
                autoPlay
                muted
                loop
                playsInline
                className={videoClassName}
              />
            ) : (
              <video
                src={url}
                controls
                preload="metadata"
                className={videoClassName}
              />
            )}
            {caption && (
              <figcaption className="mt-2.5 text-center text-xs sm:text-sm text-[#5A5D70]">
                {caption}
              </figcaption>
            )}
          </figure>
        )
      }
      case 'gallery': {
        interface GalleryItem {
          url: string
          caption?: string
          width?: number
          height?: number
        }
        const images = Array.isArray(node.attrs?.images) ? (node.attrs.images as GalleryItem[]) : []
        const caption = node.attrs?.caption ? String(node.attrs?.caption) : null
        if (images.length === 0) return null

        // Group images into pairs of 2, with the odd one out as a group of 1
        const groups: GalleryItem[][] = []
        for (let i = 0; i < images.length; i += 2) {
          groups.push(images.slice(i, i + 2))
        }

        return (
          <WideContainer key={index} className="my-10">
            <figure>
              <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 w-full">
                {groups.map((group, groupIdx) => {
                  if (group.length === 2) {
                    return (
                      <div key={groupIdx} className="flex flex-row gap-3 sm:gap-4 md:gap-5 w-full items-start">
                        {group.map((img, i) => {
                          const w = img.width && img.width > 0 ? img.width : 4
                          const h = img.height && img.height > 0 ? img.height : 3
                          const ratio = w / h
                          return (
                            <a
                              key={i}
                              href={img.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block overflow-hidden rounded-[4px] border border-[#F5ECDE] bg-[#FAF5EC] shadow-sm hover:shadow-md transition"
                              style={{
                                flexGrow: ratio,
                                flexBasis: 0,
                                minWidth: 0,
                                aspectRatio: `${w} / ${h}`,
                              }}
                              title={img.caption || 'View full-size image'}
                            >
                              <img
                                src={img.url}
                                alt={img.caption || 'Gallery image'}
                                className="w-full h-full block object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                              />
                            </a>
                          )
                        })}
                      </div>
                    )
                  }

                  // Odd one out: single full-width image with natural height
                  const img = group[0]
                  const w = img.width && img.width > 0 ? img.width : 4
                  const h = img.height && img.height > 0 ? img.height : 3
                  return (
                    <div key={groupIdx} className="w-full">
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block w-full overflow-hidden rounded-[4px] border border-[#F5ECDE] bg-[#FAF5EC] shadow-sm hover:shadow-md transition"
                        style={{
                          aspectRatio: `${w} / ${h}`,
                        }}
                        title={img.caption || 'View full-size image'}
                      >
                        <img
                          src={img.url}
                          alt={img.caption || 'Gallery image'}
                          className="w-full h-full block object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                      </a>
                    </div>
                  )
                })}
              </div>
              {caption && (
                <figcaption className="mt-3 text-center text-xs sm:text-sm text-[#5A5D70]">
                  {caption}
                </figcaption>
              )}
            </figure>
          </WideContainer>
        )
      }
      case 'youtube': {
        const url = String(node.attrs?.url || '')
        const embedUrl = getYouTubeEmbedUrl(url)
        if (!embedUrl) return null
        return (
          <figure key={index} className="my-8">
            <div className="aspect-video w-full overflow-hidden rounded-[5px] border border-[#F5ECDE] shadow-sm bg-black/5">
              <iframe
                src={embedUrl}
                title="YouTube video player"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </figure>
        )
      }
      case 'bookmark': {
        const url = String(node.attrs?.url || '')
        const title = String(node.attrs?.title || '')
        const description = String(node.attrs?.description || '')
        const author = String(node.attrs?.author || '')
        const publisher = String(node.attrs?.publisher || '')
        const thumbnail = String(node.attrs?.thumbnail || '')
        const icon = String(node.attrs?.icon || '')
        const caption = String(node.attrs?.caption || '')
        if (!url && !title) return null

        return (
          <BookmarkCard
            key={index}
            url={url}
            title={title}
            description={description}
            author={author}
            publisher={publisher}
            thumbnail={thumbnail}
            icon={icon}
            caption={caption}
          />
        )
      }
      case 'button': {
        const label = String(node.attrs?.label || '')
        const url = String(node.attrs?.url || '')
        const alignment = (node.attrs?.alignment === 'center' ? 'center' : 'left') as 'left' | 'center'
        if (!label && !url) return null

        return (
          <ButtonCard
            key={index}
            label={label}
            url={url}
            alignment={alignment}
          />
        )
      }
      case 'callout': {
        return (
          <div
            key={index}
            style={{
              backgroundColor: '#FAECE7',
              border: '1px solid #D85A30',
              borderRadius: '10px',
              padding: '16px 18px',
            }}
            className="my-6 text-gray-800 text-lg leading-relaxed callout-block"
          >
            {node.content?.map(renderNode)}
          </div>
        )
      }
      case 'blockquote': {
        let quoteNodes = node.content || []
        let attributionText: string | null = node.attrs?.attribution ? String(node.attrs.attribution) : null

        if (!attributionText && quoteNodes.length > 1) {
          const lastChild = quoteNodes[quoteNodes.length - 1]
          if (lastChild.type === 'paragraph' && lastChild.content && lastChild.content.length > 0) {
            const rawText = lastChild.content.map((c) => c.text || '').join('')
            // Check for attribution prefix: " - ", "- ", "-- ", or dashes
            if (/^(\s*(-|\u2013|\u2014){1,2}\s*)/.test(rawText)) {
              attributionText = rawText.replace(/^(\s*(-|\u2013|\u2014){1,2}\s*)/, '- ')
              quoteNodes = quoteNodes.slice(0, -1)
            }
          }
        }

        return (
          <figure key={index} className="my-8 text-center" style={{ padding: '8px 24px' }}>
            <div className="flex justify-center mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#EF5B45"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ti-quote inline-block"
                style={{ fontSize: '22px', color: '#EF5B45' }}
                aria-hidden="true"
              >
                <path d="M10 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v2c0 2.667 -1.333 4.333 -4 5" />
                <path d="M19 11h-4a1 1 0 0 1 -1 -1v-3a1 1 0 0 1 1 -1h3a1 1 0 0 1 1 1v2c0 2.667 -1.333 4.333 -4 5" />
              </svg>
            </div>
            <blockquote
              style={{
                textAlign: 'center',
                fontSize: 'clamp(21px, 2.2vw, 24px)',
                fontWeight: 500,
                lineHeight: 1.5,
                borderLeft: 'none',
                backgroundColor: 'transparent',
                padding: 0,
                margin: 0,
              }}
              className="text-[#232536]"
            >
              {quoteNodes.map(renderNode)}
            </blockquote>
            {attributionText && (
              <figcaption
                style={{ fontSize: '14px' }}
                className="mt-3 text-center text-[#5A5D70] font-normal"
              >
                {attributionText}
              </figcaption>
            )}
          </figure>
        )
      }
      case 'codeBlock':
        return (
          <pre
            key={index}
            className="bg-[#232536] text-gray-100 p-4 rounded-2xl overflow-x-auto text-sm my-6 font-mono border border-black/10"
          >
            <code>{node.content?.map(n => n.text).join('')}</code>
          </pre>
        )
      case 'horizontalRule':
        return <hr key={index} className="my-8 border-0 border-t border-gray-200" />
      default:
        return (
          <div key={index} className="mb-4">
            {node.content?.map(renderNode)}
          </div>
        )
    }
  }

  const renderInline = (node: TipTapNode, index: number): React.ReactNode => {
    if (node.type === 'hardBreak') {
      return <br key={index} />
    }

    let element: React.ReactNode = node.text || ''

    if (node.marks) {
      node.marks.forEach(mark => {
        if (mark.type === 'bold') {
          element = <strong key={`b-${index}`}>{element}</strong>
        }
        if (mark.type === 'italic') {
          element = <em key={`i-${index}`}>{element}</em>
        }
        if (mark.type === 'code') {
          element = (
            <code key={`c-${index}`} className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono">
              {element}
            </code>
          )
        }
        if (mark.type === 'link') {
          element = (
            <a
              key={`a-${index}`}
              href={String(mark.attrs?.href || '#')}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#D94834] underline hover:text-[#B93A2A] visited:text-[#D94834]"
            >
              {element}
            </a>
          )
        }
      })
    }

    return <React.Fragment key={index}>{element}</React.Fragment>
  }

  return (
    <article className="prose prose-lg max-w-none">
      {(content as TipTapDoc).content?.map(renderNode)}
    </article>
  )
}
