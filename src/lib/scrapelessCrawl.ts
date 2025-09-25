/**
 * Helper to create a Scrapeless crawl job (POST) and poll for results (GET)
 * Usage: import { crawlTwentyFiveSearch } from '../lib/scrapelessCrawl'
 */
export async function crawlTwentyFiveSearch(
  query: string,
  opts?: { limit?: number; pollDelayMs?: number; maxAttempts?: number; apiKey?: string }
) {
  const limit = opts?.limit ?? 3
  const pollDelayMs = opts?.pollDelayMs ?? 2000
  const maxAttempts = opts?.maxAttempts ?? 20
  const apiKey = opts?.apiKey ?? process.env.SCRAPELESS_API_KEY
  if (!apiKey) throw new Error('SCRAPELESS_API_KEY missing')

  const searchUrl = `https://twentyfive.vn/search?q=${encodeURIComponent(query)}`

  // 1) POST create crawl job
  console.log('🔁 Scrapeless: creating crawl job', { url: searchUrl, limit })
  const postStart = Date.now()
  const postRes = await fetch('https://api.scrapeless.com/api/v2/crawler/crawl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': apiKey
    },
    body: JSON.stringify({
      url: searchUrl,
      limit,
      scrapeOptions: { formats: ['markdown'], onlyMainContent: true, timeout: 60000 } // Giảm từ 90s xuống 60s
    })
  })
  if (!postRes.ok) {
    const text = await postRes.text().catch(() => '')
    console.error('❌ Scrapeless: create crawl job failed', { status: postRes.status, statusText: postRes.statusText, body: text })
    throw new Error(`Create crawl job failed: ${postRes.status} ${postRes.statusText} ${text}`)
  }
  const postJson = await postRes.json()
  console.log('✅ Scrapeless: crawl job response received', { id: postJson.id, elapsedMs: Date.now() - postStart })
  const crawlId = postJson.id
  if (!crawlId) throw new Error('No crawl id returned')

  // 2) Poll GET until completed or failed
  const statusUrl = (id: string) => `https://api.scrapeless.com/api/v1/crawler/crawl/${id}`

  console.log(`🔁 Scrapeless: polling status for job ${crawlId} (maxAttempts=${maxAttempts}, delay=${pollDelayMs}ms)`)
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const attemptStart = Date.now()
    console.log(`🔍 Poll attempt ${attempt} for ${crawlId}...`)
    const statusRes = await fetch(statusUrl(crawlId), {
      headers: { 'x-api-token': apiKey }
    })

    if (!statusRes.ok) {
      const text = await statusRes.text().catch(() => '')
      console.error('❌ Scrapeless: status check failed', { status: statusRes.status, statusText: statusRes.statusText, body: text })
      throw new Error(`Status check failed: ${statusRes.status} ${statusRes.statusText} ${text}`)
    }

    const statusJson = await statusRes.json()
    const status = statusJson.status
    console.log('🔎 Poll result', { attempt, status, elapsedMs: Date.now() - attemptStart, completed: statusJson.completed, total: statusJson.total, success: statusJson.success })

    // Consider job finished when API signals success OR status === 'completed' OR completed >= total
    const finished = statusJson.success === true || status === 'completed' || (typeof statusJson.completed === 'number' && typeof statusJson.total === 'number' && statusJson.completed >= statusJson.total)
    if (finished) {
      console.log('✅ Scrapeless: crawl completed', { id: crawlId, success: statusJson.success })
      return statusJson // contains .data array with markdown/html/etc
    }

    if (status === 'failed' || statusJson.success === false) {
      console.error('❌ Scrapeless: crawl failed', statusJson)
      throw new Error(`Crawl failed: ${JSON.stringify(statusJson)}`)
    }

    // wait then retry
    await new Promise((r) => setTimeout(r, pollDelayMs))
  }

  throw new Error('Crawl timeout: max attempts reached')
}

export async function crawlUrlGeneric(
  url: string,
  opts?: { limit?: number; pollDelayMs?: number; maxAttempts?: number; apiKey?: string }
) {
  const limit = opts?.limit ?? 3
  const pollDelayMs = opts?.pollDelayMs ?? 2000
  const maxAttempts = opts?.maxAttempts ?? 20
  const apiKey = opts?.apiKey ?? process.env.SCRAPELESS_API_KEY
  if (!apiKey) throw new Error('SCRAPELESS_API_KEY missing')

  // 1) POST create crawl job using provided URL
  const postRes = await fetch('https://api.scrapeless.com/api/v2/crawler/crawl', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-token': apiKey
    },
    body: JSON.stringify({
      url,
      limit,
      scrapeOptions: { formats: ['markdown'], onlyMainContent: true, timeout: 60000 } // Giảm từ 90s xuống 60s
    })
  })
  if (!postRes.ok) {
    const text = await postRes.text().catch(() => '')
    throw new Error(`Create crawl job failed: ${postRes.status} ${postRes.statusText} ${text}`)
  }
  const postJson = await postRes.json()
  const crawlId = postJson.id
  if (!crawlId) throw new Error('No crawl id returned')

  // 2) Poll GET until completed or failed
  const statusUrl = (id: string) => `https://api.scrapeless.com/api/v2/crawler/crawl/${id}`

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const statusRes = await fetch(statusUrl(crawlId), {
      headers: { 'x-api-token': apiKey }
    })

    if (!statusRes.ok) {
      const text = await statusRes.text().catch(() => '')
      throw new Error(`Status check failed: ${statusRes.status} ${statusRes.statusText} ${text}`)
    }

    const statusJson = await statusRes.json()
    const status = statusJson.status
    // Consider success flag as valid completion as well
    const finished = statusJson.success === true || status === 'completed' || (typeof statusJson.completed === 'number' && typeof statusJson.total === 'number' && statusJson.completed >= statusJson.total)
    if (finished) {
      return statusJson // contains .data array with markdown/html/etc
    }
    if (status === 'failed' || statusJson.success === false) {
      throw new Error(`Crawl failed: ${JSON.stringify(statusJson)}`)
    }

    // wait then retry
    await new Promise((r) => setTimeout(r, pollDelayMs))
  }

  throw new Error('Crawl timeout: max attempts reached')
}


