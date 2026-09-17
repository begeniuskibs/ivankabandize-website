import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import ScrollReveal from '@/components/public/ScrollReveal'

export const dynamic = 'force-dynamic'

export default async function WorkWithMePage() {
  const supabase = await createClient()

  // Fetch page content for workwithme / services from Supabase if present
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .or('slug.eq.workwithme,slug.eq.services')
    .maybeSingle()

  const headline = page?.hero_headline || 'Ambition is rarely the problem. Structure usually is.'
  const subheadline =
    page?.hero_subheadline ||
    "Let's untangle your organisation — properly. Every engagement runs in the same 3-phased process; Diagnose → Architect → Sequence. No jargon, no 90-slide decks, no system your team can't run without me."

  return (
    <div className="flex flex-col min-h-full bg-[#FDF8F1] text-[#232536] font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
      {/* ================= HERO SECTION (Work With Me) ================= */}
      <section className="py-16 md:py-24 border-b border-[#F5ECDE] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-6">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCEBE7] border border-[#EF5B45]/20 text-[#EF5B45] text-xs font-bold uppercase tracking-widest">
                  <Link href="/" className="hover:underline text-[#5A5D70]">Home</Link>
                  <span className="text-[#5A5D70]">/</span>
                  <span>Work With Me</span>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={80}>
                <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#232536] leading-[1.15]">
                  Ambition is rarely the problem. <span className="text-[#EF5B45]">Structure usually is.</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delayMs={140}>
                <p className="text-xl sm:text-2xl font-medium text-[#5A5D70] leading-relaxed">
                  {subheadline}
                </p>
              </ScrollReveal>

              <ScrollReveal delayMs={200}>
                <div className="pt-2">
                  <Link
                    href="/lets-talk"
                    className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Let&apos;s Talk</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
                <p className="text-sm font-medium text-[#5A5D70] mt-4 max-w-xl">
                  Engagements are scoped to your situation — pricing is discussed in the first conversation, never before we understand the problem.
                </p>
              </ScrollReveal>
            </div>

            {/* Right Image Column */}
            <div className="lg:col-span-5 flex justify-center">
              <ScrollReveal delayMs={150} className="w-full max-w-sm sm:max-w-md">
                <div className="relative mx-auto w-full pt-4 pb-6 px-4">
                  <div className="relative transform -rotate-2 hover:rotate-0 transition-transform duration-500 ease-out">
                    <Image
                      src="/images/auth-pool/11-nubelson-fernandes-person-reading.jpg"
                      alt="Reading and deep focus session"
                      width={420}
                      height={500}
                      priority
                      className="w-full aspect-[4/5] object-cover object-center rounded-3xl shadow-[0_18px_44px_rgba(35,37,54,0.13)] border-4 border-white"
                    />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PHASES: HOW AN ENGAGEMENT WORKS ================= */}
      <section className="py-20 md:py-28 bg-white border-b border-[#F5ECDE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight">
                How an Engagement <span className="text-[#2AA198]">Works</span>
              </h2>
              <p className="text-base sm:text-lg text-[#5A5D70] mt-4">
                Three phases. You can stop after any of them with something complete in hand.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Phase 1: Audit */}
            <ScrollReveal delayMs={50}>
              <div className="bg-[#FDF8F1] border border-[#F5ECDE] rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm mb-6">
                    🔍
                  </div>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-semibold text-[#232536] mb-1">
                    Audit
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#EF5B45] mb-4">
                    Phase 1 &middot; Diagnose
                  </p>
                  <ul className="space-y-3 text-base text-[#5A5D70] leading-relaxed list-disc list-inside">
                    <li>Structured discovery sessions with you and your team</li>
                    <li>A written diagnosis of what&rsquo;s actually broken (and what isn&rsquo;t)</li>
                    <li>A prioritised problem map you can act on immediately</li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>

            {/* Phase 2: Build */}
            <ScrollReveal delayMs={120}>
              <div className="bg-[#FDF8F1] border border-[#F5ECDE] rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm mb-6">
                    🛠️
                  </div>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-semibold text-[#232536] mb-1">
                    Build
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2AA198] mb-4">
                    Phase 2 &middot; Architect + Sequence
                  </p>
                  <ul className="space-y-3 text-base text-[#5A5D70] leading-relaxed list-disc list-inside">
                    <li>Systems, workflows, and tools designed for your context</li>
                    <li>An implementation sequence — what&rsquo;s first, what waits</li>
                    <li>Documentation your team can actually follow</li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>

            {/* Phase 3: Support */}
            <ScrollReveal delayMs={190}>
              <div className="bg-[#FDF8F1] border border-[#F5ECDE] rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-3xl shadow-sm mb-6">
                    🤝
                  </div>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl font-semibold text-[#232536] mb-1">
                    Support
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C99424] mb-4">
                    Phase 3 &middot; Embed
                  </p>
                  <ul className="space-y-3 text-base text-[#5A5D70] leading-relaxed list-disc list-inside">
                    <li>Training so the system lives with your team, not with me</li>
                    <li>Check-ins while the new structure beds in</li>
                    <li>Adjustments as reality pushes back (it always does)</li>
                  </ul>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================= FIT SECTION: IS THIS FOR YOU? ================= */}
      <section className="py-20 bg-white border-b border-[#F5ECDE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight">
                Is This <span className="text-[#EF5B45]">For You?</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Yes Box */}
            <ScrollReveal delayMs={60}>
              <div className="bg-[#EAF4F3] border border-[#2AA198]/20 rounded-3xl p-8 sm:p-10 shadow-[0_10px_30px_rgba(35,37,54,0.04)] h-full">
                <h3 className="font-bold text-xl sm:text-2xl text-[#232536] mb-6 flex items-center gap-2">
                  <span>✅</span>
                  <span>We’ll work well together if…</span>
                </h3>
                <ul className="space-y-4 text-base text-[#3A3D4E] leading-relaxed list-disc list-inside">
                  <li>You lead an SME, school, or nonprofit that’s outgrown gut instinct and heroics</li>
                  <li>You want to understand your systems, not just have them handed over</li>
                  <li>You see structure as freedom — the thing that lets your team execute</li>
                  <li>You’re willing to change how things work, not just how they look</li>
                </ul>
              </div>
            </ScrollReveal>

            {/* No Box */}
            <ScrollReveal delayMs={120}>
              <div className="bg-[#FCEBE7] border border-[#EF5B45]/20 rounded-3xl p-8 sm:p-10 shadow-[0_10px_30px_rgba(35,37,54,0.04)] h-full">
                <h3 className="font-bold text-xl sm:text-2xl text-[#232536] mb-6 flex items-center gap-2">
                  <span>❌</span>
                  <span>I’m probably not your person if…</span>
                </h3>
                <ul className="space-y-4 text-base text-[#3A3D4E] leading-relaxed list-disc list-inside">
                  <li>You want someone to &ldquo;just do it&rdquo; and hand off a black box</li>
                  <li>You’re after quick hacks rather than sustainable systems</li>
                  <li>You need accounting, legal, or licensed counselling services — I’ll gladly refer you</li>
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================= CLOSING CALL TO ACTION ================= */}
      <section className="py-20 md:py-28 bg-[#FDF8F1] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <ScrollReveal>
            <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] leading-tight">
              Ready when <span className="text-[#EF5B45]">you are.</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <p className="text-lg sm:text-xl text-[#5A5D70] leading-relaxed max-w-2xl mx-auto">
              A 30-minute conversation, no obligation. You’ll leave with a clearer picture of the problem — whether or not we work together.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={140}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/lets-talk"
                className="inline-flex items-center justify-center gap-2 font-bold text-base px-9 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Let&apos;s Talk</span>
                <span aria-hidden="true">&#128075;</span>
              </Link>
            </div>
            <p className="text-xs text-[#5A5D70] font-medium mt-4">
              First conversation is a diagnosis, not a pitch.
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
