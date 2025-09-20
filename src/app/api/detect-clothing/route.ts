import { NextRequest, NextResponse } from 'next/server'
import { detectClothingType } from '../../../lib/clothingDetector'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const result = await detectClothingType(image)
    
    return NextResponse.json({
      success: true,
      detection: result
    })

  } catch (error) {
    console.error('Clothing detection API error:', error)
    return NextResponse.json({ 
      error: 'Failed to detect clothing type',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
