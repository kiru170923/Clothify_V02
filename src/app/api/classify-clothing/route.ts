import { NextRequest, NextResponse } from 'next/server'
import { detectClothingType } from '../../../lib/clothingDetector'

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    console.log('🔍 Classifying clothing from image:', imageUrl)

    // Convert URL to base64 for clothing detection
    let imageBase64 = imageUrl
    
    // If it's a URL (not base64), fetch and convert to base64
    if (imageUrl.startsWith('http')) {
      try {
        console.log('📥 Fetching image from URL...')
        const response = await fetch(imageUrl)
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`)
        }
        
        const arrayBuffer = await response.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const mimeType = response.headers.get('content-type') || 'image/jpeg'
        imageBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`
        
        console.log('✅ Image converted to base64')
      } catch (fetchError) {
        console.error('❌ Failed to fetch image:', fetchError)
        throw new Error('Failed to fetch image for classification')
      }
    }

    // Use existing clothing detection function
    const detection = await detectClothingType(imageBase64)
    
    // Convert to classification format
    const classification = {
      category: detection.type,
      subcategory: detection.category,
      color: detection.color,
      style: detection.style,
      season: "all-season",
      gender: "unisex",
      confidence: detection.confidence,
      description: `${detection.color} ${detection.category} - ${detection.style}`
    }

    console.log('✅ Classification result:', classification)

    return NextResponse.json({
      success: true,
      classification
    })

  } catch (error: any) {
    console.error('❌ Classification error:', error)
    return NextResponse.json({ 
      error: 'Failed to classify clothing',
      details: error.message 
    }, { status: 500 })
  }
}
