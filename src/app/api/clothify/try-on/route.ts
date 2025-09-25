import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '../../../../lib/supabase'
import { generateAdvancedPrompt } from '../../../../lib/promptGenerator'
import { createCompositeImage } from '../../../../lib/imageComposer'

async function tryWithFallbackImages(personImageUrl: string, clothingImageUrl: string, apiKey: string) {
  console.log('🔄 Attempting fallback with different image processing...')
  
  try {
    // Try with a simpler prompt and different parameters
    const fallbackRequestBody = {
      model: 'google/nano-banana-edit',
      input: {
        prompt: 'Virtual try-on: Replace clothing with new garment, maintain fit and pose',
        negative_prompt: 'blurry, low quality, distorted, artifacts, poor fit',
        image_urls: [personImageUrl, clothingImageUrl],
        output_format: 'png',
        image_size: '1:1', // Force square ratio
        num_inference_steps: 30,
        guidance_scale: 5.0
      }
    }
    
    console.log('📤 Sending fallback request to KIE.AI...')
    
    const fallbackResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fallbackRequestBody)
    })
    
    const fallbackData = await fallbackResponse.json()
    console.log('📡 Fallback KIE.AI Response:', fallbackData)
    
    if (fallbackData.code !== 200) {
      throw new Error(`Fallback failed: ${fallbackData.msg || fallbackData.message}`)
    }
    
    // Continue with the fallback task
    const taskId = fallbackData.data.taskId
    console.log('✅ Fallback task created with ID:', taskId)
    
    // Return the same polling logic but with fallback task
    return await pollForKieaiResult(taskId, apiKey)
    
  } catch (error) {
    console.error('❌ Fallback also failed:', error)
    
    // Try one more time with even simpler approach
    console.log('🔄 Trying final fallback with minimal parameters...')
    try {
      const finalFallbackRequestBody = {
        model: 'google/nano-banana-edit',
        input: {
          prompt: 'person wearing new clothing item',
          negative_prompt: 'blurry, low quality',
          image_urls: [personImageUrl, clothingImageUrl],
          output_format: 'png',
          image_size: '1:1', // Force square ratio
          num_inference_steps: 20,
          guidance_scale: 4.0
        }
      }
      
      const finalResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFallbackRequestBody)
      })
      
      const finalData = await finalResponse.json()
      if (finalData.code === 200) {
        console.log('✅ Final fallback task created:', finalData.data.taskId)
        return await pollForKieaiResult(finalData.data.taskId, apiKey)
      }
    } catch (finalError) {
      console.error('❌ Final fallback also failed:', finalError)
    }
    
    return NextResponse.json({ 
      error: `All attempts failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

async function pollForKieaiResult(taskId: string, apiKey: string) {
  console.log('🔄 Polling for KIE.AI result...')
  
  let attempts = 0
  const maxAttempts = 60 // 60 seconds timeout
  
  while (attempts < maxAttempts) {
    const delay = Math.min(250 * Math.pow(2, Math.floor(attempts / 5)), 4000)
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      })
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        
        if (statusData.code === 200 && (statusData.data.state === 'processing' || statusData.data.state === 'generating')) {
          attempts++
          continue
        }
        
        if (statusData.code === 200 && statusData.data.state === 'completed') {
          const resultImageUrl = statusData.data.resultImageUrl
          console.log('✅ KIE.AI completed successfully')
          return NextResponse.json({
            success: true,
            resultImageUrl: resultImageUrl
          })
        }
        
        if (statusData.code === 200 && statusData.data.state === 'failed') {
          throw new Error(`KIE.AI task failed: ${statusData.data.error || 'Unknown error'}`)
        }
      }
      
      attempts++
    } catch (error) {
      console.error('❌ Polling error:', error)
      attempts++
    }
  }
  
  throw new Error('KIE.AI task timeout')
}

async function processImage(imageData: string): Promise<string> {
  // If it's already a base64 data URL, validate and return
  if (imageData.startsWith('data:image/')) {
    console.log('✅ Image is already base64 data URL')
    return imageData
  }
  
  // If it's a URL, convert to base64 with validation
  if (imageData.startsWith('http')) {
    try {
      console.log('🔄 Converting URL to base64:', imageData)
      const response = await fetch(imageData, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://shopee.vn/',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        throw new Error(`Invalid content type: ${contentType}`)
      }
      
      // Clean content-type (remove charset for KIE.AI compatibility)
      const cleanContentType = contentType.split(';')[0]
      console.log(`🔍 Original content-type: ${contentType}`)
      console.log(`🔍 Cleaned content-type: ${cleanContentType}`)
      
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength === 0) {
        throw new Error('Empty image data')
      }
      
      // Check if image is too large (KIE.AI might have size limits)
      if (buffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
        console.log(`⚠️ Image too large: ${buffer.byteLength} bytes, resizing...`)
        // Could add image resizing here if needed
      }
      
      const base64 = Buffer.from(buffer).toString('base64')
      const result = `data:${cleanContentType};base64,${base64}`
      
      console.log(`✅ Successfully converted URL to base64 (${buffer.byteLength} bytes, ${contentType})`)
      console.log(`🔍 Base64 length: ${base64.length} characters`)
      return result
    } catch (error) {
      console.error('❌ Failed to convert URL to base64:', error)
      throw new Error(`Failed to process image URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // If it's already base64 without data URL prefix, add it
  if (imageData.includes('base64')) {
    console.log('✅ Adding data URL prefix to base64')
    return `data:image/jpeg;base64,${imageData}`
  }
  
  console.log('⚠️ Unknown image format, returning as is')
  return imageData
}

async function uploadToSupabase(base64Image: string, bucket: string): Promise<string> {
  // Convert base64 to buffer
  const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  
  // Generate unique filename
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
  
  // Upload to Supabase Storage with optimized settings
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
      cacheControl: '3600', // Cache for 1 hour
      upsert: false // Don't overwrite existing files
    })
  
  if (error) {
    throw new Error(`Supabase upload error: ${error.message}`)
  }
  
  // Get public URL
  const { data: urlData } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(filename)
  
  return urlData.publicUrl
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Try-on API called')
    
    // Check authentication
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.log('❌ Missing authorization header')
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error) {
      console.log('❌ Invalid token:', error.message)
      return NextResponse.json({ error: 'Invalid token: ' + error.message }, { status: 401 })
    }
    
    if (!user) {
      console.log('❌ No user found')
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    const { personImage, clothingImage, clothingImageUrls, selectedGarmentType, customModelPrompt, fastMode } = await request.json()

    // Check if we have clothing image
    if (!personImage || !clothingImage) {
      console.log('❌ Missing required images')
      return NextResponse.json(
        { error: 'Missing required images' },
        { status: 400 }
      )
    }

    // If fastMode with Gemini, try DIRECT base64 without uploading
    if (fastMode === true) {
      try {
        console.log('⚡ Fast mode preflight: calling Gemini directly with base64 when possible')
        const { callGoogleAI, generateTorsoMask } = await import('../../../../lib/googleAI')

        // Build a generic prompt based on garment type if not provided yet
        const promptFast = selectedGarmentType === 'top'
          ? 'Replace the upper garment on the person in the first image with the garment from the second image. Ensure the output is photorealistic, fits naturally, and is visually different from the original person image. Do not return the original image unchanged.'
          : selectedGarmentType === 'bottom'
          ? 'Replace only the bottom garment on the person in the first image with the garment from the second image. Ensure the output is photorealistic, fits naturally, and is visually different from the original person image. Do not return the original image unchanged.'
          : selectedGarmentType === 'full-body'
          ? 'Replace the entire outfit of the person in the first image with the full-body garment from the second image. Ensure the output is photorealistic, fits naturally, and is visually different from the original person image. Do not return the original image unchanged.'
          : 'Replace the clothing in the first image with the garment from the second image. Ensure the output is photorealistic, fits naturally, and is visually different from the original person image. Do not return the original image unchanged.'

        // Ensure both inputs are base64 data URLs
        const personBase64DataUrl = personImage && personImage.startsWith('data:image/')
          ? personImage
          : await processImage(personImage)
        const clothingBase64DataUrl = clothingImage && clothingImage.startsWith('data:image/')
          ? clothingImage
          : await processImage(clothingImage)

        // Generate a simple torso mask to guide Gemini editing
        let mask: string | undefined
        try {
          mask = await generateTorsoMask(personBase64DataUrl as string)
        } catch (mErr) {
          console.log('ℹ️ Mask generation failed, proceeding without mask:', mErr)
        }

        const gResult = await callGoogleAI({ personImage: personBase64DataUrl as string, clothingImage: clothingBase64DataUrl as string, maskImage: mask, prompt: promptFast, isTextToImage: false })
        if (gResult.success && gResult.resultImage) {
          // Extra safety: if result is identical to input person image, treat as failure (Gemini ignored swap)
          const md5 = (dataUrl: string) => {
            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl
            return crypto.createHash('md5').update(base64).digest('hex')
          }
          try {
            const inHash = md5(personBase64DataUrl as string)
            const outHash = md5(gResult.resultImage)
            if (inHash === outHash) {
              console.log('⚠️ Gemini returned image identical to input person image. Treating as failure for fast mode.')
              return NextResponse.json({ error: 'Gemini produced an unchanged image. No swap detected.' }, { status: 502 })
            }
          } catch (hashErr) {
            console.log('ℹ️ Hash compare skipped due to error:', hashErr)
          }
          console.log('✅ Gemini direct path succeeded (no upload)')
          return NextResponse.json({ success: true, resultImageUrl: gResult.resultImage, provider: 'gemini' })
        }
        console.log('⚠️ Gemini returned no image in fast mode:', gResult.error)
      } catch (e) {
        console.log('⚠️ Gemini direct path error in fast mode:', e)
      }
      // In fast mode, do NOT fallback to KIE. Return error immediately for easier debugging
      return NextResponse.json({ error: 'Gemini fast mode failed. No fallback in fast mode.' }, { status: 502 })
    }

    // Process images - person image needs to be uploaded, clothing image (composite)
    let personImageUrl: string
    let clothingImageUrl: string
    
    try {
      // Person image: upload to Supabase (user upload or generated model)
      if (personImage.startsWith('data:image/')) {
        console.log('📤 Uploading person image (base64) to Supabase...')
        personImageUrl = await uploadToSupabase(personImage, 'person-images')
      } else if (personImage.startsWith('http')) {
        console.log('📤 Person image is already a URL (generated model):', personImage)
        personImageUrl = personImage
      } else {
        throw new Error('Person image must be base64 data URL or HTTP URL')
      }
      
    // Process clothing image (prefer direct URL to save time)
    if (clothingImage) {
        if (clothingImage.startsWith('http')) {
          console.log('🔗 Using clothing image URL directly (skip upload):', clothingImage)
          clothingImageUrl = clothingImage
        } else if (clothingImage.startsWith('data:image/')) {
          console.log('📤 Base64 clothing image - uploading once to Supabase (KIE.AI needs URL)')
          clothingImageUrl = await uploadToSupabase(clothingImage, 'clothing-images')
        } else {
          throw new Error('Invalid clothing image format')
        }
      } else {
        throw new Error('No clothing image provided')
      }
      
      console.log('✅ Images processed successfully')
      console.log('Person image URL:', personImageUrl)
      console.log('Clothing image URL:', clothingImageUrl)
    } catch (error) {
      console.error('❌ Image processing failed:', error)
      return NextResponse.json({ 
        error: `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 400 })
    }

    // Call KIE.AI API
    const rawKey = process.env.KIEAI_API_KEY ?? ''
    const apiKey = rawKey.trim()
    
    if (!apiKey) {
      console.log('❌ KIE.AI API key missing')
      return NextResponse.json({ error: 'KIE.AI API key missing' }, { status: 500 })
    }

    console.log('✅ KIE.AI API key found, calling API...')

    // Always treat as separate images now - person + clothing composite
    const isComposite = false
    
    console.log('🔍 Image type check:', isComposite ? 'Composite' : 'Separate')

    // Generate advanced prompt for better results (composite image)
    let prompt, negativePrompt, parameters
    
    if (customModelPrompt) {
      // Use custom model prompt for model generation
      console.log('🎨 Using custom model prompt:', customModelPrompt)
      prompt = `${customModelPrompt}, high quality, detailed, studio lighting, clean background, full body shot, 2:3 aspect ratio, photorealistic`
      negativePrompt = 'blurry, low quality, distorted, multiple people, bad anatomy, deformed, ugly, clothing items'
      parameters = {
        guidance_scale: 12.0,
        num_inference_steps: 50,
        strength: 0.5,
        seed: Math.floor(Math.random() * 1000000),
        scheduler: 'DPMSolverMultistepScheduler',
        eta: 0.0,
        clip_skip: 1,
      }
    } else {
      // Use normal clothing swap prompt
      const result = generateAdvancedPrompt(
        clothingImageUrl as string, 
        clothingImageUrls || [], // Pass clothing URLs for better prompt generation
        isComposite, // Pass composite flag
        selectedGarmentType // Pass selected garment type for better prompts
      )
      prompt = result.prompt
      negativePrompt = result.negativePrompt
      parameters = result.parameters
    }
    
    // If fastMode was requested, we should have already returned above. Guard here just in case.
    if (fastMode === true) {
      return NextResponse.json({ error: 'Gemini fast mode failed earlier. No fallback in fast mode.' }, { status: 502 })
    }

    // Skip pre-validation fetch to reduce latency; rely on KIE.AI validation
    console.log('⏭️ Skipping pre-validation to speed up request')
    
    let imageUrls: string[]
    
    // Send images based on type
    if (customModelPrompt) {
      // For model generation, we don't need clothing images
      console.log('🎨 Model generation mode - using placeholder image')
      imageUrls = [clothingImageUrl as string] // Just use one placeholder image
    } else {
      // Normal clothing swap mode
      console.log('🎨 Sending separate images: person + clothing composite')
      imageUrls = [personImageUrl as string, clothingImageUrl as string]
    }
    
    const requestBody = {
      model: 'google/nano-banana-edit',
      input: {
        prompt,
        negative_prompt: negativePrompt,
        image_urls: imageUrls,
        output_format: 'png',
        image_size: '1:1', // Force square ratio
        ...parameters
      }
    }
    
    console.log('📤 Sending to KIE.AI:', JSON.stringify(requestBody, null, 2))
    
    const kieaiResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    let kieaiData: any
    try {
      kieaiData = await kieaiResponse.json()
      console.log('📡 KIE.AI Response:', kieaiData)
    } catch (e) {
      console.log('❌ KIE.AI API JSON parse error:', e)
      return NextResponse.json({ error: `KIE.AI API error: ${kieaiResponse.statusText}` }, { status: 502 })
    }
    
    if (kieaiData.code !== 200) {
      const message = kieaiData.msg || kieaiData.message || 'Unknown error'
      console.log('❌ KIE.AI API error:', message, 'Code:', kieaiData.code)
      
      // If it's an input validation error, try with fallback images
      if (message.includes('invalid') || message.includes('E006')) {
        console.log('🔄 Trying with fallback images...')
        return await tryWithFallbackImages(personImageUrl as string, clothingImageUrl as string, apiKey)
      }
      
      const status = typeof kieaiData.code === 'number' && kieaiData.code >= 400 && kieaiData.code < 600
        ? kieaiData.code
        : 400
      return NextResponse.json({ error: message, code: kieaiData.code }, { status })
    }

    // Return 202 Accepted immediately and let client poll /api/clothify/status
    const taskId = kieaiData.data.taskId
    console.log('✅ Task created with ID:', taskId)
    return NextResponse.json({ success: true, taskId, provider: 'kieai' }, { status: 202 })

  } catch (error: any) {
    console.error('💥 Error in try-on API:', error)
    console.error('💥 Error stack:', error?.stack)
    console.error('💥 Error details:', error)
    
    const message = typeof error?.message === 'string' ? error.message : 'Internal server error'
    console.error('💥 Returning error message:', message)
    
    return NextResponse.json({ 
      error: message,
      details: error?.stack || 'No additional details'
    }, { status: 500 })
  }
}
