import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Kiểm tra bảng membership_plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('membership_plans')
      .select('*')

    // Kiểm tra bảng payment_orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('payment_orders')
      .select('*')
      .limit(5)

    // Kiểm tra bảng user_tokens
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .limit(5)

    return NextResponse.json({
      membership_plans: {
        data: plans,
        error: plansError,
        count: plans?.length || 0
      },
      payment_orders: {
        data: orders,
        error: ordersError,
        count: orders?.length || 0
      },
      user_tokens: {
        data: tokens,
        error: tokensError,
        count: tokens?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in debug:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra', details: error },
      { status: 500 }
    )
  }
}
