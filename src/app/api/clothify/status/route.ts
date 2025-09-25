import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')

    if (!taskId) {
      return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })
    }

    const rawKey = process.env.KIEAI_API_KEY ?? ''
    const apiKey = rawKey.trim()
    if (!apiKey) {
      return NextResponse.json({ error: 'KIE.AI API key missing' }, { status: 500 })
    }

    const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      cache: 'no-store'
    })

    if (!statusResponse.ok) {
      return NextResponse.json({ error: 'Status fetch failed' }, { status: 502 })
    }

    const statusData = await statusResponse.json()

    if (statusData.code !== 200) {
      return NextResponse.json({ state: 'unknown', data: statusData }, { status: 200 })
    }

    const state = statusData.data?.state

    if (state === 'success' || state === 'completed') {
      try {
        // KIE.AI sometimes returns resultJson
        const resultJson = statusData.data.resultJson ? JSON.parse(statusData.data.resultJson) : null
        const resultImageUrl = resultJson?.resultUrls?.[0] || statusData.data.resultImageUrl
        if (!resultImageUrl) {
          return NextResponse.json({ state: 'success', resultImageUrl: null }, { status: 200 })
        }
        return NextResponse.json({ state: 'success', resultImageUrl }, { status: 200 })
      } catch {
        const resultImageUrl = statusData.data.resultImageUrl
        return NextResponse.json({ state: 'success', resultImageUrl }, { status: 200 })
      }
    }

    if (state === 'fail' || state === 'failed' || state === 'error') {
      return NextResponse.json({ state: 'failed', message: statusData.data?.failMsg || 'Generation failed' }, { status: 200 })
    }

    return NextResponse.json({ state: 'processing' }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 })
  }
}
