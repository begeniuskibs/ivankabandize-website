import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import ScrollReveal from '@/components/public/ScrollReveal'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const supabase = await createClient()

  // Fetch page content for about from Supabase pages table
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'about')
    .maybeSingle()

  const headline = page?.hero_headline || 'Hey, I’m Ivan Kabandize'
  const subheadline =
    page?.hero_subheadline ||
    'I help founders and leaders turn operational chaos into structure that works.'
  const ctaText = page?.cta_text || 'Work with me'
  const ctaUrl = page?.cta_url || '/lets-talk'
  const testimonials = Array.isArray(page?.testimonials) ? page.testimonials : []

  return (
    <div className="flex flex-col min-h-full bg-[#FDF8F1] text-[#232536] font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
      {/* ================= HERO SECTION ================= */}
      <section className="py-16 md:py-24 border-b border-[#F5ECDE] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-6">
              <ScrollReveal>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCEBE7] border border-[#EF5B45]/20 text-[#EF5B45] text-xs font-bold uppercase tracking-widest">
                  <span>Background &amp; Story</span>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={80}>
                <h1 className="font-['Fraunces',_Georgia,_serif] text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#232536] leading-[1.12]">
                  {headline.includes('Ivan Kabandize') ? (
                    <>
                      {headline.replace('Ivan Kabandize', '')}
                      <span className="italic text-[#EF5B45]">Ivan Kabandize</span>
                    </>
                  ) : (
                    headline
                  )}
                </h1>
              </ScrollReveal>

              <ScrollReveal delayMs={140}>
                <p className="text-xl sm:text-2xl font-medium text-[#5A5D70] leading-relaxed">
                  {subheadline}
                </p>
              </ScrollReveal>

              <ScrollReveal delayMs={200}>
                <div className="space-y-4 text-base sm:text-lg text-[#5A5D70] leading-relaxed pt-2">
                  <p>
                    I’ve spent my career inside organisations — building training programmes, designing
                    operational systems, and helping teams turn good intentions into working structure.
                    These days I’m <strong className="font-semibold text-[#232536]">Training Lead at Watoto Church</strong> in
                    Kampala, and alongside that role I run an independent consulting practice working with SMEs,
                    schools, and nonprofits.
                  </p>
                  <p>
                    I also write, teach, and talk on the radio about systems, leadership, and doing work
                    that matters. Different rooms, same conviction: most organisations don’t have a people
                    problem — they have a structure problem, and structure can be designed.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={260}>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <Link
                    href={ctaUrl}
                    className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>{ctaText}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center font-bold text-base px-7 py-3.5 rounded-full bg-white text-[#232536] border-2 border-[#F5ECDE] hover:bg-[#F5ECDE] shadow-[0_10px_30px_rgba(35,37,54,0.08)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    See how I work
                  </Link>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Photostack Column */}
            <div className="lg:col-span-5 flex justify-center">
              <ScrollReveal delayMs={150} className="w-full max-w-sm sm:max-w-md">
                <div className="relative mx-auto w-full pt-6 pb-10 px-4">
                  {/* Floating Badge Top */}
                  <div className="absolute top-0 -left-2 sm:-left-6 z-20 bg-white/95 backdrop-blur-sm border border-[#F5ECDE] rounded-2xl px-4 py-2 shadow-[0_10px_30px_rgba(35,37,54,0.1)] text-xs font-bold text-[#232536] transform -rotate-3 flex items-center gap-2">
                    <span className="text-base">📍</span>
                    <span>Kampala, Uganda</span>
                  </div>

                  {/* Main Large Photo */}
                  <div className="relative z-10 transform rotate-2 hover:rotate-0 transition-transform duration-500 ease-out">
                    <Image
                      src="/images/ivan-headshot.jpg"
                      alt="Ivan Kabandize, professional headshot"
                      width={420}
                      height={500}
                      priority
                      className="w-full aspect-[4/5] object-cover object-top rounded-3xl shadow-[0_18px_44px_rgba(35,37,54,0.16)] border-4 border-white"
                    />
                  </div>

                  {/* Secondary Small Photo Overlay */}
                  <div className="absolute -bottom-4 -left-4 sm:-left-8 z-20 w-3/5 transform -rotate-6 hover:rotate-0 transition-transform duration-500 ease-out">
                    <Image
                      src="/images/ivan-event.jpg"
                      alt="Ivan at a leadership event"
                      width={280}
                      height={280}
                      className="w-full aspect-square object-cover rounded-2xl shadow-[0_18px_44px_rgba(35,37,54,0.2)] border-[6px] border-white"
                    />
                  </div>

                  {/* Floating Badge Bottom */}
                  <div className="absolute -bottom-8 right-0 z-30 bg-white/95 backdrop-blur-sm border border-[#F5ECDE] rounded-2xl px-4 py-2.5 shadow-[0_10px_30px_rgba(35,37,54,0.1)] text-xs font-bold text-[#2AA198] transform rotate-3 flex items-center gap-2">
                    <span className="text-base">🎙️</span>
                    <span>Systems &amp; Leadership</span>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CORE CONVICTION SECTION ================= */}
      <section className="py-20 bg-white border-b border-[#F5ECDE]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="bg-[#FDF8F1] border-2 border-[#F5ECDE] rounded-3xl p-8 sm:p-12 shadow-[0_10px_30px_rgba(35,37,54,0.06)] relative overflow-hidden">
              <span className="text-xs uppercase font-bold tracking-widest text-[#EF5B45] mb-4 block">
                The Central Philosophy
              </span>
              <blockquote className="font-['Fraunces',_Georgia,_serif] text-2xl sm:text-3xl lg:text-4xl text-[#232536] font-medium leading-snug pl-6 border-l-4 border-[#EF5B45] my-4 italic">
                &ldquo;Most organisations don’t have a people problem — they have a structure problem, and structure can be designed.&rdquo;
              </blockquote>
              <div className="mt-8 pt-6 border-t border-[#F5ECDE] flex items-center justify-between flex-wrap gap-4 text-sm text-[#5A5D70]">
                <div className="flex items-center gap-3">
                  <Image
                    src="/images/ivan-portrait.jpg"
                    alt="Ivan Kabandize"
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <p className="font-bold text-[#232536]">Ivan Kabandize</p>
                    <p className="text-xs text-[#5A5D70]">Systems Consultant &amp; Training Lead</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#EAF4F3] text-[#2AA198]">
                  Operational Clarity
                </span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= THREE PILLARS / AREAS OF PRACTICE ================= */}
      <section className="py-20 md:py-28 bg-[#FDF8F1] border-b border-[#F5ECDE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs uppercase font-bold tracking-widest text-[#2AA198] mb-2 block">
                Areas of Practice
              </span>
              <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#232536] tracking-tight">
                Three Rooms, <span className="italic text-[#EF5B45]">One Discipline</span>
              </h2>
              <p className="text-base sm:text-lg text-[#5A5D70] mt-4">
                Bridging strategy, education, and operations across distinct environments.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1: Systems Consulting */}
            <ScrollReveal delayMs={50}>
              <div className="bg-[#FCEBE7]/70 hover:bg-[#FCEBE7] border border-[#EF5B45]/15 rounded-3xl p-8 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm mb-6">
                    ⚙️
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#EF5B45] mb-2 block">
                    Consulting
                  </span>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-2xl font-semibold text-[#232536] mb-3">
                    Systems &amp; Operations
                  </h3>
                  <p className="text-[#5A5D70] text-base leading-relaxed">
                    Diagnosing operational bottlenecks, untangling chaotic workflows, and designing
                    durable structures that help leadership teams scale without burning out.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-[#EF5B45]/10">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#EF5B45] hover:text-[#D94834] transition"
                  >
                    <span>Explore Advisory</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Pillar 2: Training & People */}
            <ScrollReveal delayMs={120}>
              <div className="bg-[#EAF4F3]/70 hover:bg-[#EAF4F3] border border-[#2AA198]/15 rounded-3xl p-8 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm mb-6">
                    🎓
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#2AA198] mb-2 block">
                    Training Lead
                  </span>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-2xl font-semibold text-[#232536] mb-3">
                    People &amp; Competence
                  </h3>
                  <p className="text-[#5A5D70] text-base leading-relaxed">
                    At Watoto Church, leading institutional learning and leadership frameworks that
                    turn strategic goals into practical, day-to-day staff competence.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-[#2AA198]/10">
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#2AA198] hover:text-[#1D7A73] transition"
                  >
                    <span>Training Method</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            {/* Pillar 3: Writing & Media */}
            <ScrollReveal delayMs={190}>
              <div className="bg-[#FDF3DC]/70 hover:bg-[#FDF3DC] border border-[#F7C55C]/30 rounded-3xl p-8 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm mb-6">
                    ✍️
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#C99424] mb-2 block">
                    Broadcast &amp; Garden
                  </span>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-2xl font-semibold text-[#232536] mb-3">
                    Writing &amp; Media
                  </h3>
                  <p className="text-[#5A5D70] text-base leading-relaxed">
                    Sharing ideas publicly through essays in The Garden and weekly radio conversations
                    on Power FM on leadership, systems thinking, and intentional work.
                  </p>
                </div>
                <div className="pt-6 mt-6 border-t border-[#F7C55C]/20">
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-[#C99424] hover:text-[#9A7015] transition"
                  >
                    <span>Read The Garden</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================= BACKGROUND & ROLES SNAPSHOT ================= */}
      <section className="py-20 bg-white border-b border-[#F5ECDE]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mb-12">
              <span className="text-xs uppercase font-bold tracking-widest text-[#5A5D70] mb-2 block">
                Experience Snapshot
              </span>
              <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl sm:text-4xl font-semibold text-[#232536]">
                Where I spend my time
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ScrollReveal delayMs={50}>
              <div className="p-6 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] space-y-3">
                <span className="text-2xl block">⛪</span>
                <h3 className="font-bold text-lg text-[#232536]">Watoto Church</h3>
                <p className="text-xs font-semibold text-[#EF5B45] uppercase tracking-wider">
                  Training Lead
                </p>
                <p className="text-sm text-[#5A5D70] leading-relaxed">
                  Directing staff development, curriculum design, and organizational training across multiple campuses.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={100}>
              <div className="p-6 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] space-y-3">
                <span className="text-2xl block">💼</span>
                <h3 className="font-bold text-lg text-[#232536]">Consulting Practice</h3>
                <p className="text-xs font-semibold text-[#2AA198] uppercase tracking-wider">
                  Principal Consultant
                </p>
                <p className="text-sm text-[#5A5D70] leading-relaxed">
                  Advising founders and leadership teams on organizational structure, process mapping, and operational cadence.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={150}>
              <div className="p-6 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] space-y-3">
                <span className="text-2xl block">📻</span>
                <h3 className="font-bold text-lg text-[#232536]">Radio &amp; Media</h3>
                <p className="text-xs font-semibold text-[#C99424] uppercase tracking-wider">
                  Broadcaster &amp; Writer
                </p>
                <p className="text-sm text-[#5A5D70] leading-relaxed">
                  Regular contributor on Power FM discussing work craftsmanship, team culture, and systems philosophy.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================= TESTIMONIALS SECTION (Dynamic if present) ================= */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-[#FDF8F1] border-b border-[#F5ECDE]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <div className="text-center mb-12">
                <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl font-semibold text-[#232536]">
                  Kind words from colleagues &amp; clients
                </h2>
              </div>
            </ScrollReveal>
            <div className="space-y-6">
              {testimonials.map((t: any, idx: number) => (
                <ScrollReveal key={idx} delayMs={idx * 80}>
                  <div className="bg-white p-8 rounded-3xl border border-[#F5ECDE] shadow-sm">
                    <p className="text-lg text-[#232536] italic leading-relaxed mb-4">
                      &ldquo;{t.quote || t.content || t.text}&rdquo;
                    </p>
                    <div className="font-bold text-sm text-[#232536]">
                      {t.author || t.name}{' '}
                      {t.role && <span className="font-normal text-[#5A5D70]">· {t.role}</span>}
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= CLOSING CALL TO ACTION ================= */}
      <section className="py-20 md:py-28 bg-[#FDF8F1] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <ScrollReveal>
            <h2 className="font-['Fraunces',_Georgia,_serif] text-4xl sm:text-5xl font-semibold text-[#232536] leading-tight">
              Have a problem worth <span className="italic text-[#EF5B45]">untangling?</span>
            </h2>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <p className="text-lg sm:text-xl text-[#5A5D70] leading-relaxed max-w-2xl mx-auto">
              Tell me about what’s not working. A 30-minute conversation, no obligation — you’ll leave
              with a clearer picture of the real issue, whether we work together or not.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={140}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/lets-talk"
                className="inline-flex items-center justify-center gap-2 font-bold text-base px-9 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Let&apos;s Talk</span>
                <span aria-hidden="true">&#128075;</span>
              </Link>
            </div>
            <p className="text-xs text-[#5A5D70] font-medium mt-4">
              Direct consultation &middot; No sales pitch &middot; Actionable diagnostic
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
