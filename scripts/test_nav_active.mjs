import assert from 'node:assert'
import {
  isWorkActive,
  isMeActive,
  isGardenActive,
  isNowActive,
  isAuthActive,
} from '../components/public/navActive.ts'

console.log('Running navigation active predicates tests...')

// 1. Work with Me
assert.strictEqual(isWorkActive('/workwithme'), true, '/workwithme must be active')
assert.strictEqual(isWorkActive('/workwithme/details'), true, '/workwithme/* must be active')
assert.strictEqual(isWorkActive('/work'), false, '/work must not be active')
assert.strictEqual(isWorkActive('/'), false, '/ must not match work')

// 2. Me
assert.strictEqual(isMeActive('/me'), true, '/me must be active')
assert.strictEqual(isMeActive('/me/story'), true, '/me/* must be active')
assert.strictEqual(isMeActive('/menu'), false, '/menu must not be active')
assert.strictEqual(isMeActive('/'), false, '/ must not match me')

// 3. Garden and streams
assert.strictEqual(isGardenActive('/garden'), true, '/garden must be active')
assert.strictEqual(isGardenActive('/garden/some-post'), true, '/garden/* must be active')
assert.strictEqual(isGardenActive('/random-thoughts'), true, '/random-thoughts must be active')
assert.strictEqual(isGardenActive('/random-thoughts/post-1'), true, '/random-thoughts/* must be active')
assert.strictEqual(isGardenActive('/structured-thoughts'), true, '/structured-thoughts must be active')
assert.strictEqual(isGardenActive('/structured-thoughts/post-2'), true, '/structured-thoughts/* must be active')
assert.strictEqual(isGardenActive('/tools-for-thought'), true, '/tools-for-thought must be active')
assert.strictEqual(isGardenActive('/tools-for-thought/tool-3'), true, '/tools-for-thought/* must be active')
assert.strictEqual(isGardenActive('/library'), true, '/library must be active')
assert.strictEqual(isGardenActive('/library/item-1'), true, '/library/* must be active')
assert.strictEqual(isGardenActive('/blog'), true, '/blog must be active')
assert.strictEqual(isGardenActive('/blog/post-1'), true, '/blog/* must be active')
assert.strictEqual(isGardenActive('/gardener'), false, '/gardener must not match garden')
assert.strictEqual(isGardenActive('/'), false, '/ must not match garden')

// 4. Now
assert.strictEqual(isNowActive('/now'), true, '/now must be active')
assert.strictEqual(isNowActive('/now/history'), true, '/now/* must be active')
assert.strictEqual(isNowActive('/nowhere'), false, '/nowhere must not match now')
assert.strictEqual(isNowActive('/'), false, '/ must not match now')

// 5. Auth
assert.strictEqual(isAuthActive('/login'), true, '/login must be active')
assert.strictEqual(isAuthActive('/signup'), true, '/signup must be active')
assert.strictEqual(isAuthActive('/login/callback'), true, '/login/* must be active')
assert.strictEqual(isAuthActive('/'), false, '/ must not match auth')

// 6. Non-matching routes (Home, Contact, etc.)
const nonMatching = ['/', '/lets-talk', '/contact', '/privacy', '/terms', '', null, undefined]
for (const path of nonMatching) {
  assert.strictEqual(isWorkActive(path), false, `${path} must not be work active`)
  assert.strictEqual(isMeActive(path), false, `${path} must not be me active`)
  assert.strictEqual(isGardenActive(path), false, `${path} must not be garden active`)
  assert.strictEqual(isNowActive(path), false, `${path} must not be now active`)
}

console.log('✔ All navActive predicate tests passed successfully!')
