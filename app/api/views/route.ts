import { NextRequest } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getAuthenticatedOwner } from '@/utils/supabase/auth'
import { getClientIp, checkRateLimit } from '@/lib/rateLimit'
import {
  isBotUserAgent,
  isValidSlug,
  makeSessionHash,
  getUtcDay,
} from '@/lib/viewCounting'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce max body size of 1 KB
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > 1024) {
      return new Response(null, { status: 400 })
    }

    const rawBody = await request.text()
    if (rawBody.length > 1024) {
      return new Response(null, { status: 400 })
    }

    // 2. Parse JSON { slug }. Reject anything else with 400.
    let parsed: unknown
    try {
      parsed = JSON.parse(rawBody)
    } catch {
      return new Response(null, { status: 400 })
    }

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return new Response(null, { status: 400 })
    }

    const { slug } = parsed as { slug?: unknown }
    if (typeof slug !== 'string') {
      return new Response(null, { status: 400 })
    }

    // 3. Skip (204) for invalid slug
    if (!isValidSlug(slug)) {
      return new Response(null, { status: 204 })
    }

    // 4. Skip (204) for bot user agent
    const userAgent = request.headers.get('user-agent') || ''
    if (isBotUserAgent(userAgent)) {
      return new Response(null, { status: 204 })
    }

    // 5. Skip (204) if signed-in owner
    try {
      const { isOwner } = await getAuthenticatedOwner({ checkMfa: false })
      if (isOwner) {
        return new Response(null, { status: 204 })
      }
    } catch {
      // Continue if auth check fails
    }

    // 6. Rate limit (generous 30 per minute per IP via existing Upstash helper)
    const ip = getClientIp(request.headers)
    const rateLimitResult = await checkRateLimit(ip, 30, 60, 'views')
    if (!rateLimitResult.success) {
      return new Response(null, { status: 204 })
    }

    // 7. HMAC secret from environment
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret) {
      console.error('View counting service key unavailable')
      return new Response(null, { status: 204 })
    }

    // 8. Lookup post by slug (select id, publish_status only)
    const supabase = createAdminClient()
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, publish_status')
      .eq('slug', slug)
      .maybeSingle()

    if (postError || !post || post.publish_status !== 'published') {
      return new Response(null, { status: 204 })
    }

    // 9. Generate anonymous daily session hash
    const day = getUtcDay()
    const sessionHash = makeSessionHash({
      secret,
      ip,
      userAgent,
      postId: post.id,
      day,
    })

    // 10. De-duplicate on same UTC day
    const startOfDay = `${day}T00:00:00.000Z`
    const endOfDay = `${day}T23:59:59.999Z`

    const { data: existingView, error: viewError } = await supabase
      .from('post_views')
      .select('id')
      .eq('post_id', post.id)
      .eq('session_hash', sessionHash)
      .gte('viewed_at', startOfDay)
      .lte('viewed_at', endOfDay)
      .limit(1)
      .maybeSingle()

    if (viewError) {
      console.error('View lookup check failed')
      return new Response(null, { status: 204 })
    }

    if (existingView) {
      return new Response(null, { status: 204 })
    }

    // 11. Insert view row
    const { error: insertError } = await supabase.from('post_views').insert({
      post_id: post.id,
      session_hash: sessionHash,
      viewed_at: new Date().toISOString(),
    })

    if (insertError) {
      console.error('View insert failed')
    }

    return new Response(null, { status: 204 })
  } catch {
    console.error('Error processing view request')
    return new Response(null, { status: 204 })
  }
}

