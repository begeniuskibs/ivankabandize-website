// scripts/test_mobile_shell.mjs
// Verification suite for mobile shell hide-on-scroll logic
import assert from 'node:assert/strict'
import { computeScrollHeaderState } from '../components/public/scrollHeader.ts'

console.log('Running mobile shell hide-on-scroll tests...')

// 1. Within top 64px: always visible and not slim
{
  const state0 = computeScrollHeaderState({ currentScrollY: 0, lastScrollY: 0 })
  assert.equal(state0.isSlim, false, 'At top 0px: isSlim must be false')
  assert.equal(state0.isHidden, false, 'At top 0px: isHidden must be false')

  const state30 = computeScrollHeaderState({ currentScrollY: 30, lastScrollY: 0 })
  assert.equal(state30.isSlim, false, 'At 30px: isSlim must be false')
  assert.equal(state30.isHidden, false, 'At 30px: isHidden must be false even scrolling down')

  const state64 = computeScrollHeaderState({ currentScrollY: 64, lastScrollY: 50 })
  assert.equal(state64.isSlim, false, 'At 64px: isSlim must be false')
  assert.equal(state64.isHidden, false, 'At 64px: isHidden must be false')
  console.log('✔ Passed: Top 64px boundary tests')
}

// 2. Past 64px: becomes slim and hides on scroll down
{
  const stateScrolledDown = computeScrollHeaderState({
    currentScrollY: 100,
    lastScrollY: 80,
    previousIsHidden: false,
  })
  assert.equal(stateScrolledDown.isSlim, true, 'Past 64px: isSlim must be true')
  assert.equal(stateScrolledDown.isHidden, true, 'Scroll down > 8px delta: isHidden must be true')
  console.log('✔ Passed: Scroll down past 64px hides header')
}

// 3. Past 64px: shows on scroll up
{
  const stateScrolledUp = computeScrollHeaderState({
    currentScrollY: 150,
    lastScrollY: 170,
    previousIsHidden: true,
  })
  assert.equal(stateScrolledUp.isSlim, true, 'Past 64px: isSlim must be true')
  assert.equal(stateScrolledUp.isHidden, false, 'Scroll up > 8px delta: isHidden must be false')
  console.log('✔ Passed: Scroll up past 64px shows header')
}

// 4. Delta threshold (8px) prevents flickering
{
  // Small scroll down (+4px): should retain previous state (not hidden)
  const stateSmallDown = computeScrollHeaderState({
    currentScrollY: 104,
    lastScrollY: 100,
    previousIsHidden: false,
  })
  assert.equal(stateSmallDown.isHidden, false, 'Small delta down (+4px <= 8px): preserves previousIsHidden=false')

  // Small scroll up (-4px): should retain previous state (hidden)
  const stateSmallUp = computeScrollHeaderState({
    currentScrollY: 120,
    lastScrollY: 124,
    previousIsHidden: true,
  })
  assert.equal(stateSmallUp.isHidden, true, 'Small delta up (-4px >= -8px): preserves previousIsHidden=true')
  console.log('✔ Passed: Delta threshold prevents flickering')
}

// 5. Menu is open: never hidden regardless of scroll or delta
{
  const stateMenuOpen = computeScrollHeaderState({
    currentScrollY: 300,
    lastScrollY: 200,
    isMenuOpen: true,
    previousIsHidden: true,
  })
  assert.equal(stateMenuOpen.isHidden, false, 'When menu is open: isHidden must ALWAYS be false')
  console.log('✔ Passed: Menu open state guarantees header visibility')
}

console.log('ALL TESTS PASSED (5/5)')
