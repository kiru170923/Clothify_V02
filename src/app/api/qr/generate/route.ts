import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request body
    const body = await request.json()
    const { 
      clothingImageUrl, 
      wardrobeItemId, 
      name, 
      maxUses, 
      expiresAt 
    } = body

    // Validation
    if (!clothingImageUrl) {
      return NextResponse.json({ error: 'clothingImageUrl is required' }, { status: 400 })
    }

    // 3. Generate unique QR code
    const { data: codeData, error: codeError } = await supabaseAdmin
      .rpc('generate_unique_qr_code')

    if (codeError || !codeData) {
      console.error('Error generating QR code:', codeError)
      return NextResponse.json({ error: 'Failed to generate unique code' }, { status: 500 })
    }

    const code = codeData as string

    // 4. Insert QR code record
    const { data: qrCode, error: insertError } = await supabaseAdmin
      .from('qr_codes')
      .insert({
        user_id: user.id,
        code,
        name: name || 'QR Code',
        clothing_image_url: clothingImageUrl,
        wardrobe_item_id: wardrobeItemId || null,
        max_uses: maxUses || null,
        expires_at: expiresAt || null,
        is_active: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting QR code:', insertError)
      return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 })
    }

    // 5. Generate public URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const publicUrl = `${baseUrl}/try/${code}`

    // 6. Return response
    return NextResponse.json({
      success: true,
      qrCode: {
        id: qrCode.id,
        code: qrCode.code,
        name: qrCode.name,
        clothingImageUrl: qrCode.clothing_image_url,
        publicUrl,
        createdAt: qrCode.created_at,
        isActive: qrCode.is_active,
        maxUses: qrCode.max_uses,
        expiresAt: qrCode.expires_at
      }
    })

  } catch (error) {
    console.error('Error in QR generation API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

