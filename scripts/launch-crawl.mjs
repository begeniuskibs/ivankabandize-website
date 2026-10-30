import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const USER_AGENT = 'ivan-launch-crawl'
const MAX_PAGES = 400
const CONCURRENCY = 5
const DELAY_MS = 150
const EXTERNAL_TIMEOUT_MS = 10000
const INTERNAL_TIMEOUT_MS = 15000
const MAX_REDIRECT_HOPS = 10
const MAX_ALLOWED_REDIRECTS = 2
const OVERSIZED_IMAGE_BYTES = 500 * 1024

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function decodeHtmlEntities(str) {
    return str
        .replace(/&amp;/gi, '&')
        .replace(/&#38;/g, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/g, "'")
}

function normalizeUrl(rawHref, pageUrl) {
    if (!rawHref) return null
    const trimmed = decodeHtmlEntities(rawHref.trim())
    if (
        !trimmed ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('mailto:') ||
        trimmed.startsWith('tel:') ||
        trimmed.startsWith('javascript:') ||
        trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:')
    ) {
        return null
    }
    try {
        const resolved = new URL(trimmed, pageUrl)
        resolved.hash = ''
        return resolved
    } catch {
        return null
    }
}

function extractAttributes(tag, attrName) {
    const regex = new RegExp(
        `\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>` + '`' + `]+))`,
        'i'
    )
    const match = tag.match(regex)
    if (!match) return null
    return match[1] ?? match[2] ?? match[3] ?? ''
}

function hasAttribute(tag, attrName) {
    const regex = new RegExp(`\\b${attrName}(?:\\s*=|\\s|>|\\/)`, 'i')
    return regex.test(tag)
}

export function parsePageHtml(html, pageUrl) {
    const cleanHtml = html.replace(/<!--[\s\S]*?-->/g, '')
    const links = []
    const images = []

    const anchorRegex = /<a\b[^>]*>/gi
    let match
    while ((match = anchorRegex.exec(cleanHtml)) !== null) {
        const tag = match[0]
        const rawHref = extractAttributes(tag, 'href')
        if (!rawHref) continue
        const resolved = normalizeUrl(rawHref, pageUrl)
        if (resolved) {
            links.push({
                raw: decodeHtmlEntities(rawHref.trim()),
                url: resolved.href,
                protocol: resolved.protocol,
                host: resolved.host,
            })
        }
    }

    const imgRegex = /<img\b[^>]*>/gi
    while ((match = imgRegex.exec(cleanHtml)) !== null) {
        const tag = match[0]
        const hasAlt = hasAttribute(tag, 'alt')
        const rawSrc = extractAttributes(tag, 'src')
        const rawSrcset = extractAttributes(tag, 'srcset')

        const urls = []
        if (rawSrc) {
            const resolvedSrc = normalizeUrl(rawSrc, pageUrl)
            if (resolvedSrc) {
                urls.push({
                    raw: decodeHtmlEntities(rawSrc.trim()),
                    url: resolvedSrc.href,
                    protocol: resolvedSrc.protocol,
                    host: resolvedSrc.host,
                    sourceAttr: 'src',
                })
            }
        }

        if (rawSrcset) {
            const candidates = decodeHtmlEntities(rawSrcset)
                .split(',')
                .map((part) => part.trim().split(/\s+/)[0])
                .filter(Boolean)
            for (const candidate of candidates) {
                const resolvedCandidate = normalizeUrl(candidate, pageUrl)
                if (resolvedCandidate) {
                    urls.push({
                        raw: candidate,
                        url: resolvedCandidate.href,
                        protocol: resolvedCandidate.protocol,
                        host: resolvedCandidate.host,
                        sourceAttr: 'srcset',
                    })
                }
            }
        }

        images.push({
            hasAlt,
            rawSrc: rawSrc ? decodeHtmlEntities(rawSrc.trim()) : '(missing src)',
            urls,
        })
    }

    return { links, images }
}

async function fetchWithRedirects(targetUrl, method, timeoutMs) {
    let currentUrl = targetUrl
    let redirects = 0
    const chain = [currentUrl]

    while (redirects <= MAX_REDIRECT_HOPS) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), timeoutMs)
        let response
        try {
            response = await fetch(currentUrl, {
                method,
                redirect: 'manual',
                credentials: 'omit',
                headers: {
                    'User-Agent': USER_AGENT,
                },
                signal: controller.signal,
            })
        } finally {
            clearTimeout(timer)
        }

        if (
            response.status >= 300 &&
            response.status < 400 &&
            response.headers.get('location')
        ) {
            redirects += 1
            const nextLocation = response.headers.get('location')
            currentUrl = new URL(nextLocation, currentUrl).href
            chain.push(currentUrl)
            if (redirects > MAX_REDIRECT_HOPS) {
                return {
                    status: response.status,
                    redirects,
                    chain,
                    finalUrl: currentUrl,
                    response,
                    tooManyRedirects: true,
                }
            }
            continue
        }

        return {
            status: response.status,
            redirects,
            chain,
            finalUrl: currentUrl,
            response,
            tooManyRedirects: false,
        }
    }

    return {
        status: 0,
        redirects,
        chain,
        finalUrl: currentUrl,
        response: null,
        tooManyRedirects: true,
    }
}

async function probeResource(url, { isImage = false, isExternal = false } = {}) {
    const timeoutMs = isExternal ? EXTERNAL_TIMEOUT_MS : INTERNAL_TIMEOUT_MS
    let result
    let usedGet = false

    try {
        result = await fetchWithRedirects(url, 'HEAD', timeoutMs)
    } catch (headErr) {
        try {
            usedGet = true
            result = await fetchWithRedirects(url, 'GET', timeoutMs)
        } catch (getErr) {
            return {
                status: 0,
                redirects: 0,
                chain: [url],
                finalUrl: url,
                sizeBytes: null,
                error: getErr instanceof Error ? getErr.message : String(getErr),
            }
        }
        if (!result && headErr) {
            return {
                status: 0,
                redirects: 0,
                chain: [url],
                finalUrl: url,
                sizeBytes: null,
                error: headErr instanceof Error ? headErr.message : String(headErr),
            }
        }
    }

    // Fall back to GET if HEAD is refused or fails, or if we need image size and content-length is missing
    const headRefused = result.status >= 400
    const contentLengthHeader = result.response?.headers?.get('content-length')
    const needsImageBytes = isImage && result.status >= 200 && result.status < 300 && !contentLengthHeader

    if (!usedGet && (headRefused || needsImageBytes)) {
        try {
            if (result.response?.body) {
                await result.response.body.cancel().catch(() => {})
            }
            usedGet = true
            result = await fetchWithRedirects(url, 'GET', timeoutMs)
        } catch (getErr) {
            return {
                status: result.status || 0,
                redirects: result.redirects || 0,
                chain: result.chain || [url],
                finalUrl: result.finalUrl || url,
                sizeBytes: null,
                error: getErr instanceof Error ? getErr.message : String(getErr),
            }
        }
    }

    let sizeBytes = null
    const finalContentLength = result.response?.headers?.get('content-length')
    if (finalContentLength && /^\d+$/.test(finalContentLength)) {
        sizeBytes = Number(finalContentLength)
        if (result.response?.body) {
            await result.response.body.cancel().catch(() => {})
        }
    } else if (isImage && usedGet && result.response && result.status >= 200 && result.status < 300) {
        try {
            const buf = await result.response.arrayBuffer()
            sizeBytes = buf.byteLength
        } catch {
            sizeBytes = null
        }
    } else if (result.response?.body) {
        await result.response.body.cancel().catch(() => {})
    }

    return {
        status: result.status,
        redirects: result.redirects,
        chain: result.chain,
        finalUrl: result.finalUrl,
        sizeBytes,
        error: result.tooManyRedirects ? 'Too many redirects' : null,
    }
}

async function runPool(items, concurrency, delayMs, worker) {
    let index = 0
    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (index < items.length) {
            const currentIndex = index
            index += 1
            if (delayMs > 0 && currentIndex > 0) {
                await sleep(delayMs)
            }
            await worker(items[currentIndex], currentIndex)
        }
    })
    await Promise.all(runners)
}

export async function runCrawl(baseUrlArg, options = {}) {
    if (!baseUrlArg) {
        throw new Error('Base URL argument is required.')
    }

    const baseParsed = new URL(baseUrlArg)
    const baseOrigin = baseParsed.origin
    const baseHost = baseParsed.host
    const maxPages = options.maxPages ?? MAX_PAGES
    const concurrency = options.concurrency ?? CONCURRENCY
    const delayMs = options.delayMs ?? DELAY_MS

    const pageStatuses = new Map()
    const crawledPages = new Set()
    const queuedPages = new Set()
    const queue = []

    const discoveredLinks = []
    const discoveredImages = []
    const missingAltProblems = []
    const httpOnHttpsProblems = []
    const redirectProblems = []

    function enqueueInternalPage(urlStr, foundOn) {
        try {
            const u = new URL(urlStr, baseOrigin)
            u.hash = ''
            if (u.host !== baseHost) return
            const normalized = u.href
            if (queuedPages.has(normalized) || crawledPages.has(normalized)) return
            if (queuedPages.size >= maxPages) return
            queuedPages.add(normalized)
            queue.push({ url: normalized, foundOn })
        } catch {
            // ignore invalid URL
        }
    }

    // 1. Seed home page and /sitemap.xml
    const homeUrl = new URL('/', baseOrigin).href
    enqueueInternalPage(homeUrl, '(seed)')

    const sitemapUrl = new URL('/sitemap.xml', baseOrigin).href
    try {
        const sitemapRes = await fetchWithRedirects(sitemapUrl, 'GET', INTERNAL_TIMEOUT_MS)
        if (sitemapRes.status >= 200 && sitemapRes.status < 300 && sitemapRes.response) {
            const xml = await sitemapRes.response.text()
            const locRegex = /<loc>\s*([^<\s]+)\s*<\/loc>/gi
            let locMatch
            while ((locMatch = locRegex.exec(xml)) !== null) {
                const rawLoc = decodeHtmlEntities(locMatch[1])
                try {
                    const locUrl = new URL(rawLoc)
                    const mapped = new URL(locUrl.pathname + locUrl.search, baseOrigin).href
                    enqueueInternalPage(mapped, sitemapUrl)
                } catch {
                    // ignore invalid sitemap loc
                }
            }
        } else if (sitemapRes.response?.body) {
            await sitemapRes.response.body.cancel().catch(() => {})
        }
    } catch {
        // sitemap optional if unreachable
    }

    // 2. Breadth-first crawl of internal pages
    let activeWorkers = 0
    await new Promise((resolve) => {
        const pump = () => {
            if (queue.length === 0 && activeWorkers === 0) {
                resolve()
                return
            }
            while (
                activeWorkers < concurrency &&
                queue.length > 0 &&
                crawledPages.size < maxPages
            ) {
                const item = queue.shift()
                if (!item || crawledPages.has(item.url)) continue
                crawledPages.add(item.url)
                activeWorkers += 1

                ;(async () => {
                    if (delayMs > 0 && crawledPages.size > 1) {
                        await sleep(delayMs)
                    }
                    try {
                        const res = await fetchWithRedirects(
                            item.url,
                            'GET',
                            INTERNAL_TIMEOUT_MS
                        )
                        pageStatuses.set(item.url, {
                            status: res.status,
                            redirects: res.redirects,
                            finalUrl: res.finalUrl,
                            foundOn: item.foundOn,
                            error: res.tooManyRedirects ? 'Too many redirects' : null,
                        })

                        if (res.redirects > MAX_ALLOWED_REDIRECTS) {
                            redirectProblems.push({
                                type: 'redirect_chain',
                                url: item.url,
                                page: item.foundOn,
                                redirects: res.redirects,
                                status: res.status,
                            })
                        }

                        const contentType = res.response?.headers?.get('content-type') || ''
                        if (
                            res.status >= 200 &&
                            res.status < 300 &&
                            res.response &&
                            contentType.includes('text/html')
                        ) {
                            const html = await res.response.text()
                            const pageIsHttps = item.url.startsWith('https://')
                            const parsed = parsePageHtml(html, item.url)

                            for (const link of parsed.links) {
                                discoveredLinks.push({
                                    url: link.url,
                                    raw: link.raw,
                                    page: item.url,
                                    isInternal: link.host === baseHost,
                                })

                                if (pageIsHttps && link.protocol === 'http:') {
                                    httpOnHttpsProblems.push({
                                        type: 'http_on_https',
                                        kind: 'link',
                                        url: link.url,
                                        page: item.url,
                                    })
                                }

                                if (link.host === baseHost && crawledPages.size + queue.length < maxPages) {
                                    enqueueInternalPage(link.url, item.url)
                                }
                            }

                            for (const img of parsed.images) {
                                if (!img.hasAlt) {
                                    missingAltProblems.push({
                                        type: 'missing_alt',
                                        src: img.rawSrc,
                                        page: item.url,
                                    })
                                }
                                for (const imgUrlObj of img.urls) {
                                    discoveredImages.push({
                                        url: imgUrlObj.url,
                                        raw: imgUrlObj.raw,
                                        sourceAttr: imgUrlObj.sourceAttr,
                                        page: item.url,
                                    })
                                    if (pageIsHttps && imgUrlObj.protocol === 'http:') {
                                        httpOnHttpsProblems.push({
                                            type: 'http_on_https',
                                            kind: 'image',
                                            url: imgUrlObj.url,
                                            page: item.url,
                                        })
                                    }
                                }
                            }
                        } else if (res.response?.body) {
                            await res.response.body.cancel().catch(() => {})
                        }
                    } catch (err) {
                        pageStatuses.set(item.url, {
                            status: 0,
                            redirects: 0,
                            finalUrl: item.url,
                            foundOn: item.foundOn,
                            error: err instanceof Error ? err.message : String(err),
                        })
                    } finally {
                        activeWorkers -= 1
                        pump()
                    }
                })()
            }
        }
        pump()
    })

    // 3. Check unique links (internal & external)
    const uniqueLinksMap = new Map()
    for (const l of discoveredLinks) {
        if (!uniqueLinksMap.has(l.url)) {
            uniqueLinksMap.set(l.url, {
                url: l.url,
                isInternal: l.isInternal,
                pages: new Set([l.page]),
            })
        } else {
            uniqueLinksMap.get(l.url).pages.add(l.page)
        }
    }

    const linkResults = new Map()
    const uniqueLinks = Array.from(uniqueLinksMap.values())

    await runPool(uniqueLinks, concurrency, delayMs, async (entry) => {
        if (entry.isInternal && pageStatuses.has(entry.url)) {
            const cached = pageStatuses.get(entry.url)
            linkResults.set(entry.url, {
                status: cached.status,
                redirects: cached.redirects,
                finalUrl: cached.finalUrl,
                error: cached.error,
                isInternal: true,
                pages: Array.from(entry.pages),
            })
            return
        }

        const res = await probeResource(entry.url, {
            isImage: false,
            isExternal: !entry.isInternal,
        })
        linkResults.set(entry.url, {
            ...res,
            isInternal: entry.isInternal,
            pages: Array.from(entry.pages),
        })

        if (res.redirects > MAX_ALLOWED_REDIRECTS) {
            for (const p of entry.pages) {
                redirectProblems.push({
                    type: 'redirect_chain',
                    url: entry.url,
                    page: p,
                    redirects: res.redirects,
                    status: res.status,
                })
            }
        }
    })

    // 4. Check unique images (src + srcset)
    const uniqueImagesMap = new Map()
    for (const img of discoveredImages) {
        if (!uniqueImagesMap.has(img.url)) {
            uniqueImagesMap.set(img.url, {
                url: img.url,
                pages: new Set([img.page]),
            })
        } else {
            uniqueImagesMap.get(img.url).pages.add(img.page)
        }
    }

    const imageResults = new Map()
    const uniqueImages = Array.from(uniqueImagesMap.values())

    await runPool(uniqueImages, concurrency, delayMs, async (entry) => {
        let isExternalImg = false
        try {
            isExternalImg = new URL(entry.url).host !== baseHost
        } catch {
            isExternalImg = false
        }
        const res = await probeResource(entry.url, {
            isImage: true,
            isExternal: isExternalImg,
        })
        imageResults.set(entry.url, {
            ...res,
            pages: Array.from(entry.pages),
        })

        if (res.redirects > MAX_ALLOWED_REDIRECTS) {
            for (const p of entry.pages) {
                redirectProblems.push({
                    type: 'redirect_chain',
                    url: entry.url,
                    page: p,
                    redirects: res.redirects,
                    status: res.status,
                })
            }
        }
    })

    // 5. Classify problems
    const brokenInternal = []
    const brokenExternal = []
    const unverifiedExternal = []
    const oversizedImages = []

    // Check crawled pages that returned 4xx/5xx directly (e.g. from seed)
    for (const [pageUrl, info] of pageStatuses.entries()) {
        if (info.status >= 400 || info.status === 0) {
            if (!linkResults.has(pageUrl)) {
                brokenInternal.push({
                    kind: 'page',
                    url: pageUrl,
                    status: info.status,
                    error: info.error,
                    page: info.foundOn,
                })
            }
        }
    }

    for (const [url, info] of linkResults.entries()) {
        const isErrorStatus = info.status >= 400 || info.status === 0
        if (!isErrorStatus) continue

        if (info.isInternal) {
            for (const page of info.pages) {
                brokenInternal.push({
                    kind: 'link',
                    url,
                    status: info.status,
                    error: info.error,
                    page,
                })
            }
        } else if (info.status === 403 || info.status === 429) {
            for (const page of info.pages) {
                unverifiedExternal.push({
                    kind: 'external_link',
                    url,
                    status: info.status,
                    page,
                })
            }
        } else {
            for (const page of info.pages) {
                brokenExternal.push({
                    kind: 'external_link',
                    url,
                    status: info.status,
                    error: info.error,
                    page,
                })
            }
        }
    }

    for (const [url, info] of imageResults.entries()) {
        const isErrorStatus = info.status >= 400 || info.status === 0
        if (isErrorStatus) {
            for (const page of info.pages) {
                brokenInternal.push({
                    kind: 'image',
                    url,
                    status: info.status,
                    error: info.error,
                    page,
                })
            }
        }
        if (typeof info.sizeBytes === 'number' && info.sizeBytes > OVERSIZED_IMAGE_BYTES) {
            const sizeKb = Number((info.sizeBytes / 1024).toFixed(1))
            for (const page of info.pages) {
                oversizedImages.push({
                    url,
                    sizeBytes: info.sizeBytes,
                    sizeKb,
                    page,
                })
            }
        }
    }

    const counts = {
        pagesCrawled: pageStatuses.size,
        linksChecked: uniqueLinks.length,
        imagesChecked: uniqueImages.length,
        brokenInternal: brokenInternal.length,
        brokenExternal: brokenExternal.length,
        unverified: unverifiedExternal.length,
        imagesMissingAlt: missingAltProblems.length,
        oversizedImages: oversizedImages.length,
        redirectChains: redirectProblems.length,
        httpOnHttps: httpOnHttpsProblems.length,
    }

    const report = {
        baseUrl: baseOrigin,
        timestamp: new Date().toISOString(),
        counts,
        pages: Array.from(pageStatuses.entries()).map(([url, info]) => ({
            url,
            ...info,
        })),
        problems: {
            brokenInternal,
            brokenExternal,
            unverifiedExternal,
            imagesMissingAlt: missingAltProblems,
            oversizedImages,
            redirectChains: redirectProblems,
            httpOnHttps: httpOnHttpsProblems,
        },
    }

    const jsonPath = path.join(os.tmpdir(), `launch-crawl-${Date.now()}.json`)
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8')
    report.jsonPath = jsonPath

    return report
}

export function formatCrawlReport(report) {
    const lines = []
    const c = report.counts

    lines.push('=== LAUNCH CRAWL SUMMARY ===')
    lines.push(`Base URL: ${report.baseUrl}`)
    lines.push(`pages crawled: ${c.pagesCrawled}`)
    lines.push(`links checked: ${c.linksChecked}`)
    lines.push(`images checked: ${c.imagesChecked}`)
    lines.push(`broken internal: ${c.brokenInternal}`)
    lines.push(`broken external: ${c.brokenExternal}`)
    lines.push(`unverified: ${c.unverified}`)
    lines.push(`images missing alt: ${c.imagesMissingAlt}`)
    lines.push(`oversized images: ${c.oversizedImages}`)
    lines.push(`redirect chains (>2): ${c.redirectChains}`)
    lines.push(`http resources on https pages: ${c.httpOnHttps}`)
    lines.push(`JSON report written to: ${report.jsonPath}`)
    lines.push('')
    lines.push('=== PROBLEMS ===')

    let problemCount = 0

    for (const item of report.problems.brokenInternal) {
        problemCount += 1
        lines.push(
            `[BROKEN INTERNAL - ${item.kind.toUpperCase()}] status=${item.status}${item.error ? ` (${item.error})` : ''} url=${item.url} - found on ${item.page}`
        )
    }

    for (const item of report.problems.brokenExternal) {
        problemCount += 1
        lines.push(
            `[BROKEN EXTERNAL] status=${item.status}${item.error ? ` (${item.error})` : ''} url=${item.url} - found on ${item.page}`
        )
    }

    for (const item of report.problems.unverifiedExternal) {
        problemCount += 1
        lines.push(
            `[UNVERIFIED EXTERNAL] status=${item.status} url=${item.url} - found on ${item.page}`
        )
    }

    for (const item of report.problems.imagesMissingAlt) {
        problemCount += 1
        lines.push(
            `[IMAGE MISSING ALT] src=${item.src} - found on ${item.page}`
        )
    }

    for (const item of report.problems.oversizedImages) {
        problemCount += 1
        lines.push(
            `[OVERSIZED IMAGE] size=${item.sizeKb} KB (${item.sizeBytes} bytes) url=${item.url} - found on ${item.page}`
        )
    }

    for (const item of report.problems.redirectChains) {
        problemCount += 1
        lines.push(
            `[REDIRECT CHAIN] hops=${item.redirects} status=${item.status} url=${item.url} - found on ${item.page}`
        )
    }

    for (const item of report.problems.httpOnHttps) {
        problemCount += 1
        lines.push(
            `[HTTP ON HTTPS] kind=${item.kind} url=${item.url} - found on ${item.page}`
        )
    }

    if (problemCount === 0) {
        lines.push('No problems detected.')
    }

    return lines.join('\n')
}

const isMain =
    process.argv[1] &&
    path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isMain) {
    const targetArg = process.argv[2]
    if (!targetArg) {
        console.error(
            'Usage: node scripts/launch-crawl.mjs <base-url>'
        )
        process.exit(1)
    }

    runCrawl(targetArg)
        .then((report) => {
            console.log(formatCrawlReport(report))
        })
        .catch((err) => {
            console.error('Crawl failed:', err instanceof Error ? err.message : String(err))
            process.exit(1)
        })
}

