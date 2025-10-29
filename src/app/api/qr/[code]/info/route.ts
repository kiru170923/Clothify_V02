import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code) {
      return NextResponse.json({ error: 'QR code is required' }, { status: 400 })
    }

    // Fetch QR code info (no auth required - public endpoint)
    const { data: qrCode, error: fetchError } = await supabaseAdmin
      .from('qr_codes')
      .select('*')
      .eq('code', code)
      .single()

    if (fetchError || !qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 })
    }

    // Check if QR is usable
    const now = new Date()
    const isExpired = qrCode.expires_at && new Date(qrCode.expires_at) < now
    const isMaxUsesReached = qrCode.max_uses && qrCode.total_scans >= qrCode.max_uses
    const isUsable = qrCode.is_active && !isExpired && !isMaxUsesReached

    // Increment scan count (fire and forget)
    if (isUsable) {
      supabaseAdmin.rpc('increment_qr_scan', { qr_code_id_param: qrCode.id })
        .then(() => console.log(`✅ Incremented scan count for QR: ${code}`))
        .then(() => undefined, () => undefined) // Ignore errors
    }

    // Return public info
    return NextResponse.json({
      success: true,
      qrCode: {
        code: qrCode.code,
        name: qrCode.name,
        clothingImageUrl: qrCode.clothing_image_url,
        isActive: qrCode.is_active,
        isUsable,
        
        // Status reasons
        isExpired,
        isMaxUsesReached,
        
        // Limits
        maxUses: qrCode.max_uses,
        currentScans: qrCode.total_scans,
        expiresAt: qrCode.expires_at,
        
        // Don't expose user_id or other sensitive data
      }
    })

  } catch (error) {
    console.error('Error in QR info API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

