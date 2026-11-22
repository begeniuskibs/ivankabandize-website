import type { Digest } from './digests/types.ts'
import { slugifyCategory } from './resourceUi.ts'

// Pure helpers for Digests UI filtering, key category chips and topic strip
// House style: spaced hyphen " - " only

export const CANONICAL_DIGEST_KINDS = ['report', 'research', 'essay'] as const
export type CanonicalDigestKind = (typeof CANONICAL_DIGEST_KINDS)[number]

export function getDigestKind(digest: { kind?: 'report' | 'research' | 'essay' }): CanonicalDigestKind {
  return digest.kind || 'report'
}

export function digestKindPluralLabel(kind: string | null | undefined): string {
  if (!kind || typeof kind !== 'string') return ''
  const norm = kind.trim().toLowerCase()
  if (norm === 'report') return 'Reports'
  if (norm === 'research') return 'Research'
  if (norm === 'essay') return 'Essays'
  return norm.charAt(0).toUpperCase() + norm.slice(1)
}

export function digestKindSingularLabel(kind: string | null | undefined): string {
  if (!kind || typeof kind !== 'string') return 'Report Digest'
  const norm = kind.trim().toLowerCase()
  if (norm === 'research') return 'Research Digest'
  if (norm === 'essay') return 'Essay'
  return 'Report Digest'
}

export function getAvailableDigestKinds(
  digests: Digest[]
): Array<{ key: CanonicalDigestKind; label: string }> {
  if (!Array.isArray(digests)) return []
  return CANONICAL_DIGEST_KINDS.filter((k) =>
    digests.some((d) => getDigestKind(d) === k)
  ).map((k) => ({
    key: k,
    label: digestKindPluralLabel(k),
  }))
}

export function getDistinctDigestTopics(
  digests: Digest[]
): Array<{ name: string; slug: string }> {
  if (!Array.isArray(digests)) return []
  const map = new Map<string, string>()
  for (const d of digests) {
    const raw = (d.topic || '').trim()
    if (!raw) continue
    const key = raw.toLowerCase()
    if (!map.has(key)) {
      map.set(key, raw)
    }
  }
  return Array.from(map.values())
    .map((name) => ({
      name,
      slug: slugifyCategory(name),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function filterDigests(
  digests: Digest[],
  type?: string | null,
  topicSlug?: string | null
): Digest[] {
  if (!Array.isArray(digests)) return []
  let list = digests

  if (type && typeof type === 'string' && type.trim() && type.trim().toLowerCase() !== 'all') {
    const targetType = type.trim().toLowerCase()
    list = list.filter((d) => getDigestKind(d).toLowerCase() === targetType)
  }

  if (
    topicSlug &&
    typeof topicSlug === 'string' &&
    topicSlug.trim() &&
    topicSlug.trim().toLowerCase() !== 'all'
  ) {
    const targetTopic = topicSlug.trim().toLowerCase()
    list = list.filter((d) => slugifyCategory(d.topic) === targetTopic)
  }

  return list
}

export function buildDigestHref(type: string | null, topic: string | null): string {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (topic) params.set('topic', topic)
  const qs = params.toString()
  return qs ? `/garden/digests?${qs}` : '/garden/digests'
}
