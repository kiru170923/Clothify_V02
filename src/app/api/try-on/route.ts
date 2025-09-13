import { NextRequest, NextResponse } from 'next/server'
import { callKieAI } from '@/lib/kieai'

export async function POST(request: NextRequest) {
  try {
    console.log('API Key check:', {
      hasKieAiKey: !!process.env.KIEAI_API_KEY,
      keyPreview: process.env.KIEAI_API_KEY ? process.env.KIEAI_API_KEY.substring(0, 8) + '...' : 'not found',
      nodeEnv: process.env.NODE_ENV,
    })

    const body = await request.json()
    const { personImage, clothingImage } = body

    if (!personImage || !clothingImage) {
      return NextResponse.json(
        { error: 'Missing personImage or clothingImage' },
        { status: 400 }
      )
    }

    console.log('Calling KIE.AI with images...')
    const result = await callKieAI({
      personImage,
      clothingImage,
    })

    if (!result.success) {
      console.error('KIE.AI failed:', result.error)
      return NextResponse.json(
        { error: result.error || 'Failed to process images' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      resultImage: result.resultImage,
      processingTime: result.processingTime,
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
