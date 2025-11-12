import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

// Rate limiting helper (simple in-memory - upgrade to Redis for production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, maxAttempts = 3, windowMs = 3600000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(key)

  if (!record || now > record.resetAt) {
    // Reset or create new record
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count >= maxAttempts) {
    return false // Rate limited
  }

  record.count++
  return true
}

async function fetchImageAsBase64(url: string, label: string): Promise<string> {
  const response = await fetch(url)

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Failed to fetch ${label} image (${response.status}): ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer).toString('base64')
}

async function tryWhomeAiTryOn(params: {
  userImageUrl: string
  clothingImageUrl: string
  qrCodeId: string | number
  qrName?: string | null
}): Promise<string> {
  const { userImageUrl, clothingImageUrl, qrCodeId, qrName } = params

  const apiKey = process.env.WHOMEAI_API_KEY || process.env.WHOMEAI_TOKEN || 'sk-demo'

  if (!apiKey) {
    throw new Error('WHOMEAI API key not configured')
  }

  const [userImageBase64, clothingImageBase64] = await Promise.all([
    fetchImageAsBase64(userImageUrl, 'user'),
    fetchImageAsBase64(clothingImageUrl, 'clothing')
  ])

  const prompt = `Blend the provided clothing item onto the person for a virtual try-on. Keep the person\'s face, skin tone, pose, and proportions natural. Outfit: ${qrName || 'Clothify outfit'}.`

  const response = await fetch('https://api.whomeai.com/v1/images/image-edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'nano-banana-r2i',
      prompt,
      images: [userImageBase64, clothingImageBase64],
      n: 1,
      size: '1024x1792',
      response_format: 'b64_json'
    })
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`WHOMEAI request failed (${response.status}): ${errorText}`)
  }

  let data: any
  try {
    data = await response.json()
  } catch (parseError) {
    throw new Error('Failed to parse WHOMEAI response')
  }

  const base64Result = data?.data?.[0]?.b64_json

  if (!base64Result) {
    throw new Error('WHOMEAI response missing image data')
  }

  const resultBuffer = Buffer.from(base64Result, 'base64')
  const storagePath = `qr-tryons/${String(qrCodeId)}/results/${Date.now()}-whomeai.png`

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('images')
    .upload(storagePath, resultBuffer, {
      contentType: 'image/png',
      cacheControl: '3600'
    })

  if (uploadError || !uploadData) {
    throw new Error(`Failed to upload WHOMEAI result: ${uploadError?.message || 'unknown error'}`)
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from('images')
    .getPublicUrl(uploadData.path)

  return publicUrlData.publicUrl
}

async function tryKieAiTryOn(params: {
  userImageUrl: string
  clothingImageUrl: string
}): Promise<string> {
  const { userImageUrl, clothingImageUrl } = params

  const kieApiKey = process.env.KIE_AI_API_KEY || process.env.KIEAI_API_KEY

  if (!kieApiKey) {
    throw new Error('KIE_AI_API_KEY or KIEAI_API_KEY not configured')
  }

  const prompt = 'Virtual try-on: person wearing new clothing item, maintain fit and pose, realistic blend'

  const requestBody = {
    model: 'google/nano-banana-edit',
    input: {
      prompt,
      negative_prompt: 'blurry, low quality, distorted, artifacts, poor fit, deformed',
      image_urls: [userImageUrl, clothingImageUrl],
      output_format: 'png',
      image_size: '3:4',
      num_inference_steps: 35,
      guidance_scale: 7.0
    }
  }

  const kieResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${kieApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  let kieData: any
  try {
    kieData = await kieResponse.json()
  } catch (parseError) {
    throw new Error('Failed to parse KIE.AI response')
  }

  if (kieData.code !== 200 || !kieData.data?.taskId) {
    throw new Error(kieData.msg || 'Failed to create KIE.AI try-on task')
  }

  const taskId = kieData.data.taskId
  console.log('✅ KIE.AI task created:', taskId)

  let attempts = 0
  const maxAttempts = 60
  let resultImageUrl: string | null = null

  while (attempts < maxAttempts) {
    const delay = Math.min(250 * Math.pow(2, Math.floor(attempts / 5)), 4000)
    await new Promise(resolve => setTimeout(resolve, delay))

    try {
      const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
        headers: { 'Authorization': `Bearer ${kieApiKey}` }
      })

      if (statusResponse.ok) {
        const statusData = await statusResponse.json()
        const state = statusData.data?.state

        if (state === 'waiting' || state === 'processing' || state === 'generating') {
          attempts++
          continue
        }

        if (state === 'success' || state === 'completed') {
          if (statusData.data.resultJson) {
            try {
              const resultData = JSON.parse(statusData.data.resultJson)
              resultImageUrl = resultData.resultUrls?.[0] || null
            } catch (parseError) {
              console.error('❌ Failed to parse KIE.AI resultJson:', parseError)
            }
          }

          if (!resultImageUrl && statusData.data.resultImageUrl) {
            resultImageUrl = statusData.data.resultImageUrl
          }

          if (resultImageUrl) {
            break
          }
        }

        if (state === 'failed') {
          throw new Error(statusData.data.error || 'KIE.AI task failed')
        }
      }

      attempts++
    } catch (pollError) {
      console.error('❌ KIE.AI polling error:', pollError)
      attempts++
    }
  }

  if (!resultImageUrl) {
    throw new Error('KIE.AI try-on timeout - no result after polling')
  }

  return resultImageUrl
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  let code: string | undefined
  try {
    const paramsData = await params
    code = paramsData.code

    if (!code) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }

    // 1. Get request metadata
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // 2. Rate limiting per IP per QR
    const rateLimitKey = `qr:${code}:ip:${ip}`
    if (!checkRateLimit(rateLimitKey, 5, 3600000)) { // 5 attempts per hour
      return NextResponse.json({ 
        error: 'Too many attempts. Please try again later.',
        retryAfter: 3600 
      }, { status: 429 })
    }

    // 3. Fetch QR code
    const { data: qrCode, error: fetchError } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (fetchError || !qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
    }

    // 4. Check if QR is usable
    const now = new Date()
    const isExpired = qrCode.expires_at && new Date(qrCode.expires_at) < now
    const isMaxUsesReached = qrCode.max_uses && qrCode.total_scans >= qrCode.max_uses

    if (!qrCode.is_active) {
      return NextResponse.json({ error: 'This QR code has been disabled' }, { status: 403 })
    }

    if (isExpired) {
      return NextResponse.json({ error: 'This QR code has expired' }, { status: 410 })
    }

    if (isMaxUsesReached) {
      return NextResponse.json({ error: 'This QR code has reached its maximum uses' }, { status: 410 })
    }

    // 5. Check if owner has tokens
    const { data: ownerTokens, error: tokenError } = await supabaseAdmin
      .from('user_tokens')
      .select('total_tokens')
      .eq('user_id', qrCode.user_id)
      .single()

    if (tokenError || !ownerTokens || ownerTokens.total_tokens < 1) {
      // Log failed attempt
      await supabaseAdmin.from('qr_scan_history').insert({
        qr_code_id: qrCode.id,
        ip_address: ip,
        user_agent: userAgent,
        success: false,
        error_message: 'Owner has insufficient tokens'
      })

      return NextResponse.json({ 
        error: 'This QR code owner has run out of tokens. Please contact the owner.',
        insufficientTokens: true
      }, { status: 402 })
    }

    // 6. Parse user image from request
    const formData = await request.formData()
    const userImage = formData.get('userImage') as File

    if (!userImage) {
      return NextResponse.json({ error: 'User image is required' }, { status: 400 })
    }

    // 7. Upload user image to storage
    const fileExt = userImage.name.split('.').pop()
    const fileName = `qr-tryons/${qrCode.id}/${Date.now()}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('images')
      .upload(fileName, userImage, {
        contentType: userImage.type,
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl: userImageUrl } } = supabaseAdmin.storage
      .from('images')
      .getPublicUrl(uploadData.path)

    // 8. Ensure QR code has an associated clothing image
    if (!qrCode.clothing_image_url) {
      return NextResponse.json({ error: 'QR code missing clothing image' }, { status: 400 })
    }

    // 9. Attempt try-on with WHOMEAI first, fallback to KIE.AI if needed
      let resultImageUrl: string | null = null
    let providerUsed: 'whomeai' | 'kieai' = 'whomeai'

    try {
      resultImageUrl = await tryWhomeAiTryOn({
        userImageUrl,
        clothingImageUrl: qrCode.clothing_image_url,
        qrCodeId: qrCode.id,
        qrName: qrCode.name
      })
      console.log('✅ WHOMEAI try-on successful')
    } catch (primaryError) {
      console.error('❌ WHOMEAI try-on error:', primaryError)
      providerUsed = 'kieai'

      try {
        resultImageUrl = await tryKieAiTryOn({
          userImageUrl,
          clothingImageUrl: qrCode.clothing_image_url
        })
        console.log('✅ KIE.AI fallback try-on successful')
      } catch (fallbackError) {
        console.error('❌ KIE.AI fallback failed:', fallbackError)
        throw fallbackError
        }
      }

      if (!resultImageUrl) {
      throw new Error('Virtual try-on failed - no result image returned')
      }

      console.log('✅ Try-on successful, result URL:', resultImageUrl)

    // 10. Deduct token from owner
      const { data: currentTokenData } = await supabaseAdmin
        .from('user_tokens')
        .select('used_tokens')
        .eq('user_id', qrCode.user_id)
        .single()
      
      const currentUsedTokens = currentTokenData?.used_tokens || 0
      
      const { error: tokenDeductError } = await supabaseAdmin
        .from('user_tokens')
        .update({
          total_tokens: ownerTokens.total_tokens - 1,
          used_tokens: currentUsedTokens + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', qrCode.user_id)

      if (tokenDeductError) {
        console.error('Token deduction error:', tokenDeductError)
        // Continue anyway - we don't want to fail the user experience
      }

    // 11. Record token usage
      await supabaseAdmin.from('token_usage_history').insert({
        user_id: qrCode.user_id,
        tokens_used: 1,
        usage_type: 'qr_tryon',
        description: `QR Try-On: ${qrCode.name || code}`
      })

    // 12. Update QR stats
      await supabaseAdmin.rpc('increment_successful_tryon', {
        qr_code_id_param: qrCode.id,
        tokens_used: 1
      })

    // 13. Log successful scan
      await supabaseAdmin.from('qr_scan_history').insert({
        qr_code_id: qrCode.id,
        user_image_url: userImageUrl,
        result_image_url: resultImageUrl,
        ip_address: ip,
        user_agent: userAgent,
        success: true
      })

    // 14. Return result
      return NextResponse.json({
        success: true,
        resultImageUrl,
      tokensRemaining: ownerTokens.total_tokens - 1,
      provider: providerUsed
      })

  } catch (error: any) {
    console.error('Error in QR try-on API:', error)

    // Try to log failed attempt if we have the necessary data
    if (code) {
      try {
        const { data: qrCode } = await supabaseAdmin
          .from('qr_codes')
          .select('id')
          .eq('code', code)
          .single()

        if (qrCode) {
          const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
          const userAgent = request.headers.get('user-agent') || 'unknown'
          
      await supabaseAdmin.from('qr_scan_history').insert({
        qr_code_id: qrCode.id,
        ip_address: ip,
        user_agent: userAgent,
        success: false,
            error_message: error.message || 'Try-on failed'
      })
        }
      } catch (logError) {
        console.error('Failed to log error:', logError)
      }
    }

    return NextResponse.json({ 
      error: 'Virtual try-on failed. Please try again.',
      details: error.message 
    }, { status: 500 })
  }
}

