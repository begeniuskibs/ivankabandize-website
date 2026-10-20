/**
 * Site URL helper: one constant using NEXT_PUBLIC_SITE_URL with fallback to
 * https://ivankabandize.com, without a trailing slash.
 */
export const SITE_URL: string = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://ivankabandize.com'
).replace(/\/+$/, '')
