import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('Error getting users count:', usersError)
    }

    // Get total try-on sessions (completed images)
    const { count: totalTryOns, error: tryOnsError } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    if (tryOnsError) {
      console.error('Error getting try-ons count:', tryOnsError)
    }

    // Get satisfaction rate (completed vs failed)
    const { count: completedImages, error: completedError } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')

    const { count: failedImages, error: failedError } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')

    if (completedError || failedError) {
      console.error('Error getting satisfaction rate:', completedError || failedError)
    }

    const totalImages = (completedImages || 0) + (failedImages || 0)
    const satisfactionRate = totalImages > 0 
      ? Math.round(((completedImages || 0) / totalImages) * 100)
      : 95 // Default fallback

    // Get recent activity (last 24 hours)
    const { count: recentActivity, error: recentError } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (recentError) {
      console.error('Error getting recent activity:', recentError)
    }

    const stats = {
      totalUsers: totalUsers || 0,
      totalTryOns: totalTryOns || 0,
      satisfactionRate: satisfactionRate,
      recentActivity: recentActivity || 0,
      lastUpdated: new Date().toISOString()
    }

    console.log('📊 Stats generated:', stats)

    return NextResponse.json(stats)
  } catch (error: any) {
    console.error('❌ Stats API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to get stats',
      fallback: {
        totalUsers: 0,
        totalTryOns: 0,
        satisfactionRate: 95,
        recentActivity: 0
      }
    }, { status: 500 })
  }
}
