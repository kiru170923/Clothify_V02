import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    console.log('ðŸŽ¨ Generate AI Model API called (using try-on API)')

    // Get user session
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.log('âŒ Auth error:', authError)
      return NextResponse.json({ error: 'No user found' }, { status: 401 })
    }

    console.log('âœ… User authenticated:', user.id)

    const { gender, customPrompt } = await request.json()

    if (!gender) {
      return NextResponse.json({ error: 'Gender is required' }, { status: 400 })
    }

    // Generate model prompt based on gender selection
    let modelPrompt = ''
    if (customPrompt && customPrompt.trim()) {
      // Use custom prompt if provided
      modelPrompt = customPrompt.trim()
    } else {
      // Use hardcoded prompts based on gender (Vietnamese people)
      if (gender === 'female') {
        modelPrompt = 'Beautiful Vietnamese young woman, 25 years old, long black hair, Asian features, professional fashion model, casual outfit, Vietnamese style'
      } else if (gender === 'male') {
        modelPrompt = 'Handsome Vietnamese young man, 25 years old, short black hair, Asian features, professional fashion model, casual outfit, Vietnamese style'
      }
    }

    console.log('ðŸŽ¨ Model prompt:', modelPrompt)

    // Use google/nano-banana for TEXT TO IMAGE (exact API structure)
    const kieaiRequestBody = {
      model: 'google/nano-banana', // Text-to-image model
      input: {
        prompt: `${modelPrompt}, high quality, detailed, studio lighting, clean background, full body shot, photorealistic`,
        output_format: 'png',
        image_size: '3:4' // Portrait ratio for models
      }
    }

    console.log('ðŸ“¤ Sending TEXT TO IMAGE to KIE.AI:', JSON.stringify(kieaiRequestBody, null, 2))

    const kieaiResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KIEAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(kieaiRequestBody)
    })

    const kieaiData = await kieaiResponse.json()
    console.log('ðŸ“¡ KIE.AI Response:', kieaiData)

    if (kieaiData.code !== 200) {
      throw new Error(`KIE.AI failed: ${kieaiData.msg || kieaiData.message}`)
    }

    const taskId = kieaiData.data.taskId
    console.log('âœ… Task created with ID:', taskId)

    // Poll for result
    let attempts = 0
    const maxAttempts = 60 // 5 minutes max
    let resultImageUrl = null

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)) // Wait 5 seconds

      const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.KIEAI_API_KEY}`,
        }
      })

      const statusData = await statusResponse.json()
      console.log(`ðŸ“Š Status check ${attempts + 1}:`, statusData)

      if (statusData.code === 200) {
        console.log(`ðŸ” Current state: ${statusData.data.state}`)
        if (statusData.data.state === 'success') {
          // Parse resultJson to get image URL
          const resultJson = JSON.parse(statusData.data.resultJson)
          resultImageUrl = resultJson.resultUrls[0]
          console.log('âœ… Model generated successfully:', resultImageUrl)
          console.log('ðŸš€ Breaking out of polling loop...')
          break
        } else if (statusData.data.state === 'fail') {
          throw new Error(`Generation failed: ${statusData.data.failMsg || 'Unknown error'}`)
        }
      }

      attempts++
    }

    if (attempts >= maxAttempts) {
      throw new Error('Generation timeout - please try again')
    }

    if (!resultImageUrl) {
      throw new Error('No result image URL found')
    }

    // Save model to database
    const { data: savedModel, error: saveError } = await supabaseAdmin
      .from('user_models')
      .insert({
        id: crypto.randomUUID(), // Generate UUID in code
        user_id: user.id,
        image_url: resultImageUrl,
        prompt: modelPrompt,
        style: gender
      })
      .select()
      .single()

    if (saveError) {
      console.error('âŒ Error saving model:', saveError)
      // Still return the image even if save fails
    } else {
      console.log('âœ… Model saved to database successfully:', savedModel?.id)
    }

    return NextResponse.json({
      success: true,
      modelImageUrl: resultImageUrl,
      taskId: taskId,
      savedModel: savedModel || null
    })

  } catch (error) {
    console.error('âŒ Generate Model Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate model' },
      { status: 500 }
    )
  }
}

