import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100') // Show 100 users per page
    const search = searchParams.get('search') || ''
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build query for user_profiles - fetch all profiles (78 records)
    let query = supabaseAdmin
      .from('user_profiles')
      .select('user_id, created_at, gender, age_group, height_cm, weight_kg, size')
      .order('created_at', { ascending: false })
      .limit(1000)

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo)
    }

    const { data: profilesData, error: profilesError } = await query

    if (profilesError) {
      console.error('Profiles query error:', profilesError)
      throw profilesError
    }

    // Get user data separately
    const userIds = profilesData?.map(p => p.user_id) || []
    let usersDataMap: Record<string, any> = {}
    let authUsersMap: Record<string, any> = {}

    if (userIds.length > 0) {
      // Get from public.users
      const { data: usersData } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .in('id', userIds)
      
      usersDataMap = Object.fromEntries(usersData?.map(u => [u.id, u]) || [])

      // Get from auth.users for metadata
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
      authUsersMap = Object.fromEntries(
        authUsers?.users
          .filter(u => userIds.includes(u.id))
          .map(u => [
            u.id,
            {
              email: u.email,
              name: u.user_metadata?.name || u.user_metadata?.full_name || u.email,
              authName: u.user_metadata?.full_name || u.user_metadata?.name,
            }
          ]) || []
      )
    }

    // Get tokens for each user
    const { data: tokens } = await supabaseAdmin
      .from('user_tokens')
      .select('user_id, total_tokens, used_tokens')

    const tokenMap = new Map(tokens?.map(t => [t.user_id, t]) || [])

    // Combine data
    let users = profilesData?.map((profile: any) => {
      const authData = authUsersMap[profile.user_id]
      const userData = usersDataMap[profile.user_id]
      const tokenData = tokenMap.get(profile.user_id)
      
      return {
        id: profile.user_id,
        email: authData?.email || userData?.email || 'N/A',
        name: authData?.name || userData?.name || 'User',
        authName: authData?.authName,
        createdAt: profile.created_at,
        gender: profile.gender || null,
        ageGroup: profile.age_group || null,
        height: profile.height_cm || null,
        weight: profile.weight_kg || null,
        size: profile.size || null,
        tokens: tokenData?.total_tokens || 0,
        usedTokens: tokenData?.used_tokens || 0,
      }
    }) || []

    // Apply search filter
    if (search) {
      users = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Calculate pagination
    const total = users.length
    const start = (page - 1) * limit
    const end = start + limit
    const paginatedUsers = users.slice(start, end)

    // Calculate stats
    const totalUsers = users.length
    const usersThisWeek = users.filter(u => {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return new Date(u.createdAt) >= weekAgo
    }).length

    const usersThisMonth = users.filter(u => {
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)
      return new Date(u.createdAt) >= monthAgo
    }).length

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      stats: {
        totalUsers,
        usersThisWeek,
        usersThisMonth
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
