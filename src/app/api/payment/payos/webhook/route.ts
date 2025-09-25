import { NextRequest, NextResponse } from 'next/server'
import { getPayOSPaymentInfo, verifyPayOSWebhook } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Xác thực webhook
    if (!verifyPayOSWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const webhookData = JSON.parse(body)
    const { orderCode, status } = webhookData

    console.log('=== PayOS Webhook Received ===')
    console.log('- Order Code:', orderCode)
    console.log('- Status:', status)

    if (status === 'PAID') {
      // Lấy thông tin payment chi tiết
      const paymentInfo = await getPayOSPaymentInfo(orderCode)

      if (paymentInfo.code === '00' && paymentInfo.data.code === '00') {
        // Thanh toán thành công
        // 1) Tìm payment order
        const { data: order } = await supabaseAdmin
          .from('payment_orders')
          .select('*')
          .eq('external_order_code', String(orderCode))
          .maybeSingle()

        if (!order) {
          console.warn('Order not found for orderCode:', orderCode)
          return NextResponse.json({ success: true })
        }

        // 2) Nếu đã completed thì bỏ qua
        if (order.status === 'completed') {
          return NextResponse.json({ success: true })
        }

        // 3) Cập nhật trạng thái
        await supabaseAdmin
          .from('payment_orders')
          .update({ status: 'completed' })
          .eq('id', order.id)

        // 4) Nếu là đơn mua tokens -> cộng token
        if (order.tokens_to_add && order.user_id) {
          // Tăng total_tokens cho user
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
