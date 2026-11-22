import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getIntendedUseLabel,
  sanitizeCsvCell,
  calculateDownloadsSummary,
  calculatePerResourceStats,
  parseDownloadsFilterParams,
  buildDownloadsExportCsv,
  buildDownloadsExportHref,
} from '../lib/adminDownloads.ts'

test('intended-use label mapping', async (t) => {
  await t.test('maps valid keys to user-friendly labels', () => {
    assert.equal(getIntendedUseLabel('myself'), 'For myself')
    assert.equal(getIntendedUseLabel('team'), 'For my team')
    assert.equal(getIntendedUseLabel('church_ministry'), 'For my church or ministry')
    assert.equal(getIntendedUseLabel('curious'), 'Just curious')
  })

  await t.test('handles whitespace, null, undefined, empty string and unknown values', () => {
    assert.equal(getIntendedUseLabel(' team '), 'For my team')
    assert.equal(getIntendedUseLabel(null), 'Not given')
    assert.equal(getIntendedUseLabel(undefined), 'Not given')
    assert.equal(getIntendedUseLabel(''), 'Not given')
    assert.equal(getIntendedUseLabel('unknown_key'), 'Not given')
  })
})

test('CSV cell neutraliser formula injection and escaping', async (t) => {
  await t.test('neutralises formula trigger: = (equals)', () => {
    const result = sanitizeCsvCell('=SUM(A1:A10)')
    assert.equal(result, `"'=SUM(A1:A10)"`)
    assert.ok(result.startsWith(`"'=`))
  })

  await t.test('neutralises formula trigger: + (plus)', () => {
    const result = sanitizeCsvCell('+12345')
    assert.equal(result, `"'+12345"`)
    assert.ok(result.startsWith(`"'+`))
  })

  await t.test('neutralises formula trigger: - (minus)', () => {
    const result = sanitizeCsvCell('-999')
    assert.equal(result, `"'-999"`)
    assert.ok(result.startsWith(`"'-`))
  })

  await t.test('neutralises formula trigger: @ (at sign)', () => {
    const result = sanitizeCsvCell('@SUM')
    assert.equal(result, `"'@SUM"`)
    assert.ok(result.startsWith(`"'@`))
  })

  await t.test('neutralises formula trigger: tab character', () => {
    const result = sanitizeCsvCell('\tsecret')
    assert.ok(result.includes(`'\tsecret`))
    assert.ok(result.startsWith(`"'`))
  })

  await t.test('escapes double quotes by doubling them', () => {
    const result = sanitizeCsvCell('He said "hello"')
    assert.equal(result, `"He said ""hello"""`)
  })

  await t.test('escapes commas by wrapping cell in quotes', () => {
    const result = sanitizeCsvCell('Kampala, Uganda')
    assert.equal(result, `"Kampala, Uganda"`)
  })

  await t.test('combines formula neutralisation with quotes and commas', () => {
    const result = sanitizeCsvCell('=cmd|"/C calc",test')
    assert.ok(result.startsWith(`"'=`))
    assert.ok(result.includes(`""/C calc""`))
  })

  await t.test('handles null and undefined gracefully', () => {
    assert.equal(sanitizeCsvCell(null), '""')
    assert.equal(sanitizeCsvCell(undefined), '""')
    assert.equal(sanitizeCsvCell(''), '')
  })

  await t.test('passes safe plain text without wrapping if no special characters', () => {
    assert.equal(sanitizeCsvCell('Standard Resource Title'), 'Standard Resource Title')
  })
})

test('summary-count logic', async (t) => {
  const referenceNow = new Date('2026-11-22T12:00:00.000Z')

  await t.test('calculates totals, last 30 days, distinct emails, and email problems', () => {
    const fixtureDownloads = [
      // 1. Recent, success, email 1
      {
        created_at: '2026-11-20T10:00:00.000Z',
        email: 'ivan@example.com',
        email_sent_at: '2026-11-20T10:01:00.000Z',
        email_error: null,
      },
      // 2. Recent, uppercase email 1 (distinct check)
      {
        created_at: '2026-11-15T09:00:00.000Z',
        email: 'IVAN@EXAMPLE.COM',
        email_sent_at: '2026-11-15T09:01:00.000Z',
        email_error: null,
      },
      // 3. Recent, email 2, email_error present (Email problem)
      {
        created_at: '2026-11-10T08:00:00.000Z',
        email: 'grace@example.com',
        email_sent_at: null,
        email_error: 'SMTP timeout',
      },
      // 4. Recent, email 3, email_sent_at null without error (Email problem: not sent)
      {
        created_at: '2026-11-05T07:00:00.000Z',
        email: 'john@example.com',
        email_sent_at: null,
        email_error: null,
      },
      // 5. Older than 30 days (> 2026-10-23), email 4, success
      {
        created_at: '2026-10-01T12:00:00.000Z',
        email: 'sarah@example.com',
        email_sent_at: '2026-10-01T12:01:00.000Z',
        email_error: null,
      },
      // 6. Anonymised (no email), recent, success
      {
        created_at: '2026-11-21T12:00:00.000Z',
        email: null,
        email_sent_at: '2026-11-21T12:01:00.000Z',
        email_error: null,
      },
    ]

    const summary = calculateDownloadsSummary(fixtureDownloads, referenceNow)

    // Total downloads: 6
    assert.equal(summary.totalDownloads, 6)
    // Downloads in last 30 days: items 1, 2, 3, 4, 6 = 5
    assert.equal(summary.downloadsLast30Days, 5)
    // Distinct emails: ivan@example.com, grace@example.com, john@example.com, sarah@example.com = 4
    assert.equal(summary.distinctEmails, 4)
    // Email problems: items 3 (error) and 4 (null sent_at) = 2
    assert.equal(summary.emailProblems, 2)
  })

  await t.test('handles empty download lists', () => {
    const summary = calculateDownloadsSummary([], referenceNow)
    assert.deepEqual(summary, {
      totalDownloads: 0,
      downloadsLast30Days: 0,
      distinctEmails: 0,
      emailProblems: 0,
    })
  })
})

test('per-resource stats calculation', () => {
  const resources = [
    { id: 'res-1', title: 'Planning System', kind: 'template' },
    { id: 'res-2', title: 'AI Framework', kind: 'framework' },
    { id: 'res-3', title: 'Unused Guide', kind: 'guide' },
  ]
  const downloads = [
    { resource_id: 'res-1', created_at: '2026-11-10T10:00:00.000Z' },
    { resource_id: 'res-1', created_at: '2026-11-20T10:00:00.000Z' },
    { resource_id: 'res-2', created_at: '2026-11-18T10:00:00.000Z' },
  ]

  const stats = calculatePerResourceStats(resources, downloads)

  assert.equal(stats.length, 3)
  // Sorted by total downloads descending: res-1 (2), res-2 (1), res-3 (0)
  assert.equal(stats[0].id, 'res-1')
  assert.equal(stats[0].totalDownloads, 2)
  assert.equal(stats[0].lastDownloadDate, '2026-11-20T10:00:00.000Z')

  assert.equal(stats[1].id, 'res-2')
  assert.equal(stats[1].totalDownloads, 1)
  assert.equal(stats[1].lastDownloadDate, '2026-11-18T10:00:00.000Z')

  assert.equal(stats[2].id, 'res-3')
  assert.equal(stats[2].totalDownloads, 0)
  assert.equal(stats[2].lastDownloadDate, null)
})

test('building the filter from query params', async (t) => {
  await t.test('parses clean valid parameters', () => {
    const params = {
      resource: 'cc86f7df-9d18-4115-a08c-014529945416',
      use: 'team',
      from: '2026-11-01',
      to: '2026-11-22',
      q: 'Ivan Kabandize',
      page: '2',
    }

    const filters = parseDownloadsFilterParams(params)
    assert.equal(filters.resource, 'cc86f7df-9d18-4115-a08c-014529945416')
    assert.equal(filters.use, 'team')
    assert.equal(filters.from, '2026-11-01')
    assert.equal(filters.to, '2026-11-22')
    assert.equal(filters.q, 'Ivan Kabandize')
    assert.equal(filters.page, 2)
    assert.equal(filters.isSearchRejected, false)
  })

  await t.test('handles "all" or empty resource parameter', () => {
    const filtersAll = parseDownloadsFilterParams({ resource: 'all' })
    assert.equal(filtersAll.resource, undefined)

    const filtersEmpty = parseDownloadsFilterParams({ resource: '' })
    assert.equal(filtersEmpty.resource, undefined)
  })

  await t.test('handles none intended use', () => {
    const filters = parseDownloadsFilterParams({ use: 'none' })
    assert.equal(filters.use, 'none')
  })

  await t.test('rejects invalid intended use', () => {
    const filters = parseDownloadsFilterParams({ use: 'invalid_use' })
    assert.equal(filters.use, undefined)
  })

  await t.test('rejects invalid date formats', () => {
    const filters = parseDownloadsFilterParams({
      from: 'not-a-date',
      to: '2026/11/22',
    })
    assert.equal(filters.from, undefined)
    assert.equal(filters.to, undefined)
  })

  await t.test('defaults page to 1 when missing or invalid', () => {
    assert.equal(parseDownloadsFilterParams({}).page, 1)
    assert.equal(parseDownloadsFilterParams({ page: '-5' }).page, 1)
    assert.equal(parseDownloadsFilterParams({ page: 'abc' }).page, 1)
  })

  await t.test('accepts safe email and name search characters', () => {
    const safeQueries = [
      'ivan',
      'ivan.kabandize@gmail.com',
      'Peace Mutoni',
      'user_name-123',
    ]
    for (const sq of safeQueries) {
      const res = parseDownloadsFilterParams({ q: sq })
      assert.equal(res.q, sq)
      assert.equal(res.isSearchRejected, false)
    }
  })

  await t.test('rejects odd and dangerous characters that could break query or syntax', () => {
    const dangerousQueries = [
      'user%percent',
      'user_underscore%wildcard',
      'drop,table',
      'test(paren)',
      'test)close',
      'test"quote',
      "test'singlequote",
      'test;semicolon',
      'test\\backslash',
      'test/slash',
      'test*star',
      'test+plus',
      'test=equals',
      'test<less',
      'test>greater',
      'test[bracket',
      'test]bracket',
      'test{brace',
      'test}brace',
      'test^caret',
      'test$dollar',
      'test|pipe',
      'test?question',
      'test!exclamation',
      'test~tilde',
    ]

    for (const dq of dangerousQueries) {
      const res = parseDownloadsFilterParams({ q: dq })
      assert.equal(res.q, undefined, `Expected q to be rejected for: ${dq}`)
      assert.equal(res.isSearchRejected, true, `Expected isSearchRejected=true for: ${dq}`)
    }
  })
})

test('buildDownloadsExportCsv formatting and neutralisation', () => {
  const rows = [
    {
      created_at: '2026-11-20T10:00:00.000Z',
      resource_title: 'The Weekly Planning System',
      name: 'Peace',
      email: 'peace@example.com',
      anonymised_at: null,
      intended_use: 'team',
      email_sent_at: '2026-11-20T10:01:00.000Z',
      email_error: null,
    },
    {
      created_at: '2026-11-19T10:00:00.000Z',
      resource_title: '=SUM(1,2)', // Potential formula in title
      name: 'Secret User',
      email: 'secret@example.com',
      anonymised_at: '2026-11-22T00:00:00.000Z', // Anonymised row
      intended_use: null,
      email_sent_at: null,
      email_error: 'Timeout connecting to mail server',
    },
  ]

  const csv = buildDownloadsExportCsv(rows)
  const lines = csv.split('\r\n')

  assert.equal(lines.length, 3) // Header + 2 data rows
  assert.equal(
    lines[0],
    'Date (UTC),Resource,Name,Email,Intended Use,Email Status,Error Details'
  )

  // First row: clean, intended_use='For my team', status='Sent'
  assert.ok(lines[1].includes('The Weekly Planning System'))
  assert.ok(lines[1].includes('Peace'))
  assert.ok(lines[1].includes('peace@example.com'))
  assert.ok(lines[1].includes('For my team'))
  assert.ok(lines[1].includes('Sent'))

  // Second row: formula in title neutralised, anonymised name and email
  assert.ok(lines[2].includes(`"'=SUM(1,2)"`))
  assert.ok(lines[2].includes('Anonymised'))
  assert.ok(!lines[2].includes('Secret User'))
  assert.ok(!lines[2].includes('secret@example.com'))
  assert.ok(lines[2].includes('Not given'))
  assert.ok(lines[2].includes('Failed'))
  assert.ok(lines[2].includes('Timeout connecting to mail server'))
})

test('buildDownloadsExportHref query construction', () => {
  assert.equal(buildDownloadsExportHref({}), '/admin/downloads/export')
  assert.equal(
    buildDownloadsExportHref({
      resource: 'res-1',
      use: 'team',
      from: '2026-11-01',
      to: '2026-11-22',
      q: 'Ivan',
    }),
    '/admin/downloads/export?resource=res-1&use=team&from=2026-11-01&to=2026-11-22&q=Ivan'
  )
})
