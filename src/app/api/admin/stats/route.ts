import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Get user statistics
    const { data: userProfiles } = await supabaseAdmin
      .from('user_profiles')
      .select('user_id, created_at')

    const { data: memberships } = await supabaseAdmin
      .from('user_memberships')
      .select('user_id, plan_type, status, created_at')

    const { data: tokens } = await supabaseAdmin
      .from('user_tokens')
      .select('user_id, tokens')

    const { data: payments } = await supabaseAdmin
      .from('payment_orders')
      .select('amount, status, created_at')
      .eq('status', 'completed')

    const { data: tryOnHistory } = await supabaseAdmin
      .from('images')
      .select('user_id, created_at')

    const { data: chatHistory } = await supabaseAdmin
      .from('chat_messages')
      .select('user_id, created_at')

    // Calculate statistics
    const totalUsers = userProfiles?.length || 0
    
    // Active users (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const activeUsers = userProfiles?.filter(user => 
      new Date(user.created_at) > thirtyDaysAgo
    ).length || 0

    // Premium users - calculate from completed payments (users who have paid)
    const { data: completedPayments } = await supabaseAdmin
      .from('payment_orders')
      .select('user_id')
      .eq('status', 'completed')
    
    const uniquePaidUsers = new Set(completedPayments?.map(p => p.user_id) || [])
    const premiumUsers = uniquePaidUsers.size

    // Total tokens
    const totalTokens = tokens?.reduce((sum, t) => sum + (t.tokens || 0), 0) || 0

    // Revenue statistics
    const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    const monthlyRevenue = payments?.filter(p => {
      const paymentDate = new Date(p.created_at)
      const thisMonth = new Date()
      thisMonth.setDate(1)
      return paymentDate >= thisMonth
    }).reduce((sum, p) => sum + (p.amount || 0), 0) || 0

    // Activity statistics
    const totalTryOns = tryOnHistory?.length || 0
    const totalChats = chatHistory?.length || 0

    // Monthly growth
    const currentMonth = new Date().getMonth()
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const currentYear = new Date().getFullYear()
    
    const currentMonthUsers = userProfiles?.filter(user => {
      const userDate = new Date(user.created_at)
      return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear
    }).length || 0

    const lastMonthUsers = userProfiles?.filter(user => {
      const userDate = new Date(user.created_at)
      return userDate.getMonth() === lastMonth && userDate.getFullYear() === currentYear
    }).length || 0

    const userGrowthRate = lastMonthUsers > 0 
      ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1)
      : '0'

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        premium: premiumUsers,
        growthRate: userGrowthRate
      },
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue
      },
      tokens: {
        total: totalTokens
      },
      activity: {
        tryOns: totalTryOns,
        chats: totalChats
      }
    })

  } catch (error) {
    console.error('Error fetching admin stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
