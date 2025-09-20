import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { personImageUrl, clothingImageUrls } = await request.json()
    
    console.log('🔍 DEBUG: Starting composite debug...')
    console.log('Person URL:', personImageUrl)
    console.log('Clothing URLs:', clothingImageUrls)
    
    // Test if URLs are accessible
    console.log('🔍 Testing person image accessibility...')
    const personResponse = await fetch(personImageUrl)
    console.log('Person response status:', personResponse.status)
    console.log('Person response headers:', Object.fromEntries(personResponse.headers.entries()))
    
    if (!personResponse.ok) {
      throw new Error(`Person image not accessible: ${personResponse.status}`)
    }
    
    console.log('🔍 Testing clothing image accessibility...')
    const clothingResponse = await fetch(clothingImageUrls[0])
    console.log('Clothing response status:', clothingResponse.status)
    console.log('Clothing response headers:', Object.fromEntries(clothingResponse.headers.entries()))
    
    if (!clothingResponse.ok) {
      throw new Error(`Clothing image not accessible: ${clothingResponse.status}`)
    }
    
    // Test Sharp import
    console.log('🔍 Testing Sharp import...')
    const sharp = await import('sharp')
    console.log('Sharp imported successfully:', !!sharp.default)
    
    return NextResponse.json({
      success: true,
      message: 'All tests passed - composite should work',
      personStatus: personResponse.status,
      clothingStatus: clothingResponse.status,
      sharpAvailable: true
    })
    
  } catch (error) {
    console.error('❌ Debug composite failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
