'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import ScrollReveal from '@/components/public/ScrollReveal'
import { HELP_OPTIONS, TIMING_OPTIONS } from '@/lib/inquiries'

interface FormData {
  name: string
  email: string
  organisation: string
  problem: string
  help_type: string
  timing: string
  contact_ref_code?: string
}

export default function LetsTalkPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    organisation: '',
    problem: '',
    help_type: 'Not sure yet',
    timing: 'Just exploring',
    contact_ref_code: '',
  })

  const [errors, setErrors] = useState<{ name?: string; email?: string; problem?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateStep1 = () => {
    const newErrors: { name?: string; email?: string } = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Please tell me your name.'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'A valid email so I can reply to you.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'A valid email so I can reply to you.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: { problem?: string } = {}
    if (!formData.problem.trim()) {
      newErrors.problem = 'A sentence or two helps me come prepared.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = (from: 1 | 2) => {
    if (from === 1) {
      if (validateStep1()) setStep(2)
    } else if (from === 2) {
      if (validateStep2()) setStep(3)
    }
  }

  const handleBack = (from: 2 | 3) => {
    setStep((from - 1) as 1 | 2)
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      // Honeypot spam check - if filled, silently succeed without DB insert or email
      if (formData.contact_ref_code && formData.contact_ref_code.trim()) {
        setStep(4)
        return
      }

      const supabase = createClient()

      // 1. Primary insert into live inquiries table
      const { error: dbError } = await supabase.from('inquiries').insert([
        {
          name: formData.name.trim(),
          email: formData.email.trim(),
          organisation: formData.organisation.trim() || null,
          problem: formData.problem.trim(),
          help_type: formData.help_type || null,
          timing: formData.timing || null,
          status: 'new',
        },
      ])

      if (dbError) {
        console.error('Database insert error:', dbError)
        throw new Error(dbError.message || 'Failed to submit inquiry')
      }

      // 2. Server-side notification trigger (non-blocking)
      fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          organisation: formData.organisation.trim() || null,
          problem: formData.problem.trim(),
          help_type: formData.help_type || null,
          timing: formData.timing || null,
          contact_ref_code: formData.contact_ref_code || '',
        }),
      }).catch((err) => {
        console.error('Server notification error (non-fatal):', err)
      })

      // 3. Move to success step
      setStep(4)
    } catch (err: any) {
      console.error('Submission failed:', err)
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const firstName = formData.name.trim().split(' ')[0] || 'friend'

  return (
    <div className="min-h-full bg-[#FDF8F1] text-[#232536] font-sans selection:bg-[#F7C55C] selection:text-[#232536] py-14 md:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start max-w-5xl mx-auto">
          
          {/* ================= LEFT COLUMN: STATIC ================= */}
          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FCEBE7] border border-[#EF5B45]/20 text-[#EF5B45] text-xs font-bold uppercase tracking-widest">
                <Link href="/" className="hover:underline text-[#5A5D70]">
                  Home
                </Link>
                <span className="text-[#5A5D70]">/</span>
                <span>Let&rsquo;s Talk</span>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={80}>
              <h1 className="font-['MTN_Brighter_Sans',_sans-serif] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#232536] leading-[1.15]">
                Tell me what&rsquo;s <span className="text-[#EF5B45]">not working.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal delayMs={140}>
              <p className="text-base sm:text-lg text-[#5A5D70] leading-relaxed">
                Three quick steps, two minutes of your time. No obligation, no pressure - the first conversation is a diagnosis, not a pitch.
              </p>
            </ScrollReveal>

            {/* Three Numbered Rows */}
            <ScrollReveal delayMs={200}>
              <div className="space-y-6 pt-4">
                {/* Row 1 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-[#F5ECDE] shadow-[0_4px_14px_rgba(35,37,54,0.06)] flex items-center justify-center font-['MTN_Brighter_Sans',_sans-serif] font-bold text-base text-[#232536] flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#232536]">
                      I read every enquiry personally
                    </h3>
                    <p className="text-sm text-[#5A5D70] mt-1 leading-relaxed">
                      You&rsquo;ll hear back from me within two business days - a real reply, not an autoresponder.
                    </p>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-[#F5ECDE] shadow-[0_4px_14px_rgba(35,37,54,0.06)] flex items-center justify-center font-['MTN_Brighter_Sans',_sans-serif] font-bold text-base text-[#232536] flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#232536]">
                      We talk for 30 minutes
                    </h3>
                    <p className="text-sm text-[#5A5D70] mt-1 leading-relaxed">
                      A focused conversation about what&rsquo;s not working. You&rsquo;ll leave with a clearer picture either way.
                    </p>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white border-2 border-[#F5ECDE] shadow-[0_4px_14px_rgba(35,37,54,0.06)] flex items-center justify-center font-['MTN_Brighter_Sans',_sans-serif] font-bold text-base text-[#232536] flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#232536]">
                      A proposal - only if it fits
                    </h3>
                    <p className="text-sm text-[#5A5D70] mt-1 leading-relaxed">
                      If I can genuinely help, I&rsquo;ll propose an engagement scoped to your situation. If I can&rsquo;t, I&rsquo;ll say so and point you to someone who can.
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* ================= RIGHT COLUMN: INTERACTIVE CARD ================= */}
          <div className="lg:col-span-7">
            <ScrollReveal delayMs={100}>
              <div className="bg-white border border-[#F5ECDE] rounded-[28px] p-6 sm:p-10 shadow-[0_18px_44px_rgba(35,37,54,0.1)]">
                
                {/* Step Indicator (Steps 1-3) */}
                {step < 4 && (
                  <div className="flex items-center gap-2 sm:gap-3 mb-8">
                    {/* Step 1 badge */}
                    <div className={`flex items-center gap-2 text-xs sm:text-sm font-bold ${
                      step === 1 ? 'text-[#232536]' : step > 1 ? 'text-[#2AA198]' : 'text-[#A9ACBC]'
                    }`}>
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                        step === 1
                          ? 'bg-[#EF5B45] text-white'
                          : step > 1
                          ? 'bg-[#2AA198] text-white'
                          : 'bg-[#F5ECDE] text-[#5A5D70]'
                      }`}>
                        {step > 1 ? '✓' : '1'}
                      </div>
                      <span className="hidden sm:inline">About you</span>
                    </div>

                    {/* Connecting Line 1 */}
                    <div className={`flex-1 h-0.5 rounded-full ${step > 1 ? 'bg-[#2AA198]' : 'bg-[#F5ECDE]'}`} />

                    {/* Step 2 badge */}
                    <div className={`flex items-center gap-2 text-xs sm:text-sm font-bold ${
                      step === 2 ? 'text-[#232536]' : step > 2 ? 'text-[#2AA198]' : 'text-[#A9ACBC]'
                    }`}>
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                        step === 2
                          ? 'bg-[#EF5B45] text-white'
                          : step > 2
                          ? 'bg-[#2AA198] text-white'
                          : 'bg-[#F5ECDE] text-[#5A5D70]'
                      }`}>
                        {step > 2 ? '✓' : '2'}
                      </div>
                      <span className="hidden sm:inline">The problem</span>
                    </div>

                    {/* Connecting Line 2 */}
                    <div className={`flex-1 h-0.5 rounded-full ${step > 2 ? 'bg-[#2AA198]' : 'bg-[#F5ECDE]'}`} />

                    {/* Step 3 badge */}
                    <div className={`flex items-center gap-2 text-xs sm:text-sm font-bold ${
                      step === 3 ? 'text-[#232536]' : 'text-[#A9ACBC]'
                    }`}>
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                        step === 3
                          ? 'bg-[#EF5B45] text-white'
                          : 'bg-[#F5ECDE] text-[#5A5D70]'
                      }`}>
                        3
                      </div>
                      <span className="hidden sm:inline">Review</span>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                    {submitError}
                  </div>
                )}

                {/* Visually hidden honeypot spam guard */}
                <div
                  aria-hidden="true"
                  className="opacity-0 absolute top-0 left-0 h-0 w-0 z-[-1] pointer-events-none overflow-hidden"
                  tabIndex={-1}
                  style={{ display: 'none' }}
                >
                  <label htmlFor="contact_ref_code">Leave this field empty</label>
                  <input
                    id="contact_ref_code"
                    type="text"
                    name="contact_ref_code"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.contact_ref_code || ''}
                    onChange={(e) => setFormData({ ...formData, contact_ref_code: e.target.value })}
                  />
                </div>

                {/* ================= STEP 1: ABOUT YOU ================= */}
                {step === 1 && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-[#232536] mb-2" htmlFor="tName">
                        Your name
                      </label>
                      <input
                        id="tName"
                        type="text"
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value })
                          if (errors.name) setErrors({ ...errors, name: undefined })
                        }}
                        className={`w-full px-4 py-3.5 rounded-2xl border-2 text-base bg-[#FDF8F1] text-[#232536] focus:bg-white focus:outline-none transition ${
                          errors.name ? 'border-[#EF5B45]' : 'border-[#F5ECDE] focus:border-[#EF5B45]'
                        }`}
                      />
                      {errors.name && (
                        <p className="text-xs font-bold text-[#EF5B45] mt-1.5">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#232536] mb-2" htmlFor="tEmail">
                        Email
                      </label>
                      <input
                        id="tEmail"
                        type="email"
                        placeholder="you@yourorganisation.com"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          if (errors.email) setErrors({ ...errors, email: undefined })
                        }}
                        className={`w-full px-4 py-3.5 rounded-2xl border-2 text-base bg-[#FDF8F1] text-[#232536] focus:bg-white focus:outline-none transition ${
                          errors.email ? 'border-[#EF5B45]' : 'border-[#F5ECDE] focus:border-[#EF5B45]'
                        }`}
                      />
                      {errors.email && (
                        <p className="text-xs font-bold text-[#EF5B45] mt-1.5">{errors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-[#232536] mb-2" htmlFor="tOrg">
                        Organisation <span className="font-normal text-[#A9ACBC]">(optional)</span>
                      </label>
                      <input
                        id="tOrg"
                        type="text"
                        placeholder="Your company, school, or nonprofit"
                        value={formData.organisation}
                        onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-2xl border-2 border-[#F5ECDE] text-base bg-[#FDF8F1] text-[#232536] focus:bg-white focus:outline-none focus:border-[#EF5B45] transition"
                      />
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleNextStep(1)}
                        className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-3.5 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <span>Continue</span>
                        <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 2: THE PROBLEM ================= */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-[#232536] mb-2" htmlFor="tProblem">
                        What&rsquo;s not working?
                      </label>
                      <textarea
                        id="tProblem"
                        rows={4}
                        placeholder="In your own words - the messier the better. e.g. 'We've grown to 15 staff and everything still lives in the founder's head. Nothing is documented, reporting is chaotic…'"
                        value={formData.problem}
                        onChange={(e) => {
                          setFormData({ ...formData, problem: e.target.value })
                          if (errors.problem) setErrors({ ...errors, problem: undefined })
                        }}
                        className={`w-full px-4 py-3.5 rounded-2xl border-2 text-base bg-[#FDF8F1] text-[#232536] focus:bg-white focus:outline-none transition min-h-[120px] ${
                          errors.problem ? 'border-[#EF5B45]' : 'border-[#F5ECDE] focus:border-[#EF5B45]'
                        }`}
                      />
                      {errors.problem && (
                        <p className="text-xs font-bold text-[#EF5B45] mt-1.5">{errors.problem}</p>
                      )}
                    </div>

                    {/* Choice Pills: What kind of help */}
                    <div>
                      <label className="block text-sm font-bold text-[#232536] mb-2.5">
                        What kind of help are you exploring?
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {HELP_OPTIONS.map((opt) => {
                          const isSelected = formData.help_type === opt
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setFormData({ ...formData, help_type: opt })}
                              className={`px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#232536] text-white border-[#232536] shadow-sm'
                                  : 'bg-white text-[#5A5D70] border-[#F5ECDE] hover:border-[#5A5D70]'
                              }`}
                            >
                              {opt}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Choice Pills: How soon */}
                    <div>
                      <label className="block text-sm font-bold text-[#232536] mb-2.5">
                        How soon do you want to start?
                      </label>
                      <div className="flex flex-wrap gap-2.5">
                        {TIMING_OPTIONS.map((t) => {
                          const isSelected = formData.timing === t.value || formData.timing === t.label
                          return (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() => setFormData({ ...formData, timing: t.value })}
                              className={`px-4 py-2.5 rounded-full text-sm font-semibold border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#232536] text-white border-[#232536] shadow-sm'
                                  : 'bg-white text-[#5A5D70] border-[#F5ECDE] hover:border-[#5A5D70]'
                              }`}
                            >
                              {t.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleBack(2)}
                        className="text-[#5A5D70] hover:text-[#232536] text-sm font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        &larr; Back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleNextStep(2)}
                        className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-3.5 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                      >
                        <span>Review</span>
                        <span aria-hidden="true">&rarr;</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 3: REVIEW ================= */}
                {step === 3 && (
                  <div className="space-y-6">
                    <p className="font-bold text-base text-[#232536]">
                      Quick check before it goes to my inbox:
                    </p>

                    {/* Review card */}
                    <div className="bg-[#FDF8F1] border border-[#F5ECDE] rounded-2xl p-5 sm:p-6 space-y-4">
                      {/* Name */}
                      <div className="border-b border-[#F5ECDE] pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A9ACBC] block">
                          Name
                        </span>
                        <p className="text-base text-[#232536] font-medium mt-0.5">{formData.name}</p>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs font-bold text-[#EF5B45] hover:underline mt-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Email */}
                      <div className="border-b border-[#F5ECDE] pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A9ACBC] block">
                          Email
                        </span>
                        <p className="text-base text-[#232536] font-medium mt-0.5">{formData.email}</p>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs font-bold text-[#EF5B45] hover:underline mt-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Organisation */}
                      <div className="border-b border-[#F5ECDE] pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A9ACBC] block">
                          Organisation
                        </span>
                        <p className="text-base text-[#232536] font-medium mt-0.5">
                          {formData.organisation || '-'}
                        </p>
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="text-xs font-bold text-[#EF5B45] hover:underline mt-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>

                      {/* What's not working */}
                      <div className="border-b border-[#F5ECDE] pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A9ACBC] block">
                          What&rsquo;s not working
                        </span>
                        <p className="text-base text-[#232536] font-medium mt-0.5 whitespace-pre-wrap leading-relaxed">
                          {formData.problem}
                        </p>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-xs font-bold text-[#EF5B45] hover:underline mt-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Type of help */}
                      <div className="border-b border-[#F5ECDE] pb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A9ACBC] block">
                          Type of help
                        </span>
                        <p className="text-base text-[#232536] font-medium mt-0.5">{formData.help_type}</p>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-xs font-bold text-[#EF5B45] hover:underline mt-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>

                      {/* Timing */}
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-[#A9ACBC] block">
                          Timing
                        </span>
                        <p className="text-base text-[#232536] font-medium mt-0.5">{formData.timing}</p>
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="text-xs font-bold text-[#EF5B45] hover:underline mt-1 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleBack(3)}
                        disabled={isSubmitting}
                        className="text-[#5A5D70] hover:text-[#232536] text-sm font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        &larr; Back
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 font-bold text-base px-8 py-3.5 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="animate-spin h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v8H4z"
                              />
                            </svg>
                            <span>Sending enquiry...</span>
                          </>
                        ) : (
                          <>
                            <span>Send enquiry</span>
                            <span aria-hidden="true">&#128228;</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* ================= STEP 4: SUCCESS ================= */}
                {step === 4 && (
                  <div className="py-6 text-center space-y-6">
                    {/* Big Check */}
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-[#2AA198] text-white text-3xl sm:text-4xl flex items-center justify-center mx-auto shadow-md">
                      ✓
                    </div>

                    <div className="space-y-2">
                      <h2 className="font-['MTN_Brighter_Sans',_sans-serif] text-2xl sm:text-3xl font-bold text-[#232536]">
                        Got it, {firstName}!
                      </h2>
                      <p className="text-base text-[#5A5D70] max-w-md mx-auto leading-relaxed">
                        Your enquiry is in my inbox. A confirmation is on its way to{' '}
                        <strong className="text-[#232536]">{formData.email}</strong>.
                      </p>
                    </div>

                    {/* Next Steps Box */}
                    <div className="bg-[#FDF8F1] border border-[#F5ECDE] rounded-2xl p-6 sm:p-7 text-left space-y-4 mt-6">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#2AA198]">
                        What happens next
                      </p>

                      <div className="space-y-4">
                        <div className="flex items-start gap-3.5">
                          <span className="text-xl flex-shrink-0">📧</span>
                          <div>
                            <h4 className="font-bold text-sm text-[#232536]">Within 2 business days</h4>
                            <p className="text-xs sm:text-sm text-[#5A5D70] mt-0.5 leading-relaxed">
                              A personal reply from me - with a couple of times for our 30-minute call.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <span className="text-xl flex-shrink-0">💬</span>
                          <div>
                            <h4 className="font-bold text-sm text-[#232536]">The call</h4>
                            <p className="text-xs sm:text-sm text-[#5A5D70] mt-0.5 leading-relaxed">
                              We dig into what&rsquo;s not working. Come as you are; no preparation needed.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3.5">
                          <span className="text-xl flex-shrink-0">🧭</span>
                          <div>
                            <h4 className="font-bold text-sm text-[#232536]">Meanwhile</h4>
                            <p className="text-xs sm:text-sm text-[#5A5D70] mt-0.5 leading-relaxed">
                              If you&rsquo;d like a head start, my writing on systems and structure is a good place to begin.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Return buttons */}
                    <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                      <Link
                        href="/garden"
                        className="inline-flex items-center justify-center font-bold text-sm px-6 py-3 rounded-full bg-white text-[#232536] border-2 border-[#F5ECDE] hover:bg-[#F5ECDE] shadow-sm transition-all"
                      >
                        Wander the Garden
                      </Link>
                      <Link
                        href="/"
                        className="inline-flex items-center justify-center font-bold text-sm px-6 py-3 rounded-full bg-[#EF5B45] hover:bg-[#D94834] text-white shadow-[0_6px_18px_rgba(239,91,69,0.32)] transition-all"
                      >
                        Back to home
                      </Link>
                    </div>
                  </div>
                )}

              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </div>
  )
}
