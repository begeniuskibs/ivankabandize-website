import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, organisation, problem, help_type, timing } = body

    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.RESEND_FROM_EMAIL
    const toEmail = process.env.RESEND_TO_EMAIL

    if (!apiKey || !fromEmail || !toEmail) {
      console.warn('Resend configuration missing on server. Notification skipped.', {
        hasApiKey: !!apiKey,
        hasFrom: !!fromEmail,
        hasTo: !!toEmail,
      })
      return NextResponse.json({
        success: false,
        warning: 'Resend environment variables not fully configured on server',
      })
    }

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px;">
        <h2 style="margin-top: 0; margin-bottom: 16px; font-size: 20px; font-weight: 700; color: #111827; border-bottom: 1px solid #f3f4f6; padding-bottom: 12px;">
          New "Let's Talk" Inquiry
        </h2>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 140px; font-weight: 600;">Name</td>
            <td style="padding: 8px 0; font-size: 14px; color: #111827; font-weight: 500;">${name || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Email</td>
            <td style="padding: 8px 0; font-size: 14px; color: #111827;"><a href="mailto:${email}" style="color: #2563eb; text-decoration: none;">${email || 'N/A'}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Organisation</td>
            <td style="padding: 8px 0; font-size: 14px; color: #111827;">${organisation || 'None provided'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Type of Help</td>
            <td style="padding: 8px 0; font-size: 14px; color: #111827;">${help_type || 'Unspecified'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-size: 14px; color: #6b7280; font-weight: 600;">Timing</td>
            <td style="padding: 8px 0; font-size: 14px; color: #111827;">${timing || 'Flexible'}</td>
          </tr>
        </table>

        <div style="margin-top: 16px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #f3f4f6;">
          <div style="font-size: 13px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
            Problem Description
          </div>
          <div style="font-size: 14px; line-height: 1.6; color: #1f2937; white-space: pre-wrap;">
            ${problem || 'No description provided'}
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
        subject: `New inquiry from ${name}`,
        html: emailHtml,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      console.error('Resend API returned error:', resendData)
      return NextResponse.json({
        success: false,
        error: resendData,
      })
    }

    return NextResponse.json({
      success: true,
      data: resendData,
    })
  } catch (err: any) {
    console.error('Inquiry notification error:', err)
    return NextResponse.json({
      success: false,
      error: err.message,
    })
  }
}
