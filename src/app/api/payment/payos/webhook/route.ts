import { NextRequest, NextResponse } from 'next/server'
import { getPayOSPaymentInfo, verifyPayOSWebhook } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // XÃ¡c thá»±c webhook
    if (!verifyPayOSWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const webhookData = JSON.parse(body)
    const { orderCode, status } = webhookData

    console.log('=== PayOS Webhook Received ===')
    console.log('- Order Code:', orderCode)
    console.log('- Status:', status)

    if (status === 'PAID') {
      // Láº¥y thÃ´ng tin payment chi tiáº¿t
      const paymentInfo = await getPayOSPaymentInfo(orderCode)

      if (paymentInfo.code === '00' && paymentInfo.data.code === '00') {
        // Thanh toÃ¡n thÃ nh cÃ´ng
        // 1) TÃ¬m payment order
        const { data: order } = await supabaseAdmin
          .from('payment_orders')
          .select('*')
          .eq('external_order_code', String(orderCode))
          .maybeSingle()

        if (!order) {
          console.warn('Order not found for orderCode:', orderCode)
          return NextResponse.json({ success: true })
        }

        // 2) Náº¿u Ä‘Ã£ completed thÃ¬ bá» qua
        if (order.status === 'completed') {
          return NextResponse.json({ success: true })
        }

        // 3) Cáº­p nháº­t tráº¡ng thÃ¡i
        await supabaseAdmin
          .from('payment_orders')
          .update({ status: 'completed' })
          .eq('id', order.id)

        // 4) Náº¿u lÃ  Ä‘Æ¡n mua tokens -> cá»™ng token
        if (order.tokens_to_add && order.user_id) {
          // TÄƒng total_tokens cho user
          await supabaseAdmin.rpc('increment_user_tokens', { p_user_id: order.user_id, p_tokens: order.tokens_to_add })
        }

        console.log('Payment completed successfully:', paymentInfo.data)
        return NextResponse.json({ success: true })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing PayOS webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

