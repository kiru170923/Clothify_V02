import { NextRequest, NextResponse } from 'next/server'
import { createPayOSPayment } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const body = await request.json()
    let { userId, tokens } = body
    if (!userId && authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: auth } = await supabaseAdmin.auth.getUser(token)
      userId = auth.user?.id
    }
    if (!userId || !tokens) return NextResponse.json({ error: 'Thiáº¿u tham sá»‘' }, { status: 400 })

    // Server-side price to avoid client tampering
    const PRICE_PER_TOKEN = 500
    const MIN_TOKENS = 30
    const normalizedTokens = Math.max(MIN_TOKENS, parseInt(tokens))
    const amount = normalizedTokens * PRICE_PER_TOKEN

    // Táº¡o orderId riÃªng cho token
    const orderId = `TOKENS_${userId}_${Date.now()}`
    const orderInfo = `Mua ${normalizedTokens} tokens`

    const paymentResponse = await createPayOSPayment({ amount, orderInfo, orderId })
    if (!paymentResponse.checkoutUrl) throw new Error('Táº¡o thanh toÃ¡n tháº¥t báº¡i')

    // LÆ°u order
    const { error } = await supabaseAdmin.from('payment_orders').insert({
      order_id: orderId,
      user_id: userId,
      plan_id: null,
      billing_cycle: null,
      amount,
      status: 'pending',
      payment_url: paymentResponse.checkoutUrl,
      order_info: orderInfo,
      payment_method: 'payos',
      external_order_code: Number(paymentResponse.orderCode),
      tokens_to_add: normalizedTokens
    })
    if (error) {
      console.error('save token order error:', error)
      return NextResponse.json({ error: 'KhÃ´ng lÆ°u Ä‘Æ°á»£c Ä‘Æ¡n hÃ ng. Vui lÃ²ng thá»­ láº¡i.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, paymentUrl: paymentResponse.checkoutUrl, orderId, orderCode: paymentResponse.orderCode })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}



