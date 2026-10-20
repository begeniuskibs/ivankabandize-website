async function testRoute(path) {
  const res = await fetch(`http://localhost:3000${path}`)
  const html = await res.text()

  console.log(`========================================`)
  console.log(`PATH: ${path} (status: ${res.status})`)

  const titleMatch = html.match(/<title>([^<]*)<\/title>/i)
  console.log(`TITLE: ${titleMatch ? titleMatch[1] : '(none)'}`)

  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i)
  console.log(`DESCRIPTION: ${descMatch ? descMatch[1] : '(none)'}`)

  const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']*)["']/i) ||
                      html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']robots["']/i)
  if (robotsMatch) {
    console.log(`ROBOTS: ${robotsMatch[1]}`)
  }
}

async function run() {
  const routes = [
    '/',
    '/me',
    '/workwithme',
    '/garden',
    '/now',
    '/lets-talk',
    '/garden/the-research-that-changed-everything',
    '/garden/a-first-step-prolonged-procrastination',
    '/login'
  ]

  for (const r of routes) {
    await testRoute(r)
  }
}

run().catch(console.error)
