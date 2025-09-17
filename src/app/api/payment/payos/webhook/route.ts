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
        
        // TODO: Tìm payment order trong database
        // TODO: Cập nhật trạng thái thành 'completed'
        // TODO: Tạo membership cho user
        // TODO: Cập nhật tokens cho user
        
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
