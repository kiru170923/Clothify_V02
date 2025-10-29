import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function GET(request: NextRequest) {
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

    // 2. Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') // 'all', 'active', 'inactive', 'expired'

    const offset = (page - 1) * limit

    // 3. Build query
    let query = supabaseAdmin
      .from('qr_codes_with_analytics')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status === 'active') {
      query = query.eq('status', 'active')
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (status === 'expired') {
      query = query.eq('status', 'expired')
    }

    const { data: qrCodes, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Error fetching QR codes:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 })
    }

    // 4. Format response
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    const formattedQrCodes = qrCodes?.map(qr => ({
      id: qr.id,
      code: qr.code,
      name: qr.name,
      clothingImageUrl: qr.clothing_image_url,
      publicUrl: `${baseUrl}/try/${qr.code}`,
      
      // Stats
      totalScans: qr.total_scans,
      successfulTryons: qr.successful_tryons,
      tokensSpent: qr.tokens_spent,
      successRate: qr.success_rate_percent,
      
      // Status
      isActive: qr.is_active,
      status: qr.status,
      maxUses: qr.max_uses,
      expiresAt: qr.expires_at,
      
      // Timestamps
      createdAt: qr.created_at,
      updatedAt: qr.updated_at,
      lastScannedAt: qr.last_scanned_at
    })) || []

    return NextResponse.json({
      success: true,
      qrCodes: formattedQrCodes,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in QR list API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

