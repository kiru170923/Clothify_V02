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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

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

    // 8. Call Try-On API
    // Create a temporary session token for the QR owner to make internal API call
    // This is needed because /api/clothify/try-on expects a user token
    try {
      // Use service role to call try-on directly without auth check
      // We'll call KIE.AI directly instead of going through /api/clothify/try-on
      
      const kieApiKey = process.env.KIE_AI_API_KEY || process.env.KIEAI_API_KEY
      if (!kieApiKey) {
        throw new Error('KIE_AI_API_KEY or KIEAI_API_KEY not configured')
      }

      // Generate prompt for try-on
      const prompt = 'Virtual try-on: person wearing new clothing item, maintain fit and pose, realistic blend'
      
      const requestBody = {
        model: 'google/nano-banana-edit',
        input: {
          prompt,
          negative_prompt: 'blurry, low quality, distorted, artifacts, poor fit, deformed',
          image_urls: [userImageUrl, qrCode.clothing_image_url],
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
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const kieData = await kieResponse.json()

      if (kieData.code !== 200 || !kieData.data?.taskId) {
        throw new Error(kieData.msg || 'Failed to create try-on task')
      }

      const taskId = kieData.data.taskId
      console.log('✅ KIE.AI task created:', taskId)

      // Poll for result (copied from /api/clothify/try-on)
      let attempts = 0
      const maxAttempts = 60
      let resultImageUrl: string | null = null

      while (attempts < maxAttempts) {
        const delay = Math.min(250 * Math.pow(2, Math.floor(attempts / 5)), 4000)
        await new Promise(resolve => setTimeout(resolve, delay))
        
        try {
          // Use correct KIE.AI polling endpoint
          const statusResponse = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
            headers: { 'Authorization': `Bearer ${kieApiKey}` }
          })
          
          if (statusResponse.ok) {
            const statusData = await statusResponse.json()
            console.log(`🔍 Poll attempt ${attempts + 1}:`, statusData.data?.state || 'unknown')
            
            // Check state (processing, generating, completed, failed)
            if (statusData.code === 200 && (statusData.data.state === 'processing' || statusData.data.state === 'generating')) {
              attempts++
              continue
            }
            
            if (statusData.code === 200 && statusData.data.state === 'completed') {
              resultImageUrl = statusData.data.resultImageUrl
              console.log('✅ Got result image URL:', resultImageUrl)
              break
            }
            
            if (statusData.code === 200 && statusData.data.state === 'failed') {
              throw new Error(statusData.data.error || 'KIE.AI task failed')
            }
          }
          
          attempts++
        } catch (pollError) {
          console.error('❌ Polling error:', pollError)
          attempts++
        }
      }

      if (!resultImageUrl) {
        throw new Error('Try-on timeout - no result after polling')
      }

      console.log('✅ Try-on successful, result URL:', resultImageUrl)

      // 9. Deduct token from owner
      // First get current used_tokens
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

      // 10. Record token usage
      await supabaseAdmin.from('token_usage_history').insert({
        user_id: qrCode.user_id,
        tokens_used: 1,
        usage_type: 'qr_tryon',
        description: `QR Try-On: ${qrCode.name || code}`
      })

      // 11. Update QR stats
      await supabaseAdmin.rpc('increment_successful_tryon', {
        qr_code_id_param: qrCode.id,
        tokens_used: 1
      })

      // 12. Log successful scan
      await supabaseAdmin.from('qr_scan_history').insert({
        qr_code_id: qrCode.id,
        user_image_url: userImageUrl,
        result_image_url: resultImageUrl,
        ip_address: ip,
        user_agent: userAgent,
        success: true
      })

      // 13. Return result
      return NextResponse.json({
        success: true,
        resultImageUrl,
        tokensRemaining: ownerTokens.total_tokens - 1
      })

    } catch (tryOnError: any) {
      console.error('Try-on error:', tryOnError)

      // Log failed attempt
      await supabaseAdmin.from('qr_scan_history').insert({
        qr_code_id: qrCode.id,
        user_image_url: userImageUrl,
        ip_address: ip,
        user_agent: userAgent,
        success: false,
        error_message: tryOnError.message || 'Try-on failed'
      })

      return NextResponse.json({ 
        error: 'Virtual try-on failed. Please try again.',
        details: tryOnError.message 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Error in QR try-on API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

