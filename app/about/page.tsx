import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const supabase = await createClient()

  // Fetch page content for about
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'about')
    .maybeSingle()

  const headline = page?.hero_headline || 'About Ivan Kabandize'
  const subheadline = page?.hero_subheadline || 'Software engineer, systems architect, and writer passionate about high-leverage digital tools, robust backend systems, and thoughtful engineering.'
  const ctaText = page?.cta_text || 'View Articles'
  const ctaUrl = page?.cta_url || '/blog'

  return (
    <div className="flex flex-col min-h-full font-sans">
      {/* Hero Section */}
      <section className="py-20 md:py-24 bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-3">
            Background & Mission
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-[1.2] mb-6">
            {headline}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8">
            {subheadline}
          </p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 prose prose-lg text-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight mb-4">Focus & Principles</h2>
          <p className="leading-relaxed mb-6">
            I specialize in crafting dependable, performant web platforms and scalable cloud architectures.
            My philosophy centers on simplicity, strict domain boundaries, and building resilient systems that
            compound value over time.
          </p>
          <p className="leading-relaxed mb-8">
            Beyond engineering, I regularly document practical insights into technology trends, developer productivity,
            and software craftsmanship.
          </p>

          <div className="border-t border-gray-100 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 not-prose">
            <span className="text-sm text-gray-500">Interested in reading more?</span>
            <Link
              href={ctaUrl}
              className="px-6 py-2.5 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition text-sm"
            >
              {ctaText}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
