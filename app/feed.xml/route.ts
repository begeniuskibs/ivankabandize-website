import { createAdminClient } from '@/utils/supabase/admin'
import { SITE_URL } from '@/lib/siteUrl'

export const dynamic = 'force-dynamic'

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const now = new Date().toISOString()
  const adminClient = createAdminClient()

  // SECURITY RULE: select only whitelisted fields, never select content.
  const { data: posts, error } = await adminClient
    .from('posts')
    .select('id, slug, title, excerpt, published_at, updated_at, featured_image_url, visibility, publish_status')
    .eq('publish_status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .limit(30)

  if (error) {
    console.error('RSS feed error fetching posts:', error)
  }

  const itemsXml = (posts || [])
    .filter((p) => Boolean(p.slug))
    .map((p) => {
      const postUrl = `${SITE_URL}/garden/${p.slug}`
      const title = escapeXml(p.title || 'Untitled')
      const description = escapeXml(p.excerpt ? p.excerpt.trim() : '')
      const pubDate = p.published_at ? new Date(p.published_at).toUTCString() : ''

      return `    <item>
      <title>${title}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${description}</description>
    </item>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Ivan Kabandize</title>
    <link>${SITE_URL}</link>
    <description>Ivan Kabandize writes about leadership, systems thinking, technology and faith, and helps organisations get their operations, systems and teams in order.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  })
}
