// Ghost Content to TipTap Doc Converter
// Supports both Ghost Lexical (JSON string) and Ghost Mobiledoc (JSON string)
// Compliant with TipTapRenderer and customNodes.tsx schema in this repository.

export function decodeHtmlEntities(str) {
  if (!str) return ''
  return String(str)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
}

function stripHtml(html) {
  if (!html) return ''
  const stripped = String(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim()
  return decodeHtmlEntities(stripped)
}

export function normalizeEmbedUrl(url) {
  if (!url) return ''
  const trimmed = String(url).trim()
  if (trimmed.includes('GhwkD0CDzXI')) {
    return 'https://www.youtube.com/shorts/j4IN263suvA'
  }
  return trimmed
}

export function dedupeMarks(marks) {
  if (!marks || marks.length === 0) return []
  const seen = new Set()
  const out = []
  for (const m of marks) {
    if (!m || !m.type) continue
    if (!seen.has(m.type)) {
      seen.add(m.type)
      out.push(m)
    }
  }
  return out
}

export function rewriteBookmarkUrl(rawUrl, uuidToSlugMap, allGhostSlugs) {
  if (!rawUrl) return ''
  const u = String(rawUrl).trim()

  // Root domain match: __GHOST_URL__ or __GHOST_URL__/ or home domain
  if (u === '__GHOST_URL__' || u === '__GHOST_URL__/' || /^(?:https?:\/\/(?:www\.)?)?(?:begenius-thoughts\.ghost\.io|ivankabandize\.com)\/?$/i.test(u)) {
    return '/'
  }

  // Tag archive 30in30-series -> /garden/series/30in30
  if (u.includes('tag/30in30-series')) {
    return '/garden/series/30in30'
  }

  // General tag pattern
  const tagMatch = u.match(/(?:__GHOST_URL__|begenius-thoughts\.ghost\.io|ivankabandize\.com)\/tag\/([a-z0-9-]+)\/?$/i)
  if (tagMatch) {
    return `/${tagMatch[1]}`
  }

  // UUID pattern: /p/<uuid>/ or __GHOST_URL__/p/<uuid>/
  const uuidMatch = u.match(/\/p\/([a-f0-9-]{36})/i)
  if (uuidMatch && uuidToSlugMap) {
    const uuid = uuidMatch[1]
    const slug = uuidToSlugMap.get(uuid)
    if (slug) {
      return `/garden/${slug}`
    }
  }

  // Path pattern: /randomthoughts/<slug>/ or /structuredthoughts/<slug>/ or /toolsforthought/<slug>/
  const streamMatch = u.match(/(?:randomthoughts|structuredthoughts|toolsforthought)\/([a-z0-9-]+)\/?/i)
  if (streamMatch) {
    const slug = streamMatch[1]
    return `/garden/${slug}`
  }

  // Direct ghost domain match: __GHOST_URL__/<slug>/ or begenius-thoughts.ghost.io/<slug>/
  const ghostDomainMatch = u.match(/(?:__GHOST_URL__|begenius-thoughts\.ghost\.io|ivankabandize\.com)\/([a-z0-9-]+)\/?$/i)
  if (ghostDomainMatch) {
    const candidateSlug = ghostDomainMatch[1]
    if (allGhostSlugs && allGhostSlugs.has(candidateSlug)) {
      return `/garden/${candidateSlug}`
    }
  }

  return u
}

export function captionHtmlToText(html, uuidToSlugMap, allGhostSlugs) {
  if (!html) return ''
  let str = String(html)

  // Convert <a href="X">text</a> to [text](X')
  str = str.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (match, attrs, innerText) => {
    const hrefMatch = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i)
    const rawHref = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '') : ''
    const cleanHref = decodeHtmlEntities(rawHref.trim())
    const rewrittenUrl = rewriteBookmarkUrl(cleanHref, uuidToSlugMap, allGhostSlugs)
    const linkText = stripHtml(innerText)
    if (!linkText) return ''
    return `[${linkText}](${rewrittenUrl})`
  })

  return stripHtml(str)
}

function resolveMediaUrl(rawUrl, mediaUrlMap) {
  if (!rawUrl) return ''
  const u = String(rawUrl).trim()
  if (mediaUrlMap && mediaUrlMap.has(u)) {
    return mediaUrlMap.get(u)
  }
  // If no map entry provided, normalize __GHOST_URL__ to durable ghost.io url for fallback
  if (u.startsWith('__GHOST_URL__')) {
    return u.replace('__GHOST_URL__', 'https://begenius-thoughts.ghost.io')
  }
  if (u.startsWith('/content/')) {
    return `https://begenius-thoughts.ghost.io${u}`
  }
  return u
}

// ----------------------------------------------------
// LEXICAL CONVERSION
// ----------------------------------------------------

export function convertLexicalToTipTap(lexicalObj, { uuidToSlugMap, allGhostSlugs, mediaUrlMap, unmappedCards = [] } = {}) {
  const root = lexicalObj?.root
  if (!root || !Array.isArray(root.children)) {
    return { type: 'doc', content: [] }
  }

  const nodes = []

  function convertInline(inlineNode) {
    if (!inlineNode) return null

    if (inlineNode.type === 'text' || inlineNode.type === 'extended-text') {
      const text = inlineNode.text || ''
      if (!text) return null

      const marks = []
      const format = Number(inlineNode.format) || 0
      if ((format & 1) === 1) marks.push({ type: 'bold' })
      if ((format & 2) === 2) marks.push({ type: 'italic' })
      if ((format & 16) === 16) marks.push({ type: 'code' })

      const cleanMarks = dedupeMarks(marks)

      if (text.includes('\n')) {
        const parts = text.split('\n')
        const nodes = []
        for (let i = 0; i < parts.length; i++) {
          if (i > 0) nodes.push({ type: 'hardBreak' })
          if (parts[i].length > 0) {
            nodes.push({
              type: 'text',
              text: parts[i],
              ...(cleanMarks.length > 0 ? { marks: cleanMarks } : {}),
            })
          }
        }
        return nodes
      }

      return {
        type: 'text',
        text,
        ...(cleanMarks.length > 0 ? { marks: cleanMarks } : {}),
      }
    }

    if (inlineNode.type === 'link' || inlineNode.type === 'extended-link') {
      const href = rewriteBookmarkUrl(inlineNode.url, uuidToSlugMap, allGhostSlugs)
      const children = (inlineNode.children || []).map(convertInline).filter(Boolean)
      return children.flatMap(c => {
        if (Array.isArray(c)) {
          return c.map(item => {
            if (item.type === 'text') {
              const marks = dedupeMarks([...(item.marks || []), { type: 'link', attrs: { href } }])
              return { ...item, marks }
            }
            return item
          })
        }
        if (c.type === 'text') {
          const marks = dedupeMarks([...(c.marks || []), { type: 'link', attrs: { href } }])
          return [{ ...c, marks }]
        }
        return [c]
      })
    }

    if (inlineNode.type === 'linebreak') {
      return { type: 'hardBreak' }
    }

    return null
  }

  function convertInlines(children) {
    if (!Array.isArray(children)) return []
    const result = []
    for (const child of children) {
      const converted = convertInline(child)
      if (!converted) continue
      if (Array.isArray(converted)) {
        result.push(...converted)
      } else {
        result.push(converted)
      }
    }
    return result
  }

  for (const child of root.children) {
    if (!child) continue

    switch (child.type) {
      case 'paragraph': {
        const inlines = convertInlines(child.children)
        nodes.push({
          type: 'paragraph',
          ...(inlines.length > 0 ? { content: inlines } : {}),
        })
        break
      }

      case 'heading':
      case 'extended-heading': {
        const tag = String(child.tag || 'h2').toLowerCase()
        let level = 2
        if (tag === 'h1') level = 1
        else if (tag === 'h2') level = 2
        else if (tag === 'h3') level = 3
        else if (child.level) level = Number(child.level)

        const inlines = convertInlines(child.children)
        nodes.push({
          type: 'heading',
          attrs: { level },
          content: inlines,
        })
        break
      }

      case 'extended-quote':
      case 'quote': {
        // TipTap expects blockquote containing paragraph nodes
        const inlines = convertInlines(child.children)
        nodes.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: inlines,
            },
          ],
        })
        break
      }

      case 'list': {
        const listType = child.listType === 'number' ? 'orderedList' : 'bulletList'
        const items = []
        for (const li of child.children || []) {
          if (li.type === 'listitem') {
            const inlines = convertInlines(li.children)
            items.push({
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: inlines,
                },
              ],
            })
          }
        }
        nodes.push({
          type: listType,
          content: items,
        })
        break
      }

      case 'horizontalrule': {
        nodes.push({ type: 'horizontalRule' })
        break
      }

      case 'image': {
        const src = resolveMediaUrl(child.src, mediaUrlMap)
        const alt = child.alt || stripHtml(child.caption) || child.title || 'Article image'
        const caption = captionHtmlToText(child.caption, uuidToSlugMap, allGhostSlugs) || null
        nodes.push({
          type: 'image',
          attrs: {
            src,
            alt,
            caption,
          },
        })
        break
      }

      case 'gallery': {
        const images = (child.images || []).map(img => ({
          url: resolveMediaUrl(img.src, mediaUrlMap),
          caption: captionHtmlToText(img.caption, uuidToSlugMap, allGhostSlugs) || '',
          width: img.width || 1200,
          height: img.height || 800,
        }))
        const caption = captionHtmlToText(child.caption, uuidToSlugMap, allGhostSlugs) || null
        nodes.push({
          type: 'gallery',
          attrs: {
            images,
            caption,
          },
        })
        break
      }

      case 'video': {
        const url = resolveMediaUrl(child.src, mediaUrlMap)
        const caption = captionHtmlToText(child.caption, uuidToSlugMap, allGhostSlugs) || null
        nodes.push({
          type: 'video',
          attrs: {
            url,
            caption,
            playAsGif: false,
            flushBackground: false,
          },
        })
        break
      }

      case 'embed': {
        const url = normalizeEmbedUrl(child.url || '')
        nodes.push({
          type: 'youtube',
          attrs: { url },
        })
        break
      }

      case 'bookmark': {
        const url = rewriteBookmarkUrl(child.url, uuidToSlugMap, allGhostSlugs)
        const metadata = child.metadata || {}
        nodes.push({
          type: 'bookmark',
          attrs: {
            url,
            title: metadata.title || '',
            description: metadata.description || '',
            author: metadata.author || '',
            publisher: metadata.publisher || '',
            thumbnail: resolveMediaUrl(metadata.thumbnail, mediaUrlMap),
            icon: resolveMediaUrl(metadata.icon, mediaUrlMap),
            caption: stripHtml(child.caption) || '',
          },
        })
        break
      }

      case 'button': {
        nodes.push({
          type: 'button',
          attrs: {
            label: child.buttonText || 'Click here',
            url: child.buttonUrl || '',
            alignment: child.alignment === 'center' ? 'center' : 'left',
          },
        })
        break
      }

      case 'callout': {
        // Ghost callout has calloutText (HTML string e.g. <p>...</p>) and calloutEmoji
        const plainText = stripHtml(child.calloutText || '')
        const inlines = []
        if (child.calloutEmoji) {
          inlines.push({ type: 'text', text: `${child.calloutEmoji} ` })
        }
        inlines.push({ type: 'text', text: plainText })

        nodes.push({
          type: 'callout',
          content: [
            {
              type: 'paragraph',
              content: inlines,
            },
          ],
        })
        break
      }

      case 'aside': {
        const inlines = convertInlines(child.children)
        nodes.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: inlines,
            },
          ],
        })
        break
      }

      case 'code':
      case 'codeblock': {
        const text = child.code || child.text || ''
        nodes.push({
          type: 'codeBlock',
          content: [{ type: 'text', text }],
        })
        break
      }

      case 'signup': {
        unmappedCards.push({
          type: 'signup',
          details: 'Ghost newsletter subscription widget - omitted (site has page footer newsletter)',
        })
        break
      }

      default: {
        unmappedCards.push({
          type: child.type,
          details: 'Unrecognized Lexical card type',
        })
        break
      }
    }
  }

  return { type: 'doc', content: nodes }
}

// ----------------------------------------------------
// MOBILEDOC CONVERSION
// ----------------------------------------------------

export function convertMobiledocToTipTap(mobiledocObj, { uuidToSlugMap, allGhostSlugs, mediaUrlMap, unmappedCards = [] } = {}) {
  const atoms = mobiledocObj?.atoms || []
  const markups = mobiledocObj?.markups || []
  const cards = mobiledocObj?.cards || []
  const sections = mobiledocObj?.sections || []

  function convertMarkers(markers) {
    if (!Array.isArray(markers)) return []
    const result = []
    const activeMarks = []

    for (const marker of markers) {
      if (!Array.isArray(marker)) continue
      // Mobiledoc 0.3.1 marker:
      // Type 0 (Text): [0, openMarkupIndices, closedMarkupCount, text]
      // Type 1 (Atom): [1, openMarkupIndices, closedMarkupCount, atomIndex]
      const [markerType, openedIndices = [], closedCount = 0, payload] = marker

      if (Array.isArray(openedIndices)) {
        for (const idx of openedIndices) {
          const markupDef = markups[idx]
          if (!markupDef) continue
          const tag = String(markupDef[0]).toLowerCase()
          const attrs = markupDef[1] || []

          if (tag === 'b' || tag === 'strong') {
            activeMarks.push({ type: 'bold' })
          } else if (tag === 'i' || tag === 'em') {
            activeMarks.push({ type: 'italic' })
          } else if (tag === 'code') {
            activeMarks.push({ type: 'code' })
          } else if (tag === 'a') {
            let href = '#'
            for (let i = 0; i < attrs.length; i += 2) {
              if (attrs[i]?.toLowerCase() === 'href') {
                href = attrs[i + 1]
                break
              }
            }
            activeMarks.push({
              type: 'link',
              attrs: { href: rewriteBookmarkUrl(href, uuidToSlugMap, allGhostSlugs) },
            })
          }
        }
      }

      const currentMarks = dedupeMarks(activeMarks)

      if (markerType === 1) {
        // Atom marker
        const atomIndex = typeof payload === 'number' ? payload : parseInt(payload, 10)
        const atom = atoms[atomIndex]
        const atomName = atom ? String(atom[0]).toLowerCase() : ''
        if (atomName === 'soft-return' || atomName === 'soft-break') {
          result.push({ type: 'hardBreak' })
        } else if (atom && typeof atom[1] === 'string' && atom[1].length > 0) {
          result.push({
            type: 'text',
            text: atom[1],
            ...(currentMarks.length > 0 ? { marks: currentMarks } : {}),
          })
        }
      } else if (markerType === 0) {
        // Text marker
        const rawText = typeof payload === 'string' ? payload : ''
        if (rawText.length > 0) {
          if (rawText.includes('\n')) {
            const parts = rawText.split('\n')
            for (let i = 0; i < parts.length; i++) {
              if (i > 0) {
                result.push({ type: 'hardBreak' })
              }
              const part = parts[i]
              if (part.length > 0) {
                result.push({
                  type: 'text',
                  text: part,
                  ...(currentMarks.length > 0 ? { marks: currentMarks } : {}),
                })
              }
            }
          } else {
            result.push({
              type: 'text',
              text: rawText,
              ...(currentMarks.length > 0 ? { marks: currentMarks } : {}),
            })
          }
        }
      }

      for (let c = 0; c < closedCount; c++) {
        activeMarks.pop()
      }
    }

    return result
  }

  const nodes = []

  for (const section of sections) {
    const typeNum = section[0]

    // 1: Markup section [1, tagName, markers]
    if (typeNum === 1) {
      const tagName = String(section[1]).toLowerCase()
      const inlines = convertMarkers(section[2])

      if (tagName === 'p') {
        nodes.push({
          type: 'paragraph',
          ...(inlines.length > 0 ? { content: inlines } : {}),
        })
      } else if (tagName.startsWith('h')) {
        let level = 2
        if (tagName === 'h1') level = 1
        else if (tagName === 'h2') level = 2
        else if (tagName === 'h3') level = 3
        nodes.push({
          type: 'heading',
          attrs: { level },
          content: inlines,
        })
      } else if (tagName === 'blockquote' || tagName === 'aside') {
        nodes.push({
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: inlines,
            },
          ],
        })
      } else {
        nodes.push({
          type: 'paragraph',
          content: inlines,
        })
      }
    }

    // 3: List section [3, tagName, items]
    else if (typeNum === 3) {
      const tagName = String(section[1]).toLowerCase()
      const listType = tagName === 'ol' ? 'orderedList' : 'bulletList'
      const items = []
      for (const itemMarkers of section[2] || []) {
        items.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: convertMarkers(itemMarkers),
            },
          ],
        })
      }
      nodes.push({
        type: listType,
        content: items,
      })
    }

    // 10: Card section [10, cardIndex]
    else if (typeNum === 10) {
      const cardIndex = section[1]
      const card = cards[cardIndex]
      if (!card) continue
      const [cardName, cardPayload] = card

      switch (cardName) {
        case 'hr': {
          nodes.push({ type: 'horizontalRule' })
          break
        }
        case 'image': {
          const src = resolveMediaUrl(cardPayload?.src, mediaUrlMap)
          const alt = cardPayload?.alt || stripHtml(cardPayload?.caption) || 'Article image'
          const caption = captionHtmlToText(cardPayload?.caption, uuidToSlugMap, allGhostSlugs) || null
          nodes.push({
            type: 'image',
            attrs: { src, alt, caption },
          })
          break
        }
        case 'gallery': {
          const images = (cardPayload?.images || []).map(img => ({
            url: resolveMediaUrl(img.src, mediaUrlMap),
            caption: captionHtmlToText(img.caption, uuidToSlugMap, allGhostSlugs) || '',
            width: img.width || 1200,
            height: img.height || 800,
          }))
          const caption = captionHtmlToText(cardPayload?.caption, uuidToSlugMap, allGhostSlugs) || null
          nodes.push({
            type: 'gallery',
            attrs: { images, caption },
          })
          break
        }
        case 'video': {
          const url = resolveMediaUrl(cardPayload?.src || cardPayload?.url, mediaUrlMap)
          const caption = captionHtmlToText(cardPayload?.caption, uuidToSlugMap, allGhostSlugs) || null
          nodes.push({
            type: 'video',
            attrs: {
              url,
              caption,
              playAsGif: false,
              flushBackground: false,
            },
          })
          break
        }
        case 'embed': {
          const url = normalizeEmbedUrl(cardPayload?.url || '')
          nodes.push({
            type: 'youtube',
            attrs: { url },
          })
          break
        }
        case 'bookmark': {
          const url = rewriteBookmarkUrl(cardPayload?.url, uuidToSlugMap, allGhostSlugs)
          const metadata = cardPayload?.metadata || {}
          nodes.push({
            type: 'bookmark',
            attrs: {
              url,
              title: metadata.title || '',
              description: metadata.description || '',
              author: metadata.author || '',
              publisher: metadata.publisher || '',
              thumbnail: resolveMediaUrl(metadata.thumbnail, mediaUrlMap),
              icon: resolveMediaUrl(metadata.icon, mediaUrlMap),
              caption: stripHtml(cardPayload?.caption) || '',
            },
          })
          break
        }
        case 'callout': {
          const plainText = stripHtml(cardPayload?.calloutText || cardPayload?.text || '')
          const inlines = []
          if (cardPayload?.calloutEmoji) {
            inlines.push({ type: 'text', text: `${cardPayload.calloutEmoji} ` })
          }
          if (plainText) {
            inlines.push({ type: 'text', text: plainText })
          }
          if (inlines.length > 0) {
            nodes.push({
              type: 'callout',
              content: [
                {
                  type: 'paragraph',
                  content: inlines,
                },
              ],
            })
          }
          break
        }
        case 'html': {
          const rawHtml = cardPayload?.html || ''
          if (!rawHtml.trim()) break
          const pMatches = rawHtml.split(/<\/p>/i).map(p => p.replace(/<p[^>]*>/gi, '').trim()).filter(Boolean)
          const chunks = pMatches.length > 0 ? pMatches : [rawHtml.trim()]
          for (const chunk of chunks) {
            const parts = chunk.split(/<br\s*\/?>/gi)
            const inlines = []
            for (let i = 0; i < parts.length; i++) {
              if (i > 0) inlines.push({ type: 'hardBreak' })
              const txt = stripHtml(parts[i])
              if (txt.length > 0) inlines.push({ type: 'text', text: txt })
            }
            if (inlines.length > 0) {
              nodes.push({ type: 'paragraph', content: inlines })
            }
          }
          break
        }
        default: {
          unmappedCards.push({
            type: cardName,
            details: 'Unrecognized Mobiledoc card',
          })
          break
        }
      }
    }
  }

  return { type: 'doc', content: nodes }
}

// ----------------------------------------------------
// UNIFIED CONVERTER ENTRY POINT
// ----------------------------------------------------

export function convertGhostPostToTipTap(post, options = {}) {
  const unmappedCards = []
  const opts = { ...options, unmappedCards }

  let tipTapDoc = null
  let formatUsed = null

  if (post.lexical) {
    try {
      const lexicalObj = typeof post.lexical === 'string' ? JSON.parse(post.lexical) : post.lexical
      tipTapDoc = convertLexicalToTipTap(lexicalObj, opts)
      formatUsed = 'lexical'
    } catch (err) {
      console.error(`Error parsing lexical for ${post.slug}:`, err.message)
    }
  }

  if (!tipTapDoc && post.mobiledoc) {
    try {
      const mobiledocObj = typeof post.mobiledoc === 'string' ? JSON.parse(post.mobiledoc) : post.mobiledoc
      tipTapDoc = convertMobiledocToTipTap(mobiledocObj, opts)
      formatUsed = 'mobiledoc'
    } catch (err) {
      console.error(`Error parsing mobiledoc for ${post.slug}:`, err.message)
    }
  }

  if (!tipTapDoc) {
    tipTapDoc = { type: 'doc', content: [] }
    formatUsed = 'empty'
  }

  return {
    doc: tipTapDoc,
    format: formatUsed,
    unmappedCards,
  }
}
