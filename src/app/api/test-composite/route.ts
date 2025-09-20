import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const { personImageUrl, clothingImageUrls } = await request.json()
    
    console.log('🧪 Testing composite creation...')
    console.log('Person image URL:', personImageUrl)
    console.log('Clothing URLs count:', clothingImageUrls?.length)
    
    if (!personImageUrl || !clothingImageUrls || clothingImageUrls.length === 0) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }
    
    // No need to download person image - we only create clothing composite
    
    // Clothing-only composite layout: optimized for 2 images
    const canvasWidth = 1024  // Wider canvas for better visibility
    const canvasHeight = 512  // 2:1 ratio for side-by-side layout
    
    // Create white background
    const background = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    }).png().toBuffer()
    
    console.log('✅ Created background')
    
    // Process ALL clothing items in 2x2 grid
    const clothingItems = clothingImageUrls.slice(0, 4) // Max 4 items
    const clothingLayers = []
    
    // Layout: side-by-side for 2 clothing items
    const itemWidth = Math.floor(canvasWidth / 2)  // Each item takes half width
    const itemHeight = canvasHeight  // Full height for each item
    
    console.log(`🔄 Processing ${clothingItems.length} clothing items in side-by-side layout`)
    console.log(`📐 Each item size: ${itemWidth}x${itemHeight}`)
    
    for (let i = 0; i < clothingItems.length; i++) {
      console.log(`🔄 Processing clothing item ${i + 1}/${clothingItems.length}`)
      
      // Download clothing image
      const clothingResponse = await fetch(clothingItems[i])
      if (!clothingResponse.ok) {
        throw new Error(`Failed to download clothing item ${i + 1}`)
      }
      const clothingBuffer = await clothingResponse.arrayBuffer()
      const clothingImg = Buffer.from(clothingBuffer)
      
      console.log(`✅ Downloaded clothing item ${i + 1}, size:`, clothingBuffer.byteLength)
      
      // Calculate side-by-side position
      const x = i * itemWidth  // Left item at 0, right item at itemWidth
      const y = 0  // All items at top
      
      console.log(`📍 Item ${i + 1} position: x=${x}, y=${y}`)
      
      // Resize and prepare clothing item
      const clothingResized = await sharp(clothingImg)
        .resize(itemWidth, itemHeight, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer()
      
      clothingLayers.push({
        input: clothingResized,
        left: x,
        top: y
      })
      
      console.log(`✅ Clothing item ${i + 1} processed and added to layers`)
    }
    
    // Composite all clothing layers (no person, no divider)
    console.log('🔄 Creating clothing composite image...')
    const allLayers = [
      ...clothingLayers
    ]
    
    console.log(`🔄 Compositing ${allLayers.length} layers...`)
    const compositeBuffer = await sharp(background)
      .composite(allLayers)
      .png()
      .toBuffer()
    
    console.log('✅ Composite image created, size:', compositeBuffer.length)
    
    // Convert to base64
    console.log('🔄 Converting to base64...')
    const compositeBase64 = `data:image/png;base64,${compositeBuffer.toString('base64')}`
    console.log('✅ Base64 conversion complete, length:', compositeBase64.length)
    
    return NextResponse.json({
      success: true,
      compositeImage: compositeBase64,
      dimensions: {
        width: canvasWidth,
        height: canvasHeight
      }
    })
    
  } catch (error) {
    console.error('❌ Test composite failed:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('❌ Error details:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Test composite failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
