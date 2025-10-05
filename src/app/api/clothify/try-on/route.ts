import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { generateAdvancedPrompt } from '../../../../lib/promptGenerator'
import { createCompositeImage } from '../../../../lib/imageComposer'

async function tryWithFallbackImages(personImageUrl: string, clothingImageUrl: string, apiKey: string) {
  console.log('ðŸ”„ Attempting fallback with different image processing...')
  
  try {
    // Try with a simpler prompt and different parameters
    const fallbackRequestBody = {
      model: 'google/nano-banana-edit',
      input: {
        prompt: 'Virtual try-on: Replace clothing with new garment, maintain fit and pose',
        negative_prompt: 'blurry, low quality, distorted, artifacts, poor fit',
        image_urls: [personImageUrl, clothingImageUrl],
        output_format: 'png',
        image_size: '3:4', // Portrait ratio for try-on
        num_inference_steps: 30,
        guidance_scale: 5.0
      }
    }
    
    console.log('ðŸ“¤ Sending fallback request to KIE.AI...')
    
    const fallbackResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fallbackRequestBody)
    })
    
    const fallbackData = await fallbackResponse.json()
    console.log('ðŸ“¡ Fallback KIE.AI Response:', fallbackData)
    
    if (fallbackData.code !== 200) {
      throw new Error(`Fallback failed: ${fallbackData.msg || fallbackData.message}`)
    }
    
    // Continue with the fallback task
    const taskId = fallbackData.data.taskId
    console.log('âœ… Fallback task created with ID:', taskId)
    
    // Return the same polling logic but with fallback task
    return await pollForKieaiResult(taskId, apiKey)
    
  } catch (error) {
    console.error('âŒ Fallback also failed:', error)
    
    // Try one more time with even simpler approach
    console.log('ðŸ”„ Trying final fallback with minimal parameters...')
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
        console.log('âœ… Final fallback task created:', finalData.data.taskId)
        return await pollForKieaiResult(finalData.data.taskId, apiKey)
      }
    } catch (finalError) {
      console.error('âŒ Final fallback also failed:', finalError)
    }
    
    return NextResponse.json({ 
      error: `All attempts failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

async function pollForKieaiResult(taskId: string, apiKey: string) {
  console.log('ðŸ”„ Polling for KIE.AI result...')
  
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
          console.log('âœ… KIE.AI completed successfully')
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
      console.error('âŒ Polling error:', error)
      attempts++
    }
  }
  
  throw new Error('KIE.AI task timeout')
}

// Server-side image compression using Node.js built-in modules
async function compressImageServerSide(base64Image: string, maxSize: number = 1024, quality: number = 0.8): Promise<string> {
  try {
    // Extract base64 data
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image
    const buffer = Buffer.from(base64Data, 'base64')
    
    // Simple size check - if already small enough, return as is
    if (buffer.length < 500 * 1024) { // Less than 500KB
      console.log('ðŸ“ Image already small enough, skipping compression')
      return base64Image
    }
    
    // For now, just return original - compression would need sharp library
    console.log('ðŸ“ Image size:', Math.round(buffer.length / 1024), 'KB - using original')
    return base64Image
  } catch (error) {
    console.error('âŒ Server-side compression failed:', error)
    return base64Image // Return original if compression fails
  }
}

async function processImage(imageData: string): Promise<string> {
  // If it's already a base64 data URL, validate and return
  if (imageData.startsWith('data:image/')) {
    console.log('âœ… Image is already base64 data URL')
    return imageData
  }
  
  // If it's a URL, convert to base64 with validation
  if (imageData.startsWith('http')) {
    try {
      console.log('ðŸ”„ Converting URL to base64:', imageData)
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
      console.log(`ðŸ” Original content-type: ${contentType}`)
      console.log(`ðŸ” Cleaned content-type: ${cleanContentType}`)
      
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength === 0) {
        throw new Error('Empty image data')
      }
      
      // Check if image is too large (KIE.AI might have size limits)
      if (buffer.byteLength > 10 * 1024 * 1024) { // 10MB limit
        console.log(`âš ï¸ Image too large: ${buffer.byteLength} bytes, resizing...`)
        // Could add image resizing here if needed
      }
      
      const base64 = Buffer.from(buffer).toString('base64')
      const result = `data:${cleanContentType};base64,${base64}`
      
      console.log(`âœ… Successfully converted URL to base64 (${buffer.byteLength} bytes, ${contentType})`)
      console.log(`ðŸ” Base64 length: ${base64.length} characters`)
      return result
    } catch (error) {
      console.error('âŒ Failed to convert URL to base64:', error)
      throw new Error(`Failed to process image URL: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  // If it's already base64 without data URL prefix, add it
  if (imageData.includes('base64')) {
    console.log('âœ… Adding data URL prefix to base64')
    return `data:image/jpeg;base64,${imageData}`
  }
  
  console.log('âš ï¸ Unknown image format, returning as is')
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
    console.log('ðŸš€ Try-on API called')
    
    // Check authentication
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      console.log('âŒ Missing authorization header')
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error) {
      console.log('âŒ Invalid token:', error.message)
      return NextResponse.json({ error: 'Invalid token: ' + error.message }, { status: 401 })
    }
    
    if (!user) {
      console.log('âŒ No user found')
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    console.log('âœ… User authenticated:', user.id)

    const { personImage, clothingImage, clothingImageUrls, selectedGarmentType, customModelPrompt, fastMode } = await request.json()

    // Check if we have clothing image
    if (!personImage || !clothingImage) {
      console.log('âŒ Missing required images')
      return NextResponse.json(
        { error: 'Missing required images' },
        { status: 400 }
      )
    }

    // If fastMode with Gemini, try DIRECT base64 without uploading
    if (fastMode === true) {
      try {
        console.log('âš¡ Fast mode preflight: calling Gemini directly with base64 when possible')
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
        // NÃ©n áº£nh trÆ°á»›c khi gá»­i tá»›i Gemini Ä‘á»ƒ giáº£m payload (server-side)
        const personBase64DataUrl = personImage && personImage.startsWith('data:image/')
          ? await compressImageServerSide(personImage, 1024, 0.8)
          : await processImage(personImage)
        const clothingBase64DataUrl = clothingImage && clothingImage.startsWith('data:image/')
          ? await compressImageServerSide(clothingImage, 1024, 0.8)
          : await processImage(clothingImage)

        // Fast mode: bá» mask Ä‘á»ƒ giáº£m Ä‘á»™ trá»…
        let mask: string | undefined = undefined

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
              console.log('âš ï¸ Gemini returned image identical to input person image. Treating as failure for fast mode.')
              return NextResponse.json({ error: 'Gemini produced an unchanged image. No swap detected.' }, { status: 502 })
            }
          } catch (hashErr) {
            console.log('â„¹ï¸ Hash compare skipped due to error:', hashErr)
          }
          console.log('âœ… Gemini direct path succeeded (no upload)')
          return NextResponse.json({ success: true, resultImageUrl: gResult.resultImage, provider: 'gemini' })
        }
        console.log('âš ï¸ Gemini returned no image in fast mode:', gResult.error)
      } catch (e) {
        console.log('âš ï¸ Gemini direct path error in fast mode:', e)
      }
      // In fast mode, try fallback to KIE.AI if Gemini fails
      console.log('ðŸ”„ Fast mode Gemini failed, trying KIE.AI fallback...')
      // Continue to KIE.AI processing below instead of returning error
    }

    // Process images - person image needs to be uploaded, clothing image (composite)
    let personImageUrl: string
    let clothingImageUrl: string
    
    try {
      // Person image: upload to Supabase (user upload or generated model)
      if (personImage.startsWith('data:image/')) {
        console.log('ðŸ“¤ Uploading person image (base64) to Supabase...')
        personImageUrl = await uploadToSupabase(personImage, 'person-images')
      } else if (personImage.startsWith('http')) {
        console.log('ðŸ“¤ Person image is already a URL (generated model):', personImage)
        personImageUrl = personImage
      } else {
        throw new Error('Person image must be base64 data URL or HTTP URL')
      }
      
    // Process clothing image (prefer direct URL to save time)
    if (clothingImage) {
        if (clothingImage.startsWith('http')) {
          console.log('ðŸ”— Using clothing image URL directly (skip upload):', clothingImage)
          clothingImageUrl = clothingImage
        } else if (clothingImage.startsWith('data:image/')) {
          console.log('ðŸ“¤ Base64 clothing image - uploading once to Supabase (KIE.AI needs URL)')
          clothingImageUrl = await uploadToSupabase(clothingImage, 'clothing-images')
        } else {
          throw new Error('Invalid clothing image format')
        }
      } else {
        throw new Error('No clothing image provided')
      }
      
      console.log('âœ… Images processed successfully')
      console.log('Person image URL:', personImageUrl)
      console.log('Clothing image URL:', clothingImageUrl)
    } catch (error) {
      console.error('âŒ Image processing failed:', error)
      return NextResponse.json({ 
        error: `Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 400 })
    }

    // Call KIE.AI API
    const rawKey = process.env.KIEAI_API_KEY ?? ''
    const apiKey = rawKey.trim()
    
    if (!apiKey) {
      console.log('âŒ KIE.AI API key missing')
      return NextResponse.json({ error: 'KIE.AI API key missing' }, { status: 500 })
    }

    console.log('âœ… KIE.AI API key found, calling API...')

    // Always treat as separate images now - person + clothing composite
    const isComposite = false
    
    console.log('ðŸ” Image type check:', isComposite ? 'Composite' : 'Separate')

    // Generate advanced prompt for better results (composite image)
    let prompt, negativePrompt, parameters
    
    if (customModelPrompt) {
      // Use custom model prompt for model generation
      console.log('ðŸŽ¨ Using custom model prompt:', customModelPrompt)
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
    
    // Fast mode fallback: if Gemini failed, continue with KIE.AI processing

    // Skip pre-validation fetch to reduce latency; rely on KIE.AI validation
    console.log('â­ï¸ Skipping pre-validation to speed up request')
    
    let imageUrls: string[]
    
    // Send images based on type
    if (customModelPrompt) {
      // For model generation, we don't need clothing images
      console.log('ðŸŽ¨ Model generation mode - using placeholder image')
      imageUrls = [clothingImageUrl as string] // Just use one placeholder image
    } else {
      // Normal clothing swap mode
      console.log('ðŸŽ¨ Sending separate images: person + clothing composite')
      imageUrls = [personImageUrl as string, clothingImageUrl as string]
    }
    
    const requestBody = {
      model: 'google/nano-banana-edit',
      input: {
        prompt,
        negative_prompt: negativePrompt,
        image_urls: imageUrls,
        output_format: 'png',
        image_size: '3:4', // Portrait ratio for try-on
        ...parameters
      }
    }
    
    console.log('ðŸ“¤ Sending to KIE.AI:', JSON.stringify(requestBody, null, 2))
    
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
      console.log('ðŸ“¡ KIE.AI Response:', kieaiData)
    } catch (e) {
      console.log('âŒ KIE.AI API JSON parse error:', e)
      return NextResponse.json({ error: `KIE.AI API error: ${kieaiResponse.statusText}` }, { status: 502 })
    }
    
    if (kieaiData.code !== 200) {
      const message = kieaiData.msg || kieaiData.message || 'Unknown error'
      console.log('âŒ KIE.AI API error:', message, 'Code:', kieaiData.code)
      
      // If it's an input validation error, try with fallback images
      if (message.includes('invalid') || message.includes('E006')) {
        console.log('ðŸ”„ Trying with fallback images...')
        return await tryWithFallbackImages(personImageUrl as string, clothingImageUrl as string, apiKey)
      }
      
      const status = typeof kieaiData.code === 'number' && kieaiData.code >= 400 && kieaiData.code < 600
        ? kieaiData.code
        : 400
      return NextResponse.json({ error: message, code: kieaiData.code }, { status })
    }

    // Save task metadata for history tracking
    const taskId = kieaiData.data.taskId
    console.log('âœ… Task created with ID:', taskId)
    
    try {
      // Save task metadata to database
      await supabaseAdmin
        .from('task_metadata')
        .insert({
          task_id: taskId,
          user_id: user.id,
          person_image_url: personImageUrl,
          clothing_image_url: clothingImageUrl,
          clothing_image_urls: clothingImageUrls,
          selected_garment_type: selectedGarmentType,
          custom_model_prompt: customModelPrompt,
          provider: 'kieai'
        })
      
      console.log('âœ… Task metadata saved for:', taskId)
    } catch (metadataError) {
      console.error('âŒ Error saving task metadata:', metadataError)
      // Don't fail the main request if metadata save fails
    }
    
    // Return 202 Accepted immediately and let client poll /api/clothify/status
    return NextResponse.json({ success: true, taskId, provider: 'kieai' }, { status: 202 })

  } catch (error: any) {
    console.error('ðŸ’¥ Error in try-on API:', error)
    console.error('ðŸ’¥ Error stack:', error?.stack)
    console.error('ðŸ’¥ Error details:', error)
    
    const message = typeof error?.message === 'string' ? error.message : 'Internal server error'
    console.error('ðŸ’¥ Returning error message:', message)
    
    return NextResponse.json({ 
      error: message,
      details: error?.stack || 'No additional details'
    }, { status: 500 })
  }
}

