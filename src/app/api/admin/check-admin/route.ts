import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Check if current user is admin
 * GET /api/admin/check-admin
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ isAdmin: false }, { status: 200 })
    }

    // Check if user has is_admin flag in user_profiles
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single()

    const isAdmin = profile?.is_admin === true

    return NextResponse.json({ 
      isAdmin,
      userId: user.id,
      email: user.email
    })

  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json({ isAdmin: false }, { status: 200 })
  }
}

