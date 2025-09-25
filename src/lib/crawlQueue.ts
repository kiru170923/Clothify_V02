import PQueue from 'p-queue'
import pRetry from 'p-retry'
import { captureException } from './monitoring'
import { processUrl as processor } from './crawlProcessor'

const concurrency = Number(process.env.SCRAPE_CONCURRENCY || 2)
const intervalCap = Number(process.env.SCRAPE_INTERVAL_CAP || 1)
const interval = Number(process.env.SCRAPE_INTERVAL_MS || 1000)

const queue = new PQueue({ concurrency, intervalCap, interval })

export function enqueueScrape(url: string) {
  return queue.add(() => pRetry(() => processor(url), { retries: 3, minTimeout: 1000, factor: 2 }))
}

export function getQueueInfo() {
  return { size: queue.size, pending: queue.pending, concurrency }
}

// Graceful shutdown helper
export async function drainQueue(timeoutMs = 10000) {
  try {
    await Promise.race([queue.onEmpty(), new Promise((res) => setTimeout(res, timeoutMs))])
  } catch (e) {
    captureException(e)
  }
}


