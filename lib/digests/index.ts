import { aiChristianBenchmark } from './ai-christian-benchmark'
import { techTrends2026 } from './tech-trends-2026'
import { aiLaborMarket } from './ai-labor-market'
import type { Digest } from './types'

export * from './types'
export { aiChristianBenchmark } from './ai-christian-benchmark'
export { techTrends2026 } from './tech-trends-2026'
export { aiLaborMarket } from './ai-labor-market'

export const DIGESTS: Digest[] = [
  aiChristianBenchmark,
  techTrends2026,
  aiLaborMarket,
]

export const DIGESTS_BY_SLUG: Record<string, Digest> = {
  'ai-christian-benchmark': aiChristianBenchmark,
  'tech-trends-2026': techTrends2026,
  'ai-labor-market': aiLaborMarket,
}

export function getAllDigests(): Digest[] {
  return DIGESTS
}

export function getDigestBySlug(slug: string): Digest | null {
  return DIGESTS_BY_SLUG[slug] || null
}
