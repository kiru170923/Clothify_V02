import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { generateAdvancedPrompt } from '../../../../lib/promptGenerator'

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

    console.log('✅ Images received, starting upload...')

    // Upload images to Supabase Storage in parallel to get URLs (faster)
    // Upload images to Supabase Storage in parallel with timeout
    const uploadPromises = [
      uploadToSupabase(personImage, 'person-images'),
      uploadToSupabase(clothingImage, 'clothing-images')
    ]
    
    const [personImageUrl, clothingImageUrl] = await Promise.all(
      uploadPromises.map(promise => 
        Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout')), 10000) // 10s timeout
          )
        ])
      )
    )

    console.log('✅ Images uploaded successfully')

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
    
    const kieaiResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
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
      })
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
