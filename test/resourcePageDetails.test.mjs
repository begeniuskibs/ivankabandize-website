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
      demo: [],
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
      demo: [],
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
    assert.deepEqual(res.demo, [])
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

  it('parses valid demo tabs with columns and list variants', () => {
    const raw = {
      demo: [
        {
          label: 'Week Board',
          caption: 'Coral highlights a Big Rock.',
          type: 'columns',
          columns: [
            {
              title: 'Mon',
              items: [
                { text: 'Budget review', key: true },
                { text: 'Team 1:1', key: false },
              ],
            },
            {
              title: 'Tue',
              items: [{ text: 'Write notes', key: false }],
            },
          ],
        },
        {
          label: 'Big Rocks',
          caption: 'Three, never more.',
          type: 'list',
          marker: 'number',
          items: [
            { text: 'Finish budget review', chip: 'Mon', done: false },
            { text: 'Write sermon notes', chip: 'Tue', done: true },
          ],
        },
        {
          label: 'Parking Lot',
          caption: '',
          type: 'list',
          marker: 'checkbox',
          items: [
            { text: 'Reply to venue', chip: '', done: false },
            { text: 'Renew domain', chip: '', done: true },
          ],
        },
      ],
    }

    const res = parsePageDetails(raw)
    assert.equal(res.demo.length, 3)

    // Tab 1: columns
    assert.equal(res.demo[0].label, 'Week Board')
    assert.equal(res.demo[0].caption, 'Coral highlights a Big Rock.')
    assert.equal(res.demo[0].type, 'columns')
    assert.equal(res.demo[0].columns?.length, 2)
    assert.equal(res.demo[0].columns?.[0].title, 'Mon')
    assert.equal(res.demo[0].columns?.[0].items.length, 2)
    assert.equal(res.demo[0].columns?.[0].items[0].text, 'Budget review')
    assert.equal(res.demo[0].columns?.[0].items[0].key, true)
    assert.equal(res.demo[0].columns?.[0].items[1].key, false)

    // Tab 2: list with number
    assert.equal(res.demo[1].label, 'Big Rocks')
    assert.equal(res.demo[1].caption, 'Three, never more.')
    assert.equal(res.demo[1].type, 'list')
    assert.equal(res.demo[1].marker, 'number')
    assert.equal(res.demo[1].items?.length, 2)
    assert.equal(res.demo[1].items?.[0].chip, 'Mon')
    assert.equal(res.demo[1].items?.[0].done, false)
    assert.equal(res.demo[1].items?.[1].done, true)

    // Tab 3: list with checkbox
    assert.equal(res.demo[2].label, 'Parking Lot')
    assert.equal(res.demo[2].caption, '')
    assert.equal(res.demo[2].type, 'list')
    assert.equal(res.demo[2].marker, 'checkbox')
    assert.equal(res.demo[2].items?.length, 2)
  })

  it('enforces demo caps and truncation', () => {
    const raw = {
      demo: Array.from({ length: 8 }, (_, i) => ({
        label: `Tab ${i + 1} with long title exceeding twenty four chars`,
        caption: 'c'.repeat(200),
        type: 'columns',
        columns: Array.from({ length: 10 }, (_, c) => ({
          title: `Column ${c + 1} exceeds twelve`,
          items: Array.from({ length: 6 }, (_, it) => ({
            text: `Item ${it + 1} text exceeds forty characters limit right here`,
            key: true,
          })),
        })),
      })),
    }

    const res = parsePageDetails(raw)
    // max 5 tabs
    assert.equal(res.demo.length, 5)
    // tab label max 24
    assert.equal(res.demo[0].label.length, 24)
    // tab caption max 160
    assert.equal(res.demo[0].caption.length, 160)
    // max 7 columns per tab
    assert.equal(res.demo[0].columns?.length, 7)
    // column title max 12
    assert.equal(res.demo[0].columns?.[0].title.length, 12)
    // max 4 items per column
    assert.equal(res.demo[0].columns?.[0].items.length, 4)
    // item text max 40
    assert.equal(res.demo[0].columns?.[0].items[0].text.length, 40)

    // Check list caps
    const rawList = {
      demo: [
        {
          label: 'List Tab',
          type: 'list',
          items: Array.from({ length: 12 }, () => ({
            text: 't'.repeat(150),
            chip: 'chip_too_long_here',
            done: true,
          })),
        },
      ],
    }
    const resList = parsePageDetails(rawList)
    assert.equal(resList.demo.length, 1)
    // max 8 items per list
    assert.equal(resList.demo[0].items?.length, 8)
    // list item text max 100
    assert.equal(resList.demo[0].items?.[0].text.length, 100)
    // list item chip max 12
    assert.equal(resList.demo[0].items?.[0].chip.length, 12)
  })

  it('drops demo tabs with unknown type or empty label or no usable content', () => {
    const raw = {
      demo: [
        { label: 'Good Tab', type: 'unknown_type', items: [{ text: 'Ok' }] },
        { label: '   ', type: 'list', items: [{ text: 'Ok' }] },
        { label: '', type: 'columns', columns: [{ title: 'Col', items: [] }] },
        { label: 'No columns array', type: 'columns' },
        { label: 'Empty columns array', type: 'columns', columns: [] },
        { label: 'No items array', type: 'list' },
        { label: 'Empty items array', type: 'list', items: [] },
        { label: 'All empty items', type: 'list', items: [{ text: '   ' }] },
        {
          label: 'Valid Tab',
          type: 'list',
          items: [{ text: 'I am valid' }],
        },
      ],
    }

    const res = parsePageDetails(raw)
    assert.equal(res.demo.length, 1)
    assert.equal(res.demo[0].label, 'Valid Tab')
  })

  it('sets key and done to true only if raw value is exactly boolean true', () => {
    const raw = {
      demo: [
        {
          label: 'Strict Booleans',
          type: 'columns',
          columns: [
            {
              title: 'Col 1',
              items: [
                { text: 'A', key: true },
                { text: 'B', key: 'true' },
                { text: 'C', key: 1 },
                { text: 'D', key: null },
              ],
            },
          ],
        },
        {
          label: 'List Booleans',
          type: 'list',
          items: [
            { text: 'E', done: true },
            { text: 'F', done: 'true' },
            { text: 'G', done: 1 },
            { text: 'H', done: undefined },
          ],
        },
      ],
    }

    const res = parsePageDetails(raw)
    assert.equal(res.demo[0].columns?.[0].items[0].key, true)
    assert.equal(res.demo[0].columns?.[0].items[1].key, false)
    assert.equal(res.demo[0].columns?.[0].items[2].key, false)
    assert.equal(res.demo[0].columns?.[0].items[3].key, false)

    assert.equal(res.demo[1].items?.[0].done, true)
    assert.equal(res.demo[1].items?.[1].done, false)
    assert.equal(res.demo[1].items?.[2].done, false)
    assert.equal(res.demo[1].items?.[3].done, false)
  })

  it('leaves HTML in demo text as plain text without throwing', () => {
    const raw = {
      demo: [
        {
          label: '<b>Bold Tab</b>',
          caption: '<p>Caption with tags</p>',
          type: 'list',
          items: [
            {
              text: '<span class="test">Item with markup</span>',
              chip: '<em>New</em>',
              done: false,
            },
          ],
        },
      ],
    }

    const res = parsePageDetails(raw)
    assert.equal(res.demo.length, 1)
    assert.equal(res.demo[0].label, '<b>Bold Tab</b>')
    assert.equal(res.demo[0].caption, '<p>Caption with tags</p>')
    assert.equal(
      res.demo[0].items?.[0].text,
      '<span class="test">Item with markup</span>'
    )
    assert.equal(res.demo[0].items?.[0].chip, '<em>New</em>')
  })

  it('safely handles malformed demo input without throwing', () => {
    assert.doesNotThrow(() => parsePageDetails({ demo: 'not an array' }))
    assert.doesNotThrow(() => parsePageDetails({ demo: 12345 }))
    assert.doesNotThrow(() => parsePageDetails({ demo: null }))
    assert.doesNotThrow(() => parsePageDetails({ demo: [null, undefined, 12, 'str'] }))
    assert.doesNotThrow(() =>
      parsePageDetails({
        demo: [
          { label: 'Tab', type: 'columns', columns: [null, 'string', 99] },
          { label: 'Tab 2', type: 'list', items: [null, 'string'] },
        ],
      })
    )

    const res = parsePageDetails({ demo: 'bad' })
    assert.deepEqual(res.demo, [])
  })
})
