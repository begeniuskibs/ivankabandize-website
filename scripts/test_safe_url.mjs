import assert from 'node:assert/strict'
import { safeHref } from '../lib/safeUrl.ts'

const fallback = '#'

const testCases = [
  { input: 'javascript:alert(1)', expected: fallback, name: 'javascript protocol' },
  { input: 'data:text/html,x', expected: fallback, name: 'data protocol' },
  { input: ' javascript:alert(1)', expected: fallback, name: 'leading space javascript protocol' },
  { input: '//evil.com', expected: fallback, name: 'protocol relative link' },
  { input: '\\\\evil.com', expected: fallback, name: 'backslash link' },
  { input: '/ok', expected: '/ok', name: 'safe relative path' },
  { input: 'https://a.com', expected: 'https://a.com', name: 'safe https URL' },
]

let passed = 0
for (const tc of testCases) {
  const result = safeHref(tc.input, fallback)
  assert.equal(result, tc.expected, `Failed for ${tc.name}: expected ${tc.expected}, got ${result}`)
  console.log(`PASS: safeHref(${JSON.stringify(tc.input)}) => ${JSON.stringify(result)}`)
  passed++
}

console.log(`\nAll ${passed} safeHref tests passed successfully.`)
