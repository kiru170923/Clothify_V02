import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify user with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      console.log('Delete API - Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    console.log('Delete API - User ID:', user.id)
    console.log('Delete API - Deleting record ID:', id)

    // Delete from database
    const { error: deleteError } = await supabaseAdmin
      .from('images')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user can only delete their own records

    if (deleteError) {
      console.error('Delete API - Database error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
    }

    console.log('Delete API - Successfully deleted record:', id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete API - Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
