// Pure email template builder for Resources downloads
// House style: spaced hyphen " - " only

import { escapeHtml, sanitizeDownloadSubject } from './resourceDownload.ts'

export interface BuildResourceEmailInput {
  title: string
  name?: string | null
  url: string
  delivery: 'file' | 'link'
  kind?: string | null
}

export interface BuiltResourceEmail {
  subject: string
  html: string
  text: string
}

function sanitizeSubject(prefix: string, title: string): string {
  const cleaned = (title || '').replace(/[\x00-\x1F\x7F]/g, ' ')
  const collapsed = cleaned.replace(/\s+/g, ' ').trim()
  const subject = `${prefix} - ${collapsed}`
  return subject.slice(0, 100)
}

export function buildResourceEmail({
  title,
  name,
  url,
  delivery,
  kind,
}: BuildResourceEmailInput): BuiltResourceEmail {
  if (!url || typeof url !== 'string' || !url.trim().startsWith('https://')) {
    throw new Error('Resource URL must start with https://')
  }

  const trimmedUrl = url.trim()
  const escapedUrl = escapeHtml(trimmedUrl)
  const escapedTitle = escapeHtml(title || '')
  const rawTitle = (title || '').replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim()

  const trimmedName = typeof name === 'string' ? name.trim() : ''
  const greetingHtml = trimmedName ? `Hi ${escapeHtml(trimmedName)},` : 'Hello,'
  const greetingText = trimmedName ? `Hi ${trimmedName},` : 'Hello,'

  const footerHtml = `
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0 16px;" />
    <p style="font-size: 13px; color: #6b7280; margin: 0;">You asked for this file at ivankabandize.com. Questions: <a href="mailto:privacy@ivankabandize.com" style="color: #6b7280;">privacy@ivankabandize.com</a>.</p>
  `
  const footerText = 'You asked for this file at ivankabandize.com. Questions: privacy@ivankabandize.com.'

  if (delivery === 'link') {
    const isTemplate = (kind || '').trim().toLowerCase() === 'template'
    const prefix = isTemplate ? 'Your template' : 'Your link'
    const subject = sanitizeSubject(prefix, title)

    const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.6;">
    <p style="margin-top: 0; font-size: 16px;">${greetingHtml}</p>
    <p style="font-size: 16px;">Here is your copy of <strong>${escapedTitle}</strong>:</p>
    <p style="margin: 24px 0;">
      <a href="${escapedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Open ${escapedTitle}</a>
    </p>
    <p style="font-size: 14px; color: #4b5563;">Save this email. The link does not expire.</p>${footerHtml}
  </div>
`

    const text = `${greetingText}\n\nHere is your copy of ${rawTitle}:\n\n${trimmedUrl}\n\nSave this email. The link does not expire.\n\n${footerText}`

    return { subject, html, text }
  }

  // FILE variant (matches existing route wording and structure)
  const subject = sanitizeDownloadSubject(title)

  const html = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1a1a; line-height: 1.6;">
    <p style="margin-top: 0; font-size: 16px;">${greetingHtml}</p>
    <p style="font-size: 16px;">Here is your copy of <strong>${escapedTitle}</strong>:</p>
    <p style="margin: 24px 0;">
      <a href="${escapedUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600;">Download ${escapedTitle}</a>
    </p>
    <p style="font-size: 14px; color: #4b5563;">This link works for 24 hours.</p>${footerHtml}
  </div>
`

  const text = `${greetingText}\n\nHere is your copy of ${rawTitle}:\n\n${trimmedUrl}\n\nThis link works for 24 hours.\n\n${footerText}`

  return { subject, html, text }
}
