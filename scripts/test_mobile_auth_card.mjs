import assert from 'node:assert/strict'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function extractClassTokens(source) {
    const tokens = []
    // Match static className="..."
    for (const match of source.matchAll(/className="([^"]+)"/g)) {
        for (const t of match[1].split(/\s+/).filter(Boolean)) {
            tokens.push(t)
        }
    }
    // Match template literal className={`...`}
    for (const match of source.matchAll(/className=\{`([\s\S]*?)`\}/g)) {
        const rawTemplate = match[1]
        // Extract string literals inside ${...}
        for (const strMatch of rawTemplate.matchAll(/'([^']+)'/g)) {
            for (const t of strMatch[1].split(/\s+/).filter(Boolean)) {
                tokens.push(t)
            }
        }
        // Remove ${...} blocks and extract static template tokens
        const staticPart = rawTemplate.replace(/\$\{[\s\S]*?\}/g, ' ')
        for (const t of staticPart.split(/\s+/).filter(Boolean)) {
            tokens.push(t)
        }
    }
    return tokens
}

const cardPath = path.resolve('components/auth/SlidingAuthCard.tsx')
assert.ok(fs.existsSync(cardPath), 'components/auth/SlidingAuthCard.tsx must exist')

const currentContent = fs.readFileSync(cardPath, 'utf8')
const mainContent = execSync('git show origin/main:components/auth/SlidingAuthCard.tsx', {
    encoding: 'utf8',
})

const mainTokens = extractClassTokens(mainContent)
const currentTokens = extractClassTokens(currentContent)
const mainTokenSet = new Set(mainTokens)

// 1. Check all desktop md: classes from origin/main are still present unchanged
const mainMdTokens = mainTokens.filter((t) => t.startsWith('md:'))
const currentMdTokens = currentTokens.filter((t) => t.startsWith('md:'))
assert.deepEqual(
    currentMdTokens,
    mainMdTokens,
    'Desktop md: classes must remain 100% identical to origin/main'
)
console.log(`[PASS] All ${mainMdTokens.length} desktop md: class occurrences from origin/main are present unchanged`)

// 2. Check git diff against origin/main has zero removed lines containing md:
const diffOutput = execSync(
    'git diff origin/main -- components/auth/SlidingAuthCard.tsx',
    { encoding: 'utf8' }
)
const diffLines = diffOutput.split(/\r?\n/)
const removedLines = diffLines.filter((l) => l.startsWith('-') && !l.startsWith('---'))
const removedMdLines = removedLines.filter((l) => /\bmd:/.test(l))
assert.equal(
    removedMdLines.length,
    0,
    `Expected 0 removed lines containing md:, found: ${removedMdLines.join('\n')}`
)
console.log('[PASS] Zero removed lines in git diff contain md:')

// 3. Check every new class token is max-md: prefixed
const newClassTokens = currentTokens.filter((t) => !mainTokenSet.has(t))
assert.ok(newClassTokens.length > 0, 'Expected new mobile class tokens to be present')
for (const token of newClassTokens) {
    assert.ok(
        token.startsWith('max-md:'),
        `Every new mobile class must be max-md: prefixed, but found "${token}"`
    )
}
console.log(`[PASS] All ${newClassTokens.length} new mobile class tokens are max-md: prefixed`)

// 4. Verify both privacy lines exist
assert.ok(
    currentContent.includes('By creating an account you agree to the'),
    'Sign-up privacy notice must exist'
)
assert.ok(
    currentContent.includes('See our'),
    'Login privacy notice must exist'
)
const privacyPolicyCount = currentContent
    .split(/\r?\n/)
    .filter((l) => l.includes('Privacy Policy')).length
assert.equal(
    privacyPolicyCount,
    2,
    `Expected exactly 2 "Privacy Policy" occurrences in SlidingAuthCard.tsx, found ${privacyPolicyCount}`
)
console.log('[PASS] Both privacy notice lines exist and are intact')

// 5. Verify required mobile vertical swap & compact photo panel classes exist
const requiredMobileClasses = [
    'max-md:min-h-0',
    'max-md:grid',
    'max-md:grid-cols-1',
    'max-md:order-1',
    'max-md:order-2',
    'max-md:min-h-[200px]',
    'max-md:h-[210px]',
    'max-md:min-h-[44px]',
    'max-md:transition-transform',
    'max-md:duration-500',
    'max-md:ease-in-out',
    'max-md:motion-reduce:transition-none',
]
for (const reqCls of requiredMobileClasses) {
    assert.ok(
        currentContent.includes(reqCls),
        `Expected mobile class "${reqCls}" in SlidingAuthCard.tsx`
    )
}
console.log('[PASS] Required mobile vertical swap, compact photo panel, 44px button, and reduced-motion classes verified')

console.log('\nPASS: All test_mobile_auth_card checks succeeded.')
