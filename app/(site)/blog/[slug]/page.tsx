import { redirect } from 'next/navigation'

interface BlogPostRedirectProps {
  params: Promise<{ slug: string }>
}

export default async function BlogPostRedirectPage({ params }: BlogPostRedirectProps) {
  const { slug } = await params
  redirect(`/garden/${slug}`)
}
