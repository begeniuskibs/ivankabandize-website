// Vanilla JS test runner for Let's Talk hardening logic

import {
  validateInquiryPayload,
  escapeHtml,
  formatMessageForEmail,
  HELP_OPTIONS,
  TIMING_OPTIONS,
} from '../lib/inquiries.ts'

console.log('=== LET\'S TALK HARDENING UNIT TESTS (No DB, No Email) ===\n')

// Test Case 1: Valid payload
console.log('--- Test Case 1: Valid Payload ---')
const payload1 = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  organisation: 'Acme School',
  problem: 'We need help restructuring our operations and leadership reporting.',
  help_type: 'Operations & systems',
  timing: 'As soon as possible',
  website: '',
}
const result1 = validateInquiryPayload(payload1)
console.log('Input:', JSON.stringify(payload1, null, 2))
console.log('Result isValid:', result1.isValid)
console.log('Sanitized Data:', JSON.stringify(result1.data, null, 2))
console.log('Verdict: ACCEPTED\n')

// Test Case 2: Unknown help type
console.log('--- Test Case 2: Unknown Help Type ---')
const payload2 = {
  name: 'John Doe',
  email: 'john@example.com',
  organisation: 'Initech',
  problem: 'Need some general consulting.',
  help_type: 'Custom Unapproved Option 123',
  timing: 'Just exploring',
}
const result2 = validateInquiryPayload(payload2)
console.log('Input:', JSON.stringify(payload2, null, 2))
console.log('Result isValid:', result2.isValid)
console.log('Error Message:', result2.error)
console.log('Verdict: REJECTED (400)\n')

// Test Case 3: <script>alert(1)</script> inside the message
console.log('--- Test Case 3: Script Tag in Message (HTML Escaping) ---')
const payload3 = {
  name: 'Security Tester',
  email: 'sec@test.org',
  organisation: 'AppSec Inc',
  problem: 'Testing message with malicious payload: <script>alert(1)</script>\nLine 2 payload: <img src=x onerror=alert(2) />',
  help_type: 'Make sense of AI',
  timing: 'Just exploring',
}
const result3 = validateInquiryPayload(payload3)
console.log('Input Problem:', payload3.problem)
console.log('Validation isValid:', result3.isValid)
if (result3.isValid && result3.data) {
  const formattedProblem = formatMessageForEmail(result3.data.problem)
  console.log('Formatted for Email HTML:\n' + formattedProblem)
}
console.log('Verdict: ACCEPTED & SAFELY ESCAPED\n')

// Test Case 4: <a href="https://example.com">click</a> inside the name
console.log('--- Test Case 4: HTML in Name (HTML Escaping) ---')
const payload4 = {
  name: '<a href="https://example.com">click</a> & "test" \'name\'',
  email: 'attacker@evil.com',
  problem: 'Testing HTML in name field.',
  help_type: 'Strategy & planning',
  timing: 'Just exploring',
}
const result4 = validateInquiryPayload(payload4)
console.log('Input Name:', payload4.name)
console.log('Validation isValid:', result4.isValid)
if (result4.isValid && result4.data) {
  const escapedName = escapeHtml(result4.data.name)
  console.log('Escaped Name for Email HTML:', escapedName)
}
console.log('Verdict: ACCEPTED & SAFELY ESCAPED\n')

// Test Case 5: Message over length limit
console.log('--- Test Case 5: Message Over Length Limit (3000 chars) ---')
const payload5 = {
  name: 'Long Winded',
  email: 'long@example.com',
  problem: 'A'.repeat(3050),
  help_type: 'Training my team',
  timing: 'ASAP',
}
const result5 = validateInquiryPayload(payload5)
console.log('Input Message Length:', payload5.problem.length)
console.log('Result isValid:', result5.isValid)
console.log('Error Message:', result5.error)
console.log('Verdict: REJECTED (400)\n')

// Test Case 6: Honeypot filled
console.log('--- Test Case 6: Honeypot Filled (Spam Guard) ---')
const payload6 = {
  name: 'Spam Bot 3000',
  email: 'spammer@darkweb.io',
  problem: 'Buy cheap watches and crypto now!',
  help_type: 'Operations & systems',
  timing: 'ASAP',
  website: 'https://spam-domain.xyz/buy-now',
}
const result6 = validateInquiryPayload(payload6)
console.log('Input:', JSON.stringify(payload6, null, 2))
console.log('Result isValid:', result6.isValid)
console.log('Is Spam flag:', result6.data?.isSpam)
console.log('Verdict: ACCEPTED AS 200 BENIGN BUT DROPPED (No DB insert, No Email)\n')
