import { NextResponse } from 'next/server'
import {
  RESOURCE_DOWNLOAD_LIMITS,
  escapeHtml,
  isSameOrigin,
  sanitizeDownloadSubject,
  validateResourceDownloadPayload,
} from '@/lib/resourceDownload'
import { computeRequestFingerprint } from '@/lib/resourceFingerprint'
import {
  RESOURCE_CONSENT_TEXT,
  RESOURCE_CONSENT_VERSION,
} from '@/lib/resourceConsent'
import { createAdminClient } from '@/utils/supabase/admin'
import { checkRateLimit, getClientIp } from '@/lib/rateLimit'
import { cleanFirstName } from '@/lib/confirmation-email'
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

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON payload.' },
        { status: 400 }
      )
    }

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
      .select('id, title, file_path, file_name, visibility')
      .eq('slug', validation.data.slug)
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

    // 6. Database limits: per email (3 / 60m), per fingerprint (10 / 60m), global (20 / 60s)
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
        .eq('email', validation.data.email)
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
    const { data: insertedRow, error: insertError } = await adminClient
      .from('resource_downloads')
      .insert({
        resource_id: resource.id,
        name: validation.data.name,
        email: validation.data.email,
        consent_wording_version: RESOURCE_CONSENT_VERSION,
        consent_text: RESOURCE_CONSENT_TEXT,
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

    // 8. On-screen link: createSignedUrl (60 seconds)
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

    const onScreenUrl = signedData.signedUrl

    // 9. Emailed link: duplicate suppression & asynchronous delivery
    const duplicateWindowStart = new Date(
      Date.now() -
        RESOURCE_DOWNLOAD_LIMITS.EMAIL_DUPLICATE_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString()

    const { count: dupCount, error: dupError } = await adminClient
      .from('resource_downloads')
      .select('*', { count: 'exact', head: true })
      .eq('resource_id', resource.id)
      .eq('email', validation.data.email)
      .neq('id', insertedRow.id)
      .gte('email_sent_at', duplicateWindowStart)

    const shouldSendEmail =
      !dupError && typeof dupCount === 'number' && dupCount === 0

    if (shouldSendEmail) {
      try {
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
          const apiKey = process.env.RESEND_API_KEY
          const fromEmail = process.env.RESEND_FROM_EMAIL

          if (!apiKey || !fromEmail) {
            await adminClient
              .from('resource_downloads')
              .update({ email_error: 'Resend not configured on server' })
              .eq('id', insertedRow.id)
          } else {
            const emailSignedUrl = emailSignedData.signedUrl
            const cleanedFirst = cleanFirstName(validation.data.name)
            const greeting = cleanedFirst
              ? `Hi ${escapeHtml(cleanedFirst)},`
              : 'Hello,'
            const escapedTitle = escapeHtml(resource.title)
            const escapedUrl = escapeHtml(emailSignedUrl)

            const emailHtml = `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.6;">
                <p style="margin-top: 0; font-size: 16px;">${greeting}</p>
                <p style="font-size: 16px;">Here is your copy of <strong>${escapedTitle}</strong>:</p>
                <p style="margin: 24px 0;">
                  <a href="${escapedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Download ${escapedTitle}</a>
                </p>
                <p style="font-size: 14px; color: #4b5563;">This link works for 24 hours.</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
                <p style="font-size: 13px; color: #6b7280; margin: 0;">You asked for this file at ivankabandize.com. Questions: <a href="mailto:privacy@ivankabandize.com" style="color: #6b7280;">privacy@ivankabandize.com</a>.</p>
              </div>
            `

            const emailText = `${cleanedFirst ? `Hi ${cleanedFirst},` : 'Hello,'}\n\nHere is your copy of ${resource.title}:\n\n${emailSignedUrl}\n\nThis link works for 24 hours.\n\nYou asked for this file at ivankabandize.com. Questions: privacy@ivankabandize.com.`

            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: fromEmail,
                to: [validation.data.email],
                subject: sanitizeDownloadSubject(resource.title),
                html: emailHtml,
                text: emailText,
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

    // 10. Respond 200 { ok: true, url, expiresInSeconds: 60 } and nothing else
    return NextResponse.json(
      {
        ok: true,
        url: onScreenUrl,
        expiresInSeconds: 60,
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
