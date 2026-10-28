import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/siteUrl'
import PolicyDocument, { parseLegalMarkdown } from '@/components/public/PolicyDocument'

export const dynamic = 'force-static'

function loadCookiePolicyContent(): string {
  const filePath = path.join(process.cwd(), 'content', 'legal', 'cookie-policy.md')
  return fs.readFileSync(filePath, 'utf-8')
}

export async function generateMetadata(): Promise<Metadata> {
  const content = loadCookiePolicyContent()
  const { h1 } = parseLegalMarkdown(content)
  const title = h1 || 'Cookie Policy'
  const description =
    'What small pieces of information this website stores on your device, why, and how you can control them.'

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/cookie-policy`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/cookie-policy`,
      type: 'website',
    },
  }
}

export default function CookiePolicyPage() {
  const content = loadCookiePolicyContent()

  return (
    <div className="min-h-full bg-[#FDF8F1] text-[#232536] py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[720px] mx-auto">
        <PolicyDocument markdown={content} />
      </div>
    </div>
  )
}
