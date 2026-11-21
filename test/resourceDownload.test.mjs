// Unit tests for Resource Download pure functions and consent constants
// House style: spaced hyphen " - " only

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import {
  RESOURCE_DOWNLOAD_LIMITS,
  escapeHtml,
  isSameOrigin,
  sanitizeDownloadSubject,
  validateResourceDownloadPayload,
} from '../lib/resourceDownload.ts'
import { computeRequestFingerprint } from '../lib/resourceFingerprint.ts'
import {
  RESOURCE_CONSENT_TEXT,
  RESOURCE_CONSENT_TEXT_MEMBER,
  RESOURCE_CONSENT_VERSION,
  RESOURCE_CONSENT_VERSION_MEMBER,
} from '../lib/resourceConsent.ts'

describe('Resource Consent Constants', () => {
  it('has valid consent version and wording', () => {
    assert.equal(RESOURCE_CONSENT_VERSION, 'v1')
    assert.equal(
      RESOURCE_CONSENT_TEXT,
      'I am asking for this file. I understand that my name and email are stored so the download link can be sent to me and Ivan can see which files are used. See the Privacy Policy.'
    )
    assert.equal(RESOURCE_CONSENT_VERSION_MEMBER, 'v1-member')
    assert.equal(
      RESOURCE_CONSENT_TEXT_MEMBER,
      'Signed-in member requested this file. Name and email taken from the member account.'
    )
  })
})

describe('Resource Download Limits', () => {
  it('specifies the correct body size and rate limits', () => {
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.MAX_REQUEST_BODY_CHARS, 4000)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.NAME_MIN, 2)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.NAME_MAX, 100)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.EMAIL_MAX, 254)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.SLUG_MAX, 120)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.MIN_SECRET_LENGTH, 32)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.EMAIL_LIMIT_MAX, 3)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.EMAIL_LIMIT_WINDOW_MINUTES, 60)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.FINGERPRINT_LIMIT_MAX, 10)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.FINGERPRINT_LIMIT_WINDOW_MINUTES, 60)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.GLOBAL_LIMIT_MAX, 70)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.GLOBAL_LIMIT_WINDOW_SECONDS, 60)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.SIGNED_URL_EXPIRY_SECONDS, 60)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.EMAIL_SIGNED_URL_EXPIRY_SECONDS, 86400)
    assert.equal(RESOURCE_DOWNLOAD_LIMITS.EMAIL_DUPLICATE_WINDOW_HOURS, 24)
  })
})

describe('Payload Validation & Normalisation', () => {
  const validPayload = {
    slug: 'weekly-planning-system',
    name: 'Ivan Kabandize',
    email: 'ivan@example.com',
    website: '',
  }

  it('accepts a fully valid payload', () => {
    const res = validateResourceDownloadPayload(validPayload)
    assert.equal(res.isValid, true)
    assert.deepEqual(res.data, {
      slug: 'weekly-planning-system',
      name: 'Ivan Kabandize',
      email: 'ivan@example.com',
      isHoneypot: false,
      intendedUse: null,
    })
  })

  describe('Intended Use Validation & Normalisation', () => {
    it('accepts valid intendedUse values', () => {
      for (const val of ['myself', 'team', 'church_ministry', 'curious']) {
        const res = validateResourceDownloadPayload({
          ...validPayload,
          intendedUse: val,
        })
        assert.equal(res.isValid, true)
        assert.equal(res.data?.intendedUse, val)
      }
    })

    it('normalises missing or empty intendedUse to null', () => {
      const res1 = validateResourceDownloadPayload({
        ...validPayload,
        intendedUse: '',
      })
      assert.equal(res1.isValid, true)
      assert.equal(res1.data?.intendedUse, null)

      const res2 = validateResourceDownloadPayload({
        ...validPayload,
        intendedUse: '   ',
      })
      assert.equal(res2.isValid, true)
      assert.equal(res2.data?.intendedUse, null)

      const res3 = validateResourceDownloadPayload({
        ...validPayload,
        intendedUse: undefined,
      })
      assert.equal(res3.isValid, true)
      assert.equal(res3.data?.intendedUse, null)
    })

    it('rejects invalid intendedUse string', () => {
      const res = validateResourceDownloadPayload({
        ...validPayload,
        intendedUse: 'invalid_category',
      })
      assert.equal(res.isValid, false)
      assert.equal(res.error, 'Invalid request data.')
    })

    it('rejects non-string intendedUse', () => {
      const res = validateResourceDownloadPayload({
        ...validPayload,
        intendedUse: 12345,
      })
      assert.equal(res.isValid, false)
      assert.equal(res.error, 'Invalid request data.')
    })
  })

  it('detects honeypot when website is filled', () => {
    const honeypotPayload = {
      ...validPayload,
      website: 'https://spamsite.example.com',
    }
    const res = validateResourceDownloadPayload(honeypotPayload)
    assert.equal(res.isValid, true)
    assert.equal(res.data?.isHoneypot, true)
  })

  it('rejects invalid or non-object payloads', () => {
    assert.equal(validateResourceDownloadPayload(null).isValid, false)
    assert.equal(validateResourceDownloadPayload(undefined).isValid, false)
    assert.equal(validateResourceDownloadPayload('string').isValid, false)
    assert.equal(validateResourceDownloadPayload([]).isValid, false)
  })

  describe('Name Validation', () => {
    it('trims leading and trailing whitespace', () => {
      const res = validateResourceDownloadPayload({
        ...validPayload,
        name: '   Jane Doe   ',
      })
      assert.equal(res.isValid, true)
      assert.equal(res.data?.name, 'Jane Doe')
    })

    it('rejects missing or empty names', () => {
      assert.equal(validateResourceDownloadPayload({ ...validPayload, name: '' }).isValid, false)
      assert.equal(validateResourceDownloadPayload({ ...validPayload, name: '   ' }).isValid, false)
      assert.equal(validateResourceDownloadPayload({ ...validPayload, name: null }).isValid, false)
      assert.equal(validateResourceDownloadPayload({ ...validPayload, name: 123 }).isValid, false)
    })

    it('rejects names shorter than 2 characters', () => {
      const res = validateResourceDownloadPayload({
        ...validPayload,
        name: 'A',
      })
      assert.equal(res.isValid, false)
      assert.match(res.error || '', /at least 2 characters/)
    })

    it('accepts names with exactly 2 characters', () => {
      const res = validateResourceDownloadPayload({
        ...validPayload,
        name: 'Al',
      })
      assert.equal(res.isValid, true)
      assert.equal(res.data?.name, 'Al')
    })

    it('accepts names with exactly 100 characters', () => {
      const name100 = 'A'.repeat(100)
      const res = validateResourceDownloadPayload({
        ...validPayload,
        name: name100,
      })
      assert.equal(res.isValid, true)
      assert.equal(res.data?.name, name100)
    })

    it('rejects names exceeding 100 characters', () => {
      const name101 = 'A'.repeat(101)
      const res = validateResourceDownloadPayload({
        ...validPayload,
        name: name101,
      })
      assert.equal(res.isValid, false)
      assert.match(res.error || '', /must not exceed 100 characters/)
    })
  })

  describe('Email Validation & Lowercasing', () => {
    it('lowercases and trims email addresses', () => {
      const res = validateResourceDownloadPayload({
        ...validPayload,
        email: '   IVAN.Kabandize@Example.COM   ',
      })
      assert.equal(res.isValid, true)
      assert.equal(res.data?.email, 'ivan.kabandize@example.com')
    })

    it('rejects missing or invalid email shapes', () => {
      assert.equal(validateResourceDownloadPayload({ ...validPayload, email: '' }).isValid, false)
      assert.equal(validateResourceDownloadPayload({ ...validPayload, email: 'not-an-email' }).isValid, false)
      assert.equal(validateResourceDownloadPayload({ ...validPayload, email: 'missing-at.com' }).isValid, false)
      assert.equal(validateResourceDownloadPayload({ ...validPayload, email: '@no-local.com' }).isValid, false)
      assert.equal(validateResourceDownloadPayload({ ...validPayload, email: 'no-domain@' }).isValid, false)
    })

    it('rejects emails exceeding 254 characters', () => {
      const longUser = 'a'.repeat(245)
      const email255 = `${longUser}@example.com`
      const res = validateResourceDownloadPayload({
        ...validPayload,
        email: email255,
      })
      assert.equal(res.isValid, false)
      assert.match(res.error || '', /must not exceed 254 characters/)
    })
  })

  describe('Slug Validation', () => {
    it('accepts valid slugs with lowercase letters, numbers, and hyphens', () => {
      const validSlugs = [
        'weekly-planning-system',
        'the-effective-annual-planning-framework',
        'report-2026',
        'guide',
      ]
      for (const slug of validSlugs) {
        const res = validateResourceDownloadPayload({ ...validPayload, slug })
        assert.equal(res.isValid, true, `Expected slug "${slug}" to be valid`)
        assert.equal(res.data?.slug, slug)
      }
    })

    it('rejects slugs with uppercase letters', () => {
      const res = validateResourceDownloadPayload({
        ...validPayload,
        slug: 'Weekly-Planning-System',
      })
      assert.equal(res.isValid, false)
    })

    it('rejects slugs with spaces or disallowed symbols', () => {
      const invalidSlugs = [
        'weekly planning system',
        'weekly_planning_system',
        'weekly/planning',
        'slug!',
        'slug?param=1',
      ]
      for (const slug of invalidSlugs) {
        const res = validateResourceDownloadPayload({ ...validPayload, slug })
        assert.equal(res.isValid, false, `Expected slug "${slug}" to be invalid`)
      }
    })

    it('rejects slugs exceeding 120 characters', () => {
      const slug121 = 'a'.repeat(121)
      const res = validateResourceDownloadPayload({
        ...validPayload,
        slug: slug121,
      })
      assert.equal(res.isValid, false)
      assert.match(res.error || '', /must not exceed 120 characters/)
    })
  })
})

describe('Request Fingerprint Calculation', () => {
  const testIp = '203.0.113.195'
  const validSecretA = '0123456789abcdef0123456789abcdef' // 32 chars
  const validSecretB = 'fedcba9876543210fedcba9876543210' // 32 chars

  it('is deterministic for the same IP and secret', () => {
    const fp1 = computeRequestFingerprint(testIp, validSecretA)
    const fp2 = computeRequestFingerprint(testIp, validSecretA)
    assert.equal(fp1, fp2)
    assert.equal(typeof fp1, 'string')
    assert.equal(fp1.length, 64) // hex SHA-256
  })

  it('differs for different secrets', () => {
    const fpA = computeRequestFingerprint(testIp, validSecretA)
    const fpB = computeRequestFingerprint(testIp, validSecretB)
    assert.notEqual(fpA, fpB)
  })

  it('differs for different IPs', () => {
    const fp1 = computeRequestFingerprint('198.51.100.1', validSecretA)
    const fp2 = computeRequestFingerprint('198.51.100.2', validSecretA)
    assert.notEqual(fp1, fp2)
  })

  it('never equals a plain SHA-256 of the IP', () => {
    const hmacFp = computeRequestFingerprint(testIp, validSecretA)
    const plainSha = createHash('sha256').update(testIp).digest('hex')
    assert.notEqual(hmacFp, plainSha)
  })

  it('rejects a secret missing or under 32 characters', () => {
    assert.throws(
      () => computeRequestFingerprint(testIp, ''),
      /must be at least 32 characters/
    )
    assert.throws(
      () => computeRequestFingerprint(testIp, 'short_secret_under_32_chars!'),
      /must be at least 32 characters/
    )
    assert.throws(
      () => computeRequestFingerprint(testIp, 'a'.repeat(31)),
      /must be at least 32 characters/
    )
    assert.doesNotThrow(() => computeRequestFingerprint(testIp, 'a'.repeat(32)))
  })
})

describe('HTML Escaping & Subject Formatting', () => {
  it('escapes dangerous HTML characters', () => {
    const raw = '<script>alert("XSS & injection")</script>\'test\''
    const escaped = escapeHtml(raw)
    assert.equal(
      escaped,
      '&lt;script&gt;alert(&quot;XSS &amp; injection&quot;)&lt;/script&gt;&#39;test&#39;'
    )
  })

  it('sanitizes download subjects with house style', () => {
    const title = 'The Weekly Planning System'
    const subject = sanitizeDownloadSubject(title)
    assert.equal(subject, 'Your download - The Weekly Planning System')
  })

  it('collapses whitespace and strips control characters in subject', () => {
    const messyTitle = 'The\tWeekly\nPlanning   System\r\x00'
    const subject = sanitizeDownloadSubject(messyTitle)
    assert.equal(subject, 'Your download - The Weekly Planning System')
  })
})

describe('isSameOrigin', () => {
  it('returns true when origin has the exact same host', () => {
    assert.equal(isSameOrigin('https://example.com', 'example.com'), true)
  })

  it('returns true when origin matches the production host in allowed hosts list', () => {
    assert.equal(
      isSameOrigin('https://ivankabandize.com', [
        'preview.vercel.app',
        'ivankabandize.com',
      ]),
      true
    )
  })

  it('returns true when preview host equals request host', () => {
    assert.equal(
      isSameOrigin('https://preview-123.vercel.app', 'preview-123.vercel.app'),
      true
    )
  })

  it('returns false for a different site', () => {
    assert.equal(isSameOrigin('https://evil.com', 'example.com'), false)
    assert.equal(
      isSameOrigin('https://sub.evil.com', ['example.com', 'preview.vercel.app']),
      false
    )
  })

  it('returns false for "null" string origin', () => {
    assert.equal(isSameOrigin('null', 'example.com'), false)
  })

  it('returns false for garbage unparseable origin', () => {
    assert.equal(isSameOrigin('not-a-valid-url', 'example.com'), false)
    assert.equal(isSameOrigin('///', 'example.com'), false)
  })

  it('returns false when host is missing or empty', () => {
    assert.equal(isSameOrigin('https://example.com', ''), false)
    assert.equal(isSameOrigin('https://example.com', undefined), false)
    assert.equal(isSameOrigin('https://example.com', []), false)
  })

  it('returns false on port mismatch', () => {
    assert.equal(isSameOrigin('http://localhost:3000', 'localhost:4000'), false)
    assert.equal(isSameOrigin('http://localhost:3000', 'localhost'), false)
  })

  it('returns true regardless of case differences', () => {
    assert.equal(isSameOrigin('https://EXAMPLE.COM', 'example.com'), true)
    assert.equal(isSameOrigin('https://example.com', 'EXAMPLE.COM'), true)
    assert.equal(
      isSameOrigin('https://Preview-App.Vercel.App', 'preview-app.vercel.app'),
      true
    )
  })
})

describe('Resource projection safety', () => {
  it('PUBLIC_RESOURCE_COLUMNS does not leak sensitive columns', () => {
    const source = readFileSync(
      new URL('../lib/resources.ts', import.meta.url),
      'utf8'
    )
    const match = source.match(/export const PUBLIC_RESOURCE_COLUMNS\s*=\s*['"`]([^'"`]+)['"`]/)
    assert.ok(match, 'PUBLIC_RESOURCE_COLUMNS must be defined and exported')
    const columns = match[1].split(',').map((c) => c.trim())
    assert.equal(columns.includes('external_url'), false)
    assert.equal(columns.includes('file_path'), false)
    assert.equal(columns.includes('file_name'), false)
    assert.ok(columns.includes('delivery_type'))
    assert.ok(columns.includes('category'))
    assert.ok(columns.includes('page_details'))
  })
})

