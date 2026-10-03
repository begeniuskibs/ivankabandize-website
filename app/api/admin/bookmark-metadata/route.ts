import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { NextResponse, type NextRequest } from 'next/server'
import { safeFetchHtml, rehostBookmarkImage, BookmarkFetchError } from '@/lib/urlSafety'

export const maxDuration = 30

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => {
      try {
        const code = parseInt(hex, 16)
        return String.fromCodePoint(code)
      } catch {
        return _
      }
    })
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        const code = parseInt(dec, 10)
        return String.fromCodePoint(code)
      } catch {
        return _
      }
    })
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
}

function extractMetaContent(html: string, keyName: string, keyValue: string): string | null {
  const metaTagRegex = /<meta\b[^>]*>/gi
  let tagMatch: RegExpExecArray | null
  while ((tagMatch = metaTagRegex.exec(html)) !== null) {
    const tag = tagMatch[0]
    const keyRegex = new RegExp(`\\b${keyName}=(?:"${keyValue}"|'${keyValue}')`, 'i')
    if (keyRegex.test(tag)) {
      const doubleQuoteMatch = tag.match(/\bcontent="([^"]*)"/i)
      if (doubleQuoteMatch) {
        return decodeHtmlEntities(doubleQuoteMatch[1].trim())
      }
      const singleQuoteMatch = tag.match(/\bcontent='([^']*)'/i)
      if (singleQuoteMatch) {
        return decodeHtmlEntities(singleQuoteMatch[1].trim())
      }
    }
  }
  return null
}

function extractLinkHref(html: string, relPattern: RegExp): string | null {
  const linkTagRegex = /<link\b[^>]*>/gi
  let tagMatch: RegExpExecArray | null
  while ((tagMatch = linkTagRegex.exec(html)) !== null) {
    const tag = tagMatch[0]
    const relMatch = tag.match(/\brel=(?:"([^"]*)"|'([^']*)')/i)
    const relValue = relMatch ? (relMatch[1] ?? relMatch[2] ?? '') : ''
    if (relValue && relPattern.test(relValue.trim())) {
      const doubleQuoteHref = tag.match(/\bhref="([^"]*)"/i)
      if (doubleQuoteHref) {
        return decodeHtmlEntities(doubleQuoteHref[1].trim())
      }
      const singleQuoteHref = tag.match(/\bhref='([^']*)'/i)
      if (singleQuoteHref) {
        return decodeHtmlEntities(singleQuoteHref[1].trim())
      }
    }
  }
  return null
}

function resolveUrl(relativeOrAbsolute: string | null | undefined, baseUrl: string): string {
  if (!relativeOrAbsolute) return ''
  try {
    return new URL(relativeOrAbsolute, baseUrl).href
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  const { supabase, error: authError } = await getAuthenticatedOwner()

  if (authError) {
    console.error('[bookmark-metadata] not signed in')
    return NextResponse.json(
      { error: 'Your sign-in has expired. Reload the page and sign in again.' },
      { status: 401 }
    )
  }

  let body: { url?: unknown } | null = null
  try {
    body = (await request.json()) as { url?: unknown }
  } catch {
    console.error('[bookmark-metadata] bad address: invalid JSON body')
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { url } = body || {}
  if (!url || typeof url !== 'string' || !url.trim()) {
    console.error('[bookmark-metadata] bad address: missing URL')
    return NextResponse.json({ error: 'A valid URL is required' }, { status: 400 })
  }

  try {
    const { html, finalUrl } = await safeFetchHtml(url.trim())

    // 1. Title: og:title -> twitter:title -> <title>
    const ogTitle = extractMetaContent(html, 'property', 'og:title') || extractMetaContent(html, 'name', 'og:title')
    const twitterTitle = extractMetaContent(html, 'name', 'twitter:title') || extractMetaContent(html, 'property', 'twitter:title')
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const rawTagTitle = titleMatch ? decodeHtmlEntities(titleMatch[1].trim().replace(/\s+/g, ' ')) : ''
    const title = ogTitle || twitterTitle || rawTagTitle || finalUrl

    // 2. Description: og:description -> twitter:description -> meta description
    const ogDesc = extractMetaContent(html, 'property', 'og:description') || extractMetaContent(html, 'name', 'og:description')
    const twitterDesc = extractMetaContent(html, 'name', 'twitter:description') || extractMetaContent(html, 'property', 'twitter:description')
    const metaDesc = extractMetaContent(html, 'name', 'description')
    const description = ogDesc || twitterDesc || metaDesc || ''

    // 3. Author: meta author -> article:author -> twitter:creator
    const metaAuthor = extractMetaContent(html, 'name', 'author')
    const articleAuthor = extractMetaContent(html, 'property', 'article:author')
    const twitterAuthor = extractMetaContent(html, 'name', 'twitter:creator')
    const author = metaAuthor || articleAuthor || twitterAuthor || ''

    // 4. Publisher: og:site_name -> twitter:site -> hostname
    const ogPublisher = extractMetaContent(html, 'property', 'og:site_name')
    const twitterPublisher = extractMetaContent(html, 'name', 'twitter:site')
    let hostnameFallback = ''
    try {
      hostnameFallback = new URL(finalUrl).hostname.replace(/^www\./i, '')
    } catch {}
    const publisher = ogPublisher || twitterPublisher || hostnameFallback

    // 5. Thumbnail: og:image -> twitter:image
    const ogImage =
      extractMetaContent(html, 'property', 'og:image') ||
      extractMetaContent(html, 'property', 'og:image:url') ||
      extractMetaContent(html, 'name', 'og:image')
    const twitterImage =
      extractMetaContent(html, 'name', 'twitter:image') ||
      extractMetaContent(html, 'name', 'twitter:image:src') ||
      extractMetaContent(html, 'property', 'twitter:image')
    const resolvedThumbnail = resolveUrl(ogImage || twitterImage, finalUrl)

    // 6. Icon: link rel="icon" | rel="shortcut icon" | rel="apple-touch-icon" | /favicon.ico
    const iconHref = extractLinkHref(html, /^(?:shortcut\s+)?icon$|^apple-touch-icon$/i)
    const rawIcon = iconHref || '/favicon.ico'
    const resolvedIcon = resolveUrl(rawIcon, finalUrl)

    // 7. Storage re-hosting (ON by default; disabled only when ENABLE_BOOKMARK_STORAGE_REHOST === 'false')
    // Download thumbnail and icon in parallel via Promise.all
    const shouldExecuteUpload = process.env.ENABLE_BOOKMARK_STORAGE_REHOST !== 'false'
    const [finalThumbnail, finalIcon] = await Promise.all([
      rehostBookmarkImage(supabase, resolvedThumbnail, shouldExecuteUpload),
      rehostBookmarkImage(supabase, resolvedIcon, shouldExecuteUpload),
    ])

    return NextResponse.json({
      url: finalUrl,
      title,
      description,
      author,
      publisher,
      thumbnail: finalThumbnail,
      icon: finalIcon,
    })
  } catch (err: unknown) {
    if (err instanceof BookmarkFetchError) {
      switch (err.code) {
        case 'BAD_ADDRESS': {
          console.error('[bookmark-metadata] bad address')
          return NextResponse.json(
            { error: 'The address could not be reached or is invalid.' },
            { status: 400 }
          )
        }
        case 'TIMEOUT': {
          console.error('[bookmark-metadata] the site took too long')
          return NextResponse.json(
            { error: 'The site took too long to respond.' },
            { status: 504 }
          )
        }
        case 'PAGE_TOO_LARGE': {
          console.error('[bookmark-metadata] the page is too large')
          return NextResponse.json(
            { error: 'The page is too large to load (exceeds 1 MB limit).' },
            { status: 413 }
          )
        }
        case 'NOT_HTML': {
          console.error('[bookmark-metadata] not an HTML page')
          return NextResponse.json(
            { error: 'The requested address is not an HTML page.' },
            { status: 415 }
          )
        }
        case 'SITE_REFUSED': {
          const status = err.httpStatus || 502
          console.error(`[bookmark-metadata] the site refused (${status})`)
          return NextResponse.json(
            { error: `The site refused the request (HTTP ${status}).` },
            { status: 502 }
          )
        }
      }
    }

    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('took too long') || message.includes('timed out')) {
      console.error('[bookmark-metadata] the site took too long')
      return NextResponse.json({ error: 'The site took too long to respond.' }, { status: 504 })
    }
    if (message.includes('too large') || message.includes('limit')) {
      console.error('[bookmark-metadata] the page is too large')
      return NextResponse.json({ error: 'The page is too large to load (exceeds 1 MB limit).' }, { status: 413 })
    }
    if (message.includes('not an HTML page') || message.includes('content-type')) {
      console.error('[bookmark-metadata] not an HTML page')
      return NextResponse.json({ error: 'The requested address is not an HTML page.' }, { status: 415 })
    }
    if (message.includes('SSRF') || message.includes('URL') || message.includes('DNS')) {
      console.error('[bookmark-metadata] bad address')
      return NextResponse.json({ error: 'The address could not be reached or is invalid.' }, { status: 400 })
    }

    console.error('[bookmark-metadata] unexpected error')
    return NextResponse.json({ error: 'Failed to fetch bookmark metadata' }, { status: 500 })
  }
}
