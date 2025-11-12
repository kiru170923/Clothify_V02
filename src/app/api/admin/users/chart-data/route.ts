import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Fetch ALL users (no pagination) for chart
    let query = supabaseAdmin
      .from('user_profiles')
      .select('user_id, created_at')
      .order('created_at', { ascending: true })

    // Apply date filters if provided
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

    // Group users by date
    const dateMap: Record<string, number> = {}
    
    profilesData?.forEach((profile: any) => {
      const date = new Date(profile.created_at).toISOString().split('T')[0] // YYYY-MM-DD
      dateMap[date] = (dateMap[date] || 0) + 1
    })

    // Convert to array and format for chart
    const chartData = Object.entries(dateMap)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('vi-VN', {
          month: '2-digit',
          day: '2-digit',
        }),
        fullDate: date,
        users: count
      }))
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate))

    return NextResponse.json({
      chartData,
      totalUsers: profilesData?.length || 0
    })

  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

