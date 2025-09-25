import { ScrapingCrawl } from '@scrapeless-ai/sdk'

const getScrapelessClient = () => {
  const apiKey = process.env.SCRAPELESS_API_KEY
  if (!apiKey) {
    throw new Error('❌ SCRAPELESS_API_KEY not found in environment variables')
  }
  return new ScrapingCrawl({ apiKey })
}

export async function scrapeUrl(url: string, options: { 
  formats?: string[], 
  onlyMainContent?: boolean, 
  timeout?: number 
} = {}) {
  const client = getScrapelessClient()
  console.log('🔁 Scrapeless.scrapeUrl', { url, options: { ...options, timeout: options.timeout || 90000 } })
  const start = Date.now()
  try {
    const res = await client.scrapeUrl(url, {
      formats: (options.formats || ['markdown']) as any,
      onlyMainContent: options.onlyMainContent || true,
             timeout: options.timeout || 60000, // Giảm từ 90s xuống 60s
      browserOptions: {
        proxyCountry: 'VN',
        sessionName: 'Crawl',
        sessionRecording: false
      }
    })
    console.log('✅ Scrapeless.scrapeUrl done', { url, elapsedMs: Date.now() - start })
    return res
  } catch (err) {
    console.error('❌ Scrapeless.scrapeUrl error', { url, err })
    throw err
  }
}

export async function crawlUrl(url: string, options: { 
  limit?: number,
  formats?: string[], 
  onlyMainContent?: boolean, 
  timeout?: number 
} = {}) {
  const client = getScrapelessClient()
  console.log('🔁 Scrapeless.crawlUrl', { url, options: { limit: options.limit || 5, timeout: options.timeout || 90000 } })
  const start = Date.now()
  try {
    const res = await client.crawlUrl(url, {
      limit: options.limit || 5,
      scrapeOptions: {
        formats: (options.formats || ['markdown']) as any,
        onlyMainContent: options.onlyMainContent || true,
             timeout: options.timeout || 60000, // Giảm từ 90s xuống 60s
      },
      browserOptions: {
        proxyCountry: 'VN',
        sessionName: 'Crawl',
        sessionRecording: false
      },
    })
    console.log('✅ Scrapeless.crawlUrl done', { url, elapsedMs: Date.now() - start })
    return res
  } catch (err) {
    console.error('❌ Scrapeless.crawlUrl error', { url, err })
    throw err
  }
}

export async function batchScrapeUrls(urls: string[], options: { 
  formats?: string[], 
  onlyMainContent?: boolean, 
  timeout?: number 
} = {}) {
  const client = getScrapelessClient()
  console.log('🔁 Scrapeless.batchScrapeUrls', { count: urls.length, options: { timeout: options.timeout || 90000 } })
  const start = Date.now()
  try {
    const res = await client.batchScrapeUrls(urls, {
      formats: (options.formats || ['markdown']) as any,
      onlyMainContent: options.onlyMainContent || true,
      timeout: options.timeout || 90000
    })
    console.log('✅ Scrapeless.batchScrapeUrls done', { count: urls.length, elapsedMs: Date.now() - start })
    return res
  } catch (err) {
    console.error('❌ Scrapeless.batchScrapeUrls error', { err })
    throw err
  }
}
