import { NextResponse } from 'next/server'
import {
  RESOURCE_DOWNLOAD_LIMITS,
  SLUG_REGEX,
  isSameOrigin,
  validateResourceDownloadPayload,
} from '@/lib/resourceDownload'
import { computeRequestFingerprint } from '@/lib/resourceFingerprint'
import {
  RESOURCE_CONSENT_TEXT,
  RESOURCE_CONSENT_VERSION,
  RESOURCE_CONSENT_TEXT_MEMBER,
  RESOURCE_CONSENT_VERSION_MEMBER,
} from '@/lib/resourceConsent'
import {
  getFirstName,
  isValidIntendedUse,
  normaliseIntendedUse,
  type IntendedUseValue,
} from '@/lib/resourceFlow'
import { buildResourceEmail } from '@/lib/resourceEmail'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { SITE_URL } from '@/lib/siteUrl'

export const maxDuration = 30

export async function POST(request: Request) {
  try {
    // 0a. Origin check: If present, must match request host or site host (supports preview deployments)
    const origin = request.headers.get('origin')
    if (origin) {
      const forwardedHost = request.headers.get('x-forwarded-host')
      const hostHeader = request.headers.get('host')
      const requestHost =
        forwardedHost?.split(',')[0].trim() || hostHeader?.trim() || ''

      let siteHost = ''
      try {
        siteHost = new URL(SITE_URL).host
      } catch {
        siteHost = SITE_URL.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
      }

      if (!isSameOrigin(origin, [requestHost, siteHost])) {
        return NextResponse.json(
          { ok: false, error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // 0b. Size guard: Content-Length header & raw body limit (max 4000 chars)
    const contentLength = request.headers.get('content-length')
    if (
      contentLength &&
      parseInt(contentLength, 10) > RESOURCE_DOWNLOAD_LIMITS.MAX_REQUEST_BODY_CHARS
    ) {
      return NextResponse.json(
        { ok: false, error: 'That request is too large.' },
        { status: 413 }
      )
    }

    const rawBody = await request.text()
    if (rawBody.length > RESOURCE_DOWNLOAD_LIMITS.MAX_REQUEST_BODY_CHARS) {
      return NextResponse.json(
        { ok: false, error: 'That request is too large.' },
        { status: 413 }
      )
    }

    let body: Record<string, unknown>
    try {
      const parsed = JSON.parse(rawBody)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid request format.' },
          { status: 400 }
        )
      }
      body = parsed as Record<string, unknown>
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON payload.' },
        { status: 400 }
      )
    }

    // Check member authentication
    let isMember = false
    let memberId: string | null = null
    let memberEmail = ''
    let memberName = ''
    let slug = ''
    let intendedUse: IntendedUseValue | null = null
    let downloadName = ''
    let downloadEmail = ''

    try {
      const userSupabase = await createClient()
      const {
        data: { user },
      } = await userSupabase.auth.getUser()

      if (user) {
        const { data: member } = await userSupabase
          .from('members')
          .select('id, tier_status')
          .eq('user_id', user.id)
          .maybeSingle()

        if (
          member &&
          member.tier_status &&
          ['free', 'paid', 'comped'].includes(member.tier_status)
        ) {
          isMember = true
          memberId = member.id

          const { data: profile } = await userSupabase
            .from('users')
            .select('email, full_name')
            .eq('id', user.id)
            .maybeSingle()

          memberEmail = profile?.email || user.email || ''
          memberName =
            profile?.full_name ||
            (user.user_metadata?.full_name as string) ||
            (user.user_metadata?.name as string) ||
            'Member'
        }
      }
    } catch {
      isMember = false
    }

    if (isMember) {
      const rawSlug = typeof body.slug === 'string' ? body.slug.trim() : ''
      if (
        !rawSlug ||
        rawSlug.length > RESOURCE_DOWNLOAD_LIMITS.SLUG_MAX ||
        !SLUG_REGEX.test(rawSlug)
      ) {
        return NextResponse.json(
          { ok: false, error: 'Resource slug is required.' },
          { status: 400 }
        )
      }
      slug = rawSlug

      if (!isValidIntendedUse(body.intendedUse)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid request data.' },
          { status: 400 }
        )
      }
      intendedUse = normaliseIntendedUse(body.intendedUse)
      downloadName = memberName
      downloadEmail = memberEmail
    } else {
      const validation = validateResourceDownloadPayload(body)
      if (!validation.isValid || !validation.data) {
        return NextResponse.json(
          { ok: false, error: validation.error || 'Invalid request data.' },
          { status: 400 }
        )
      }

      // 1. Honeypot check: If filled, return 200 { ok: true } with NO url and no DB writes
      if (validation.data.isHoneypot) {
        console.log('[resources/download] honeypot triggered')
        return NextResponse.json({ ok: true }, { status: 200 })
      }

      slug = validation.data.slug
      downloadName = validation.data.name
      downloadEmail = validation.data.email
      intendedUse = validation.data.intendedUse
    }

    // 2. Fingerprint secret check: FAIL CLOSED if missing or < 32 characters
    const fingerprintSecret = process.env.RESOURCE_FINGERPRINT_SECRET
    if (
      !fingerprintSecret ||
      fingerprintSecret.length < RESOURCE_DOWNLOAD_LIMITS.MIN_SECRET_LENGTH
    ) {
      return NextResponse.json(
        { ok: false, error: 'Downloads are temporarily unavailable.' },
        { status: 503 }
      )
    }

    // 3. IP limit via checkRateLimit (10 requests per 600 seconds)
    const clientIp = getClientIp(request.headers)
    const ipRateLimit = await checkRateLimit(clientIp, 10, 600, 'resource-ip')
    if (!ipRateLimit.success) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Too many downloads just now. Please try again in a little while.',
        },
        { status: 429 }
      )
    }

    // 4. Compute request fingerprint: HMAC-SHA256 over client IP
    const fingerprint = computeRequestFingerprint(clientIp, fingerprintSecret)

    // 5. Load the resource by slug where status = 'published'
    const adminClient = createAdminClient()

    const { data: resource, error: resourceError } = await adminClient
      .from('resources')
      .select('id, title, kind, delivery_type, file_path, file_name, external_url, visibility')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (resourceError || !resource) {
      return NextResponse.json(
        { ok: false, error: "That file isn't available." },
        { status: 404 }
      )
    }

    if (resource.visibility === 'members') {
      return NextResponse.json(
        { ok: false, error: 'Members only.' },
        { status: 403 }
      )
    }

    // 6. Database limits: per email (3 / 60m), per fingerprint (10 / 60m), global (70 / 60s)
    const emailWindowStart = new Date(
      Date.now() - RESOURCE_DOWNLOAD_LIMITS.EMAIL_LIMIT_WINDOW_MINUTES * 60 * 1000
    ).toISOString()

    const fingerprintWindowStart = new Date(
      Date.now() - RESOURCE_DOWNLOAD_LIMITS.FINGERPRINT_LIMIT_WINDOW_MINUTES * 60 * 1000
    ).toISOString()

    const globalWindowStart = new Date(
      Date.now() - RESOURCE_DOWNLOAD_LIMITS.GLOBAL_LIMIT_WINDOW_SECONDS * 1000
    ).toISOString()

    const [emailCheck, fingerprintCheck, globalCheck] = await Promise.all([
      adminClient
        .from('resource_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('email', downloadEmail)
        .gte('created_at', emailWindowStart),
      adminClient
        .from('resource_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('request_fingerprint', fingerprint)
        .gte('created_at', fingerprintWindowStart),
      adminClient
        .from('resource_downloads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', globalWindowStart),
    ])

    if (emailCheck.error || fingerprintCheck.error || globalCheck.error) {
      console.error('[resources/download] database limit check error')
      return NextResponse.json(
        { ok: false, error: 'Downloads are temporarily unavailable.' },
        { status: 503 }
      )
    }

    if (
      (typeof emailCheck.count === 'number' &&
        emailCheck.count >= RESOURCE_DOWNLOAD_LIMITS.EMAIL_LIMIT_MAX) ||
      (typeof fingerprintCheck.count === 'number' &&
        fingerprintCheck.count >= RESOURCE_DOWNLOAD_LIMITS.FINGERPRINT_LIMIT_MAX) ||
      (typeof globalCheck.count === 'number' &&
        globalCheck.count >= RESOURCE_DOWNLOAD_LIMITS.GLOBAL_LIMIT_MAX)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Too many downloads just now. Please try again in a little while.',
        },
        { status: 429 }
      )
    }

    // 7. Insert resource_downloads row
    const consentVersion = isMember
      ? RESOURCE_CONSENT_VERSION_MEMBER
      : RESOURCE_CONSENT_VERSION
    const consentText = isMember
      ? RESOURCE_CONSENT_TEXT_MEMBER
      : RESOURCE_CONSENT_TEXT

    const { data: insertedRow, error: insertError } = await adminClient
      .from('resource_downloads')
      .insert({
        resource_id: resource.id,
        member_id: memberId,
        name: downloadName,
        email: downloadEmail,
        intended_use: intendedUse,
        consent_wording_version: consentVersion,
        consent_text: consentText,
        request_fingerprint: fingerprint,
      })
      .select('id')
      .single()

    if (insertError || !insertedRow?.id) {
      console.error('[resources/download] insert download record error')
      return NextResponse.json(
        {
          ok: false,
          error: 'Something went wrong. Please try again in a moment.',
        },
        { status: 500 }
      )
    }

    // 8. On-screen link delivery
    const isLinkDelivery = resource.delivery_type === 'link'
    let onScreenUrl = ''

    if (isLinkDelivery) {
      const rawUrl = resource.external_url
      const isValidExternalUrl =
        typeof rawUrl === 'string' &&
        rawUrl.startsWith('https://') &&
        rawUrl.length <= 2000

      if (!isValidExternalUrl) {
        console.error('[resources/download] link resource has no valid external_url')
        await adminClient
          .from('resource_downloads')
          .update({ email_error: 'Link resource misconfigured' })
          .eq('id', insertedRow.id)

        return NextResponse.json(
          {
            ok: false,
            error: 'Something went wrong. Please try again in a moment.',
          },
          { status: 500 }
        )
      }

      onScreenUrl = rawUrl
      await adminClient
        .from('resource_downloads')
        .update({ signed_link_issued_at: new Date().toISOString() })
        .eq('id', insertedRow.id)
    } else {
      // file delivery
      const { data: signedData, error: signedError } = await adminClient.storage
        .from('resource-files')
        .createSignedUrl(
          resource.file_path,
          RESOURCE_DOWNLOAD_LIMITS.SIGNED_URL_EXPIRY_SECONDS,
          {
            download: resource.file_name,
          }
        )

      if (signedError || !signedData?.signedUrl) {
        console.error('[resources/download] on-screen signed url generation error')
        await adminClient
          .from('resource_downloads')
          .update({ email_error: 'Failed to generate download link' })
          .eq('id', insertedRow.id)

        return NextResponse.json(
          {
            ok: false,
            error: 'Something went wrong. Please try again in a moment.',
          },
          { status: 500 }
        )
      }

      await adminClient
        .from('resource_downloads')
        .update({ signed_link_issued_at: new Date().toISOString() })
        .eq('id', insertedRow.id)

      onScreenUrl = signedData.signedUrl
    }

    // 9. Emailed link: duplicate suppression & asynchronous delivery
    const duplicateWindowStart = new Date(
      Date.now() -
        RESOURCE_DOWNLOAD_LIMITS.EMAIL_DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString()

    const { count: dupCount, error: dupError } = await adminClient
      .from('resource_downloads')
      .select('*', { count: 'exact', head: true })
      .eq('resource_id', resource.id)
      .eq('email', downloadEmail)
      .neq('id', insertedRow.id)
      .gte('email_sent_at', duplicateWindowStart)

    const shouldSendEmail =
      !dupError && typeof dupCount === 'number' && dupCount === 0

    if (shouldSendEmail) {
      try {
        let emailTargetUrl: string | null = null

        if (isLinkDelivery) {
          // Link resources carry external_url directly (no signing)
          emailTargetUrl = resource.external_url
        } else {
          // File resources create 24h signed URL
          const { data: emailSignedData, error: emailSignedError } =
            await adminClient.storage
              .from('resource-files')
              .createSignedUrl(
                resource.file_path,
                RESOURCE_DOWNLOAD_LIMITS.EMAIL_SIGNED_URL_EXPIRY_SECONDS,
                {
                  download: resource.file_name,
                }
              )

          if (emailSignedError || !emailSignedData?.signedUrl) {
            console.error('[resources/download] email signed url generation error')
            await adminClient
              .from('resource_downloads')
              .update({ email_error: 'Failed to generate emailed download link' })
              .eq('id', insertedRow.id)
          } else {
            emailTargetUrl = emailSignedData.signedUrl
          }
        }

        if (emailTargetUrl) {
          const apiKey = process.env.RESEND_API_KEY
          const fromEmail = process.env.RESEND_FROM_EMAIL

          if (!apiKey || !fromEmail) {
            await adminClient
              .from('resource_downloads')
              .update({ email_error: 'Resend not configured on server' })
              .eq('id', insertedRow.id)
          } else {
            const emailContent = buildResourceEmail({
              title: resource.title,
              name: downloadName,
              url: emailTargetUrl,
              delivery: isLinkDelivery ? 'link' : 'file',
              kind: resource.kind,
            })

            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: fromEmail,
                to: [downloadEmail],
                subject: emailContent.subject,
                html: emailContent.html,
                text: emailContent.text,
              }),
              signal: AbortSignal.timeout(
                RESOURCE_DOWNLOAD_LIMITS.RESEND_TIMEOUT_MS
              ),
            })

            if (!resendRes.ok) {
              console.error(
                '[resources/download] resend non-OK status:',
                resendRes.status
              )
              await adminClient
                .from('resource_downloads')
                .update({ email_error: `Resend status ${resendRes.status}` })
                .eq('id', insertedRow.id)
            } else {
              await adminClient
                .from('resource_downloads')
                .update({ email_sent_at: new Date().toISOString() })
                .eq('id', insertedRow.id)
            }
          }
        }
      } catch (emailErr: unknown) {
        console.error('[resources/download] email send failed')
        const err = emailErr as { name?: string; message?: string } | null
        const safeMsg =
          err?.name === 'TimeoutError' || err?.name === 'AbortError'
            ? 'Email timed out'
            : 'Email delivery failed'
        await adminClient
          .from('resource_downloads')
          .update({ email_error: safeMsg })
          .eq('id', insertedRow.id)
      }
    }

    // 10. Respond with success JSON
    if (isLinkDelivery) {
      return NextResponse.json(
        {
          ok: true,
          delivery: 'link',
          url: onScreenUrl,
          ...(isMember
            ? {
                firstName: getFirstName(downloadName),
                email: downloadEmail,
              }
            : {}),
        },
        { status: 200 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        delivery: 'file',
        url: onScreenUrl,
        expiresInSeconds: 60,
        ...(isMember
          ? {
              firstName: getFirstName(downloadName),
              email: downloadEmail,
            }
          : {}),
      },
      { status: 200 }
    )
  } catch {
    console.error('[resources/download] unexpected server error')
    return NextResponse.json(
      {
        ok: false,
        error: 'Something went wrong. Please try again in a moment.',
      },
      { status: 500 }
    )
  }
}
