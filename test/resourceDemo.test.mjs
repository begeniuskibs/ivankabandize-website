// Unit tests for resource demo pure helpers (navigation & swipe)
// House style: spaced hyphen " - " only

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getNextTabIndex,
  getPrevTabIndex,
  getFirstTabIndex,
  getLastTabIndex,
  getSwipeDirection,
  getSwipedTabIndex,
} from '../lib/resourceDemo.ts'

describe('Resource Demo Navigation Helpers', () => {
  it('getNextTabIndex advances index and wraps around at total', () => {
    assert.equal(getNextTabIndex(0, 3), 1)
    assert.equal(getNextTabIndex(1, 3), 2)
    assert.equal(getNextTabIndex(2, 3), 0) // wraps to start
    assert.equal(getNextTabIndex(0, 1), 0)
    assert.equal(getNextTabIndex(0, 0), 0)
  })

  it('getPrevTabIndex decrements index and wraps around at 0', () => {
    assert.equal(getPrevTabIndex(2, 3), 1)
    assert.equal(getPrevTabIndex(1, 3), 0)
    assert.equal(getPrevTabIndex(0, 3), 2) // wraps to end
    assert.equal(getPrevTabIndex(0, 1), 0)
    assert.equal(getPrevTabIndex(0, 0), 0)
  })

  it('getFirstTabIndex returns 0', () => {
    assert.equal(getFirstTabIndex(), 0)
  })

  it('getLastTabIndex returns total - 1 or 0 if empty', () => {
    assert.equal(getLastTabIndex(4), 3)
    assert.equal(getLastTabIndex(1), 0)
    assert.equal(getLastTabIndex(0), 0)
  })
})

describe('Resource Demo Swipe Helpers', () => {
  it('identifies swipe direction using threshold', () => {
    // Swipe left (finger moves right to left): deltaX is negative
    assert.equal(getSwipeDirection(100, 50), 'left')
    assert.equal(getSwipeDirection(100, 60), 'left') // exactly -40

    // Swipe right (finger moves left to right): deltaX is positive
    assert.equal(getSwipeDirection(50, 100), 'right')
    assert.equal(getSwipeDirection(50, 90), 'right') // exactly 40

    // Below threshold: none
    assert.equal(getSwipeDirection(100, 70), 'none') // -30
    assert.equal(getSwipeDirection(70, 100), 'none') // 30
    assert.equal(getSwipeDirection(100, 100), 'none') // 0
  })

  it('computes swiped tab index without wrapping', () => {
    const total = 4

    // Swipe left moves next
    assert.equal(getSwipedTabIndex(0, total, 100, 50), 1)
    assert.equal(getSwipedTabIndex(2, total, 100, 50), 3)
    // At last tab, swipe left does NOT wrap (clamps to total - 1)
    assert.equal(getSwipedTabIndex(3, total, 100, 50), 3)

    // Swipe right moves prev
    assert.equal(getSwipedTabIndex(3, total, 50, 100), 2)
    assert.equal(getSwipedTabIndex(1, total, 50, 100), 0)
    // At first tab, swipe right does NOT wrap (clamps to 0)
    assert.equal(getSwipedTabIndex(0, total, 50, 100), 0)

    // Insufficient swipe keeps current index
    assert.equal(getSwipedTabIndex(1, total, 100, 90), 1)
    assert.equal(getSwipedTabIndex(2, total, 90, 100), 2)
  })

  it('handles empty total safely', () => {
    assert.equal(getSwipedTabIndex(0, 0, 100, 50), 0)
  })
})
