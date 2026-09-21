import { NextResponse } from 'next/server'
import {
  validateInquiryPayload,
  escapeHtml,
  formatMessageForEmail,
  sanitizeSubjectHeader,
  INQUIRY_RATE_LIMITS,
} from '@/lib/inquiries'
import { createAdminClient } from '@/utils/supabase/admin'
import { sendConfirmationEmail } from '@/lib/confirmation-email'

export async function POST(request: Request) {
  try {
    // 1. Size guard: Content-Length header & raw body limit (max 20,000 chars)
    const contentLength = request.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > INQUIRY_RATE_LIMITS.MAX_REQUEST_BODY_CHARS) {
      return NextResponse.json(
        { ok: false, error: 'That message is too large.' },
        { status: 413 }
      )
    }

    const rawBody = await request.text()
    if (rawBody.length > INQUIRY_RATE_LIMITS.MAX_REQUEST_BODY_CHARS) {
      return NextResponse.json(
        { ok: false, error: 'That message is too large.' },
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

    const validation = validateInquiryPayload(body)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          ok: false,
          error: validation.error || 'Invalid inquiry data.',
        },
        { status: 400 }
      )
    }

    const { name, email, organisation, problem, help_type, timing, isSpam } =
      validation.data!

    // If honeypot caught spam, log with NO personal data and return benign 200
    if (isSpam) {
      console.log('[inquiries] honeypot triggered')
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const adminClient = createAdminClient()

    // 2. Abuse limits: check email (3 in 60 min) and global (20 in 60 sec)
    try {
      const escapedEmail = email.replace(/[%_\\]/g, '\\$&')
      const emailWindowStart = new Date(
        Date.now() - INQUIRY_RATE_LIMITS.EMAIL_LIMIT_WINDOW_MINUTES * 60 * 1000
      ).toISOString()

      const globalWindowStart = new Date(
        Date.now() - INQUIRY_RATE_LIMITS.GLOBAL_LIMIT_WINDOW_SECONDS * 1000
      ).toISOString()

      const [emailCheck, globalCheck] = await Promise.all([
        adminClient
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .ilike('email', escapedEmail)
          .gte('created_at', emailWindowStart),
        adminClient
          .from('inquiries')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', globalWindowStart),
      ])

      if (emailCheck.error) {
        console.error('[inquiries] email rate check error:', emailCheck.error.message)
      } else if (
        typeof emailCheck.count === 'number' &&
        emailCheck.count >= INQUIRY_RATE_LIMITS.EMAIL_LIMIT_MAX
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Too many enquiries just now. Please try again in a little while.',
          },
          { status: 429 }
        )
      }

      if (globalCheck.error) {
        console.error('[inquiries] global rate check error:', globalCheck.error.message)
      } else if (
        typeof globalCheck.count === 'number' &&
        globalCheck.count >= INQUIRY_RATE_LIMITS.GLOBAL_LIMIT_MAX
      ) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Too many enquiries just now. Please try again in a little while.',
          },
          { status: 429 }
        )
      }
    } catch (rateErr: any) {
      console.error('[inquiries] rate check error:', rateErr?.message || rateErr)
    }

    // 3. Insert row using server-only privileged client
    const { data: insertedRow, error: insertError } = await adminClient
      .from('inquiries')
      .insert({
        name,
        email,
        organisation,
        problem,
        help_type,
        timing,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[inquiries] insert error:', insertError.message)
      return NextResponse.json(
        {
          ok: false,
          error: 'Something went wrong. Please try again in a moment.',
        },
        { status: 500 }
      )
    }

    // Row successfully saved. Now attempt Ivan's email notification.
    let notified = false
    let notifyError: string | null = null

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL
    const toEmail = process.env.RESEND_TO_EMAIL

    if (!apiKey || !fromEmail || !toEmail) {
      notifyError = 'Resend environment variables not fully configured on server'
    } else {
      try {
        // HTML-escape every user-supplied field before embedding into the email HTML
        const escapedName = escapeHtml(name)
        const escapedEmail = escapeHtml(email)
        const escapedOrganisation = organisation ? escapeHtml(organisation) : 'None provided'
        const escapedHelpType = help_type ? escapeHtml(help_type) : 'Unspecified'
        const escapedTiming = timing ? escapeHtml(timing) : 'Flexible'
        const formattedProblem = formatMessageForEmail(problem)

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px;">
            <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; color: #111827; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px;">
              New "Let's Talk" Inquiry
            </h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 140px; font-weight: 600;">Name</td>
                <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${escapedName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Email</td>
                <td style="padding: 8px 0; font-size: 14px; color: #111827;"><a href="mailto:${escapedEmail}" style="color: #2563eb; text-decoration: none;">${escapedEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Organisation</td>
                <td style="padding: 8px 0; font-size: 14px; color: #111827;">${escapedOrganisation}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Type of Help</td>
                <td style="padding: 8px 0; font-size: 14px; color: #111827;">${escapedHelpType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Timing</td>
                <td style="padding: 8px 0; font-size: 14px; color: #111827;">${escapedTiming}</td>
              </tr>
            </table>

            <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6;">
              <div style="font-size: 13px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
                Problem Description
              </div>
              <div style="font-size: 14px; line-height: 1.6; color: #1f2937;">
                ${formattedProblem}
              </div>
            </div>

            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center;">
              Sent from ivankabandize.com &bull; ${new Date().toUTCString()}
            </div>
          </div>
        `

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [toEmail],
            reply_to: email,
            subject: sanitizeSubjectHeader(name),
            html: emailHtml,
          }),
          signal: AbortSignal.timeout(INQUIRY_RATE_LIMITS.RESEND_TIMEOUT_MS),
        })

        const resendData = await resendRes.json().catch(() => ({}))

        if (!resendRes.ok) {
          console.error('[inquiries] resend non-OK status:', resendRes.status)
          const errorMsg =
            typeof resendData?.message === 'string'
              ? resendData.message
              : `Resend returned status ${resendRes.status}`
          notifyError = errorMsg.slice(0, 300)
        } else {
          notified = true
        }
      } catch (err: any) {
        console.error('[inquiries] resend error:', err?.message || err)
        if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
          notifyError = 'Email timed out'
        } else {
          const errorMsg = err?.message || 'Email delivery failed'
          notifyError = errorMsg.slice(0, 300)
        }
      }
    }

    // Update row with notification status
    if (insertedRow?.id) {
      if (notified) {
        await adminClient
          .from('inquiries')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', insertedRow.id)
      } else if (notifyError) {
        await adminClient
          .from('inquiries')
          .update({ notify_error: notifyError })
          .eq('id', insertedRow.id)
      }

      // Attempt visitor confirmation email (only active if CONFIRMATION_EMAIL_ENABLED === 'true')
      const confirmationResult = await sendConfirmationEmail({
        toEmail: email,
        name,
        helpType: help_type,
      })

      if (confirmationResult.sent) {
        await adminClient
          .from('inquiries')
          .update({ confirmation_sent_at: new Date().toISOString() })
          .eq('id', insertedRow.id)
      } else if (confirmationResult.error) {
        await adminClient
          .from('inquiries')
          .update({ confirmation_error: confirmationResult.error })
          .eq('id', insertedRow.id)
      }
    }

    return NextResponse.json({ ok: true, notified }, { status: 200 })
  } catch (err: any) {
    console.error('[inquiries] error:', err?.message || err)
    return NextResponse.json(
      {
        ok: false,
        error: 'Something went wrong. Please try again in a moment.',
      },
      { status: 500 }
    )
  }
}
