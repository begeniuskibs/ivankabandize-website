import fs from 'node:fs'
import path from 'node:path'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/siteUrl'
import PolicyDocument, { parseLegalMarkdown } from '@/components/public/PolicyDocument'

export const dynamic = 'force-static'

function loadPrivacyPolicyContent(): string {
  const filePath = path.join(process.cwd(), 'content', 'legal', 'privacy-policy.md')
  return fs.readFileSync(filePath, 'utf-8')
}

export async function generateMetadata(): Promise<Metadata> {
  const content = loadPrivacyPolicyContent()
  const { h1 } = parseLegalMarkdown(content)
  const title = h1 || 'Privacy Policy'
  const description =
    'What personal data this website collects, why, who helps handle it, how long it is kept, and your rights.'

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/privacy-policy`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/privacy-policy`,
      type: 'website',
    },
  }
}

export default function PrivacyPolicyPage() {
  const content = loadPrivacyPolicyContent()

  return (
    <div className="min-h-full bg-[#FDF8F1] text-[#232536] py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[720px] mx-auto">
        <PolicyDocument markdown={content} />
      </div>
    </div>
  )
}
