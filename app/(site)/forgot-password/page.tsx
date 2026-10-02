import { headers } from 'next/headers'
import ForgotPasswordClient from './ForgotPasswordClient'

export const dynamic = 'force-dynamic'

export default async function ForgotPasswordPage() {
  const headerList = await headers()
  const origin = headerList.get('origin')
  const forwardedHost = headerList.get('x-forwarded-host')
  const host = forwardedHost || headerList.get('host')
  const proto = headerList.get('x-forwarded-proto') || 'https'
  const requestOrigin = origin || (host ? `${proto}://${host}` : null)

  const siteUrl =
    requestOrigin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://ivankabandize.com'

  return <ForgotPasswordClient siteUrl={siteUrl} />
}
