import fs from 'node:fs'
import { runPreflight } from './preflight.mjs'

async function generate() {
  const report = await runPreflight()
  fs.writeFileSync('scripts/ghost-import/preflight-report.json', JSON.stringify(report, null, 2), 'utf8')
  console.log('Saved preflight report to scripts/ghost-import/preflight-report.json')
}

generate().catch(err => {
  console.error(err)
  process.exit(1)
})
