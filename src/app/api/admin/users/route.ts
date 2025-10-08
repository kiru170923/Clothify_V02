import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''
    const membership = searchParams.get('membership') || ''

    const offset = (page - 1) * limit

    // Build query - simplified to avoid complex joins
    let query = supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.ilike('user_id', `%${search}%`)
    }

    // Membership filter temporarily disabled due to complex join
    // if (membership) {
    //   if (membership === 'free') {
    //     query = query.is('user_memberships', null)
    //   } else {
    //     query = query.eq('user_memberships.plan_type', membership)
    //   }
    // }

    // Get total count for pagination
    const { count } = await supabaseAdmin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    // Get paginated results
    const { data: users, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get memberships and tokens for these users
    const userIds = users?.map(u => u.user_id) || []
    
    const { data: memberships } = await supabaseAdmin
      .from('user_memberships')
      .select('user_id, plan_type, status, created_at, expires_at')
      .in('user_id', userIds)

    const { data: tokens } = await supabaseAdmin
      .from('user_tokens')
      .select('user_id, tokens')
      .in('user_id', userIds)

    // Combine data
    const usersWithDetails = users?.map(user => ({
      ...user,
      user_memberships: memberships?.filter(m => m.user_id === user.user_id) || [],
      user_tokens: tokens?.filter(t => t.user_id === user.user_id) || []
    })) || []

    return NextResponse.json({
      users: usersWithDetails,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Error in admin users API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Delete user data from all related tables
    const deletePromises = [
      supabaseAdmin.from('user_wardrobe_items').delete().eq('user_id', userId),
      supabaseAdmin.from('user_memberships').delete().eq('user_id', userId),
      supabaseAdmin.from('user_tokens').delete().eq('user_id', userId),
      supabaseAdmin.from('payment_orders').delete().eq('user_id', userId),
      supabaseAdmin.from('user_profiles').delete().eq('user_id', userId)
    ]

    await Promise.all(deletePromises)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
