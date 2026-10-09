// Static scan for accidentally committed secrets, API keys, and sensitive tokens
import fs from 'node:fs'
import path from 'node:path'

console.log('=== SECRETS SCAN: CHECKING SOURCE FILES FOR LEAKED CREDENTIALS ===\n')

const SECRET_PATTERNS = [
  { name: 'Supabase Service Role Key JWT', regex: /eyJh[a-zA-Z0-9_-]+\.eyJh[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]{20,}/ },
  { name: 'Private Key Header', regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Generic Secret Assignment', regex: /(?:api[_-]?key|secret[_-]?key|service[_-]?role[_-]?key)\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/i },
  { name: 'Database Password in URI', regex: /postgres(?:ql)?:\/\/[^:]+:([^@]+)@/ },
]

const IGNORED_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  '.yarn',
  'out',
  'build',
  'coverage',
])

const IGNORED_FILES = new Set([
  'package-lock.json',
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
])

let filesScanned = 0
const violations = []

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    const relPath = path.relative('.', fullPath)

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name) && !entry.name.startsWith('.')) {
        walk(fullPath)
      }
    } else if (entry.isFile()) {
      if (IGNORED_FILES.has(entry.name) || entry.name.endsWith('.env') || entry.name.endsWith('.log')) {
        continue
      }

      // Check text files
      const ext = path.extname(entry.name).toLowerCase()
      if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json', '.md', '.sql', '.css'].includes(ext)) {
        filesScanned++
        try {
          const content = fs.readFileSync(fullPath, 'utf8')
          for (const pattern of SECRET_PATTERNS) {
            // Ignore preflight-report.json or harmless schema files if they mention the regex pattern itself
            if (relPath.includes('secrets_scan.mjs')) continue

            const match = pattern.regex.exec(content)
            if (match) {
              // Ignore placeholders
              const matchedStr = match[0]
              if (
                matchedStr.includes('your-') ||
                matchedStr.includes('placeholder') ||
                matchedStr.includes('example') ||
                matchedStr.includes('xxx')
              ) {
                continue
              }
              violations.push({
                file: relPath,
                pattern: pattern.name,
                match: matchedStr.slice(0, 15) + '...',
              })
            }
          }
        } catch {
          // ignore binary / unreadable
        }
      }
    }
  }
}

walk('.')

console.log(`Scanned ${filesScanned} source files.`)
if (violations.length === 0) {
  console.log('Result: PASS - No secrets or credentials found in tracked source files.')
} else {
  console.error(`Result: FAIL - Found ${violations.length} potential secrets!`)
  for (const v of violations) {
    console.error(`  - [${v.file}] matches ${v.pattern} (${v.match})`)
  }
  process.exit(1)
}
