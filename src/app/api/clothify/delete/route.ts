import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Không có quyền truy cập' }, { status: 401 })
    }

    // Get ID from request body (not query params)
    const body = await request.json()
    const id = body.id
    
    if (!id) {
      return NextResponse.json({ error: 'ID là bắt buộc' }, { status: 400 })
    }

    console.log('🗑️ Deleting image:', id, 'for user:', user.id)

    // Delete from images table (not clothify_results)
    const { error } = await supabaseAdmin
      .from('images')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own images

    if (error) {
      console.error('❌ Delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('✅ Image deleted successfully:', id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Delete API error:', error)
    return NextResponse.json({ error: error.message || 'Không thể xóa' }, { status: 500 })
  }
}
