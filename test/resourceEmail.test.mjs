// Unit tests for Resource Email builder
// House style: spaced hyphen " - " only

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildResourceEmail } from '../lib/resourceEmail.ts'

describe('buildResourceEmail', () => {
  const validFileUrl =
    'https://eoobmmupqdygujyaxifz.supabase.co/storage/v1/object/sign/resource-files/guide.pdf?token=abc'
  const validLinkUrl = 'https://www.notion.so/my-workspace/template-123'

  describe('File delivery variant', () => {
    it('produces standard subject and 24 hour wording in html and text', () => {
      const email = buildResourceEmail({
        title: 'Weekly Planning System',
        name: 'Ivan Kabandize',
        url: validFileUrl,
        delivery: 'file',
        kind: 'guide',
      })

      assert.equal(email.subject, 'Your download - Weekly Planning System')
      assert.ok(email.html.includes('This link works for 24 hours.'))
      assert.ok(email.text.includes('This link works for 24 hours.'))
      assert.ok(email.html.includes('Download Weekly Planning System'))
      assert.ok(email.html.includes(validFileUrl))
      assert.ok(email.text.includes(validFileUrl))
      assert.ok(email.html.includes('Hi Ivan Kabandize,'))
      assert.ok(email.text.includes('Hi Ivan Kabandize,'))
    })

    it('handles missing name gracefully with generic greeting', () => {
      const email = buildResourceEmail({
        title: 'Founder Checklist',
        name: null,
        url: validFileUrl,
        delivery: 'file',
        kind: 'template',
      })

      assert.ok(
        email.html.includes('<p style="margin-top: 0; font-size: 16px;">Hello,</p>')
      )
      assert.ok(email.text.startsWith('Hello,'))
    })
  })

  describe('Link delivery variant', () => {
    it('uses "Your template - {title}" subject when kind is template', () => {
      const email = buildResourceEmail({
        title: 'SaaS Metrics Dashboard',
        name: 'Maya',
        url: validLinkUrl,
        delivery: 'link',
        kind: 'template',
      })

      assert.equal(email.subject, 'Your template - SaaS Metrics Dashboard')
      assert.ok(email.html.includes('Open SaaS Metrics Dashboard'))
      assert.ok(
        email.html.includes('Save this email. The link does not expire.')
      )
      assert.ok(
        email.text.includes('Save this email. The link does not expire.')
      )
      assert.ok(!email.html.includes('24 hours'))
      assert.ok(email.html.includes(validLinkUrl))
    })

    it('uses "Your link - {title}" subject when kind is not template', () => {
      const email = buildResourceEmail({
        title: 'Growth Engineering Guide',
        name: 'Alex',
        url: validLinkUrl,
        delivery: 'link',
        kind: 'guide',
      })

      assert.equal(email.subject, 'Your link - Growth Engineering Guide')
      assert.ok(email.html.includes('Open Growth Engineering Guide'))
      assert.ok(
        email.html.includes('Save this email. The link does not expire.')
      )
    })
  })

  describe('HTML escaping and security', () => {
    it('escapes malicious HTML characters in title and name', () => {
      const email = buildResourceEmail({
        title: 'Guide <script>alert("xss")</script> & More',
        name: 'User <b>Bold</b>',
        url: validLinkUrl,
        delivery: 'link',
        kind: 'template',
      })

      assert.ok(!email.html.includes('<script>'))
      assert.ok(
        email.html.includes(
          '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; More'
        )
      )
      assert.ok(!email.html.includes('<b>Bold</b>'))
      assert.ok(email.html.includes('User &lt;b&gt;Bold&lt;/b&gt;'))
    })

    it('refuses a non-https url by throwing', () => {
      assert.throws(
        () =>
          buildResourceEmail({
            title: 'Test Resource',
            name: 'Maya',
            url: 'http://insecure.example.com',
            delivery: 'link',
            kind: 'template',
          }),
        /must start with https:\/\//
      )

      assert.throws(
        () =>
          buildResourceEmail({
            title: 'Test Resource',
            name: 'Maya',
            url: 'javascript:alert(1)',
            delivery: 'file',
            kind: 'guide',
          }),
        /must start with https:\/\//
      )
    })
  })
})
