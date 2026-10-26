import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/siteUrl'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/preview',
        '/api',
        '/auth',
        '/login',
        '/signup',
        '/forgot-password',
        '/me',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
