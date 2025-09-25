import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { processUrl } from './crawlProcessor'

const redisUrl = process.env.REDIS_URL || process.env.REDIS_CONN || ''

let queue: Queue | null = null

export function initBull() {
  if (!redisUrl) return null
  if (!queue) {
    const connection = new IORedis(redisUrl)
    queue = new Queue('crawl-queue', { connection })
  }
  return queue
}

export async function enqueueJob(url: string) {
  const q = initBull()
  if (!q) throw new Error('No Redis configured')
  return q.add('crawl', { url }, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } })
}

export function getQueueInfo() {
  if (!queue) return { redis: false }
  return { redis: true }
}

// Worker starter (call in a separate process)
export function startWorker() {
  if (!redisUrl) throw new Error('REDIS_URL not set')
  const connection = new IORedis(redisUrl)
  const worker = new Worker('crawl-queue', async (job: Job) => {
    const { url } = job.data
    return await processUrl(url)
  }, { connection })
  worker.on('failed', (job, err) => console.error('Job failed', job?.id, err))
  return worker
}


