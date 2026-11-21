import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildTopicBarItems } from '../lib/gardenTopicBar.ts'

describe('gardenTopicBar - buildTopicBarItems', () => {
  it('always places "All topics" first with key "all"', () => {
    const items = buildTopicBarItems([])
    assert.equal(items.length, 1)
    assert.deepEqual(items[0], { key: 'all', label: 'All topics', href: undefined })
  })

  it('handles null or undefined input by returning only "All topics"', () => {
    assert.deepEqual(buildTopicBarItems(null), [{ key: 'all', label: 'All topics', href: undefined }])
    assert.deepEqual(buildTopicBarItems(undefined), [{ key: 'all', label: 'All topics', href: undefined }])
  })

  it('builds topic items without href when buildHref is omitted (callback mode)', () => {
    const raw = [
      { name: 'Faith', slug: 'faith' },
      { name: 'Technology', slug: 'technology' },
    ]
    const items = buildTopicBarItems(raw)
    assert.equal(items.length, 3)
    assert.deepEqual(items, [
      { key: 'all', label: 'All topics', href: undefined },
      { key: 'faith', label: 'Faith', href: undefined },
      { key: 'technology', label: 'Technology', href: undefined },
    ])
  })

  it('builds topic items with href when buildHref is provided (link mode)', () => {
    const raw = [
      { name: 'Productivity', slug: 'productivity' },
      { name: 'Leadership', slug: 'leadership' },
    ]
    const buildHref = (slug) => (slug ? `/garden/resources?topic=${slug}` : '/garden/resources')
    const items = buildTopicBarItems(raw, buildHref)
    assert.equal(items.length, 3)
    assert.deepEqual(items, [
      { key: 'all', label: 'All topics', href: '/garden/resources' },
      { key: 'productivity', label: 'Productivity', href: '/garden/resources?topic=productivity' },
      { key: 'leadership', label: 'Leadership', href: '/garden/resources?topic=leadership' },
    ])
  })

  it('supports alternative field names (label, key)', () => {
    const raw = [
      { label: 'Deep Work', key: 'deep-work' },
    ]
    const items = buildTopicBarItems(raw)
    assert.equal(items.length, 2)
    assert.deepEqual(items[1], { key: 'deep-work', label: 'Deep Work', href: undefined })
  })

  it('drops empty topic entries safely', () => {
    const raw = [
      { name: '', slug: '' },
      { name: 'Valid', slug: 'valid' },
    ]
    const items = buildTopicBarItems(raw)
    assert.equal(items.length, 2)
    assert.equal(items[1].key, 'valid')
  })
})
