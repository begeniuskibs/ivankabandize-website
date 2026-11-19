import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { SITE_URL } from '@/lib/siteUrl'
import { getPublishedResourceBySlug } from '@/lib/resources'
import { formatFileSize, kindLabel, splitParagraphs } from '@/lib/resourceUi'
import ResourceDownloadForm, {
  ResourceStickyBar,
} from '@/components/public/ResourceDownloadForm'

// Single resource landing & download gate page
// House style: spaced hyphen " - " only

export const dynamic = 'force-dynamic'

interface ResourcePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ResourcePageProps): Promise<Metadata> {
  const { slug } = await params
  const resource = await getPublishedResourceBySlug(slug)

  if (!resource) {
    return {
      title: 'Resource Not Found',
    }
  }

  const title = `${resource.title} - Resources`
  const description = resource.summary

  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/garden/resources/${resource.slug}`,
    },
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function ResourcePage({ params }: ResourcePageProps) {
  const { slug } = await params
  const resource = await getPublishedResourceBySlug(slug)

  if (!resource) {
    notFound()
  }

  const paragraphs = splitParagraphs(resource.description)
  const typeText = kindLabel(resource.kind)
  const sizeText = formatFileSize(resource.file_size_bytes)
  const hasFacts = Boolean(typeText || sizeText)

  return (
    <div className="flex flex-col min-h-screen bg-[#FDF8F1] font-sans selection:bg-[#E8DCC4] text-[#232536]">
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/garden/resources"
            className="group inline-flex items-center gap-1.5 text-sm font-semibold text-[#5C5F73] hover:text-[#232536] transition cursor-pointer"
          >
            <ArrowLeft
              size={16}
              strokeWidth={2.5}
              aria-hidden="true"
              className="transition-transform group-hover:-translate-x-1 motion-reduce:group-hover:translate-x-0"
            />
            <span>All resources</span>
          </Link>
        </div>

        {/* Header Block */}
        <header className="mb-8">
          <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full bg-[#EEEFF6] text-[#232536] mb-3">
            {typeText}
          </span>

          <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight mb-4 leading-[1.15]">
            {resource.title}
          </h1>

          <p className="text-lg sm:text-xl text-[#5C5F73] leading-relaxed max-w-2xl">
            {resource.summary}
          </p>

          {/* Primary Action Button (jumps to gate form) */}
          <div className="pt-6">
            <a
              href="#get"
              className="inline-flex items-center justify-center min-h-[48px] px-8 py-3.5 bg-[#CF3F29] hover:bg-[#b83420] text-white font-bold text-base rounded-md shadow-sm transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#CF3F29] focus:ring-offset-2"
            >
              Get the file
            </a>
          </div>
        </header>

        {/* Facts Row: only rendered if data exists */}
        {hasFacts && (
          <section
            aria-label="File information"
            className="flex flex-wrap items-center gap-8 py-4 my-6 border-y border-[#F0E4D2]"
          >
            {typeText ? (
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#5C5F73] block mb-0.5">
                  Format
                </span>
                <span className="text-sm font-semibold text-[#232536]">
                  {typeText}
                </span>
              </div>
            ) : null}

            {sizeText ? (
              <div>
                <span className="text-xs uppercase tracking-wider font-bold text-[#5C5F73] block mb-0.5">
                  File size
                </span>
                <span className="text-sm font-semibold text-[#232536]">
                  {sizeText}
                </span>
              </div>
            ) : null}
          </section>
        )}

        {/* Cover image: only if present */}
        {resource.cover_image_url && (
          <div className="relative w-full aspect-[16/9] max-w-2xl rounded-xl overflow-hidden border border-[#F0E4D2] mb-8 bg-white shadow-xs">
            <Image
              src={resource.cover_image_url}
              alt={resource.title}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
          </div>
        )}

        {/* Description: split paragraphs (plain text only) */}
        {paragraphs.length > 0 && (
          <section
            aria-label="Resource description"
            className="space-y-4 text-base sm:text-lg text-[#232536] leading-relaxed mb-12 max-w-2xl"
          >
            {paragraphs.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </section>
        )}

        {/* Form Section with anchor id "get" */}
        <section
          id="get"
          className="pt-10 border-t border-[#F0E4D2] mt-12 scroll-mt-6"
        >
          <ResourceDownloadForm slug={resource.slug} title={resource.title} />
        </section>
      </main>

      {/* Mobile-only sticky bottom bar */}
      <ResourceStickyBar title={resource.title} formTargetId="get" />
    </div>
  )
}
