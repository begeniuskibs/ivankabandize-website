import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import ScrollReveal from '@/components/public/ScrollReveal'
import { Leaf } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch page content for home from Supabase pages table
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', 'home')
    .maybeSingle()

  const headline =
    page?.hero_headline ||
    "I'm Ivan. I help founders and leaders turn operational chaos into structure that works."
  const subheadline =
    page?.hero_subheadline ||
    "I'm a systems consultant, trainer, and writer. Whatever's not working in your business or organisation, my job is to help you see the problem clearly, design the structure to solve it, and know exactly what to do first."
  const ctaText = page?.cta_text || "Let's Talk"
  const ctaUrl = page?.cta_url || '/lets-talk'
  const closingCtaHeadline =
    page?.closing_cta_headline || "The problem has a name. Let's find it together."

  const bodyParagraphs: string[] =
    Array.isArray(page?.body_paragraphs) && page.body_paragraphs.length > 0
      ? page.body_paragraphs
      : [
          "I've worked with pest control companies, international schools, children's nonprofits, logistics startups, and church ministries. The industries are different. The problem is the same: ambition and resources, but no structured path from where they are to where they want to be.",
          "If you're a founder, director, or team leader building something you believe in - but the operational side isn't keeping up with the vision - we should talk.",
        ]

  // Fetch latest public published posts (RLS enforces visibility='public' AND publish_status='published')
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, featured_image_url, post_tags(tag:tags(name, slug))')
    .order('published_at', { ascending: false })
    .limit(3)

  return (
    <div className="flex flex-col min-h-full bg-[#FDF8F1] text-[#232536] font-sans selection:bg-[#F7C55C] selection:text-[#232536]">
      {/* ================= HERO SECTION ================= */}
      <section className="py-16 md:py-24 border-b border-[#F5ECDE] overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Narrative Column */}
            <div className="lg:col-span-7 space-y-6">
              <ScrollReveal>
                <p className="text-xl sm:text-2xl font-bold text-[#232536] flex items-center gap-2">
                  <span>Hey Friends</span>
                  <span aria-hidden="true">&#128075;</span>
                </p>
              </ScrollReveal>

              <ScrollReveal delayMs={80}>
                <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#232536] leading-[1.12]">
                  {headline.includes('structure that works.') ? (
                    <>
                      {headline.replace('structure that works.', '')}
                      <span className="text-[#EF5B45]">structure that works.</span>
                    </>
                  ) : (
                    headline
                  )}
                </h1>
              </ScrollReveal>

              <ScrollReveal delayMs={140}>
                <div className="space-y-4 text-lg sm:text-xl text-[#5A5D70] leading-relaxed">
                  <p className="font-medium text-[#232536]">
                    {subheadline}
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={200}>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href={ctaUrl}
                    className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>{ctaText}</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Link>
                  <a
                    href="#method"
                    className="inline-flex items-center justify-center font-bold text-base px-7 py-3.5 rounded-full bg-white text-[#232536] border-2 border-[#F5ECDE] hover:bg-[#F5ECDE] shadow-[0_10px_30px_rgba(35,37,54,0.08)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    See how I work
                  </a>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Portrait Column (No stickers) */}
            <div className="lg:col-span-5 flex justify-center">
              <ScrollReveal delayMs={150} className="w-full max-w-sm sm:max-w-md">
                <div className="relative mx-auto w-full pt-4 pb-6 px-4">
                  <div className="relative z-10">
                    <Image
                      src="/images/ivan-headshot.jpg"
                      alt="Ivan Kabandize"
                      width={420}
                      height={500}
                      priority
                      className="w-full aspect-[4/5] object-cover object-top rounded-3xl shadow-[0_18px_44px_rgba(35,37,54,0.16)] border-4 border-white"
                    />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ================= PROOF SECTION: TRUST BAR & WHO I WORK WITH ================= */}
      <section className="py-16 md:py-20 bg-[#FDF8F1] border-b border-[#F5ECDE]" aria-label="Where you might know me from">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <p className="text-center text-xs uppercase tracking-widest font-bold text-[#5A5D70] mb-8">
              Where you might know me from
            </p>

            {/* Placeholder only - do not replace with real client logos/names without confirmed permission. See Decision log. */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 mb-12">
              <div className="w-24 sm:w-28 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center">
                <div className="w-12 h-2.5 rounded-full bg-black/10" />
              </div>
              <div className="w-24 sm:w-28 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center">
                <div className="w-14 h-2.5 rounded-full bg-black/10" />
              </div>
              <div className="w-24 sm:w-28 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center">
                <div className="w-10 h-2.5 rounded-full bg-black/10" />
              </div>
              <div className="w-24 sm:w-28 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center">
                <div className="w-16 h-2.5 rounded-full bg-black/10" />
              </div>
              <div className="w-24 sm:w-28 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center">
                <div className="w-12 h-2.5 rounded-full bg-black/10" />
              </div>
              <div className="w-24 sm:w-28 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center">
                <div className="w-14 h-2.5 rounded-full bg-black/10" />
              </div>
              <div className="w-24 sm:w-28 h-10 rounded-xl bg-black/5 border border-black/5 flex items-center justify-center">
                <div className="w-10 h-2.5 rounded-full bg-black/10" />
              </div>
            </div>

            <div className="space-y-4 text-base sm:text-lg text-[#5A5D70] leading-relaxed max-w-3xl mx-auto text-center sm:text-left">
              {bodyParagraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= HELP CARDS: HOW CAN I HELP YOU? ================= */}
      <section className="py-20 md:py-28 bg-white border-b border-[#F5ECDE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight">
                How Can I <span className="text-[#EF5B45]">Help You?</span>
              </h2>
              <p className="text-base sm:text-lg text-[#5A5D70] mt-4">
                Pick the thing that&rsquo;s keeping you up at night. There&rsquo;s a starting point for each one.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <ScrollReveal delayMs={40}>
              <Link
                href="/workwithme"
                className="bg-[#FCEBE7] hover:bg-[#fad8d1] border border-[#EF5B45]/15 rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl block mb-4">&#127959;&#65039;</span>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-semibold text-[#232536] mb-2">
                    Fix Your Operations
                  </h3>
                  <p className="text-sm sm:text-base text-[#5A5D70] leading-relaxed">
                    Your organisation runs on gut instinct and heroics. Let&rsquo;s replace that with systems your team can actually run.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#EF5B45]/15 font-bold text-sm text-[#EF5B45] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Get started</span>
                  <span aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            </ScrollReveal>

            {/* Card 2 */}
            <ScrollReveal delayMs={80}>
              <Link
                href="/garden"
                className="bg-[#FDF3DC] hover:bg-[#faeac4] border border-[#F7C55C]/30 rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl block mb-4">&#9881;&#65039;</span>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-semibold text-[#232536] mb-2">
                    Build Better Systems
                  </h3>
                  <p className="text-sm sm:text-base text-[#5A5D70] leading-relaxed">
                    Personal productivity that doesn&rsquo;t depend on willpower — how to design defaults instead of chasing goals.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#F7C55C]/25 font-bold text-sm text-[#C99424] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Get started</span>
                  <span aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            </ScrollReveal>

            {/* Card 3 */}
            <ScrollReveal delayMs={120}>
              <Link
                href="/garden"
                className="bg-[#EAF4F3] hover:bg-[#d5ebe9] border border-[#2AA198]/20 rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl block mb-4">&#129658;</span>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-semibold text-[#232536] mb-2">
                    Lead With Clarity
                  </h3>
                  <p className="text-sm sm:text-base text-[#5A5D70] leading-relaxed">
                    Practical leadership for people who&rsquo;d rather build a healthy team than fight the same fire every week.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#2AA198]/15 font-bold text-sm text-[#2AA198] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Get started</span>
                  <span aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            </ScrollReveal>

            {/* Card 4 */}
            <ScrollReveal delayMs={160}>
              <Link
                href="/garden"
                className="bg-[#EEEDF9] hover:bg-[#dfdcf5] border border-[#6B66C4]/20 rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl block mb-4">&#129302;</span>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-semibold text-[#232536] mb-2">
                    Make Sense of AI
                  </h3>
                  <p className="text-sm sm:text-base text-[#5A5D70] leading-relaxed">
                    What actually changes for your work and your organisation — translated from the research, minus the hype.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#6B66C4]/15 font-bold text-sm text-[#6B66C4] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Get started</span>
                  <span aria-hidden="true">&rarr;</span>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ================= METHOD SECTION ================= */}
      <section className="py-20 md:py-28 bg-[#FDF8F1] border-b border-[#F5ECDE]" id="method">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight">
                My 3-Step <span className="text-[#2AA198]">Method</span>
              </h2>
              <p className="text-base sm:text-lg text-[#5A5D70] mt-4">
                Every engagement — an SME, a school, a nonprofit — follows the same three moves, in the same order. That&rsquo;s the whole trick.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1: Diagnose */}
            <ScrollReveal delayMs={50}>
              <div className="bg-white border border-[#F5ECDE] rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 rounded-full bg-[#EF5B45] text-white flex items-center justify-center font-['MTN_Brighter_Sans',_sans-serif] font-bold text-xl mb-6 shadow-sm">
                    1
                  </div>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-semibold text-[#232536] mb-1">
                    Diagnose
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#EF5B45] mb-4">
                    See it clearly
                  </p>
                  <p className="text-base text-[#5A5D70] leading-relaxed mb-6">
                    Surface the problem you&apos;ve been operating around without naming. Most organisations know something isn&apos;t working. Few can articulate exactly what.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] text-xs sm:text-sm text-[#232536] leading-relaxed">
                  &ldquo;A pest control company&apos;s founder discovery session surfaced financial leakage, manual processes, and data integrity gaps across five dimensions - none of which had been named before.&rdquo;
                </div>
              </div>
            </ScrollReveal>

            {/* Step 2: Architect */}
            <ScrollReveal delayMs={120}>
              <div className="bg-white border border-[#F5ECDE] rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 rounded-full bg-[#2AA198] text-white flex items-center justify-center font-['MTN_Brighter_Sans',_sans-serif] font-bold text-xl mb-6 shadow-sm">
                    2
                  </div>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-semibold text-[#232536] mb-1">
                    Architect
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2AA198] mb-4">
                    Design the fix
                  </p>
                  <p className="text-base text-[#5A5D70] leading-relaxed mb-6">
                    Design the structure that solves it. Systems, processes, frameworks, workflows, documentation. Not theory. Working structures your team can actually use.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] text-xs sm:text-sm text-[#232536] leading-relaxed">
                  &ldquo;An international school being built from scratch needed everything - email infrastructure, admissions forms, branding, teacher onboarding - designed and delivered before doors opened.&rdquo;
                </div>
              </div>
            </ScrollReveal>

            {/* Step 3: Sequence */}
            <ScrollReveal delayMs={190}>
              <div className="bg-white border border-[#F5ECDE] rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 rounded-full bg-[#F7C55C] text-[#232536] flex items-center justify-center font-['MTN_Brighter_Sans',_sans-serif] font-bold text-xl mb-6 shadow-sm">
                    3
                  </div>
                  <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-semibold text-[#232536] mb-1">
                    Sequence
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C99424] mb-4">
                    Know what&apos;s first
                  </p>
                  <p className="text-base text-[#5A5D70] leading-relaxed mb-6">
                    Define what to do first, second, third. Doing things in the wrong order wastes everything.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] text-xs sm:text-sm text-[#232536] leading-relaxed">
                  &ldquo;A logistics startup needed strategic clarity before systems could be built - advisory work that shaped the founder&apos;s thinking on what to prioritise and defer.&rdquo;
                </div>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delayMs={240}>
            <div className="text-center mt-12">
              <Link
                href="/workwithme"
                className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>See how an engagement works</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= ARTICLES SECTION: RECENT THINKING ================= */}
      <section className="py-20 md:py-28 bg-[#FDF8F1] border-b border-[#F5ECDE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] tracking-tight">
                Recent <span className="text-[#EF5B45]">Thinking</span>
              </h2>
              <p className="text-base sm:text-lg text-[#5A5D70] mt-4">
                A digital garden of essays, notes, and tools — some polished, some still growing. Recently tended entries below.
              </p>
            </div>
          </ScrollReveal>

          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {posts.map((post, idx) => (
                <ScrollReveal key={post.id} delayMs={idx * 80}>
                  <Link
                    href={`/garden/${post.slug}`}
                    className="group flex flex-col space-y-4"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden rounded-[20px] bg-[#FDF3DC] border border-[#F5ECDE] shadow-[0_4px_20px_rgba(35,37,54,0.04)]">
                      {post.featured_image_url ? (
                        <img
                          src={post.featured_image_url}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf className="w-10 h-10 text-[#1F7A72]" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl sm:text-2xl font-bold text-[#232536] group-hover:text-[#EF5B45] transition-colors leading-snug">
                      {post.title}
                    </h3>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-3xl border border-[#F5ECDE] text-[#5A5D70] text-base">
              Articles will appear here once published.
            </div>
          )}

          <ScrollReveal delayMs={240}>
            <div className="text-center mt-12">
              <Link
                href="/garden"
                className="inline-flex items-center justify-center font-bold text-base px-8 py-4 rounded-full bg-white text-[#232536] border-2 border-[#F5ECDE] hover:bg-[#F5ECDE] shadow-[0_10px_30px_rgba(35,37,54,0.08)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                Wander the Garden &#127793;
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= CLOSING CALL TO ACTION ================= */}
      <section className="py-20 md:py-28 bg-[#FDF8F1] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <ScrollReveal>
            <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold text-[#232536] leading-tight">
              {closingCtaHeadline.includes("Let's find it together.") ? (
                <>
                  {closingCtaHeadline.replace("Let's find it together.", '')}
                  <span className="text-[#EF5B45]">Let&apos;s find it together.</span>
                </>
              ) : (
                closingCtaHeadline
              )}
            </h2>
          </ScrollReveal>

          <ScrollReveal delayMs={80}>
            <p className="text-lg sm:text-xl text-[#5A5D70] leading-relaxed max-w-2xl mx-auto">
              Tell me about it. A 30-minute conversation, no obligation — you&apos;ll leave with a clearer picture of the problem, whether or not we work together.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={140}>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href={ctaUrl}
                className="inline-flex items-center justify-center gap-2 font-bold text-base px-9 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{ctaText}</span>
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
