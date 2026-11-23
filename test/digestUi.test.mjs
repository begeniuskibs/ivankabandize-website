import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getDigestKind,
  digestKindPluralLabel,
  digestKindSingularLabel,
  getAvailableDigestKinds,
  getDistinctDigestTopics,
  filterDigests,
  buildDigestHref,
  digestCountLabel,
} from '../lib/digestUi.ts'

describe('digestUi - helpers', () => {
  describe('getDigestKind', () => {
    it('defaults to "report" when kind is omitted or undefined', () => {
      assert.equal(getDigestKind({}), 'report')
      assert.equal(getDigestKind({ kind: undefined }), 'report')
    })

    it('returns the specified kind when present', () => {
      assert.equal(getDigestKind({ kind: 'report' }), 'report')
      assert.equal(getDigestKind({ kind: 'research' }), 'research')
      assert.equal(getDigestKind({ kind: 'essay' }), 'essay')
    })
  })

  describe('digestKindPluralLabel', () => {
    it('returns Reports for report', () => {
      assert.equal(digestKindPluralLabel('report'), 'Reports')
      assert.equal(digestKindPluralLabel('REPORT'), 'Reports')
      assert.equal(digestKindPluralLabel('  report  '), 'Reports')
    })

    it('returns Research for research', () => {
      assert.equal(digestKindPluralLabel('research'), 'Research')
      assert.equal(digestKindPluralLabel('RESEARCH'), 'Research')
      assert.equal(digestKindPluralLabel('  research  '), 'Research')
    })

    it('returns Essays for essay', () => {
      assert.equal(digestKindPluralLabel('essay'), 'Essays')
      assert.equal(digestKindPluralLabel('ESSAY'), 'Essays')
      assert.equal(digestKindPluralLabel('  essay  '), 'Essays')
    })

    it('handles empty or non-string inputs safely', () => {
      assert.equal(digestKindPluralLabel(''), '')
      assert.equal(digestKindPluralLabel(null), '')
      assert.equal(digestKindPluralLabel(undefined), '')
    })
  })

  describe('digestKindSingularLabel', () => {
    it('returns Report Digest for report or empty', () => {
      assert.equal(digestKindSingularLabel('report'), 'Report Digest')
      assert.equal(digestKindSingularLabel(''), 'Report Digest')
      assert.equal(digestKindSingularLabel(null), 'Report Digest')
      assert.equal(digestKindSingularLabel(undefined), 'Report Digest')
    })

    it('returns Research Digest for research', () => {
      assert.equal(digestKindSingularLabel('research'), 'Research Digest')
    })

    it('returns Essay for essay', () => {
      assert.equal(digestKindSingularLabel('essay'), 'Essay')
    })
  })

  describe('getAvailableDigestKinds', () => {
    it('returns only Reports when all digests have default kind (omitted)', () => {
      const digests = [
        { id: '1', slug: 'd1', topic: 'Technology' },
        { id: '2', slug: 'd2', topic: 'Faith' },
      ]
      const kinds = getAvailableDigestKinds(digests)
      assert.deepEqual(kinds, [{ key: 'report', label: 'Reports' }])
    })

    it('returns both Reports and Research when a research digest is added, keeping canonical order', () => {
      const digests = [
        { id: '1', slug: 'd1', topic: 'Technology' },
        { id: '2', slug: 'd2', topic: 'Faith', kind: 'research' },
      ]
      const kinds = getAvailableDigestKinds(digests)
      assert.deepEqual(kinds, [
        { key: 'report', label: 'Reports' },
        { key: 'research', label: 'Research' },
      ])
    })

    it('hides empty kinds and preserves strict canonical order (report, research, essay)', () => {
      // Test when only report and essay exist (research is empty and thus hidden)
      const reportAndEssay = [
        { id: '1', slug: 'd1', topic: 'Technology', kind: 'report' },
        { id: '2', slug: 'd2', topic: 'Writing', kind: 'essay' },
      ]
      assert.deepEqual(getAvailableDigestKinds(reportAndEssay), [
        { key: 'report', label: 'Reports' },
        { key: 'essay', label: 'Essays' },
      ])

      // Test when all three kinds exist: order is strictly report, research, essay
      const allThree = [
        { id: '3', slug: 'd3', topic: 'Writing', kind: 'essay' },
        { id: '2', slug: 'd2', topic: 'Science', kind: 'research' },
        { id: '1', slug: 'd1', topic: 'Business', kind: 'report' },
      ]
      assert.deepEqual(getAvailableDigestKinds(allThree), [
        { key: 'report', label: 'Reports' },
        { key: 'research', label: 'Research' },
        { key: 'essay', label: 'Essays' },
      ])
    })

    it('returns empty array for empty input', () => {
      assert.deepEqual(getAvailableDigestKinds([]), [])
      assert.deepEqual(getAvailableDigestKinds(null), [])
    })
  })

  describe('getDistinctDigestTopics', () => {
    it('extracts unique topics, sorts them alphabetically, and provides clean slugs', () => {
      const digests = [
        { id: '1', slug: 'd1', topic: 'Work' },
        { id: '2', slug: 'd2', topic: 'Technology' },
        { id: '3', slug: 'd3', topic: 'Faith' },
        { id: '4', slug: 'd4', topic: 'technology' },
      ]
      const topics = getDistinctDigestTopics(digests)
      assert.deepEqual(topics, [
        { name: 'Faith', slug: 'faith' },
        { name: 'Technology', slug: 'technology' },
        { name: 'Work', slug: 'work' },
      ])
    })

    it('handles empty or non-array inputs safely', () => {
      assert.deepEqual(getDistinctDigestTopics([]), [])
      assert.deepEqual(getDistinctDigestTopics(null), [])
    })
  })

  describe('filterDigests', () => {
    const digests = [
      { id: '1', slug: 'd1', topic: 'Technology', kind: 'report' },
      { id: '2', slug: 'd2', topic: 'Faith' }, // defaults to report
      { id: '3', slug: 'd3', topic: 'Work', kind: 'research' },
      { id: '4', slug: 'd4', topic: 'Culture', kind: 'essay' }, // essay fixture
    ]

    it('returns all when type and topic are empty, null, or "all"', () => {
      assert.deepEqual(filterDigests(digests, null, null), digests)
      assert.deepEqual(filterDigests(digests, 'all', 'all'), digests)
      assert.deepEqual(filterDigests(digests, '', ''), digests)
    })

    it('filters by type including essay fixture', () => {
      const reports = filterDigests(digests, 'report', null)
      assert.equal(reports.length, 2)
      assert.equal(reports[0].id, '1')
      assert.equal(reports[1].id, '2')

      const research = filterDigests(digests, 'research', null)
      assert.equal(research.length, 1)
      assert.equal(research[0].id, '3')

      const essays = filterDigests(digests, 'essay', null)
      assert.equal(essays.length, 1)
      assert.equal(essays[0].id, '4')
      assert.equal(essays[0].kind, 'essay')
    })

    it('filters by topic slug', () => {
      const faith = filterDigests(digests, null, 'faith')
      assert.equal(faith.length, 1)
      assert.equal(faith[0].id, '2')

      const culture = filterDigests(digests, null, 'culture')
      assert.equal(culture.length, 1)
      assert.equal(culture[0].id, '4')
    })

    it('combines type and topic filters', () => {
      const match = filterDigests(digests, 'report', 'technology')
      assert.equal(match.length, 1)
      assert.equal(match[0].id, '1')

      const essayMatch = filterDigests(digests, 'essay', 'culture')
      assert.equal(essayMatch.length, 1)
      assert.equal(essayMatch[0].id, '4')

      const noMatch = filterDigests(digests, 'research', 'technology')
      assert.equal(noMatch.length, 0)
    })
  })

  describe('buildDigestHref', () => {
    it('builds clean URL without parameters when none provided', () => {
      assert.equal(buildDigestHref(null, null), '/garden/digests')
    })

    it('adds type and topic search params', () => {
      assert.equal(buildDigestHref('report', null), '/garden/digests?type=report')
      assert.equal(buildDigestHref('essay', null), '/garden/digests?type=essay')
      assert.equal(buildDigestHref(null, 'faith'), '/garden/digests?topic=faith')
      assert.equal(
        buildDigestHref('report', 'faith'),
        '/garden/digests?type=report&topic=faith'
      )
      assert.equal(
        buildDigestHref('essay', 'culture'),
        '/garden/digests?type=essay&topic=culture'
      )
    })
  })

  describe('digestCountLabel', () => {
    it('returns "0 digests" for 0', () => {
      assert.equal(digestCountLabel(0), '0 digests')
    })

    it('returns "1 digest" for 1', () => {
      assert.equal(digestCountLabel(1), '1 digest')
    })

    it('returns "2 digests" for 2', () => {
      assert.equal(digestCountLabel(2), '2 digests')
    })

    it('returns "4 digests" for 4', () => {
      assert.equal(digestCountLabel(4), '4 digests')
    })
  })
})
