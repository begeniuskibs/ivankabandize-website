// Unit tests for URL Safety and SSRF prevention
import { isPrivateOrReservedIp, validateUrlSafety } from '../lib/urlSafety.ts'

console.log('=== URL SAFETY & SSRF DEFENSE UNIT TESTS ===\n')

// 1. IP range tests
console.log('--- 1. Testing isPrivateOrReservedIp ---')
const ipTestCases = [
  { ip: '127.0.0.1', expected: true, desc: 'IPv4 Loopback' },
  { ip: '127.1.2.3', expected: true, desc: 'IPv4 Loopback range' },
  { ip: '10.0.0.1', expected: true, desc: 'IPv4 Private 10/8' },
  { ip: '172.16.0.1', expected: true, desc: 'IPv4 Private 172.16/12' },
  { ip: '172.31.255.255', expected: true, desc: 'IPv4 Private 172.16/12 high' },
  { ip: '192.168.1.1', expected: true, desc: 'IPv4 Private 192.168/16' },
  { ip: '169.254.169.254', expected: true, desc: 'IPv4 Link-local (cloud metadata)' },
  { ip: '0.0.0.0', expected: true, desc: 'IPv4 Current network' },
  { ip: '100.64.0.1', expected: true, desc: 'IPv4 Carrier-grade NAT' },
  { ip: '192.0.2.1', expected: true, desc: 'IPv4 TEST-NET-1' },
  { ip: '198.51.100.1', expected: true, desc: 'IPv4 TEST-NET-2' },
  { ip: '203.0.113.1', expected: true, desc: 'IPv4 TEST-NET-3' },
  { ip: '224.0.0.1', expected: true, desc: 'IPv4 Multicast' },
  { ip: '240.0.0.1', expected: true, desc: 'IPv4 Reserved' },
  { ip: '::1', expected: true, desc: 'IPv6 Loopback' },
  { ip: '::', expected: true, desc: 'IPv6 Unspecified' },
  { ip: '8.8.8.8', expected: false, desc: 'Public DNS (Google)' },
  { ip: '1.1.1.1', expected: false, desc: 'Public DNS (Cloudflare)' },
  { ip: '142.250.190.46', expected: false, desc: 'Public IP' },
]

for (const { ip, expected, desc } of ipTestCases) {
  const result = isPrivateOrReservedIp(ip)
  const pass = result === expected
  console.log(`IP [${ip}] (${desc}) -> Result: ${result} (Expected: ${expected}) -> ${pass ? 'PASS' : 'FAIL'}`)
  if (!pass) {
    throw new Error(`isPrivateOrReservedIp test failed for ${ip}`)
  }
}

// 2. URL validation tests
console.log('\n--- 2. Testing validateSafeUrl ---')
const urlTestCases = [
  { url: 'https://example.com', expectedSafe: true, desc: 'Valid HTTPS URL' },
  { url: 'http://example.com', expectedSafe: true, desc: 'Valid HTTP URL' },
  { url: 'http://localhost', expectedSafe: false, desc: 'Localhost blocked' },
  { url: 'http://localhost:3000', expectedSafe: false, desc: 'Localhost port blocked' },
  { url: 'http://test.localhost', expectedSafe: false, desc: 'Subdomain localhost blocked' },
  { url: 'http://127.0.0.1', expectedSafe: false, desc: 'Loopback IP blocked' },
  { url: 'http://169.254.169.254/latest/meta-data/', expectedSafe: false, desc: 'AWS metadata blocked' },
  { url: 'http://10.0.0.5', expectedSafe: false, desc: 'Private 10.x blocked' },
  { url: 'http://192.168.0.1', expectedSafe: false, desc: 'Private 192.168.x blocked' },
  { url: 'ftp://example.com', expectedSafe: false, desc: 'FTP protocol blocked' },
  { url: 'file:///etc/passwd', expectedSafe: false, desc: 'File protocol blocked' },
  { url: 'javascript:alert(1)', expectedSafe: false, desc: 'Javascript scheme blocked' },
  { url: 'data:text/html,test', expectedSafe: false, desc: 'Data URI blocked' },
  { url: 'not-a-valid-url', expectedSafe: false, desc: 'Invalid URL syntax blocked' },
]

for (const { url, expectedSafe, desc } of urlTestCases) {
  const result = await validateUrlSafety(url)
  const pass = result.safe === expectedSafe
  console.log(`URL [${url}] (${desc}) -> Safe: ${result.safe} (Expected: ${expectedSafe}) -> ${pass ? 'PASS' : 'FAIL'}`)
  if (!pass) {
    throw new Error(`validateUrlSafety test failed for ${url}: ${JSON.stringify(result)}`)
  }
}

console.log('\nALL URL SAFETY UNIT TESTS PASSED!')
