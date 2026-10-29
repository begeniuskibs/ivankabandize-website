// Unit tests for resolvePublishedAt pure helper using node:test
// Covers six essential state transitions:
// 1. draft with date + Save Draft
// 2. draft with date + Publish
// 3. draft without date + Publish
// 4. draft without date + Save Draft
// 5. published post + edit and save
// 6. scheduled with an explicit date
// House style: spaced hyphen only

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { resolvePublishedAt } from '../lib/resolvePublishedAt.ts'

describe('resolvePublishedAt', () => {
  const fixedNow = '2026-10-29T12:00:00.000Z'
  const originalDate = '2023-10-27T11:00:37.000Z'
  const explicitScheduledDate = '2026-12-01T09:00:00.000Z'

  it('1. draft with date + Save Draft: preserves stored date even when incoming is null or omitted', () => {
    // When client sends null or stored date on draft save, original date is preserved
    const resultNull = resolvePublishedAt({
      incomingPublishedAt: null,
      existingPublishedAt: originalDate,
      publishStatus: 'draft',
      now: fixedNow,
    })
    assert.equal(resultNull, originalDate)

    const resultSame = resolvePublishedAt({
      incomingPublishedAt: originalDate,
      existingPublishedAt: originalDate,
      publishStatus: 'draft',
      now: fixedNow,
    })
    assert.equal(resultSame, originalDate)
  })

  it('2. draft with date + Publish: preserves stored date when published without explicit new date', () => {
    // When publishing a draft that already had a date, original date is preserved
    const resultNull = resolvePublishedAt({
      incomingPublishedAt: null,
      existingPublishedAt: originalDate,
      publishStatus: 'published',
      now: fixedNow,
    })
    assert.equal(resultNull, originalDate)

    const resultStored = resolvePublishedAt({
      incomingPublishedAt: originalDate,
      existingPublishedAt: originalDate,
      publishStatus: 'published',
      now: fixedNow,
    })
    assert.equal(resultStored, originalDate)
  })

  it('3. draft without date + Publish: sets published_at to current timestamp (now)', () => {
    // Publishing a fresh draft with no previous date assigns now
    const result = resolvePublishedAt({
      incomingPublishedAt: null,
      existingPublishedAt: null,
      publishStatus: 'published',
      now: fixedNow,
    })
    assert.equal(result, fixedNow)
  })

  it('4. draft without date + Save Draft: leaves published_at as null', () => {
    // Saving a fresh draft with no date leaves published_at null
    const result = resolvePublishedAt({
      incomingPublishedAt: null,
      existingPublishedAt: null,
      publishStatus: 'draft',
      now: fixedNow,
    })
    assert.equal(result, null)
  })

  it('5. published post + edit and save: preserves original published_at timestamp', () => {
    // Editing an already published post keeps its original publication date
    const resultNull = resolvePublishedAt({
      incomingPublishedAt: null,
      existingPublishedAt: originalDate,
      publishStatus: 'published',
      now: fixedNow,
    })
    assert.equal(resultNull, originalDate)

    const resultSame = resolvePublishedAt({
      incomingPublishedAt: originalDate,
      existingPublishedAt: originalDate,
      publishStatus: 'published',
      now: fixedNow,
    })
    assert.equal(resultSame, originalDate)
  })

  it('6. scheduled with an explicit date: explicit future schedule date wins', () => {
    // Scheduling with an explicit date always adopts that date
    const result = resolvePublishedAt({
      incomingPublishedAt: explicitScheduledDate,
      existingPublishedAt: originalDate,
      publishStatus: 'scheduled',
      now: fixedNow,
    })
    assert.equal(result, explicitScheduledDate)
  })
})
