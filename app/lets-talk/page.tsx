'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface FormData {
  name: string
  email: string
  organisation: string
  problem: string
  help_type: string
  timing: string
}

const HELP_TYPE_OPTIONS = [
  'Advisory & Architecture',
  'Engineering & Delivery',
  'Data & AI Pipelines',
  'Full-Stack Systems',
  'General Consultation',
]

const TIMING_OPTIONS = [
  'Immediately',
  'Within 1 month',
  '1–3 months',
  'Exploring options',
]

export default function LetsTalkPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    organisation: '',
    problem: '',
    help_type: '',
    timing: '',
  })

  const [errors, setErrors] = useState<{ name?: string; email?: string; problem?: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const validateStep1 = () => {
    const newErrors: { name?: string; email?: string } = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Please enter your name.'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Please enter your email address.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email address.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors: { problem?: string } = {}
    if (!formData.problem.trim()) {
      newErrors.problem = 'Please describe what you are looking to solve or build.'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2)
    } else if (step === 2) {
      if (validateStep2()) setStep(3)
    }
  }

  const handlePrevStep = () => {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const supabase = createClient()

      // 1. Primary source of truth: Insert into live inquiries table
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

      // 2. Secondary server-side notification trigger (non-blocking for UI success)
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
        }),
      }).catch((err) => {
        console.error('Server email notification error (non-fatal):', err)
      })

      // 3. Transition to success step
      setStep(4)
    } catch (err: any) {
      console.error('Submission failed:', err)
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[80vh] py-12 md:py-20 font-sans">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-2">
            Get in Touch
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Let&apos;s Talk
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
            Tell me about your project, engineering problem, or strategic initiative.
          </p>
        </div>

        {/* Progress Bar (Visible on Steps 1–3) */}
        {step < 4 && (
          <div className="mb-10">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-2">
              <span className={step >= 1 ? 'text-black font-bold' : ''}>1. About You</span>
              <span className={step >= 2 ? 'text-black font-bold' : ''}>2. The Problem</span>
              <span className={step >= 3 ? 'text-black font-bold' : ''}>3. Review</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-black h-full transition-all duration-300 ease-out"
                style={{ width: `${((step - 1) / 2) * 100 || 10}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Container */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 sm:p-10 shadow-sm">
          {submitError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              {submitError}
            </div>
          )}

          {/* STEP 1: About You */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">About You</h2>
                <p className="text-sm text-gray-500">Who are you and how can I reach you?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5" htmlFor="name">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-black transition ${
                    errors.name ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5" htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="jane@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-black transition ${
                    errors.email ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.email && <p className="text-xs text-red-600 mt-1.5">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5" htmlFor="organisation">
                  Organisation / Company <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="organisation"
                  type="text"
                  placeholder="Acme Corp"
                  value={formData.organisation}
                  onChange={(e) => setFormData({ ...formData, organisation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-black transition"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-7 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                >
                  Continue &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: The Problem */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">The Problem</h2>
                <p className="text-sm text-gray-500">What are you looking to solve, build, or accelerate?</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1.5" htmlFor="problem">
                  Problem Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="problem"
                  rows={4}
                  placeholder="Describe your current challenge, architectural bottleneck, or what you'd like to achieve..."
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-black transition ${
                    errors.problem ? 'border-red-400 bg-red-50/20' : 'border-gray-200'
                  }`}
                />
                {errors.problem && <p className="text-xs text-red-600 mt-1.5">{errors.problem}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Type of Help <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {HELP_TYPE_OPTIONS.map((option) => {
                    const isSelected = formData.help_type === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            help_type: isSelected ? '' : option,
                          })
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Timing <span className="text-xs text-gray-400 font-normal">(Optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIMING_OPTIONS.map((timing) => {
                    const isSelected = formData.timing === timing
                    return (
                      <button
                        key={timing}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            timing: isSelected ? '' : timing,
                          })
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition ${
                          isSelected
                            ? 'bg-black text-white border-black shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {timing}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:border-black transition"
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-7 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm"
                >
                  Review Inquiry &rarr;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Review */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Review Your Inquiry</h2>
                <p className="text-sm text-gray-500">Please confirm everything looks correct before submitting.</p>
              </div>

              {/* Review Section 1: Contact Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Contact Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs font-semibold text-black hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Name</span>
                    <span className="font-medium text-gray-900">{formData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Email</span>
                    <span className="font-medium text-gray-900">{formData.email}</span>
                  </div>
                  {formData.organisation && (
                    <div className="sm:col-span-2">
                      <span className="text-gray-500 text-xs block">Organisation</span>
                      <span className="font-medium text-gray-900">{formData.organisation}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Review Section 2: Project Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Inquiry Details
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-xs font-semibold text-black hover:underline"
                  >
                    Edit
                  </button>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs block">Problem Description</span>
                    <p className="font-medium text-gray-900 whitespace-pre-wrap mt-0.5 leading-relaxed">
                      {formData.problem}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-gray-200/40">
                    <div>
                      <span className="text-gray-500 text-xs block">Type of Help</span>
                      <span className="font-medium text-gray-900">
                        {formData.help_type || 'Unspecified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs block">Timing</span>
                      <span className="font-medium text-gray-900">{formData.timing || 'Flexible'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:border-black transition disabled:opacity-50"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
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
                      Sending Inquiry...
                    </>
                  ) : (
                    'Submit Inquiry'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success State */}
          {step === 4 && (
            <div className="py-8 text-center space-y-5">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Inquiry Received</h2>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out, <span className="font-semibold text-gray-900">{formData.name}</span>. Your submission has been securely recorded, and I will review it and get back to you shortly.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/"
                  className="px-6 py-2.5 rounded-full bg-black text-white text-sm font-medium hover:bg-gray-800 transition"
                >
                  Return to Homepage
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({
                      name: '',
                      email: '',
                      organisation: '',
                      problem: '',
                      help_type: '',
                      timing: '',
                    })
                    setStep(1)
                  }}
                  className="px-6 py-2.5 rounded-full border border-gray-200 text-gray-700 text-sm font-medium hover:border-black transition"
                >
                  Submit Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
