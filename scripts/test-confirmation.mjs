// Unit tests for Confirmation Email generator and First Name Cleaner (No DB, No Resend)

import {
  cleanFirstName,
  buildConfirmationEmailContent,
  RECOMMENDED_READS_BY_HELP_TYPE,
} from '../lib/confirmation-email.ts'
import { HELP_OPTIONS } from '../lib/inquiries.ts'

console.log('=== CONFIRMATION EMAIL UNIT TESTS (No DB, No Email) ===\n')

// 1. Test cleanFirstName on all specified test cases
console.log('--- 1. Testing cleanFirstName sanitization ---')
const testNames = [
  { input: 'Jane', expected: 'Jane' },
  { input: 'SMOKE TEST 3 & Co', expected: 'Smoke' },
  { input: '<script>alert(1)</script>', expected: null },
  { input: 'http://x.com', expected: null },
  { input: 'Ann-Marie', expected: 'Ann-Marie' },
  { input: "O'Neil", expected: "O'Neil" },
  { input: '12345', expected: null },
  { input: 'mary', expected: 'Mary' },
  { input: '', expected: null },
]

for (const { input, expected } of testNames) {
  const result = cleanFirstName(input)
  const pass = result === expected
  console.log(
    `Input: [${input}] -> Cleaned: [${result}] (Expected: [${expected}]) -> ${pass ? 'PASS' : 'FAIL'}`
  )
  if (!pass) {
    throw new Error(`cleanFirstName failed for input: "${input}"`)
  }
}

// 2. Test building confirmation email for every help option
console.log('\n--- 2. Testing confirmation email builder for all help types ---')
const testHelpTypes = [...HELP_OPTIONS, null, undefined, 'Invalid Option']

for (const ht of testHelpTypes) {
  const rawTestName = '<script>alert("XSS")</script> Jane'
  const emailData = buildConfirmationEmailContent({
    name: rawTestName,
    helpType: ht,
    siteUrl: 'https://ivankabandize.com',
  })

  // Assertions:
  // a) Subject has no line breaks
  if (/[\r\n]/.test(emailData.subject)) {
    throw new Error(`Subject contains line breaks for helpType: ${ht}`)
  }

  // b) Raw uncleaned visitor text is NOT present
  if (emailData.subject.includes('<script>') || emailData.htmlContent.includes('<script>alert("XSS")</script>')) {
    throw new Error(`Raw visitor script found in email for helpType: ${ht}`)
  }

  // c) First name was cleaned to null, fallback "there" / "Got it - your enquiry just landed" is used
  if (!emailData.subject.startsWith('Got it')) {
    throw new Error(`Subject format invalid for helpType: ${ht}`)
  }

  // d) Links match https://ivankabandize.com/garden/<slug>
  const reads = (ht && RECOMMENDED_READS_BY_HELP_TYPE[ht]) || RECOMMENDED_READS_BY_HELP_TYPE.default
  for (const read of reads) {
    const expectedUrl = `https://ivankabandize.com/garden/${read.slug}`
    if (!emailData.htmlContent.includes(expectedUrl) || !emailData.textContent.includes(expectedUrl)) {
      throw new Error(`Missing expected read URL ${expectedUrl} for helpType: ${ht}`)
    }
  }

  // e) Neither text nor HTML contains en/em dashes (–, —, &ndash;, &mdash;)
  const forbiddenDashes = ['–', '—', '&ndash;', '&mdash;']
  for (const dash of forbiddenDashes) {
    if (emailData.textContent.includes(dash)) {
      throw new Error(`Forbidden dash "${dash}" found in textContent for helpType: ${ht}`)
    }
    if (emailData.htmlContent.includes(dash)) {
      throw new Error(`Forbidden dash "${dash}" found in htmlContent for helpType: ${ht}`)
    }
    if (emailData.subject.includes(dash)) {
      throw new Error(`Forbidden dash "${dash}" found in subject for helpType: ${ht}`)
    }
  }

  console.log(`Help type [${ht}]: Generated valid subject: "${emailData.subject}" -> PASS`)
}

// 3. Test with a valid name
console.log('\n--- 3. Testing with valid name ---')
const validEmail = buildConfirmationEmailContent({
  name: 'Jane Doe',
  helpType: 'Operations & systems',
  siteUrl: 'https://ivankabandize.com',
})

console.log('Subject:', validEmail.subject)
console.log('Greeting in text:', validEmail.textContent.split('\n')[0])
if (!validEmail.subject.includes('Jane') || !validEmail.textContent.startsWith('Hi Jane,')) {
  throw new Error('Valid name Jane was not formatted into subject or greeting')
}

console.log('\nALL CONFIRMATION EMAIL UNIT TESTS PASSED!')
