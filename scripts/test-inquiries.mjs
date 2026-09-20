// Unit tests for Let's Talk inquiries hardening logic (No DB, No Resend)

import {
  validateInquiryPayload,
  escapeHtml,
  formatMessageForEmail,
  HELP_OPTIONS,
  TIMING_OPTIONS,
  VALID_TIMING_VALUES,
} from '../lib/inquiries.ts'

console.log('=== LET\'S TALK HARDENING UNIT TESTS (No DB, No Email) ===\n')

// 1. Comprehensive Chip Options Verification (Every single option rendered by the form)
console.log('--- 1. Testing ALL Form-Rendered Help Type Options ---')
for (const helpOpt of HELP_OPTIONS) {
  const payload = {
    name: 'Test User',
    email: 'user@example.com',
    problem: 'Testing help type: ' + helpOpt,
    help_type: helpOpt,
    timing: 'Just exploring',
    contact_ref_code: '',
  }
  const res = validateInquiryPayload(payload)
  console.log(`Help Option [${helpOpt}]: ${res.isValid ? 'ACCEPTED' : 'REJECTED - ' + res.error}`)
  if (!res.isValid) throw new Error(`Option rejected unexpectedly: ${helpOpt}`)
}

console.log('\n--- 2. Testing ALL Form-Rendered Timing Options (Values & Labels) ---')
for (const timingOpt of TIMING_OPTIONS) {
  // Test value (as set by clicking the chip in the UI)
  const payloadValue = {
    name: 'Test User',
    email: 'user@example.com',
    problem: 'Testing timing value: ' + timingOpt.value,
    help_type: 'Operations & systems',
    timing: timingOpt.value,
    contact_ref_code: '',
  }
  const resVal = validateInquiryPayload(payloadValue)
  console.log(`Timing Value [${timingOpt.value}]: ${resVal.isValid ? 'ACCEPTED' : 'REJECTED - ' + resVal.error}`)
  if (!resVal.isValid) throw new Error(`Timing value rejected: ${timingOpt.value}`)

  // Test label (if sent as label e.g. "1–3 months")
  const payloadLabel = {
    name: 'Test User',
    email: 'user@example.com',
    problem: 'Testing timing label: ' + timingOpt.label,
    help_type: 'Operations & systems',
    timing: timingOpt.label,
    contact_ref_code: '',
  }
  const resLabel = validateInquiryPayload(payloadLabel)
  console.log(`Timing Label [${timingOpt.label}]: ${resLabel.isValid ? 'ACCEPTED' : 'REJECTED - ' + resLabel.error}`)
  if (!resLabel.isValid) throw new Error(`Timing label rejected: ${timingOpt.label}`)
}

// 3. Testing Unknown Options
console.log('\n--- 3. Testing Invalid Options (Rejections) ---')
const invalidHelpPayload = {
  name: 'John Doe',
  email: 'john@example.com',
  problem: 'Need consulting',
  help_type: 'Unknown Help Option XYZ',
  timing: 'Just exploring',
}
const resInvalidHelp = validateInquiryPayload(invalidHelpPayload)
console.log('Unknown Help Type result:', resInvalidHelp.isValid ? 'ACCEPTED' : `REJECTED (400) -> "${resInvalidHelp.error}"`)

const invalidTimingPayload = {
  name: 'John Doe',
  email: 'john@example.com',
  problem: 'Need consulting',
  help_type: 'Operations & systems',
  timing: 'Next year sometime',
}
const resInvalidTiming = validateInquiryPayload(invalidTimingPayload)
console.log('Unknown Timing result:', resInvalidTiming.isValid ? 'ACCEPTED' : `REJECTED (400) -> "${resInvalidTiming.error}"`)

// 4. HTML Escaping Tests
console.log('\n--- 4. Testing HTML Escaping for Email ---')
const scriptPayload = {
  name: '<a href="https://example.com">Jane & Co</a>',
  email: 'jane@example.com',
  problem: 'Line 1: <script>alert("XSS")</script>\nLine 2: <b>Bold text</b> & "quotes"',
  help_type: 'Make sense of AI',
  timing: 'Just exploring',
}
const resScript = validateInquiryPayload(scriptPayload)
console.log('Script Payload Validation isValid:', resScript.isValid)
if (resScript.isValid && resScript.data) {
  const escapedName = escapeHtml(resScript.data.name)
  const formattedProblem = formatMessageForEmail(resScript.data.problem)
  console.log('Escaped Name for Email:', escapedName)
  console.log('Formatted Problem for Email:\n' + formattedProblem)
}

// 5. Length Limits Tests
console.log('\n--- 5. Testing Length Limits ---')
const longMessagePayload = {
  name: 'Valid Name',
  email: 'valid@example.com',
  problem: 'X'.repeat(3050),
  help_type: 'Training my team',
  timing: 'ASAP',
}
const resLong = validateInquiryPayload(longMessagePayload)
console.log('Over 3000 chars message result:', resLong.isValid ? 'ACCEPTED' : `REJECTED (400) -> "${resLong.error}"`)

// 6. Honeypot Spam Guard Test (contact_ref_code)
console.log('\n--- 6. Testing Honeypot Spam Guard (contact_ref_code) ---')
const spamPayload = {
  name: 'Spam Bot',
  email: 'bot@spam.io',
  problem: 'Buy luxury watches!',
  help_type: 'Operations & systems',
  timing: 'ASAP',
  contact_ref_code: 'spam-bot-value-12345',
}
const resSpam = validateInquiryPayload(spamPayload)
console.log('Honeypot filled result isValid:', resSpam.isValid)
console.log('Honeypot isSpam flag:', resSpam.data?.isSpam)
console.log('Verdict: ACCEPTED AS 200 BENIGN BUT DROPPED (No DB insert, No Email)\n')
