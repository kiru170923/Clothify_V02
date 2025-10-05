import { NextRequest, NextResponse } from 'next/server'
import { getPayOSPaymentInfo, verifyPayOSWebhook } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')

    if (!signature) {
      console.error('Missing webhook signature')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Xác thực webhook
    if (!verifyPayOSWebhook(body, signature)) {
      console.error('Invalid webhook signature:', signature)
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

        // 2) Kiểm tra trùng lặp - nếu đã completed thì bỏ qua
        if (order.status === 'completed') {
          console.log('Order already completed:', orderCode)
          return NextResponse.json({ success: true })
        }

        // 3) Sử dụng transaction để đảm bảo atomicity
        const { error: transactionError } = await supabaseAdmin.rpc('process_payment_completion', {
          p_order_id: order.id,
          p_order_code: orderCode.toString()
        })

        if (transactionError) {
          console.error('Transaction error:', transactionError)
          return NextResponse.json({ error: 'Transaction failed' }, { status: 500 })
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