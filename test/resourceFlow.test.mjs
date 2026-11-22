// Unit tests for Resource Flow v2 pure functions
// House style: spaced hyphen " - " only

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  BRAND_CONFETTI_COLORS,
  INTENDED_USE_OPTIONS,
  VALID_INTENDED_USE_VALUES,
  getFirstName,
  isValidIntendedUse,
  makeConfettiPieces,
  normaliseIntendedUse,
  shouldAnimate,
} from '../lib/resourceFlow.ts'

describe('Resource Flow - Intended Use Options and Constants', () => {
  it('exposes the expected intended use dropdown options', () => {
    assert.equal(INTENDED_USE_OPTIONS.length, 4)
    assert.deepEqual(INTENDED_USE_OPTIONS[0], { value: '', label: 'Choose one' })
    assert.deepEqual(INTENDED_USE_OPTIONS[1], { value: 'myself', label: 'For myself' })
    assert.deepEqual(INTENDED_USE_OPTIONS[2], {
      value: 'team',
      label: 'For my team or organisation',
    })
    assert.deepEqual(INTENDED_USE_OPTIONS[3], { value: 'curious', label: 'Just curious' })
  })

  it('exposes the valid intended use values', () => {
    assert.deepEqual(VALID_INTENDED_USE_VALUES, [
      'myself',
      'team',
      'church_ministry',
      'curious',
    ])
  })
})

describe('Resource Flow - normaliseIntendedUse', () => {
  it('returns valid values untouched or trimmed', () => {
    assert.equal(normaliseIntendedUse('myself'), 'myself')
    assert.equal(normaliseIntendedUse('team'), 'team')
    assert.equal(normaliseIntendedUse('church_ministry'), 'church_ministry')
    assert.equal(normaliseIntendedUse('curious'), 'curious')
    assert.equal(normaliseIntendedUse('  myself  '), 'myself')
  })

  it('normalises empty, missing, or null to null', () => {
    assert.equal(normaliseIntendedUse(null), null)
    assert.equal(normaliseIntendedUse(undefined), null)
    assert.equal(normaliseIntendedUse(''), null)
    assert.equal(normaliseIntendedUse('   '), null)
  })

  it('normalises invalid strings or non-strings to null', () => {
    assert.equal(normaliseIntendedUse('other'), null)
    assert.equal(normaliseIntendedUse('company'), null)
    assert.equal(normaliseIntendedUse(123), null)
    assert.equal(normaliseIntendedUse({}), null)
    assert.equal(normaliseIntendedUse([]), null)
    assert.equal(normaliseIntendedUse(true), null)
  })
})

describe('Resource Flow - isValidIntendedUse', () => {
  it('considers missing or blank values valid (optional field)', () => {
    assert.equal(isValidIntendedUse(null), true)
    assert.equal(isValidIntendedUse(undefined), true)
    assert.equal(isValidIntendedUse(''), true)
    assert.equal(isValidIntendedUse('   '), true)
  })

  it('considers valid option strings valid', () => {
    assert.equal(isValidIntendedUse('myself'), true)
    assert.equal(isValidIntendedUse('team'), true)
    assert.equal(isValidIntendedUse('church_ministry'), true)
    assert.equal(isValidIntendedUse('curious'), true)
    assert.equal(isValidIntendedUse('  team  '), true)
  })

  it('rejects invalid option strings', () => {
    assert.equal(isValidIntendedUse('freelance'), false)
    assert.equal(isValidIntendedUse('school'), false)
    assert.equal(isValidIntendedUse('unknown'), false)
  })

  it('rejects non-string types', () => {
    assert.equal(isValidIntendedUse(123), false)
    assert.equal(isValidIntendedUse(true), false)
    assert.equal(isValidIntendedUse({}), false)
    assert.equal(isValidIntendedUse(['myself']), false)
  })
})

describe('Resource Flow - getFirstName', () => {
  it('extracts first name from full name strings', () => {
    assert.equal(getFirstName('Ivan'), 'Ivan')
    assert.equal(getFirstName('Ivan Kabandize'), 'Ivan')
    assert.equal(getFirstName('Mary Jane Watson'), 'Mary')
    assert.equal(getFirstName('  Alice   Smith  '), 'Alice')
  })

  it('returns empty string for empty or non-string inputs', () => {
    assert.equal(getFirstName(''), '')
    assert.equal(getFirstName('    '), '')
    assert.equal(getFirstName(null), '')
    assert.equal(getFirstName(undefined), '')
    assert.equal(getFirstName(12345), '')
    assert.equal(getFirstName({}), '')
  })
})

describe('Resource Flow - Confetti Generator and Motion', () => {
  it('generates 36 pieces by default with expected properties', () => {
    const pieces = makeConfettiPieces()
    assert.equal(pieces.length, 36)

    for (let i = 0; i < pieces.length; i++) {
      const p = pieces[i]
      assert.equal(p.id, i)
      assert.equal(typeof p.vx, 'number')
      assert.equal(typeof p.vy, 'number')
      assert.equal(typeof p.size, 'number')
      assert.equal(typeof p.rotation, 'number')
      assert.equal(typeof p.delayMs, 'number')
      assert.ok(BRAND_CONFETTI_COLORS.includes(p.color))
    }
  })

  it('respects custom count', () => {
    const pieces = makeConfettiPieces(12)
    assert.equal(pieces.length, 12)
  })

  it('is deterministic for a given seed', () => {
    const run1 = makeConfettiPieces(20, 42)
    const run2 = makeConfettiPieces(20, 42)
    assert.deepEqual(run1, run2)
  })

  it('produces different sequences for different seeds', () => {
    const run1 = makeConfettiPieces(10, 1)
    const run2 = makeConfettiPieces(10, 2)
    assert.notDeepEqual(run1, run2)
  })

  it('shouldAnimate evaluates prefers-reduced-motion correctly', () => {
    assert.equal(shouldAnimate(true), false)
    assert.equal(shouldAnimate(false), true)
  })
})
