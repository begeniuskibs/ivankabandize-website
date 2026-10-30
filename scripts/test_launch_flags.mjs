import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const flagPath = path.resolve('lib/launchFlags.ts')
assert.ok(fs.existsSync(flagPath), 'lib/launchFlags.ts must exist')

const flagSource = fs.readFileSync(flagPath, 'utf8')
assert.ok(
    flagSource.includes(
        'Set to true after launch when the sections are complete. Tracked in Notion: Post-launch batch.'
    ),
    'lib/launchFlags.ts must contain the required post-launch tracking comment'
)

const match = flagSource.match(/export\s+const\s+SHOW_PLACEHOLDER_SECTIONS\s*=\s*(true|false)/)
assert.ok(match, 'SHOW_PLACEHOLDER_SECTIONS export must exist in lib/launchFlags.ts')
const parsedValue = match[1] === 'true'
assert.equal(parsedValue, false, 'SHOW_PLACEHOLDER_SECTIONS must equal false')

// Check gated files import SHOW_PLACEHOLDER_SECTIONS
const gatedFiles = [
    'components/public/GardenLandingA2.tsx',
    'components/public/GardenFeed.tsx',
    'app/(site)/garden/series/[slug]/page.tsx',
]

for (const relPath of gatedFiles) {
    const content = fs.readFileSync(path.resolve(relPath), 'utf8')
    assert.ok(
        content.includes('SHOW_PLACEHOLDER_SECTIONS'),
        `${relPath} must reference SHOW_PLACEHOLDER_SECTIONS`
    )
}

// Check SlidingAuthCard privacy links
const authCardContent = fs.readFileSync(
    path.resolve('components/auth/SlidingAuthCard.tsx'),
    'utf8'
)
assert.ok(
    authCardContent.includes('By creating an account you agree to the'),
    'SlidingAuthCard.tsx must include sign-up privacy notice'
)
assert.ok(
    authCardContent.includes('See our'),
    'SlidingAuthCard.tsx must include sign-in privacy notice'
)
assert.ok(
    authCardContent.includes('href="/privacy-policy"'),
    'SlidingAuthCard.tsx must link to /privacy-policy'
)

console.log('PASS: SHOW_PLACEHOLDER_SECTIONS exists and equals false')

