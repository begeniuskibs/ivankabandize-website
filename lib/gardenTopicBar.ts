// Pure helpers for Garden topic bar item formatting
// House style: spaced hyphen " - " only

export interface GardenTopicItem {
  key: string
  label: string
  href?: string
}

export interface RawTopicInput {
  name?: string
  label?: string
  slug?: string
  key?: string
}

export function buildTopicBarItems(
  topics: RawTopicInput[] | null | undefined,
  buildHref?: (key: string | null) => string
): GardenTopicItem[] {
  const allItem: GardenTopicItem = {
    key: 'all',
    label: 'All topics',
    href: buildHref ? buildHref(null) : undefined,
  }

  if (!Array.isArray(topics) || topics.length === 0) {
    return [allItem]
  }

  const topicItems: GardenTopicItem[] = []
  for (const t of topics) {
    const key = (t.slug || t.key || '').trim()
    const label = (t.name || t.label || '').trim()
    if (!key && !label) continue
    const effectiveKey = key || label.toLowerCase()
    topicItems.push({
      key: effectiveKey,
      label: label || key,
      href: buildHref ? buildHref(effectiveKey) : undefined,
    })
  }

  return [allItem, ...topicItems]
}
