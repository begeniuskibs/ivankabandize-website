export const HELP_OPTIONS = [
  'Operations & systems',
  'Training my team',
  'Strategy & planning',
  'Make sense of AI',
  'Not sure yet',
] as const

export type HelpOption = (typeof HELP_OPTIONS)[number]

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export interface RecommendedRead {
  title: string
  slug: string
  hook?: string
}

export const RECOMMENDED_READS_BY_HELP_TYPE: Record<string, RecommendedRead[]> = {
  'Operations & systems': [
    { title: 'Systems Over Goals', slug: 'systems-over-goals' },
    { title: 'Focusing on the Big Rocks', slug: 'focusing-on-the-big-rocks' },
    { title: 'Measure What Matters', slug: 'measure-what-matters' },
  ],
  'Training my team': [
    {
      title: 'The Team Performance Curve',
      slug: 'the-team-performance-curve-a-roadmap-for-team-leaders',
    },
    {
      title: 'The Double-Edged Sword of Empathetic Leadership',
      slug: 'the-double-edged-sword-of-empathetic-leadership',
    },
    { title: 'Authentic Leadership', slug: 'authentic-leadership' },
  ],
  'Strategy & planning': [
    {
      title: 'The Effective Annual Planning Framework',
      slug: 'the-effective-annual-planning-framework',
    },
    { title: 'Play the Long Game', slug: 'play-the-long-game' },
    { title: 'How I Plan My Week', slug: 'how-i-plan-my-week' },
  ],
  'Make sense of AI': [
    { title: 'The AI You Already Use', slug: 'the-ai-you-already-use' },
    {
      title: 'The Research That Changed Everything',
      slug: 'the-research-that-changed-everything',
    },
    {
      title: 'Tools That Have Triggered My Growth and Productivity',
      slug: 'tools-that-have-triggered-my-growth-and-productivity',
    },
  ],
  default: [
    { title: 'Welcome to My Space', slug: 'welcome-to-my-space' },
    { title: 'Systems Over Goals', slug: 'systems-over-goals' },
    { title: 'The AI You Already Use', slug: 'the-ai-you-already-use' },
  ],
}

/**
 * Cleans user-provided name to extract a safe first name:
 * - First whitespace-separated word
 * - Unicode letters with optional internal apostrophe or hyphen
 * - Length between 2 and 30 characters
 * - No digits, symbols, URLs, or HTML
 * - Title-cased if input was all-uppercase or all-lowercase
 * - Returns null on any invalid/suspicious input
 */
export function cleanFirstName(rawName: unknown): string | null {
  if (typeof rawName !== 'string') return null
  const trimmed = rawName.trim()
  if (!trimmed) return null

  // Take first whitespace-separated token
  const firstWord = trimmed.split(/\s+/)[0]
  if (firstWord.length < 2 || firstWord.length > 30) return null

  // Unicode letters only, allowing hyphen or apostrophe inside (not leading/trailing)
  const namePattern = /^\p{L}+(?:['\-]\p{L}+)*$/u
  if (!namePattern.test(firstWord)) return null

  // Check for URL-like fragments
  const lower = firstWord.toLowerCase()
  if (
    lower.includes('http') ||
    lower.includes('www') ||
    lower.includes('.com') ||
    lower.includes('.org') ||
    lower.includes('.net')
  ) {
    return null
  }

  // Proper title casing if all uppercase or all lowercase
  const isAllUpper = firstWord === firstWord.toUpperCase()
  const isAllLower = firstWord === firstWord.toLowerCase()

  if (isAllUpper || isAllLower) {
    // Capitalize letters following start or hyphen/apostrophe
    return firstWord
      .toLowerCase()
      .replace(/(?:^|['\-])\p{L}/gu, (match) => match.toUpperCase())
  }

  return firstWord
}

export function buildConfirmationEmailContent({
  name,
  helpType,
  siteUrl = 'https://ivankabandize.com',
}: {
  name: string
  helpType?: string | null
  siteUrl?: string
}) {
  const firstName = cleanFirstName(name)
  const isSpecificHelp =
    helpType &&
    helpType !== 'Not sure yet' &&
    HELP_OPTIONS.includes(helpType as HelpOption)

  const subject = firstName
    ? `Got it, ${firstName} - your enquiry just landed`
    : `Got it - your enquiry just landed`

  const greeting = firstName ? `Hi ${firstName},` : `Hi there,`

  const reads =
    (helpType && RECOMMENDED_READS_BY_HELP_TYPE[helpType]) ||
    RECOMMENDED_READS_BY_HELP_TYPE.default

  const normalizedSiteUrl = siteUrl.replace(/\/+$/, '')

  const readsIntroText = isSpecificHelp
    ? `While the kettle boils, three reads picked for "${helpType}":`
    : `While the kettle boils, three reads to start with:`

  const readsListText = reads
    .map((r, i) => {
      const hookPart = r.hook ? ` - ${r.hook}` : ''
      return `${i + 1}. ${r.title}${hookPart}\n   ${normalizedSiteUrl}/garden/${r.slug}`
    })
    .join('\n\n')

  const textContent = `${greeting}

Consider this the digital handshake: your enquiry just landed safely in my inbox, and I'm already curious about what's not working.

A quick honesty note - this message is an automatic confirmation. The real reply, from me (a human with opinions), follows within two business days, with a couple of times for a 30-minute call.

${readsIntroText}

${readsListText}

What happens next:
1. I read your enquiry - every word.
2. I reply with times that suit a conversation.
3. We dig into what's not working. Come as you are; no slides required.

Something to add before then? Just reply to this email and it lands straight with me.

Talk soon,
Ivan Kabandize
ivankabandize.com

P.S. If one of those reads makes you want to argue back - good. That's the conversation I'm hoping for.`

  const escapedGreeting = escapeHtml(greeting)
  const escapedReadsIntro = escapeHtml(readsIntroText)
  const readsListHtml = reads
    .map((r, i) => {
      const safeTitle = escapeHtml(r.title)
      const safeHook = r.hook ? ` - ${escapeHtml(r.hook)}` : ''
      const url = `${normalizedSiteUrl}/garden/${r.slug}`
      return `<li style="margin-bottom: 12px; line-height: 1.5;"><a href="${url}" style="color: #EF5B45; font-weight: 600; text-decoration: none;">${safeTitle}</a>${safeHook}</li>`
    })
    .join('')

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #232536; background-color: #ffffff; border: 1px solid #eaeaea; border-radius: 12px; line-height: 1.6;">
      <p style="font-size: 16px; font-weight: 600; margin-top: 0;">${escapedGreeting}</p>
      
      <p style="font-size: 15px; color: #232536;">
        Consider this the digital handshake: your enquiry just landed safely in my inbox, and I&rsquo;m already curious about what&rsquo;s not working.
      </p>
      
      <p style="font-size: 14px; color: #5A5D70; background-color: #FDF8F1; padding: 14px 16px; border-radius: 8px; border: 1px solid #F5ECDE;">
        A quick honesty note &ndash; this message is an automatic confirmation. The real reply, from me (a human with opinions), follows within two business days, with a couple of times for a 30-minute call.
      </p>
      
      <div style="margin: 24px 0;">
        <p style="font-size: 14px; font-weight: 700; color: #232536; margin-bottom: 12px;">${escapedReadsIntro}</p>
        <ol style="padding-left: 20px; margin: 0; font-size: 14px; color: #232536;">
          ${readsListHtml}
        </ol>
      </div>

      <div style="margin: 24px 0; padding-top: 16px; border-top: 1px solid #f3f4f6;">
        <p style="font-size: 14px; font-weight: 700; color: #232536; margin-bottom: 8px;">What happens next:</p>
        <ol style="padding-left: 20px; margin: 0; font-size: 14px; color: #5A5D70; line-height: 1.6;">
          <li>I read your enquiry &ndash; every word.</li>
          <li>I reply with times that suit a conversation.</li>
          <li>We dig into what&rsquo;s not working. Come as you are; no slides required.</li>
        </ol>
      </div>

      <p style="font-size: 14px; color: #5A5D70;">
        Something to add before then? Just reply to this email and it lands straight with me.
      </p>

      <p style="font-size: 14px; color: #232536; margin-bottom: 4px;">
        Talk soon,<br />
        <strong>Ivan Kabandize</strong><br />
        <a href="${normalizedSiteUrl}" style="color: #5A5D70; text-decoration: none; font-size: 13px;">ivankabandize.com</a>
      </p>

      <p style="font-size: 12px; color: #82869C; font-style: italic; margin-top: 24px; padding-top: 16px; border-top: 1px solid #f3f4f6;">
        P.S. If one of those reads makes you want to argue back &ndash; good. That&rsquo;s the conversation I&rsquo;m hoping for.
      </p>
    </div>
  `

  return {
    subject,
    textContent,
    htmlContent,
  }
}

export async function sendConfirmationEmail({
  toEmail,
  name,
  helpType,
}: {
  toEmail: string
  name: string
  helpType?: string | null
}): Promise<{ sent: boolean; error: string | null }> {
  if (process.env.CONFIRMATION_EMAIL_ENABLED !== 'true') {
    return { sent: false, error: null }
  }

  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !fromEmail) {
    return {
      sent: false,
      error: 'Resend environment variables not fully configured on server',
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ivankabandize.com'
  const replyTo = process.env.CONFIRMATION_REPLY_TO

  const { subject, textContent, htmlContent } = buildConfirmationEmailContent({
    name,
    helpType,
    siteUrl,
  })

  try {
    const payload: Record<string, unknown> = {
      from: fromEmail,
      to: [toEmail],
      subject,
      text: textContent,
      html: htmlContent,
    }

    if (replyTo && replyTo.trim()) {
      payload.reply_to = replyTo.trim()
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    })

    const resendData = await resendRes.json().catch(() => ({}))

    if (!resendRes.ok) {
      console.error('[confirmation-email] resend non-OK status:', resendRes.status)
      const errorMsg =
        typeof resendData?.message === 'string'
          ? resendData.message
          : `Resend returned status ${resendRes.status}`
      return { sent: false, error: errorMsg.slice(0, 300) }
    }

    return { sent: true, error: null }
  } catch (err: any) {
    console.error('[confirmation-email] error:', err?.message || err)
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return { sent: false, error: 'Confirmation email timed out' }
    }
    const errorMsg = err?.message || 'Confirmation email delivery failed'
    return { sent: false, error: errorMsg.slice(0, 300) }
  }
}
