import assert from 'node:assert/strict'
import {
    buildCleanupPlan,
    parseAllowList,
    maskEmail,
} from './cleanup-test-data/cleanup.mjs'

const ID_INQ_1 = '8cd8dde8-6b13-49d0-a3a4-016ff8fe1eb7'
const ID_INQ_2 = '64bd2728-b6cc-40e3-91ab-13c380f69fa4'
const ID_POST_DRAFT = '11111111-1111-4111-8111-111111111111'
const ID_POST_PUBLISHED = '22222222-2222-4222-8222-222222222222'
const ID_TAG_EMPTY = '33333333-3333-4333-8333-333333333333'
const ID_TAG_DRAFT_ONLY = '44444444-4444-4444-8444-444444444444'
const ID_TAG_ON_PUBLISHED = '55555555-5555-4555-8555-555555555555'

const fixtureInquiries = [
    {
        id: ID_INQ_1,
        created_at: '2026-09-16T18:55:11Z',
        email: 'ivan@example.com',
        name: 'Ivan Test',
    },
    {
        id: ID_INQ_2,
        created_at: '2026-10-28T23:24:52Z',
        email: 'kibs@example.com',
        name: 'Kibs',
    },
]

const fixturePosts = [
    {
        id: ID_POST_DRAFT,
        slug: 'draft-test-post',
        title: 'Draft Test Post',
        publish_status: 'draft',
        published_at: null,
    },
    {
        id: ID_POST_PUBLISHED,
        slug: 'live-published-post',
        title: 'Live Published Post',
        publish_status: 'published',
        published_at: '2026-10-01T10:00:00Z',
    },
]

const fixtureTags = [
    {
        id: ID_TAG_EMPTY,
        name: 'Unused Test Tag',
        slug: 'unused-test-tag',
    },
    {
        id: ID_TAG_DRAFT_ONLY,
        name: 'Draft Only Tag',
        slug: 'draft-only-tag',
    },
    {
        id: ID_TAG_ON_PUBLISHED,
        name: 'Leadership',
        slug: 'leadership',
    },
]

const fixturePostTags = [
    {
        post_id: ID_POST_DRAFT,
        tag_id: ID_TAG_DRAFT_ONLY,
    },
    {
        post_id: ID_POST_PUBLISHED,
        tag_id: ID_TAG_ON_PUBLISHED,
    },
]

// 1. Test allow-list filtering (only listed IDs are scheduled for deletion)
{
    const plan = buildCleanupPlan({
        allowList: {
            inquiries: [ID_INQ_1],
            posts: [ID_POST_DRAFT],
            tags: [ID_TAG_EMPTY, ID_TAG_DRAFT_ONLY],
        },
        dbInquiries: fixtureInquiries,
        dbPosts: fixturePosts,
        dbTags: fixtureTags,
        dbPostTags: fixturePostTags,
    })

    assert.equal(plan.canApply, true, 'Plan with valid draft post and unused/draft tags should be allowed')
    assert.equal(plan.refused.length, 0, 'Expected 0 refused items')
    assert.deepEqual(
        plan.inquiriesToDelete.map((i) => i.id),
        [ID_INQ_1],
        'Only allow-listed inquiry ID_INQ_1 should be scheduled for deletion'
    )
    assert.deepEqual(
        plan.postsToDelete.map((p) => p.id),
        [ID_POST_DRAFT],
        'Only allow-listed draft post should be scheduled for deletion'
    )
    assert.deepEqual(
        plan.tagsToDelete.map((t) => t.id),
        [ID_TAG_EMPTY, ID_TAG_DRAFT_ONLY],
        'Only allow-listed non-published tags should be scheduled for deletion'
    )
    console.log('[PASS] Allow-list filtering selects only explicitly listed IDs')
}

// 2. Test refuse rule: published post in allow-list is refused
{
    const plan = buildCleanupPlan({
        allowList: {
            inquiries: [],
            posts: [ID_POST_PUBLISHED],
            tags: [],
        },
        dbInquiries: fixtureInquiries,
        dbPosts: fixturePosts,
        dbTags: fixtureTags,
        dbPostTags: fixturePostTags,
    })

    assert.equal(plan.canApply, false, 'Plan containing a published post must refuse apply')
    assert.equal(plan.postsToDelete.length, 0, 'Published post must not be added to postsToDelete')
    assert.equal(plan.refused.length, 1, 'Published post must be recorded in refused list')
    assert.equal(plan.refused[0].table, 'posts')
    assert.equal(plan.refused[0].id, ID_POST_PUBLISHED)
    console.log('[PASS] Refuse rule blocks deletion of published posts')
}

// 3. Test refuse rule: tag attached to a published post is refused
{
    const plan = buildCleanupPlan({
        allowList: {
            inquiries: [],
            posts: [],
            tags: [ID_TAG_ON_PUBLISHED],
        },
        dbInquiries: fixtureInquiries,
        dbPosts: fixturePosts,
        dbTags: fixtureTags,
        dbPostTags: fixturePostTags,
    })

    assert.equal(plan.canApply, false, 'Plan containing a tag attached to a published post must refuse apply')
    assert.equal(plan.tagsToDelete.length, 0, 'Tag attached to published post must not be in tagsToDelete')
    assert.equal(plan.refused.length, 1, 'Tag attached to published post must be in refused list')
    assert.equal(plan.refused[0].table, 'tags')
    assert.equal(plan.refused[0].id, ID_TAG_ON_PUBLISHED)
    console.log('[PASS] Refuse rule blocks deletion of tags attached to published posts')
}

// 4. Test invalid allow-list rejection
{
    assert.throws(
        () => parseAllowList({ inquiries: ['not-a-uuid'], posts: [], tags: [] }),
        /Invalid UUID/
    )
    assert.throws(
        () => parseAllowList({ inquiries: [] }),
        /must be an array/
    )
    console.log('[PASS] Invalid allow-list schema or non-UUID entries are rejected')
}

// 5. Test email masking
{
    assert.equal(maskEmail('ivan@gmail.com'), 'iv***@gmail.com')
    assert.equal(maskEmail('kibs@domain.co.ug'), 'ki***@domain.co.ug')
    console.log('[PASS] Email masking shows only first 2 characters plus domain')
}

console.log('\nPASS: All test_cleanup_test_data assertions succeeded.')
