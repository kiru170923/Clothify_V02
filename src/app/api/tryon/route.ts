import { NextRequest, NextResponse } from 'next/server'

// Placeholder: integrate Gemini 2.5 Flash Image here when API key/env is available

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const modelImageUrl = typeof body.modelImageUrl === 'string' ? body.modelImageUrl : ''
    const productImageUrl = typeof body.productImageUrl === 'string' ? body.productImageUrl : ''
    if (!modelImageUrl || !productImageUrl) {
      return NextResponse.json({ error: 'Thiếu modelImageUrl hoặc productImageUrl' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY chưa cấu hình' }, { status: 500 })
    }

    // TODO: Call Gemini 2.5 Flash Image swap API with the two URLs
    // For now, return a placeholder structure
    return NextResponse.json({ success: true, imageUrl: productImageUrl })
  } catch (error) {
    console.error('[tryon] error', error)
    return NextResponse.json({ error: 'Không thể thực hiện try-on' }, { status: 500 })
  }
}


