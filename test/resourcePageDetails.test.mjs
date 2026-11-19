// Unit tests for Resource Page Details parser and sanitizer
// House style: spaced hyphen " - " only

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { parsePageDetails } from '../lib/resourcePageDetails.ts'

describe('parsePageDetails', () => {
  it('returns default empty object for non-object inputs', () => {
    const expected = {
      facts: [],
      what_it_is: '',
      who_for: '',
      helps_with: '',
      steps: [],
      works_well: [],
      not_fit: [],
      faq: [],
      success_steps: [],
      related: [],
    }

    assert.deepEqual(parsePageDetails(null), expected)
    assert.deepEqual(parsePageDetails(undefined), expected)
    assert.deepEqual(parsePageDetails('not an object'), expected)
    assert.deepEqual(parsePageDetails(12345), expected)
    assert.deepEqual(parsePageDetails(true), expected)
  })

  it('returns default empty object when input is an array', () => {
    const expected = {
      facts: [],
      what_it_is: '',
      who_for: '',
      helps_with: '',
      steps: [],
      works_well: [],
      not_fit: [],
      faq: [],
      success_steps: [],
      related: [],
    }
    assert.deepEqual(parsePageDetails(['item1', 'item2']), expected)
  })

  it('handles an empty object and provides empty default keys', () => {
    const res = parsePageDetails({})
    assert.deepEqual(res.facts, [])
    assert.equal(res.what_it_is, '')
    assert.equal(res.who_for, '')
    assert.equal(res.helps_with, '')
    assert.deepEqual(res.steps, [])
    assert.deepEqual(res.works_well, [])
    assert.deepEqual(res.not_fit, [])
    assert.deepEqual(res.faq, [])
    assert.deepEqual(res.success_steps, [])
    assert.deepEqual(res.related, [])
  })

  it('drops unknown keys from the output', () => {
    const raw = {
      unknownKey: 'secret_value',
      another_secret: 999,
      what_it_is: 'A great tool',
    }
    const res = parsePageDetails(raw)
    assert.equal(res.what_it_is, 'A great tool')
    assert.equal('unknownKey' in res, false)
    assert.equal('another_secret' in res, false)
  })

  it('leaves HTML as plain text without stripping or throwing', () => {
    const raw = {
      what_it_is: '<script>alert("test")</script> <b>Bold description</b>',
      who_for: '<p>Founders & creators</p>',
    }
    const res = parsePageDetails(raw)
    assert.equal(
      res.what_it_is,
      '<script>alert("test")</script> <b>Bold description</b>'
    )
    assert.equal(res.who_for, '<p>Founders & creators</p>')
  })

  it('enforces array count caps (overflow truncation)', () => {
    const raw = {
      facts: [
        { value: '1', label: 'One' },
        { value: '2', label: 'Two' },
        { value: '3', label: 'Three' },
        { value: '4', label: 'Four' },
        { value: '5', label: 'Five' },
      ],
      steps: Array.from({ length: 12 }, (_, i) => ({
        title: `Step ${i + 1}`,
        detail: `Detail ${i + 1}`,
      })),
      works_well: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
      not_fit: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
      faq: Array.from({ length: 10 }, (_, i) => ({
        q: `Question ${i + 1}`,
        a: `Answer ${i + 1}`,
      })),
      success_steps: Array.from({ length: 8 }, (_, i) => ({
        title: `Success ${i + 1}`,
        detail: `Detail ${i + 1}`,
      })),
      related: Array.from({ length: 6 }, (_, i) => ({
        title: `Related ${i + 1}`,
        href: `/resources/item-${i + 1}`,
        label: `Label ${i + 1}`,
      })),
    }

    const res = parsePageDetails(raw)
    assert.equal(res.facts.length, 4)
    assert.equal(res.steps.length, 8)
    assert.equal(res.works_well.length, 6)
    assert.equal(res.not_fit.length, 6)
    assert.equal(res.faq.length, 8)
    assert.equal(res.success_steps.length, 5)
    assert.equal(res.related.length, 4)
  })

  it('enforces character length caps on fields', () => {
    const raw = {
      facts: [{ value: 'a'.repeat(50), label: 'b'.repeat(100) }],
      what_it_is: 'c'.repeat(1000),
      who_for: 'd'.repeat(900),
      helps_with: 'e'.repeat(950),
      steps: [{ title: 'f'.repeat(200), detail: 'g'.repeat(500) }],
      works_well: ['h'.repeat(300)],
      not_fit: ['i'.repeat(300)],
      faq: [{ q: 'j'.repeat(200), a: 'k'.repeat(800) }],
      success_steps: [{ title: 'l'.repeat(200), detail: 'm'.repeat(500) }],
      related: [
        {
          title: 'n'.repeat(200),
          href: '/valid/path',
          label: 'o'.repeat(100),
        },
      ],
    }

    const res = parsePageDetails(raw)
    assert.equal(res.facts[0].value.length, 24)
    assert.equal(res.facts[0].label.length, 48)
    assert.equal(res.what_it_is.length, 800)
    assert.equal(res.who_for.length, 800)
    assert.equal(res.helps_with.length, 800)
    assert.equal(res.steps[0].title.length, 120)
    assert.equal(res.steps[0].detail.length, 400)
    assert.equal(res.works_well[0].length, 200)
    assert.equal(res.not_fit[0].length, 200)
    assert.equal(res.faq[0].q.length, 160)
    assert.equal(res.faq[0].a.length, 600)
    assert.equal(res.success_steps[0].title.length, 120)
    assert.equal(res.success_steps[0].detail.length, 400)
    assert.equal(res.related[0].title.length, 120)
    assert.equal(res.related[0].label.length, 60)
  })

  it('filters bad hrefs in related items and keeps valid ones', () => {
    const raw = {
      related: [
        { title: 'Good relative', href: '/garden/resources/one', label: 'Guide' },
        { title: 'Good https', href: 'https://example.com/notion', label: 'Template' },
        { title: 'Bad protocol-relative', href: '//evil.com/phish', label: 'Bad' },
        { title: 'Bad javascript', href: 'javascript:alert(1)', label: 'Bad' },
        { title: 'Bad http', href: 'http://insecure.example.com', label: 'Bad' },
        { title: 'Bad relative without slash', href: 'garden/resources/two', label: 'Bad' },
      ],
    }

    const res = parsePageDetails(raw)
    assert.equal(res.related.length, 2)
    assert.equal(res.related[0].title, 'Good relative')
    assert.equal(res.related[0].href, '/garden/resources/one')
    assert.equal(res.related[1].title, 'Good https')
    assert.equal(res.related[1].href, 'https://example.com/notion')
  })

  it('trims whitespace and drops empty or non-string array entries', () => {
    const raw = {
      facts: [
        { value: '   ', label: 'Empty value' },
        { value: 'Valid', label: '   ' },
        { value: '  10x  ', label: '  Productivity  ' },
      ],
      works_well: ['  item 1  ', '   ', '', 123, null],
      steps: [
        { title: '', detail: 'No title' },
        { title: 'Step 1', detail: '' },
        { title: '  Step 1  ', detail: '  Detail 1  ' },
      ],
    }

    const res = parsePageDetails(raw)
    assert.equal(res.facts.length, 1)
    assert.equal(res.facts[0].value, '10x')
    assert.equal(res.facts[0].label, 'Productivity')

    assert.equal(res.works_well.length, 1)
    assert.equal(res.works_well[0], 'item 1')

    assert.equal(res.steps.length, 1)
    assert.equal(res.steps[0].title, 'Step 1')
    assert.equal(res.steps[0].detail, 'Detail 1')
  })
})
