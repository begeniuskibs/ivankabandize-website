import assert from 'node:assert/strict'
import fs from 'node:fs'
import http from 'node:http'
import { runCrawl, formatCrawlReport } from './launch-crawl.mjs'

async function main() {
    let baseUrl = ''

    const server = http.createServer((req, res) => {
        const url = req.url || '/'

        if (url === '/sitemap.xml') {
            res.writeHead(200, { 'Content-Type': 'application/xml' })
            res.end(
                `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc></url>
  <url><loc>${baseUrl}/about</loc></url>
</urlset>`
            )
            return
        }

        if (url === '/' || url === '/about') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            if (url === '/') {
                res.end(`<!doctype html>
<html>
  <body>
    <a href="/about">About</a>
    <a href="/missing-link">Broken 404 Link</a>
    <img src="/valid-image.png" alt="Valid diagram" />
    <img src="/no-alt-image.png" />
    <img src="/missing-image.png" alt="Missing asset" />
  </body>
</html>`)
            } else {
                res.end(`<!doctype html>
<html>
  <body>
    <h1>About</h1>
    <a href="/">Home</a>
  </body>
</html>`)
            }
            return
        }

        if (url === '/valid-image.png' || url === '/no-alt-image.png') {
            const payload = Buffer.from('89504e470d0a1a0a', 'hex')
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': String(payload.length),
            })
            if (req.method === 'HEAD') {
                res.end()
            } else {
                res.end(payload)
            }
            return
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' })
        res.end('Not found')
    })

    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
    const address = server.address()
    baseUrl = `http://127.0.0.1:${address.port}`

    try {
        const report = await runCrawl(baseUrl, { delayMs: 10 })
        const formatted = formatCrawlReport(report)
        console.log(formatted)

        // Verify pages crawled (/, /about, /missing-link)
        assert.equal(report.counts.pagesCrawled, 3, 'Expected 3 pages crawled')

        // Verify 404 link detected
        const has404Link = report.problems.brokenInternal.some(
            (item) =>
                item.kind === 'link' &&
                item.url === `${baseUrl}/missing-link` &&
                item.status === 404 &&
                item.page === `${baseUrl}/`
        )
        assert.ok(has404Link, 'Expected crawler to detect 404 link /missing-link')

        // Verify missing image detected
        const hasMissingImage = report.problems.brokenInternal.some(
            (item) =>
                item.kind === 'image' &&
                item.url === `${baseUrl}/missing-image.png` &&
                item.status === 404 &&
                item.page === `${baseUrl}/`
        )
        assert.ok(hasMissingImage, 'Expected crawler to detect missing image /missing-image.png')

        // Verify missing alt detected
        const hasMissingAlt = report.problems.imagesMissingAlt.some(
            (item) =>
                item.src === '/no-alt-image.png' &&
                item.page === `${baseUrl}/`
        )
        assert.ok(hasMissingAlt, 'Expected crawler to detect missing alt on /no-alt-image.png')
        assert.equal(report.counts.imagesMissingAlt, 1, 'Expected exactly 1 image missing alt')

        // Verify JSON report exists in os.tmpdir()
        assert.ok(report.jsonPath && fs.existsSync(report.jsonPath), 'Expected JSON report in os.tmpdir()')

        console.log('\nPASS: test_launch_crawl verified 404 link, missing image, and missing alt detection.')
    } finally {
        await new Promise((resolve) => server.close(resolve))
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
