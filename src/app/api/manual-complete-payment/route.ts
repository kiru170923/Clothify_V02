import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Thiếu orderId' },
        { status: 400 }
      )
    }

    // Tìm payment order
    const { data: paymentOrder, error: orderError } = await supabaseAdmin
      .from('payment_orders')
      .select(`
        *,
        membership_plans (
          id,
          name,
          tokens_monthly,
          tokens_yearly
        )
      `)
      .eq('order_id', orderId)
      .single()

    if (orderError || !paymentOrder) {
      console.error('Payment order not found:', orderError)
      return NextResponse.json(
        { error: 'Không tìm thấy payment order' },
        { status: 404 }
      )
    }

    console.log('Found payment order:', paymentOrder)

    // Cập nhật trạng thái payment order
    const { error: updateOrderError } = await supabaseAdmin
      .from('payment_orders')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentOrder.id)

    if (updateOrderError) {
      console.error('Error updating payment order:', updateOrderError)
      return NextResponse.json(
        { error: 'Có lỗi khi cập nhật payment order', details: updateOrderError },
        { status: 500 }
      )
    }

    // Tính số tokens cần cộng
    const tokensToAdd = paymentOrder.billing_cycle === 'monthly' 
      ? paymentOrder.membership_plans.tokens_monthly 
      : paymentOrder.membership_plans.tokens_yearly

    console.log(`Adding ${tokensToAdd} tokens for user ${paymentOrder.user_id}`)

    // Cộng tokens cho user
    const { data: tokenResult, error: tokenError } = await supabaseAdmin
      .from('user_tokens')
      .upsert({
        user_id: paymentOrder.user_id,
        total_tokens: tokensToAdd,
        used_tokens: 0,
        last_reset_date: new Date().toISOString(),
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
      message: `Đã cộng ${tokensToAdd} tokens cho user`,
      paymentOrder: paymentOrder,
      tokenResult: tokenResult
    })

  } catch (error) {
    console.error('Error in manual complete payment:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra', details: error },
      { status: 500 }
    )
  }
}
