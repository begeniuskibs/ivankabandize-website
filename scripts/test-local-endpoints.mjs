async function run() {
  console.log('=== LOCAL ENDPOINT HARDENING & ANALYTICS TESTS ===\n')

  // 1. Invalid JSON
  console.log('--- 1. Testing Invalid JSON Payload ---')
  const resInvalid = await fetch('http://localhost:3100/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{ invalid-json-payload',
  })
  const jsonInvalid = await resInvalid.json()
  console.log(`Status: ${resInvalid.status}, Body: ${JSON.stringify(jsonInvalid)}`)
  if (resInvalid.status !== 400 || jsonInvalid.ok !== false) {
    throw new Error('Expected 400 with ok: false for invalid JSON')
  }

  // 2. Body over 20,000 characters
  console.log('\n--- 2. Testing Body > 20,000 Characters ---')
  const largeBody = JSON.stringify({
    name: 'Jane Doe',
    email: 'jane@example.com',
    problem: 'A'.repeat(21000),
    help_type: 'Operations & systems',
    timing: 'Just exploring',
  })
  const resLarge = await fetch('http://localhost:3100/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: largeBody,
  })
  const jsonLarge = await resLarge.json()
  console.log(`Status: ${resLarge.status}, Body: ${JSON.stringify(jsonLarge)}`)
  if (resLarge.status !== 413 || jsonLarge.ok !== false || jsonLarge.error !== 'That message is too large.') {
    throw new Error('Expected 413 with error "That message is too large."')
  }

  // 3. Honeypot request
  console.log('\n--- 3. Testing Honeypot Spam Submission ---')
  const honeypotBody = JSON.stringify({
    name: 'Spam Bot',
    email: 'spambot@example.com',
    problem: 'Buy crypto now',
    help_type: 'Operations & systems',
    timing: 'Just exploring',
    contact_ref_code: 'gotcha-bot',
  })
  const resHoneypot = await fetch('http://localhost:3100/api/inquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: honeypotBody,
  })
  const jsonHoneypot = await resHoneypot.json()
  console.log(`Status: ${resHoneypot.status}, Body: ${JSON.stringify(jsonHoneypot)}`)
  if (resHoneypot.status !== 200 || jsonHoneypot.ok !== true) {
    throw new Error('Expected 200 with ok: true for honeypot payload')
  }

  // 4. Analytics component presence on / vs /admin vs /preview
  console.log('\n--- 4. Testing Analytics Inclusion in Public Site vs Admin & Preview ---')
  const homeRes = await fetch('http://localhost:3100/')
  const homeHtml = await homeRes.text()
  const homeHasAnalytics = homeHtml.includes('Analytics')
  console.log(`Public Home (/) renders Analytics component: ${homeHasAnalytics}`)

  const adminRes = await fetch('http://localhost:3100/admin', { redirect: 'manual' })
  const adminHtml = await adminRes.text()
  const adminHasAnalytics = adminHtml.includes('Analytics')
  console.log(`Admin (/admin redirect) renders Analytics component: ${adminHasAnalytics}`)

  const previewRes = await fetch('http://localhost:3100/preview/test', { redirect: 'manual' })
  const previewHtml = await previewRes.text()
  const previewHasAnalytics = previewHtml.includes('Analytics')
  console.log(`Preview (/preview) renders Analytics component: ${previewHasAnalytics}`)

  if (!homeHasAnalytics) {
    throw new Error('Public site missing analytics')
  }
  if (adminHasAnalytics || previewHasAnalytics) {
    throw new Error('Admin or Preview site unexpectedly contains analytics')
  }

  console.log('\nALL LOCAL INTEGRATION TESTS PASSED!')
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
