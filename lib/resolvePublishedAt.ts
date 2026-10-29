// Helper to determine published_at timestamp during post creation or update
// Rules:
// a) Never erase or replace a stored published_at date on draft save
// b) When publishing: use explicit incoming date if provided, else stored date, else now
// c) When scheduling: explicit incoming date wins
// House style: spaced hyphen only

export interface ResolvePublishedAtInput {
  incomingPublishedAt?: string | null
  existingPublishedAt?: string | null
  publishStatus?: 'draft' | 'published' | 'scheduled' | string
  now?: string
}

export function resolvePublishedAt({
  incomingPublishedAt,
  existingPublishedAt,
  publishStatus,
  now = new Date().toISOString(),
}: ResolvePublishedAtInput): string | null {
  const incoming =
    incomingPublishedAt && incomingPublishedAt.trim() !== ''
      ? incomingPublishedAt
      : null

  const existing =
    existingPublishedAt && existingPublishedAt.trim() !== ''
      ? existingPublishedAt
      : null

  // Scheduling keeps current behaviour: an explicit future date wins
  if (publishStatus === 'scheduled') {
    return incoming || existing || null
  }

  // Publishing: use incoming if explicit non-null, else stored date, else now
  if (publishStatus === 'published') {
    if (incoming) {
      return incoming
    }
    if (existing) {
      return existing
    }
    return now
  }

  // Draft saves or updates:
  // If incoming is null/missing and stored row has a non-null date, preserve stored date
  if (!incoming && existing) {
    return existing
  }

  return incoming || null
}
