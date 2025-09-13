import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

async function uploadToSupabase(base64Image: string, bucket: string): Promise<string> {
  // Convert base64 to buffer
  const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '')
  const buffer = Buffer.from(base64Data, 'base64')
  
  // Generate unique filename
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`
  
  // Upload to Supabase Storage
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, buffer, {
      contentType: 'image/jpeg',
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
    // Check authentication
    const authHeader = request.headers.get('authorization')
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('Token length:', token.length)
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error) {
      console.log('Auth error:', error)
      return NextResponse.json({ error: 'Invalid token: ' + error.message }, { status: 401 })
    }
    
    if (!user) {
      console.log('No user found')
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }
    
    console.log('Authenticated user:', user.id)

    const { personImage, clothingImage } = await request.json()

    if (!personImage || !clothingImage) {
      return NextResponse.json(
        { error: 'Missing required images' },
        { status: 400 }
      )
    }

    // Upload images to Supabase Storage first to get URLs
    const personImageUrl = await uploadToSupabase(personImage, 'person-images')
    const clothingImageUrl = await uploadToSupabase(clothingImage, 'clothing-images')

    // Call KIE.AI API
    const rawKey = process.env.KIEAI_API_KEY ?? ''
    const apiKey = rawKey.trim()
    console.log('API Key Debug:', {
      hasRawKey: !!rawKey,
      rawKeyLength: rawKey.length,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.slice(0, 8),
      fullKey: apiKey // REMOVE THIS IN PRODUCTION
    })
    
    if (!apiKey) {
      return NextResponse.json({ error: 'KIE.AI API key missing' }, { status: 500 })
    }
    const kieaiResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/nano-banana-edit',
        input: {
          prompt: 'Try on this clothing item on the person in the image',
          image_urls: [personImageUrl, clothingImageUrl],
          output_format: 'png',
          image_size: 'auto'
        }
      }),
    })

    let kieaiData: any
    try {
      kieaiData = await kieaiResponse.json()
    } catch (e) {
      return NextResponse.json({ error: `KIE.AI API error: ${kieaiResponse.statusText}` }, { status: 502 })
    }
    console.log('KIE.AI Response:', kieaiData)
    
    if (kieaiData.code !== 200) {
      const message = kieaiData.msg || kieaiData.message || 'Unknown error'
      const status = typeof kieaiData.code === 'number' && kieaiData.code >= 400 && kieaiData.code < 600
        ? kieaiData.code
        : 400
      return NextResponse.json({ error: message, code: kieaiData.code }, { status })
    }

    // Try to get result immediately
    const taskId = kieaiData.data.taskId
    
    // Poll for results using status API
    let attempts = 0
    const maxAttempts = 120 // 2 minutes timeout (KIE.AI can be slow)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      
      try {
        console.log(`KIE.AI Status Check - Attempt ${attempts + 1}/${maxAttempts} for taskId: ${taskId}`)
        
        const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        })
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json()
          console.log('KIE.AI Status Response:', statusData)
          
          // Check if task is still processing
          if (statusData.code === 200 && statusData.data.state === 'processing') {
            console.log(`Task ${taskId} is still processing... (${attempts + 1}/${maxAttempts})`)
            attempts++
            continue
          }
          
          if (statusData.code === 200 && statusData.data.state === 'success') {
            const resultJson = JSON.parse(statusData.data.resultJson)
            const tempResultImageUrl = resultJson.resultUrls[0]
            
            // Download and save result image to Supabase Storage
            const resultImageResponse = await fetch(tempResultImageUrl)
            if (!resultImageResponse.ok) {
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
              person_image_url: personImageUrl,
              clothing_image_url: clothingImageUrl,
              result_image_url: finalResultImageUrl,
              status: 'completed',
              processing_time: (attempts + 1) * 1000, // Convert to milliseconds
              created_at: new Date().toISOString()
            }
            
            console.log('Try-on API - User ID:', user.id)
            console.log('Try-on API - Inserting data:', insertData)
            
            const { data: insertResult, error: dbError } = await supabaseAdmin
              .from('images')
              .insert(insertData)
              .select()

            if (dbError) {
              console.error('Database error:', dbError)
            } else {
              console.log('Try-on API - Insert successful:', insertResult)
            }

            return NextResponse.json({
              success: true,
              resultImage: finalResultImageUrl,
              taskId: taskId,
              processingTime: `${attempts + 1}s`
            })
          } else if (statusData.code === 200 && statusData.data.state === 'fail') {
            console.log('KIE.AI generation failed:', statusData.data.failMsg)
            return NextResponse.json({ error: `KIE.AI generation failed: ${statusData.data.failMsg}` }, { status: 502 })
          }
        } else {
          console.log(`Status API returned ${statusResponse.status}: ${statusResponse.statusText}`)
        }
      } catch (error) {
        console.log('Status API error:', error)
      }
      
      attempts++
    }
    
    // Timeout - but return taskId for callback approach
    console.log(`KIE.AI timeout after ${maxAttempts} attempts. TaskId: ${taskId}`)
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

    // TODO: Save to database
    // - Save person image to Supabase Storage
    // - Save clothing image to Supabase Storage  
    // - Save result image to Supabase Storage
    // - Save metadata to database
  } catch (error: any) {
    console.error('Error in try-on API:', error)
    const message = typeof error?.message === 'string' ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
