import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planId, billingCycle } = body

    // Lấy thông tin gói membership
    const { data: plan, error: planError } = await supabaseAdmin
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Không tìm thấy gói membership' },
        { status: 404 }
      )
    }

    // Tính số tokens cần cộng
    const tokensToAdd = billingCycle === 'monthly' 
      ? plan.tokens_monthly 
      : plan.tokens_yearly

    console.log(`Adding ${tokensToAdd} tokens for user ${userId}`)

    // Cộng tokens cho user
    const { data: tokenResult, error: tokenError } = await supabaseAdmin
      .from('user_tokens')
      .upsert({
        user_id: userId,
        tokens_remaining: tokensToAdd,
        tokens_total: tokensToAdd,
        plan_id: planId,
        billing_cycle: billingCycle,
        expires_at: billingCycle === 'monthly' 
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
          : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 365 days
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()

    if (tokenError) {
      console.error('Error updating user tokens:', tokenError)
      return NextResponse.json(
        { error: 'Có lỗi khi cập nhật tokens', details: tokenError },
        { status: 500 }
      )
    }

    console.log('Token update result:', tokenResult)

    return NextResponse.json({
      success: true,
      tokensAdded: tokensToAdd,
      result: tokenResult
    })

  } catch (error) {
    console.error('Error in test tokens:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra', details: error },
      { status: 500 }
    )
  }
}
