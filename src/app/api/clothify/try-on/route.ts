import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { generateAdvancedPrompt } from '../../../../lib/promptGenerator'

async function tryWithFallbackImages(personImageUrl: string, clothingImageUrl: string, apiKey: string) {
  console.log('🔄 Attempting fallback with different image processing...')
  
  try {
    // Try with a simpler prompt and different parameters
    const fallbackRequestBody = {
      model: 'google/nano-banana-edit',
      input: {
        prompt: 'A person wearing the clothing item',
        negative_prompt: 'blurry, low quality, distorted',
        image_urls: [personImageUrl, clothingImageUrl],
        output_format: 'png',
        image_size: 'auto',
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
    return NextResponse.json({ 
      error: `Both primary and fallback attempts failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}

async function pollForKieaiResult(taskId: string, apiKey: string) {
  console.log('🔄 Polling for KIE.AI result...')
  
  let attempts = 0
  const maxAttempts = 60 // 1 minute timeout
  
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
        
        if (statusData.code === 200 && statusData.data.state === 'processing') {
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
      
      const buffer = await response.arrayBuffer()
      if (buffer.byteLength === 0) {
        throw new Error('Empty image data')
      }
      
      const base64 = Buffer.from(buffer).toString('base64')
      const result = `data:${contentType};base64,${base64}`
      
      console.log(`✅ Successfully converted URL to base64 (${buffer.byteLength} bytes, ${contentType})`)
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

    const { personImage, clothingImage } = await request.json()

    if (!personImage || !clothingImage) {
      console.log('❌ Missing required images')
      return NextResponse.json(
        { error: 'Missing required images' },
        { status: 400 }
      )
    }

    // Process images - person image needs to be uploaded, clothing can be URL
    let personImageUrl: string
    let clothingImageUrl: string
    
    try {
      // Person image: upload to Supabase (user upload)
      if (personImage.startsWith('data:image/')) {
        console.log('📤 Uploading person image to Supabase...')
        personImageUrl = await uploadToSupabase(personImage, 'person-images')
      } else {
        throw new Error('Person image must be base64 data URL')
      }
      
      // Clothing image: always upload to Supabase for KIE.AI compatibility
      if (clothingImage.startsWith('http')) {
        console.log('🔄 Converting clothing image URL to base64 and uploading to Supabase...')
        const processedImage = await processImage(clothingImage)
        clothingImageUrl = await uploadToSupabase(processedImage, 'clothing-images')
      } else if (clothingImage.startsWith('data:image/')) {
        console.log('📤 Uploading clothing image to Supabase...')
        clothingImageUrl = await uploadToSupabase(clothingImage, 'clothing-images')
      } else {
        throw new Error('Invalid clothing image format')
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

    // Generate advanced prompt for better results (AI will auto-detect clothing type)
    const { prompt, negativePrompt, parameters } = generateAdvancedPrompt(clothingImageUrl as string)
    
    // Validate images before sending to KIE.AI
    console.log('🔍 Validating images for KIE.AI...')
    console.log('Person image URL:', personImageUrl)
    console.log('Clothing image URL:', clothingImageUrl)
    
    // Test if images are accessible and validate format
    try {
      // Test both images (both uploaded to Supabase)
      const personTest = await fetch(personImageUrl)
      if (!personTest.ok) {
        throw new Error(`Person image not accessible: ${personTest.status}`)
      }
      
      const personContentType = personTest.headers.get('content-type')
      if (!personContentType?.startsWith('image/')) {
        throw new Error(`Invalid person image format: ${personContentType}`)
      }
      
      console.log('✅ Person image is accessible and valid')
      console.log('Person image type:', personContentType)
      
      // Test clothing image (also uploaded to Supabase)
      const clothingTest = await fetch(clothingImageUrl)
      if (!clothingTest.ok) {
        throw new Error(`Clothing image not accessible: ${clothingTest.status}`)
      }
      
      const clothingContentType = clothingTest.headers.get('content-type')
      if (!clothingContentType?.startsWith('image/')) {
        throw new Error(`Invalid clothing image format: ${clothingContentType}`)
      }
      
      console.log('✅ Clothing image is accessible and valid')
      console.log('Clothing image type:', clothingContentType)
      
    } catch (error) {
      console.error('❌ Image validation failed:', error)
      return NextResponse.json({ 
        error: `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }, { status: 400 })
    }
    
    const requestBody = {
      model: 'google/nano-banana-edit',
      input: {
        prompt,
        negative_prompt: negativePrompt,
        image_urls: [personImageUrl as string, clothingImageUrl as string],
        output_format: 'png',
        image_size: 'auto',
        num_inference_steps: 50,
        guidance_scale: 7.5,
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

    // Try to get result immediately
    const taskId = kieaiData.data.taskId
    console.log('✅ Task created with ID:', taskId)
    
    // Poll for results using status API with exponential backoff
    let attempts = 0
    const maxAttempts = 60 // 1 minute timeout (optimized)
    
    while (attempts < maxAttempts) {
      // Exponential backoff: 250ms, 500ms, 1s, 2s, 4s...
      const delay = Math.min(250 * Math.pow(2, Math.floor(attempts / 5)), 4000);
      await new Promise(resolve => setTimeout(resolve, delay))
      
      try {
        const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          
          // Check if task is still processing
          if (statusData.code === 200 && statusData.data.state === 'processing') {
            attempts++
            continue
          }
          
          if (statusData.code === 200 && statusData.data.state === 'success') {
            console.log('🎉 Task completed successfully!')
            const resultJson = JSON.parse(statusData.data.resultJson)
            const tempResultImageUrl = resultJson.resultUrls[0]
            
            // Download and save result image to Supabase Storage
            const resultImageResponse = await fetch(tempResultImageUrl)
            if (!resultImageResponse.ok) {
              console.log('❌ Failed to download result image')
              throw new Error('Failed to download result image')
            }
            
            const resultImageBuffer = await resultImageResponse.arrayBuffer()
            const resultImageFilename = `result-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
            
            const { data: resultUploadData, error: resultUploadError } = await supabaseAdmin.storage
              .from('result-images')
              .upload(resultImageFilename, resultImageBuffer, {
                contentType: 'image/jpeg',
              })
            
            if (resultUploadError) {
              throw new Error(`Failed to upload result image: ${resultUploadError.message}`)
            }
            
            // Get public URL for result image
            const { data: resultUrlData } = supabaseAdmin.storage
              .from('result-images')
              .getPublicUrl(resultImageFilename)
            
            const finalResultImageUrl = resultUrlData.publicUrl
            
            // Save to database
            const insertData = {
              user_id: user.id,
            person_image_url: personImageUrl as string,
            clothing_image_url: clothingImageUrl as string,
              result_image_url: finalResultImageUrl,
              status: 'completed',
              processing_time: (attempts + 1) * 1000, // Convert to milliseconds
              created_at: new Date().toISOString()
            }
            
            const { data: insertResult, error: dbError } = await supabaseAdmin
              .from('images')
              .insert(insertData)
              .select()

            if (dbError) {
              console.error('Database error:', dbError)
            }

            return NextResponse.json({
              success: true,
              resultImageUrl: finalResultImageUrl,
              taskId: taskId,
              processingTime: `${attempts + 1}s`
            })
          } else if (statusData.code === 200 && statusData.data.state === 'fail') {
            console.log('❌ KIE.AI generation failed:', statusData.data.failMsg)
            return NextResponse.json({ error: `KIE.AI generation failed: ${statusData.data.failMsg}` }, { status: 502 })
          }
        }
      } catch (error) {
        // Continue polling on error
      }
      
      attempts++
    }
    
    // Timeout - but return taskId for callback approach
    console.log('⏰ Task timeout after', maxAttempts, 'attempts')
    return NextResponse.json({ 
      success: true, 
      taskId: taskId,
      message: 'Task created successfully. Processing may take longer than expected. Please check back later.',
      timeout: true
    }, { status: 202 }) // 202 Accepted - processing
    
    // Fallback to callback approach
    return NextResponse.json({
      success: true,
      taskId: taskId,
      message: 'Task created successfully. Processing...'
    })

  } catch (error: any) {
    console.error('💥 Error in try-on API:', error)
    const message = typeof error?.message === 'string' ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
