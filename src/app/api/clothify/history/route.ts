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

    // Pagination params
    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)
    const pageSize = Math.min(Math.max(parseInt(searchParams.get('pageSize') || '20', 10), 1), 50)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Fetch user's try-on history (paginated)
    const { data: history, error: dbError, count } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .range(from, to)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    console.log('History API - User ID:', user.id)
    console.log('History API - Found records:', history?.length || 0)
    console.log('History API - Data:', history)

    return NextResponse.json({ items: history || [], page, pageSize, total: count || 0 })
  } catch (error) {
    console.error('Error in history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
