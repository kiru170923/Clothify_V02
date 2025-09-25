import { NextRequest, NextResponse } from 'next/server'
import { createPayOSPayment } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabase'

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
    if (!userId || !tokens) return NextResponse.json({ error: 'Thiếu tham số' }, { status: 400 })

    // Server-side price to avoid client tampering
    const PRICE_PER_TOKEN = 500
    const MIN_TOKENS = 30
    const normalizedTokens = Math.max(MIN_TOKENS, parseInt(tokens))
    const amount = normalizedTokens * PRICE_PER_TOKEN

    // Tạo orderId riêng cho token
    const orderId = `TOKENS_${userId}_${Date.now()}`
    const orderInfo = `Mua ${normalizedTokens} tokens`

    const paymentResponse = await createPayOSPayment({ amount, orderInfo, orderId })
    if (!paymentResponse.checkoutUrl) throw new Error('Tạo thanh toán thất bại')

    // Lưu order
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
      return NextResponse.json({ error: 'Không lưu được đơn hàng. Vui lòng thử lại.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, paymentUrl: paymentResponse.checkoutUrl, orderId, orderCode: paymentResponse.orderCode })
  } catch (e:any) {
    console.error(e)
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}


