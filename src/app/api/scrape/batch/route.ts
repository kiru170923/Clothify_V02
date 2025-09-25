import { NextRequest, NextResponse } from 'next/server'
import { enqueueScrape, getQueueInfo } from '../../../../lib/crawlQueue'
import { enqueueJob } from '../../../../lib/bullQueue'
import { initSentry } from '../../../../lib/sentry'

initSentry()

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get('x-scrape-secret') || req.headers.get('authorization')?.replace('Bearer ', '')
    if (!secret || secret !== process.env.SCRAPE_JOB_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const urls: string[] = body.urls || []
    if (!Array.isArray(urls) || urls.length === 0) return NextResponse.json({ success: false, error: 'No urls provided' }, { status: 400 })

    const enqueued = []
    for (const url of urls) {
      try {
        if (process.env.REDIS_URL) {
          await enqueueJob(url)
          enqueued.push({ url, queued: 'redis' })
        } else {
          enqueued.push(enqueueScrape(url))
        }
      } catch (e) {
        console.error('Enqueue failed for', url, e)
      }
    }

    const info = getQueueInfo()
    return NextResponse.json({ success: true, queued: enqueued.length, queue: info })
  } catch (error: any) {
    console.error('Batch enqueue error:', error)
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 })
  }
}


