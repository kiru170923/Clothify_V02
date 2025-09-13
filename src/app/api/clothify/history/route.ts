import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's try-on history
    const { data: history, error: dbError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('History API - User ID:', user.id)
    console.log('History API - Found records:', history?.length || 0)
    console.log('History API - Data:', history)

    return NextResponse.json(history || [])
  } catch (error) {
    console.error('Error in history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
