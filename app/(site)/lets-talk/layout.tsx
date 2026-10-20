import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Let's Talk",
  description:
    'Get in touch with Ivan Kabandize regarding advisory work, operational challenges or speaking engagements.',
}

export default function LetsTalkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
