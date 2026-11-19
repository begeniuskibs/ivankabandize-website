// Unit tests for Resource UI pure helper functions
// House style: spaced hyphen " - " only

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatFileSize,
  splitParagraphs,
  kindLabel,
  getDownloadErrorMessage,
} from '../lib/resourceUi.ts'

describe('formatFileSize', () => {
  it('returns empty string for missing, zero, negative or non-finite inputs', () => {
    assert.equal(formatFileSize(null), '')
    assert.equal(formatFileSize(undefined), '')
    assert.equal(formatFileSize(0), '')
    assert.equal(formatFileSize(-100), '')
    assert.equal(formatFileSize(Number.NaN), '')
    assert.equal(formatFileSize(Number.POSITIVE_INFINITY), '')
  })

  it('formats byte values under 1 KB', () => {
    assert.equal(formatFileSize(500), '500 B')
    assert.equal(formatFileSize(1023), '1023 B')
  })

  it('formats kilobyte values', () => {
    assert.equal(formatFileSize(1024), '1 KB')
    assert.equal(formatFileSize(1536), '2 KB')
    assert.equal(formatFileSize(512000), '500 KB')
  })

  it('formats megabyte values with smart decimals', () => {
    assert.equal(formatFileSize(1048576), '1 MB')
    assert.equal(formatFileSize(1572864), '1.5 MB')
    assert.equal(formatFileSize(10485760), '10 MB')
  })

  it('formats gigabyte values', () => {
    assert.equal(formatFileSize(1073741824), '1 GB')
    assert.equal(formatFileSize(2684354560), '2.5 GB')
  })
})

describe('splitParagraphs', () => {
  it('returns empty array for missing or whitespace-only strings', () => {
    assert.deepEqual(splitParagraphs(null), [])
    assert.deepEqual(splitParagraphs(undefined), [])
    assert.deepEqual(splitParagraphs(''), [])
    assert.deepEqual(splitParagraphs('   \n  \n  '), [])
  })

  it('splits on multiple newlines and trims paragraphs', () => {
    const text = 'First paragraph.\n\nSecond paragraph.\n\n\nThird paragraph.'
    assert.deepEqual(splitParagraphs(text), [
      'First paragraph.',
      'Second paragraph.',
      'Third paragraph.',
    ])
  })

  it('handles single paragraph correctly', () => {
    assert.deepEqual(splitParagraphs('  Only one paragraph here.  '), [
      'Only one paragraph here.',
    ])
  })
})

describe('kindLabel', () => {
  it('maps standard resource kinds to proper display labels', () => {
    assert.equal(kindLabel('guide'), 'Guide')
    assert.equal(kindLabel('template'), 'Template')
    assert.equal(kindLabel('framework'), 'Framework')
  })

  it('handles case differences and fallbacks', () => {
    assert.equal(kindLabel('GUIDE'), 'Guide')
    assert.equal(kindLabel('template'), 'Template')
    assert.equal(kindLabel('tool'), 'Tool')
    assert.equal(kindLabel(''), '')
    assert.equal(kindLabel(null), '')
    assert.equal(kindLabel(undefined), '')
  })
})

describe('getDownloadErrorMessage', () => {
  it('handles 400 with server message or fallback', () => {
    assert.equal(
      getDownloadErrorMessage(400, 'Please enter a valid email address.'),
      'Please enter a valid email address.'
    )
    assert.equal(
      getDownloadErrorMessage(400, ''),
      'Invalid request. Please check the form and try again.'
    )
    assert.equal(
      getDownloadErrorMessage(400, null),
      'Invalid request. Please check the form and try again.'
    )
  })

  it('handles 403 and 404', () => {
    assert.equal(getDownloadErrorMessage(403), "That file isn't available.")
    assert.equal(getDownloadErrorMessage(404), "That file isn't available.")
  })

  it('handles 413 payload too large', () => {
    assert.equal(getDownloadErrorMessage(413), 'That request is too large.')
  })

  it('handles 429 rate limit', () => {
    assert.equal(
      getDownloadErrorMessage(429),
      'Too many downloads just now. Please try again in a little while.'
    )
  })

  it('handles 503 service unavailable', () => {
    assert.equal(
      getDownloadErrorMessage(503),
      'Downloads are temporarily unavailable. Please try again soon.'
    )
  })

  it('handles 500, network errors, and unexpected statuses', () => {
    const genericMsg =
      'That did not go through. Nothing was saved. Please try again in a moment.'
    assert.equal(getDownloadErrorMessage(500), genericMsg)
    assert.equal(getDownloadErrorMessage(502), genericMsg)
    assert.equal(getDownloadErrorMessage(null), genericMsg)
    assert.equal(getDownloadErrorMessage(undefined), genericMsg)
  })
})
