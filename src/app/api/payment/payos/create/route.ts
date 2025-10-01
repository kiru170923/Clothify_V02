import { NextRequest, NextResponse } from 'next/server'
import { createPayOSPayment, getClientIP } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const body = await request.json()
    let { planId, billingCycle, userId } = body

    if (!planId || !billingCycle || !userId) {
      return NextResponse.json(
        { error: 'Thiáº¿u thÃ´ng tin báº¯t buá»™c' },
        { status: 400 }
      )
    }

    // Láº¥y thÃ´ng tin gÃ³i membership
    const { data: plan, error: planError } = await supabaseAdmin
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'KhÃ´ng tÃ¬m tháº¥y gÃ³i membership' },
        { status: 404 }
      )
    }

    // Láº¥y user tá»« token náº¿u cÃ³, trÃ¡nh phá»¥ thuá»™c báº£ng profiles
    if (!userId && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: auth } = await supabaseAdmin.auth.getUser(token)
      userId = auth.user?.id
    }
    if (!userId) {
      return NextResponse.json({ error: 'Thiáº¿u userId' }, { status: 400 })
    }

    // TÃ­nh sá»‘ tiá»n thanh toÃ¡n
    const amount = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly

    // Táº¡o order ID duy nháº¥t
    const orderId = `MEMBERSHIP_${userId}_${Date.now()}`

    // Táº¡o thÃ´ng tin Ä‘Æ¡n hÃ ng (tá»‘i Ä‘a 25 kÃ½ tá»± theo yÃªu cáº§u PayOS)
    const orderInfo = `${plan.name} ${billingCycle === 'monthly' ? 'thÃ¡ng' : 'nÄƒm'}`

    // Táº¡o payment vá»›i PayOS (khÃ´ng truyá»n buyer info theo documentation)
    const paymentResponse = await createPayOSPayment({
      amount,
      orderInfo,
      orderId
    })

    // PayOS SDK tráº£ vá» trá»±c tiáº¿p payment link object
    if (!paymentResponse.checkoutUrl) {
      throw new Error('CÃ³ lá»—i xáº£y ra khi táº¡o thanh toÃ¡n')
    }

    // LÆ°u payment order vÃ o database Ä‘á»ƒ track
    const { error: paymentError } = await supabaseAdmin
      .from('payment_orders')
      .insert({
        order_id: orderId,
        user_id: userId,
        plan_id: planId,
        billing_cycle: billingCycle,
        amount,
        status: 'pending',
        payment_url: paymentResponse.checkoutUrl,
        order_info: orderInfo,
        payment_method: 'payos',
        external_order_code: paymentResponse.orderCode.toString()
      })

    if (paymentError) {
      console.error('Error saving payment order:', paymentError)
      return NextResponse.json(
        { error: 'CÃ³ lá»—i xáº£y ra khi táº¡o Ä‘Æ¡n thanh toÃ¡n' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.checkoutUrl,
      qrCode: paymentResponse.qrCode,
      orderId,
      amount,
      orderInfo,
      orderCode: paymentResponse.orderCode
    })

  } catch (error) {
    console.error('Error creating PayOS payment:', error)
    return NextResponse.json(
      { error: 'CÃ³ lá»—i xáº£y ra khi táº¡o thanh toÃ¡n' },
      { status: 500 }
    )
  }
}

