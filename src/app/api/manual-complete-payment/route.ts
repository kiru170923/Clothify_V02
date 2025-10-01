import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Thiáº¿u orderId' },
        { status: 400 }
      )
    }

    // TÃ¬m payment order
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
        { error: 'KhÃ´ng tÃ¬m tháº¥y payment order' },
        { status: 404 }
      )
    }

    console.log('Found payment order:', paymentOrder)

    // Cáº­p nháº­t tráº¡ng thÃ¡i payment order
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
        { error: 'CÃ³ lá»—i khi cáº­p nháº­t payment order', details: updateOrderError },
        { status: 500 }
      )
    }

    // TÃ­nh sá»‘ tokens cáº§n cá»™ng
    const tokensToAdd = paymentOrder.billing_cycle === 'monthly' 
      ? paymentOrder.membership_plans.tokens_monthly 
      : paymentOrder.membership_plans.tokens_yearly

    console.log(`Adding ${tokensToAdd} tokens for user ${paymentOrder.user_id}`)

    // Cá»™ng tokens cho user
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
        { error: 'CÃ³ lá»—i khi cáº­p nháº­t tokens', details: tokenError },
        { status: 500 }
      )
    }

    console.log('Token update result:', tokenResult)

    return NextResponse.json({
      success: true,
      message: `ÄÃ£ cá»™ng ${tokensToAdd} tokens cho user`,
      paymentOrder: paymentOrder,
      tokenResult: tokenResult
    })

  } catch (error) {
    console.error('Error in manual complete payment:', error)
    return NextResponse.json(
      { error: 'CÃ³ lá»—i xáº£y ra', details: error },
      { status: 500 }
    )
  }
}

