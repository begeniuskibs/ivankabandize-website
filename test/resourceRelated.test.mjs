// Unit tests for pickRelatedArticles pure helper
// House style: spaced hyphen " - " only

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  extractArticleSlugFromHref,
  pickRelatedArticles,
} from '../lib/resourceRelated.ts'

describe('pickRelatedArticles - Pure Helper', () => {
  const samplePosts = [
    {
      title: 'Tools That Have Triggered My Growth',
      slug: 'tools-growth',
      content_type: 'tools_for_thought',
      published_at: '2024-05-01T10:00:00Z',
      topics: ['Productivity', 'Systems'],
    },
    {
      title: 'Focus, Less Is More',
      slug: 'focus-less-is-more',
      content_type: 'random_thoughts',
      published_at: '2024-12-12T11:00:00Z',
      topics: ['Productivity'],
    },
    {
      title: 'The Architecture of Effective Systems',
      slug: 'architecture-effective-systems',
      content_type: 'structured_thoughts',
      published_at: '2024-03-15T09:00:00Z',
      topics: ['productivity', 'Architecture'],
    },
    {
      title: 'Carry Your Own Weather',
      slug: 'carry-your-own-weather',
      content_type: 'random_thoughts',
      published_at: '2024-12-16T07:00:00Z',
      topics: ['Life and Character'],
    },
    {
      title: 'Advanced Productivity Workflows',
      slug: 'advanced-productivity-workflows',
      content_type: 'structured_thoughts',
      published_at: '2024-08-20T12:00:00Z',
      topics: ['PRODUCTIVITY'],
    },
  ]

  it('matches topic case-insensitively after trimming', () => {
    const resUpper = pickRelatedArticles(samplePosts, 'PRODUCTIVITY')
    const resLower = pickRelatedArticles(samplePosts, 'productivity')
    const resPadded = pickRelatedArticles(samplePosts, '  Productivity  ')

    assert.equal(resUpper.length, 3)
    assert.deepEqual(resUpper, resLower)
    assert.deepEqual(resUpper, resPadded)
  })

  it('ranks structured and tools posts above random thoughts', () => {
    // In samplePosts:
    // structured_thoughts:
    //   - 'advanced-productivity-workflows' (2024-08-20)
    //   - 'architecture-effective-systems' (2024-03-15)
    // tools_for_thought:
    //   - 'tools-growth' (2024-05-01)
    // random_thoughts:
    //   - 'focus-less-is-more' (2024-12-12)
    // Even though focus-less-is-more is newer (December), group 1 ranks before random_thoughts.
    const res = pickRelatedArticles(samplePosts, 'Productivity', 4)

    assert.equal(res.length, 4)
    assert.equal(res[0].slug === undefined, true) // verify slug is not top-level, href is used
    assert.equal(res[0].href, '/garden/advanced-productivity-workflows')
    assert.equal(res[0].label, 'Article')

    assert.equal(res[1].href, '/garden/tools-growth')
    assert.equal(res[1].label, 'Tools for thought')

    assert.equal(res[2].href, '/garden/architecture-effective-systems')
    assert.equal(res[2].label, 'Article')

    assert.equal(res[3].href, '/garden/focus-less-is-more')
    assert.equal(res[3].label, 'Reflection')
  })

  it('sorts newest first inside a group and tie-breaks by slug', () => {
    const sameGroupPosts = [
      {
        title: 'Alpha Post',
        slug: 'alpha-post',
        content_type: 'structured_thoughts',
        published_at: '2024-06-01T10:00:00Z',
        topics: ['Design'],
      },
      {
        title: 'Beta Post Newer',
        slug: 'beta-post',
        content_type: 'structured_thoughts',
        published_at: '2024-08-01T10:00:00Z',
        topics: ['Design'],
      },
      {
        title: 'Zeta Post Same Date',
        slug: 'zeta-post',
        content_type: 'structured_thoughts',
        published_at: '2024-06-01T10:00:00Z',
        topics: ['Design'],
      },
    ]

    const res = pickRelatedArticles(sameGroupPosts, 'Design')
    assert.equal(res[0].href, '/garden/beta-post')
    // alpha-post and zeta-post have the same date, tie-break by slug: alpha before zeta
    assert.equal(res[1].href, '/garden/alpha-post')
    assert.equal(res[2].href, '/garden/zeta-post')
  })

  it('returns at most 3 items by default', () => {
    const res = pickRelatedArticles(samplePosts, 'Productivity')
    assert.equal(res.length, 3)
    assert.deepEqual(res.map((r) => r.href), [
      '/garden/advanced-productivity-workflows',
      '/garden/tools-growth',
      '/garden/architecture-effective-systems',
    ])
  })

  it('returns empty array when category is empty, whitespace, or invalid', () => {
    assert.deepEqual(pickRelatedArticles(samplePosts, ''), [])
    assert.deepEqual(pickRelatedArticles(samplePosts, '   '), [])
    assert.deepEqual(pickRelatedArticles(samplePosts, null), [])
    assert.deepEqual(pickRelatedArticles(samplePosts, undefined), [])
    assert.deepEqual(pickRelatedArticles(samplePosts, 12345), [])
  })

  it('returns empty array when no posts match category', () => {
    const res = pickRelatedArticles(samplePosts, 'NonExistentCategory')
    assert.deepEqual(res, [])
  })

  it('members-only style input is not the helper job (loader filters)', () => {
    // The pure helper does not filter by visibility; that is the loader's responsibility.
    // If a candidate with matching topic is passed in, the helper processes it faithfully.
    const candidateWithCustomProps = [
      {
        title: 'Public Or Members Post',
        slug: 'some-post',
        content_type: 'structured_thoughts',
        published_at: '2024-01-01T00:00:00Z',
        topics: ['Special Topic'],
        visibility: 'members', // loader would exclude this, but helper receives pre-filtered candidates
      },
    ]

    const res = pickRelatedArticles(candidateWithCustomProps, 'Special Topic')
    assert.equal(res.length, 1)
    assert.equal(res[0].title, 'Public Or Members Post')
    assert.equal(res[0].href, '/garden/some-post')
    assert.equal(res[0].label, 'Article')
  })

  it('safely handles null, undefined, or malformed inputs without throwing', () => {
    assert.doesNotThrow(() => {
      assert.deepEqual(pickRelatedArticles(null, 'Productivity'), [])
      assert.deepEqual(pickRelatedArticles(undefined, 'Productivity'), [])
      assert.deepEqual(pickRelatedArticles([], 'Productivity'), [])
      assert.deepEqual(pickRelatedArticles(['not-an-object'], 'Productivity'), [])
      assert.deepEqual(
        pickRelatedArticles(
          [
            null,
            undefined,
            {},
            { title: 'No slug', topics: ['Productivity'] },
            { slug: 'no-title', topics: ['Productivity'] },
            { title: 'Valid', slug: 'valid', topics: 'not-an-array' },
          ],
          'Productivity'
        ),
        []
      )
    })
  })
})

describe('extractArticleSlugFromHref - Pure Helper', () => {
  it('extracts slug from valid /garden/<slug> paths', () => {
    assert.equal(
      extractArticleSlugFromHref('/garden/weekly-planning-system'),
      'weekly-planning-system'
    )
    assert.equal(
      extractArticleSlugFromHref('/garden/focus-less-is-more'),
      'focus-less-is-more'
    )
    assert.equal(
      extractArticleSlugFromHref('  /garden/tools-growth  '),
      'tools-growth'
    )
    assert.equal(
      extractArticleSlugFromHref('/garden/some-slug-with-numbers-123'),
      'some-slug-with-numbers-123'
    )
  })

  it('strips query parameters and hash anchors from valid garden paths', () => {
    assert.equal(
      extractArticleSlugFromHref('/garden/weekly-planning-system?ref=download'),
      'weekly-planning-system'
    )
    assert.equal(
      extractArticleSlugFromHref('/garden/weekly-planning-system#how'),
      'weekly-planning-system'
    )
    assert.equal(
      extractArticleSlugFromHref('/garden/tools-growth?utm=test#section'),
      'tools-growth'
    )
  })

  it('rejects nested paths or sub-routes under garden', () => {
    assert.equal(extractArticleSlugFromHref('/garden/series/some-series'), null)
    assert.equal(extractArticleSlugFromHref('/garden/topics/some-topic'), null)
    assert.equal(
      extractArticleSlugFromHref('/garden/resources/some-resource'),
      null
    )
  })

  it('rejects non-garden internal paths', () => {
    assert.equal(extractArticleSlugFromHref('/library/some-book'), null)
    assert.equal(extractArticleSlugFromHref('/blog/some-post'), null)
    assert.equal(extractArticleSlugFromHref('/garden'), null)
    assert.equal(extractArticleSlugFromHref('/garden/'), null)
  })

  it('rejects external links and malformed URLs', () => {
    assert.equal(
      extractArticleSlugFromHref('https://example.com/garden/some-slug'),
      null
    )
    assert.equal(
      extractArticleSlugFromHref('https://ivankabandize.com/garden/some-slug'),
      null
    )
    assert.equal(extractArticleSlugFromHref('//garden/some-slug'), null)
  })

  it('rejects empty, null, undefined, and non-string inputs safely', () => {
    assert.equal(extractArticleSlugFromHref(''), null)
    assert.equal(extractArticleSlugFromHref('   '), null)
    assert.equal(extractArticleSlugFromHref(null), null)
    assert.equal(extractArticleSlugFromHref(undefined), null)
    assert.equal(extractArticleSlugFromHref(12345), null)
    assert.equal(extractArticleSlugFromHref({}), null)
    assert.equal(extractArticleSlugFromHref(['/garden/valid']), null)
  })
})
