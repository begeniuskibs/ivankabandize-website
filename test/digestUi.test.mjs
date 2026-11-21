import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getDigestKind,
  digestKindPluralLabel,
  getAvailableDigestKinds,
  getDistinctDigestTopics,
  filterDigests,
  buildDigestHref,
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

    it('handles empty or non-string inputs safely', () => {
      assert.equal(digestKindPluralLabel(''), '')
      assert.equal(digestKindPluralLabel(null), '')
      assert.equal(digestKindPluralLabel(undefined), '')
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

    it('returns both Reports and Research when a research digest is added', () => {
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
    ]

    it('returns all when type and topic are empty, null, or "all"', () => {
      assert.deepEqual(filterDigests(digests, null, null), digests)
      assert.deepEqual(filterDigests(digests, 'all', 'all'), digests)
      assert.deepEqual(filterDigests(digests, '', ''), digests)
    })

    it('filters by type', () => {
      const reports = filterDigests(digests, 'report', null)
      assert.equal(reports.length, 2)
      assert.equal(reports[0].id, '1')
      assert.equal(reports[1].id, '2')

      const research = filterDigests(digests, 'research', null)
      assert.equal(research.length, 1)
      assert.equal(research[0].id, '3')
    })

    it('filters by topic slug', () => {
      const faith = filterDigests(digests, null, 'faith')
      assert.equal(faith.length, 1)
      assert.equal(faith[0].id, '2')
    })

    it('combines type and topic filters', () => {
      const match = filterDigests(digests, 'report', 'technology')
      assert.equal(match.length, 1)
      assert.equal(match[0].id, '1')

      const noMatch = filterDigests(digests, 'research', 'technology')
      assert.equal(noMatch.length, 0)
    })
  })

  describe('buildDigestHref', () => {
    it('builds clean URL without parameters when none provided', () => {
      assert.equal(buildDigestHref(null, null), '/garden/report-digests')
    })

    it('adds type and topic search params', () => {
      assert.equal(buildDigestHref('report', null), '/garden/report-digests?type=report')
      assert.equal(buildDigestHref(null, 'faith'), '/garden/report-digests?topic=faith')
      assert.equal(
        buildDigestHref('report', 'faith'),
        '/garden/report-digests?type=report&topic=faith'
      )
    })
  })
})
