import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const supabase = await createClient()

  // Fetch page content for services
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'services')
    .maybeSingle()

  const headline = page?.hero_headline || 'Advisory, Architecture & Engineering Services'
  const subheadline = page?.hero_subheadline || 'Helping forward-thinking teams build scalable software platforms, automated workflows, and robust cloud systems.'
  const ctaText = page?.cta_text || 'Get in Touch'
  const ctaUrl = page?.cta_url || '/about'

  const testimonials: Array<{ quote: string; author: string; role?: string }> = Array.isArray(page?.testimonials)
    ? (page.testimonials as Array<any>)
    : [
        {
          quote: "Working with Ivan transformed our platform architecture and unlocked rapid feature shipping.",
          author: "Startup Founder",
          role: "Seed Stage Venture"
        }
      ]

  return (
    <div className="flex flex-col min-h-full font-sans">
      {/* Hero Section */}
      <section className="py-20 md:py-24 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-500 mb-3">
            Services & Consulting
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 leading-[1.2] mb-6">
            {headline}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl leading-relaxed mb-8">
            {subheadline}
          </p>
          <Link
            href={ctaUrl}
            className="inline-block px-6 py-3 rounded-full bg-black text-white font-medium hover:bg-gray-800 transition text-sm"
          >
            {ctaText}
          </Link>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-gray-50/60 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-10">
            Core Offerings
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Technical Architecture & Strategy</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Designing end-to-end architectures, database schemas, and microservice infrastructure designed for reliability, performance, and scale.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">01 / Architecture</span>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Full-Stack Development & Delivery</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Rapid execution of modern web applications, APIs, authentication systems, and cloud integrations with production-grade rigor.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">02 / Engineering</span>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Systems & Workflow Automation</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Streamlining complex business logic, backend pipelines, and internal tools to supercharge team operational leverage.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">03 / Automation</span>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Technical Advisory & Code Audits</h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Deep-dive code reviews, performance bottleneck analysis, security posture evaluations, and technical mentoring.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">04 / Advisory</span>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-8 text-center">
              Client Feedback
            </h2>
            <div className="grid gap-6 md:grid-cols-1">
              {testimonials.map((t, idx) => (
                <div key={idx} className="bg-gray-50 p-8 rounded-2xl border border-gray-100">
                  <p className="text-gray-700 italic text-lg leading-relaxed mb-4">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.author}</p>
                    {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
