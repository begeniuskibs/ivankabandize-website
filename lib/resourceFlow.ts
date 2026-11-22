// Pure helpers for resources download flow v2 (intended use, names, confetti, motion)
// House style: spaced hyphen " - " only

export interface IntendedUseOption {
  value: string
  label: string
}

export const INTENDED_USE_OPTIONS: readonly IntendedUseOption[] = [
  { value: '', label: 'Choose one' },
  { value: 'myself', label: 'For myself' },
  { value: 'team', label: 'For my team or organisation' },
  { value: 'curious', label: 'Just curious' },
] as const

// 'church_ministry' is a legacy value accepted for backward compatibility, but no longer offered in the form
export type IntendedUseValue = 'myself' | 'team' | 'church_ministry' | 'curious'

export const VALID_INTENDED_USE_VALUES: readonly string[] = [
  'myself',
  'team',
  'church_ministry', // legacy value: accepted for existing records and backwards compatibility, but no longer offered
  'curious',
]

/**
 * Normalises an intended use value.
 * Missing, undefined, null, or whitespace-only strings normalise to null.
 * Valid values ('myself', 'team', 'church_ministry', 'curious') return their string.
 * Invalid values return null.
 */
export function normaliseIntendedUse(value: unknown): IntendedUseValue | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (VALID_INTENDED_USE_VALUES.includes(trimmed)) {
    return trimmed as IntendedUseValue
  }
  return null
}

/**
 * Checks whether an intended use input is valid.
 * Missing/empty inputs are valid (optional field).
 * Non-empty strings must match one of the 4 allowed values.
 * Non-string values (numbers, booleans, objects) are invalid.
 */
export function isValidIntendedUse(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value !== 'string') return false
  const trimmed = value.trim()
  if (!trimmed) return true
  return VALID_INTENDED_USE_VALUES.includes(trimmed)
}

/**
 * Extracts the first name from a user full name:
 * the first word of the trimmed name, or "" if empty or not a string.
 */
export function getFirstName(name: unknown): string {
  if (typeof name !== 'string') return ''
  const trimmed = name.trim()
  if (!trimmed) return ''
  const firstWord = trimmed.split(/\s+/)[0]
  return firstWord || ''
}

export interface ConfettiPiece {
  id: number
  vx: number
  vy: number
  color: string
  size: number
  rotation: number
  delayMs: number
}

export const BRAND_CONFETTI_COLORS: readonly string[] = [
  '#EF5B45',
  '#CF3F29',
  '#232536',
  '#1E7E5A',
  '#F0E4D2',
]

/**
 * Generates a deterministic array of confetti pieces using a linear congruential generator.
 */
export function makeConfettiPieces(count = 36, seed = 1): ConfettiPiece[] {
  let s = Math.abs(seed) || 1
  function nextRand(): number {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }

  const pieces: ConfettiPiece[] = []
  for (let i = 0; i < count; i++) {
    const angle = nextRand() * Math.PI * 2
    const speed = 40 + nextRand() * 90
    const vx = Math.cos(angle) * speed
    const vy = -Math.abs(Math.sin(angle) * speed) - 30
    const color = BRAND_CONFETTI_COLORS[i % BRAND_CONFETTI_COLORS.length]
    const size = 6 + Math.round(nextRand() * 6)
    const rotation = Math.round(nextRand() * 360)
    const delayMs = Math.round(nextRand() * 120)

    pieces.push({
      id: i,
      vx: Math.round(vx),
      vy: Math.round(vy),
      color,
      size,
      rotation,
      delayMs,
    })
  }

  return pieces
}

/**
 * Evaluates whether to run animations based on prefers-reduced-motion.
 */
export function shouldAnimate(prefersReducedMotion: boolean): boolean {
  return !prefersReducedMotion
}
