import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
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

    const { code } = await params
    const body = await request.json()
    const { isActive } = body

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
    }

    // 2. Update QR code status (RLS ensures user owns this QR)
    const { data: updatedQR, error: updateError } = await supabaseAdmin
      .from('qr_codes')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('code', code)
      .eq('user_id', user.id) // Extra safety check
      .select()
      .single()

    if (updateError || !updatedQR) {
      console.error('Error updating QR status:', updateError)
      return NextResponse.json({ 
        error: updateError?.code === 'PGRST116' ? 'QR code not found or access denied' : 'Failed to update QR code'
      }, { status: updateError?.code === 'PGRST116' ? 404 : 500 })
    }

    return NextResponse.json({
      success: true,
      qrCode: {
        code: updatedQR.code,
        isActive: updatedQR.is_active,
        updatedAt: updatedQR.updated_at
      }
    })

  } catch (error) {
    console.error('Error in QR status API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE endpoint to remove QR code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
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

    const { code } = await params

    // 2. Delete QR code (RLS ensures user owns this QR)
    const { error: deleteError } = await supabaseAdmin
      .from('qr_codes')
      .delete()
      .eq('code', code)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting QR code:', deleteError)
      return NextResponse.json({ 
        error: deleteError.code === 'PGRST116' ? 'QR code not found or access denied' : 'Failed to delete QR code'
      }, { status: deleteError.code === 'PGRST116' ? 404 : 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'QR code deleted successfully'
    })

  } catch (error) {
    console.error('Error in QR delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

