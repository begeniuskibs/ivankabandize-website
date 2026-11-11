import assert from 'node:assert/strict'
import {
  CONSENT_KEY,
  readConsent,
  writeConsent,
  isValidMeasurementId,
  clearGoogleAnalyticsCookies,
  ensureGtagStub,
} from '../lib/analyticsConsent.ts'

console.log('=== ANALYTICS CONSENT UNIT TESTS ===\n')

// ----------------------------------------------------------------------------
// 1. readConsent
// ----------------------------------------------------------------------------
console.log('--- 1. Testing readConsent ---')

// 1.1 Returns null by default when storage is empty
const emptyStorage = {
  data: {},
  getItem(k) {
    return this.data[k] ?? null
  },
  setItem(k, v) {
    this.data[k] = String(v)
  },
}
assert.equal(readConsent(emptyStorage), null, 'Empty storage must return null')
console.log('  PASS: empty storage returns null by default')

// 1.2 Returns stored value ('granted' and 'denied')
emptyStorage.data[CONSENT_KEY] = 'granted'
assert.equal(readConsent(emptyStorage), 'granted', 'Stored "granted" must return "granted"')

emptyStorage.data[CONSENT_KEY] = 'denied'
assert.equal(readConsent(emptyStorage), 'denied', 'Stored "denied" must return "denied"')
console.log('  PASS: returns stored value for granted and denied')

// 1.3 Ignores junk values
const junkValues = ['foo', 'yes', 'no', 'true', 'false', '', 'GRANTED', 'denied-extra', '123']
for (const junk of junkValues) {
  emptyStorage.data[CONSENT_KEY] = junk
  assert.equal(readConsent(emptyStorage), null, `Junk value "${junk}" must return null`)
}
console.log('  PASS: ignores junk values')

// 1.4 Survives a throwing storage
const throwingStorage = {
  getItem() {
    throw new Error('Storage access denied')
  },
  setItem() {
    throw new Error('Storage quota exceeded')
  },
}
assert.equal(readConsent(throwingStorage), null, 'Throwing storage must safely return null')
console.log('  PASS: survives throwing storage')

// ----------------------------------------------------------------------------
// 2. writeConsent round trip
// ----------------------------------------------------------------------------
console.log('\n--- 2. Testing writeConsent round trip ---')
const memStorage = {
  data: {},
  getItem(k) {
    return this.data[k] ?? null
  },
  setItem(k, v) {
    this.data[k] = String(v)
  },
}

writeConsent('granted', memStorage)
assert.equal(readConsent(memStorage), 'granted', 'writeConsent("granted") must be readable as "granted"')

writeConsent('denied', memStorage)
assert.equal(readConsent(memStorage), 'denied', 'writeConsent("denied") must be readable as "denied"')

// Survives throwing storage on write
assert.doesNotThrow(() => {
  writeConsent('granted', throwingStorage)
}, 'writeConsent must survive throwing storage')
console.log('  PASS: writeConsent round trip and resilience verified')

// ----------------------------------------------------------------------------
// 3. isValidMeasurementId
// ----------------------------------------------------------------------------
console.log('\n--- 3. Testing isValidMeasurementId ---')
// Accepts G-FTJJWQ4JD9
assert.equal(isValidMeasurementId('G-FTJJWQ4JD9'), true, 'G-FTJJWQ4JD9 must be accepted')

// Rejects empty
assert.equal(isValidMeasurementId(''), false, 'Empty string must be rejected')

// Rejects "UA-123"
assert.equal(isValidMeasurementId('UA-123'), false, '"UA-123" must be rejected')

// Rejects "G-"
assert.equal(isValidMeasurementId('G-'), false, '"G-" must be rejected')

// Rejects lowercase
assert.equal(isValidMeasurementId('g-ftjjwq4jd9'), false, 'Lowercase "g-ftjjwq4jd9" must be rejected')
assert.equal(isValidMeasurementId('G-ftjjwq4jd9'), false, 'Lowercase "G-ftjjwq4jd9" must be rejected')

// Rejects strings with spaces
assert.equal(isValidMeasurementId(' G-FTJJWQ4JD9'), false, 'Leading space must be rejected')
assert.equal(isValidMeasurementId('G-FTJJWQ4JD9 '), false, 'Trailing space must be rejected')
assert.equal(isValidMeasurementId('G-FTJJ WQ4JD9'), false, 'Inner space must be rejected')

// Rejects strings with scripts
assert.equal(isValidMeasurementId('<script>alert(1)</script>'), false, 'Script injection string must be rejected')

// Rejects non-string types
assert.equal(isValidMeasurementId(null), false, 'null must be rejected')
assert.equal(isValidMeasurementId(undefined), false, 'undefined must be rejected')
assert.equal(isValidMeasurementId(12345), false, 'number must be rejected')
console.log('  PASS: measurement ID validation rules verified')

// ----------------------------------------------------------------------------
// 4. clearGoogleAnalyticsCookies
// ----------------------------------------------------------------------------
console.log('\n--- 4. Testing clearGoogleAnalyticsCookies ---')
const setCookieCalls = []
const fakeDoc = {
  cookie: '_ga=GA1.1.123456789.1234567890; other_cookie=important_session_token; _ga_ABC123=GS1.1.987654321.1.0.0; preference=dark_mode',
  location: {
    hostname: 'sub.ivankabandize.com',
  },
}

Object.defineProperty(fakeDoc, 'cookie', {
  get() {
    return this._cookie
  },
  set(val) {
    setCookieCalls.push(val)
  },
})
fakeDoc._cookie = '_ga=GA1.1.123456789.1234567890; other_cookie=important_session_token; _ga_ABC123=GS1.1.987654321.1.0.0; preference=dark_mode'

clearGoogleAnalyticsCookies(fakeDoc)

// Verify that expired cookies only target _ga and _ga_ABC123
assert.ok(setCookieCalls.length > 0, 'Should have set expiration cookie directives')

const targetedCookieNames = new Set(
  setCookieCalls.map((call) => call.split('=')[0].trim())
)

assert.ok(targetedCookieNames.has('_ga'), 'Must expire _ga')
assert.ok(targetedCookieNames.has('_ga_ABC123'), 'Must expire _ga_ABC123')
assert.equal(targetedCookieNames.has('other_cookie'), false, 'Must NOT expire other_cookie')
assert.equal(targetedCookieNames.has('preference'), false, 'Must NOT expire preference')

// Verify that every set call includes expiration in the past
for (const call of setCookieCalls) {
  assert.ok(
    call.includes('Expires=Thu, 01 Jan 1970 00:00:01 GMT'),
    `Cookie clear call "${call}" must set epoch expiration`
  )
}

console.log('  PASS: _ga and _ga_ABC123 expired without touching other cookies')

// ----------------------------------------------------------------------------
// 5. ensureGtagStub
// ----------------------------------------------------------------------------
console.log('\n--- 5. Testing ensureGtagStub ---')
const fakeWin = {}
ensureGtagStub(fakeWin)

assert.ok(Array.isArray(fakeWin.dataLayer), 'dataLayer must be initialized as an array')
assert.equal(typeof fakeWin.gtag, 'function', 'gtag must be initialized as a function')

const initialGtag = fakeWin.gtag
fakeWin.gtag('config', 'G-TEST123456')

assert.equal(fakeWin.dataLayer.length, 1, 'Calling gtag must push exactly one entry')
const entry = fakeWin.dataLayer[0]
assert.equal(
  Object.prototype.toString.call(entry),
  '[object Arguments]',
  'Entry in dataLayer must be [object Arguments]'
)
assert.equal(entry[0], 'config', 'First argument must be "config"')
assert.equal(entry[1], 'G-TEST123456', 'Second argument must be "G-TEST123456"')

// Calling ensureGtagStub twice must not replace an existing gtag
ensureGtagStub(fakeWin)
assert.equal(fakeWin.gtag, initialGtag, 'Calling ensureGtagStub twice must not replace existing gtag')
console.log('  PASS: ensureGtagStub correctly uses arguments object and preserves existing stub')

console.log('\n========================================')
console.log('ALL ANALYTICS CONSENT TESTS PASSED!')
console.log('========================================')

