import { NextResponse } from 'next/server'
import {
  validateInquiryPayload,
  escapeHtml,
  formatMessageForEmail,
  sanitizeSubjectHeader,
} from '@/lib/inquiries'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
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

    // Insert row using server-only privileged client
    const adminClient = createAdminClient()
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

    // Row successfully saved. Now attempt email notification.
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
            subject: sanitizeSubjectHeader(name),
            html: emailHtml,
          }),
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
        const errorMsg = err?.message || 'Email delivery failed'
        notifyError = errorMsg.slice(0, 300)
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
