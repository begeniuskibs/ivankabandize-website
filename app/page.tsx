import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import ScrollReveal from '@/components/public/ScrollReveal'

export const dynamic = 'force-dynamic'

interface VideoItem {
  id: string
  title: string
  kind: string
  url: string
  thumbnailUrl: string
}

// Extensible video data list — seeded with real YouTube video
const featuredVideos: VideoItem[] = [
  {
    id: 'g4C4cFIVMmU',
    title: 'Analyzing the Free WiFi Project by the Ugandan Government',
    kind: 'Analysis · Kabandize Ivan Begirira',
    url: 'https://youtu.be/g4C4cFIVMmU',
    thumbnailUrl: 'https://i.ytimg.com/vi/g4C4cFIVMmU/hqdefault.jpg',
  },
]

export default async function HomePage() {
  const supabase = await createClient()

  // Fetch latest public published posts (RLS enforces visibility='public' AND publish_status='published')
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, published_at, post_tags(tag:tags(name, slug))')
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
                <h1 className="font-['Fraunces',_Georgia,_serif] text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-[#232536] leading-[1.12]">
                  Ambition is rarely the problem. <span className="italic text-[#EF5B45]">Structure usually is.</span>
                </h1>
              </ScrollReveal>

              <ScrollReveal delayMs={140}>
                <div className="space-y-4 text-lg sm:text-xl text-[#5A5D70] leading-relaxed">
                  <p className="font-medium text-[#232536]">
                    I help organisations and individuals see their problem clearly, design the structure to solve it, and know what to do first.
                  </p>
                  <p className="text-base sm:text-lg text-[#5A5D70]">
                    You have a vision. You have a team. You might even have the resources. But somewhere between where you are and where you want to be, there&apos;s a gap you can feel but haven&apos;t been able to name. That&apos;s where I start.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal delayMs={200}>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/lets-talk"
                    className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Let&apos;s Talk</span>
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

            {/* Right Portrait & Stickers Column */}
            <div className="lg:col-span-5 flex justify-center">
              <ScrollReveal delayMs={150} className="w-full max-w-sm sm:max-w-md">
                <div className="relative mx-auto w-full pt-6 pb-8 px-4">
                  {/* Sticker A - Top Left */}
                  <div className="absolute top-4 -left-2 sm:-left-6 z-20 bg-white/95 backdrop-blur-sm border border-[#F5ECDE] rounded-2xl px-4 py-2.5 shadow-[0_10px_30px_rgba(35,37,54,0.12)] text-xs font-bold text-[#232536] transform -rotate-6 flex items-center gap-2">
                    <span className="text-base">&#129658;</span>
                    <span>Diagnose</span>
                  </div>

                  {/* Main Portrait with Blob Shape */}
                  <div className="relative z-10">
                    <Image
                      src="/images/mockup_img_1_Ivan_Kabandize_smiling.jpg"
                      alt="Ivan Kabandize smiling"
                      width={400}
                      height={500}
                      priority
                      className="w-full aspect-[4/5] object-cover object-top shadow-[0_18px_44px_rgba(35,37,54,0.16)] border-4 border-white animate-blob"
                    />
                  </div>

                  {/* Sticker B - Bottom Right */}
                  <div className="absolute bottom-12 -right-2 sm:-right-6 z-20 bg-white/95 backdrop-blur-sm border border-[#F5ECDE] rounded-2xl px-4 py-2.5 shadow-[0_10px_30px_rgba(35,37,54,0.12)] text-xs font-bold text-[#2AA198] transform rotate-6 flex items-center gap-2">
                    <span className="text-base">&#128506;&#65039;</span>
                    <span>Sequence</span>
                  </div>

                  {/* Sticker C - Bottom Left */}
                  <div className="absolute -bottom-3 left-4 z-20 bg-white/95 backdrop-blur-sm border border-[#F5ECDE] rounded-2xl px-4 py-2.5 shadow-[0_10px_30px_rgba(35,37,54,0.12)] text-xs font-bold text-[#EF5B45] transform -rotate-3 flex items-center gap-2">
                    <span className="text-base">&#127959;&#65039;</span>
                    <span>Architect</span>
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
              <p>
                I&apos;ve worked with pest control companies, international schools, children&apos;s nonprofits, logistics startups, and church ministries. The industries are different. The problem is the same: ambition and resources, but no structured path from where they are to where they want to be.
              </p>
              <p>
                If you&apos;re a founder, director, or team leader building something you believe in - but the operational side isn&apos;t keeping up with the vision - we should talk.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Provisional content - not yet in the approved Website Copy Document. Pending formal addition. */}
      {/* ================= HELP CARDS: HOW CAN I HELP YOU? ================= */}
      <section className="py-20 md:py-28 bg-white border-b border-[#F5ECDE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#232536] tracking-tight">
                How Can I <span className="italic text-[#EF5B45]">Help You?</span>
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
                href="/services"
                className="bg-[#FCEBE7] hover:bg-[#fad8d1] border border-[#EF5B45]/15 rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl block mb-4">&#127959;&#65039;</span>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-xl sm:text-2xl font-semibold text-[#232536] mb-2">
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
                href="/blog"
                className="bg-[#FDF3DC] hover:bg-[#faeac4] border border-[#F7C55C]/30 rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl block mb-4">&#9881;&#65039;</span>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-xl sm:text-2xl font-semibold text-[#232536] mb-2">
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
                href="/blog"
                className="bg-[#EAF4F3] hover:bg-[#d5ebe9] border border-[#2AA198]/20 rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl block mb-4">&#129658;</span>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-xl sm:text-2xl font-semibold text-[#232536] mb-2">
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
                href="/blog"
                className="bg-[#EEEDF9] hover:bg-[#dfdcf5] border border-[#6B66C4]/20 rounded-3xl p-7 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.04)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.09)] hover:-translate-y-1.5 transition-all duration-300 group"
              >
                <div>
                  <span className="text-3xl block mb-4">&#129302;</span>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-xl sm:text-2xl font-semibold text-[#232536] mb-2">
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
              <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#232536] tracking-tight">
                My 3-Step <span className="italic text-[#2AA198]">Method</span>
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
                  <div className="w-12 h-12 rounded-full bg-[#EF5B45] text-white flex items-center justify-center font-['Fraunces',_Georgia,_serif] font-bold text-xl mb-6 shadow-sm">
                    1
                  </div>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-2xl sm:text-3xl font-semibold text-[#232536] mb-1">
                    Diagnose
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#EF5B45] mb-4">
                    See it clearly
                  </p>
                  <p className="text-base text-[#5A5D70] leading-relaxed mb-6">
                    Surface the problem you&apos;ve been operating around without naming. Most organisations know something isn&apos;t working. Few can articulate exactly what.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] text-xs sm:text-sm text-[#232536] italic leading-relaxed">
                  &ldquo;A pest control company&apos;s founder discovery session surfaced financial leakage, manual processes, and data integrity gaps across five dimensions - none of which had been named before.&rdquo;
                </div>
              </div>
            </ScrollReveal>

            {/* Step 2: Architect */}
            <ScrollReveal delayMs={120}>
              <div className="bg-white border border-[#F5ECDE] rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 rounded-full bg-[#2AA198] text-white flex items-center justify-center font-['Fraunces',_Georgia,_serif] font-bold text-xl mb-6 shadow-sm">
                    2
                  </div>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-2xl sm:text-3xl font-semibold text-[#232536] mb-1">
                    Architect
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#2AA198] mb-4">
                    Design the fix
                  </p>
                  <p className="text-base text-[#5A5D70] leading-relaxed mb-6">
                    Design the structure that solves it. Systems, processes, frameworks, workflows, documentation. Not theory. Working structures your team can actually use.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] text-xs sm:text-sm text-[#232536] italic leading-relaxed">
                  &ldquo;An international school being built from scratch needed everything - email infrastructure, admissions forms, branding, teacher onboarding - designed and delivered before doors opened.&rdquo;
                </div>
              </div>
            </ScrollReveal>

            {/* Step 3: Sequence */}
            <ScrollReveal delayMs={190}>
              <div className="bg-white border border-[#F5ECDE] rounded-3xl p-8 sm:p-10 h-full flex flex-col justify-between shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300">
                <div>
                  <div className="w-12 h-12 rounded-full bg-[#F7C55C] text-[#232536] flex items-center justify-center font-['Fraunces',_Georgia,_serif] font-bold text-xl mb-6 shadow-sm">
                    3
                  </div>
                  <h3 className="font-['Fraunces',_Georgia,_serif] text-2xl sm:text-3xl font-semibold text-[#232536] mb-1">
                    Sequence
                  </h3>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C99424] mb-4">
                    Know what&apos;s first
                  </p>
                  <p className="text-base text-[#5A5D70] leading-relaxed mb-6">
                    Define what to do first, second, third. Doing things in the wrong order wastes everything.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#FDF8F1] border border-[#F5ECDE] text-xs sm:text-sm text-[#232536] italic leading-relaxed">
                  &ldquo;A logistics startup needed strategic clarity before systems could be built - advisory work that shaped the founder&apos;s thinking on what to prioritise and defer.&rdquo;
                </div>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal delayMs={240}>
            <div className="text-center mt-12">
              <Link
                href="/services"
                className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-4 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>See how an engagement works</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ================= VIDEOS SECTION: WATCH & LISTEN ================= */}
      <section className="py-20 md:py-28 bg-white border-b border-[#F5ECDE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#232536] tracking-tight">
                Watch &amp; <span className="italic text-[#EF5B45]">Listen</span>
              </h2>
              <p className="text-base sm:text-lg text-[#5A5D70] mt-4">
                Talks, radio segments, and walkthroughs — for when reading isn&rsquo;t your thing.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
            {featuredVideos.map((video, idx) => (
              <ScrollReveal key={video.id} delayMs={idx * 80}>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#FDF8F1] border border-[#F5ECDE] rounded-3xl overflow-hidden flex flex-col shadow-[0_10px_30px_rgba(35,37,54,0.06)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.12)] hover:-translate-y-1.5 transition-all duration-300 group"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-black/5">
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/95 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <span className="w-0 h-0 border-y-[9px] border-y-transparent border-l-[15px] border-l-[#EF5B45] ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1 justify-between">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#2AA198] mb-2 block">
                        {video.kind}
                      </span>
                      <h3 className="font-['Fraunces',_Georgia,_serif] text-xl font-semibold text-[#232536] leading-snug group-hover:text-[#EF5B45] transition-colors">
                        {video.title}
                      </h3>
                    </div>
                  </div>
                </a>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ARTICLES SECTION: RECENT THINKING ================= */}
      <section className="py-20 md:py-28 bg-[#FDF8F1] border-b border-[#F5ECDE]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#232536] tracking-tight">
                Recent <span className="italic text-[#EF5B45]">Thinking</span>
              </h2>
              <p className="text-base sm:text-lg text-[#5A5D70] mt-4">
                A digital garden of essays, notes, and tools — some polished, some still growing. Recently tended entries below.
              </p>
            </div>
          </ScrollReveal>

          {posts && posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {posts.map((post, idx) => {
                const tagNames: string[] = (post.post_tags as any[])?.map((pt: any) => pt.tag?.name).filter(Boolean) || []
                return (
                  <ScrollReveal key={post.id} delayMs={idx * 80}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="bg-white border border-[#F5ECDE] rounded-3xl p-8 flex flex-col justify-between h-full shadow-[0_10px_30px_rgba(35,37,54,0.05)] hover:shadow-[0_18px_44px_rgba(35,37,54,0.1)] hover:-translate-y-1.5 transition-all duration-300 group"
                    >
                      <div>
                        {tagNames.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tagNames.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#FDF8F1] text-[#2AA198] border border-[#F5ECDE]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <h3 className="font-['Fraunces',_Georgia,_serif] text-2xl font-semibold text-[#232536] group-hover:text-[#EF5B45] transition-colors leading-snug mb-3">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-[#5A5D70] text-sm sm:text-base leading-relaxed line-clamp-3">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                      <div className="mt-6 pt-4 border-t border-[#F5ECDE] flex items-center justify-between text-xs text-[#5A5D70] font-semibold">
                        <span>
                          {post.published_at
                            ? new Date(post.published_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Recent'}
                        </span>
                        <span className="font-bold text-[#EF5B45] group-hover:translate-x-0.5 transition-transform">
                          Read article &rarr;
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                )
              })}
            </div>
          ) : (
            <div className="py-12 text-center bg-white rounded-3xl border border-[#F5ECDE] text-[#5A5D70] text-base">
              Articles will appear here once published.
            </div>
          )}

          <ScrollReveal delayMs={240}>
            <div className="text-center mt-12">
              <Link
                href="/blog"
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
            <h2 className="font-['Fraunces',_Georgia,_serif] text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#232536] leading-tight">
              The problem has a name. <span className="italic text-[#EF5B45]">Let&apos;s find it together.</span>
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
