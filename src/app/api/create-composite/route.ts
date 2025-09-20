import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export async function POST(request: NextRequest) {
  try {
    const { personImageUrl, clothingImageUrls } = await request.json()
    
    if (!personImageUrl || !clothingImageUrls || clothingImageUrls.length === 0) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }
    
    console.log('🎨 Creating server-side composite image...')
    console.log('Person image URL:', personImageUrl)
    console.log('Clothing image URLs:', clothingImageUrls)
    console.log('Clothing images count:', clothingImageUrls.length)
    
    // Download images
    const personResponse = await fetch(personImageUrl)
    const personBuffer = await personResponse.arrayBuffer()
    const personImage = Buffer.from(personBuffer)
    
    const clothingImages = []
    for (const url of clothingImageUrls) {
      const clothingResponse = await fetch(url)
      const clothingBuffer = await clothingResponse.arrayBuffer()
      clothingImages.push(Buffer.from(clothingBuffer))
    }
    
    console.log('✅ Downloaded all images')
    
    // Get person image dimensions
    const personMetadata = await sharp(personImage).metadata()
    console.log('Person image dimensions:', personMetadata.width, 'x', personMetadata.height)
    
    // Create composite layout
    const canvasWidth = 1024
    const canvasHeight = 1365
    const personWidth = 512
    const personHeight = 1365
    const clothingWidth = 512
    const clothingItemHeight = Math.floor(1365 / clothingImages.length)
    
    // Create white background
    const background = await sharp({
      create: {
        width: canvasWidth,
        height: canvasHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    }).png().toBuffer()
    
    console.log('✅ Created background canvas')
    
    // Prepare composite layers
    const compositeLayers = []
    
    // Add person image (left side)
    const resizedPerson = await sharp(personImage)
      .resize(personWidth, personHeight, { 
        fit: 'cover',
        position: 'center'
      })
      .png()
      .toBuffer()
    
    compositeLayers.push({
      input: resizedPerson,
      left: 0,
      top: 0
    })
    
    console.log('✅ Prepared person image layer')
    
    // Add clothing images (right side)
    for (let i = 0; i < clothingImages.length; i++) {
      const clothingImage = clothingImages[i]
      const itemY = i * clothingItemHeight
      
      console.log(`Processing clothing item ${i + 1}, position: (512, ${itemY}), size: (${clothingWidth}, ${clothingItemHeight})`)
      
      const resizedClothing = await sharp(clothingImage)
        .resize(clothingWidth, clothingItemHeight, {
          fit: 'cover',
          position: 'center'
        })
        .png()
        .toBuffer()
      
      compositeLayers.push({
        input: resizedClothing,
        left: 512,
        top: itemY
      })
      
      console.log(`✅ Prepared clothing item ${i + 1} layer`)
    }
    
    // Add divider line (create a thin black rectangle)
    const dividerLine = await sharp({
      create: {
        width: 3,
        height: canvasHeight,
        channels: 3,
        background: { r: 0, g: 0, b: 0 }
      }
    }).png().toBuffer()
    
    compositeLayers.push({
      input: dividerLine,
      left: 512,
      top: 0
    })
    
    console.log('✅ Prepared divider line')
    
    // Create final composite
    const compositeBuffer = await sharp(background)
      .composite(compositeLayers)
      .png()
      .toBuffer()
    
    console.log('✅ Created composite image')
    
    // Convert to base64
    const compositeBase64 = `data:image/png;base64,${compositeBuffer.toString('base64')}`
    
    return NextResponse.json({
      success: true,
      compositeImage: compositeBase64,
      dimensions: {
        width: canvasWidth,
        height: canvasHeight
      }
    })
    
  } catch (error) {
    console.error('❌ Error creating composite image:', error)
    return NextResponse.json({
      error: 'Failed to create composite image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
