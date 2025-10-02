import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

interface TryOnRequest {
  userImageUrl: string
  productImageUrl: string
  userId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: TryOnRequest = await request.json()
    const { userImageUrl, productImageUrl, userId } = body

    if (!userImageUrl || !productImageUrl || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    // Note: You might want to verify the token with your auth system here

    // Generate try-on image using Gemini 2.5 Flash
    const result = await generateTryOnImage(userImageUrl, productImageUrl)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to generate try-on image' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      tryOnImageUrl: result.imageUrl,
      processingTime: result.processingTime
    })

  } catch (error) {
    console.error('Try-on error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateTryOnImage(userImageUrl: string, productImageUrl: string): Promise<{
  success: boolean
  imageUrl?: string
  error?: string
  processingTime?: number
}> {
  try {
    const startTime = Date.now()
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' })

    // Create the prompt for clothing swap
    const prompt = `You are a professional fashion AI. Please perform a high-quality clothing swap between the user image and the product image.

TASK: Swap the clothing item from the product image onto the person in the user image.

REQUIREMENTS:
1. Maintain the person's body proportions and pose
2. Ensure the clothing fits naturally on the person
3. Preserve lighting and shadows for realism
4. Keep the background and environment unchanged
5. Maintain high image quality and resolution
6. The clothing should look like it's actually being worn

TECHNIQUES TO USE:
- Seamless blending of the clothing onto the person
- Proper fabric draping and folds
- Realistic shadows and highlights
- Color matching with the environment
- Maintain the person's skin tone and body shape

Please generate a realistic try-on image that looks natural and professional.`

    // Prepare images for the model
    const userImage = {
      inlineData: {
        data: await fetchImageAsBase64(userImageUrl),
        mimeType: 'image/jpeg'
      }
    }

    const productImage = {
      inlineData: {
        data: await fetchImageAsBase64(productImageUrl),
        mimeType: 'image/jpeg'
      }
    }

    // Generate the result
    const result = await model.generateContent([prompt, userImage, productImage])
    const response = await result.response

    // Extract the generated image
    const imageData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    
    if (!imageData) {
      return { success: false, error: 'No image generated' }
    }

    // Convert base64 to image URL (you might want to save this to your storage)
    const imageUrl = `data:image/jpeg;base64,${imageData}`
    
    const processingTime = Date.now() - startTime

    return {
      success: true,
      imageUrl,
      processingTime
    }

  } catch (error) {
    console.error('Error generating try-on image:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString('base64')
  } catch (error) {
    console.error('Error fetching image:', error)
    throw new Error('Failed to fetch image')
  }
}
