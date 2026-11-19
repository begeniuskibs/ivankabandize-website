// Pure parsing and sanitization for public resource page details (jsonb)
// House style: spaced hyphen " - " only

export interface FactItem {
  value: string
  label: string
}

export interface StepItem {
  title: string
  detail: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface RelatedItem {
  title: string
  href: string
  label: string
}

export interface PageDetails {
  facts: FactItem[]
  what_it_is: string
  who_for: string
  helps_with: string
  steps: StepItem[]
  works_well: string[]
  not_fit: string[]
  faq: FaqItem[]
  success_steps: StepItem[]
  related: RelatedItem[]
}

function trimString(val: unknown, maxLen: number): string {
  if (typeof val !== 'string') return ''
  const trimmed = val.trim()
  return trimmed.slice(0, maxLen)
}

function isValidHref(href: unknown): boolean {
  if (typeof href !== 'string') return false
  const trimmed = href.trim()
  if (trimmed.startsWith('https://')) return true
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return true
  return false
}

export function parsePageDetails(value: unknown): PageDetails {
  const empty: PageDetails = {
    facts: [],
    what_it_is: '',
    who_for: '',
    helps_with: '',
    steps: [],
    works_well: [],
    not_fit: [],
    faq: [],
    success_steps: [],
    related: [],
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return empty
  }

  try {
    const raw = value as Record<string, unknown>

    // 1. facts: max 4, { value: 24, label: 48 }
    const facts: FactItem[] = []
    if (Array.isArray(raw.facts)) {
      for (const item of raw.facts) {
        if (facts.length >= 4) break
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const v = trimString((item as Record<string, unknown>).value, 24)
          const l = trimString((item as Record<string, unknown>).label, 48)
          if (v && l) {
            facts.push({ value: v, label: l })
          }
        }
      }
    }

    // 2. what_it_is, who_for, helps_with: max 800 chars each
    const what_it_is = trimString(raw.what_it_is, 800)
    const who_for = trimString(raw.who_for, 800)
    const helps_with = trimString(raw.helps_with, 800)

    // 3. steps: max 8, { title: 120, detail: 400 }
    const steps: StepItem[] = []
    if (Array.isArray(raw.steps)) {
      for (const item of raw.steps) {
        if (steps.length >= 8) break
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const t = trimString((item as Record<string, unknown>).title, 120)
          const d = trimString((item as Record<string, unknown>).detail, 400)
          if (t && d) {
            steps.push({ title: t, detail: d })
          }
        }
      }
    }

    // 4. works_well, not_fit: max 6 items, max 200 chars each
    const works_well: string[] = []
    if (Array.isArray(raw.works_well)) {
      for (const item of raw.works_well) {
        if (works_well.length >= 6) break
        const s = trimString(item, 200)
        if (s) {
          works_well.push(s)
        }
      }
    }

    const not_fit: string[] = []
    if (Array.isArray(raw.not_fit)) {
      for (const item of raw.not_fit) {
        if (not_fit.length >= 6) break
        const s = trimString(item, 200)
        if (s) {
          not_fit.push(s)
        }
      }
    }

    // 5. faq: max 8, { q: 160, a: 600 }
    const faq: FaqItem[] = []
    if (Array.isArray(raw.faq)) {
      for (const item of raw.faq) {
        if (faq.length >= 8) break
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const q = trimString((item as Record<string, unknown>).q, 160)
          const a = trimString((item as Record<string, unknown>).a, 600)
          if (q && a) {
            faq.push({ q, a })
          }
        }
      }
    }

    // 6. success_steps: max 5, { title: 120, detail: 400 }
    const success_steps: StepItem[] = []
    if (Array.isArray(raw.success_steps)) {
      for (const item of raw.success_steps) {
        if (success_steps.length >= 5) break
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const t = trimString((item as Record<string, unknown>).title, 120)
          const d = trimString((item as Record<string, unknown>).detail, 400)
          if (t && d) {
            success_steps.push({ title: t, detail: d })
          }
        }
      }
    }

    // 7. related: max 4, { title: 120, href: valid, label: 60 }
    const related: RelatedItem[] = []
    if (Array.isArray(raw.related)) {
      for (const item of raw.related) {
        if (related.length >= 4) break
        if (item && typeof item === 'object' && !Array.isArray(item)) {
          const rawItem = item as Record<string, unknown>
          if (isValidHref(rawItem.href)) {
            const h = (rawItem.href as string).trim()
            const t = trimString(rawItem.title, 120)
            const l = trimString(rawItem.label, 60)
            if (t && l) {
              related.push({ title: t, href: h, label: l })
            }
          }
        }
      }
    }

    return {
      facts,
      what_it_is,
      who_for,
      helps_with,
      steps,
      works_well,
      not_fit,
      faq,
      success_steps,
      related,
    }
  } catch {
    return empty
  }
}
