import { NextRequest, NextResponse } from 'next/server'
import { getPayOSPaymentInfo } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabaseAdmin'
import { APP_URL } from '../../../../../lib/config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderCode = searchParams.get('orderCode')
    const status = searchParams.get('status')

    if (!orderCode) {
      return NextResponse.redirect(
        `${APP_URL}/membership?error=${encodeURIComponent('Thiếu thông tin đơn hàng')}`
      )
    }

    // Lấy thông tin payment từ PayOS
    const paymentInfo = await getPayOSPaymentInfo(parseInt(orderCode))
    
    console.log('=== PayOS Payment Info Structure ===')
    console.log('Payment Info:', JSON.stringify(paymentInfo, null, 2))

    // Kiểm tra trạng thái thanh toán từ PayOS SDK response
    if (paymentInfo.status === 'PAID') {
      // Thanh toán thành công
      console.log('Payment successful:', paymentInfo)
      
      // Tìm payment order từ orderCode (thử kiểu số trước, sau đó chuỗi)
      console.log('[Return] orderCode:', orderCode)
      let { data: paymentOrder, error: orderError } = await supabaseAdmin
        .from('payment_orders')
        .select('*')
        .eq('external_order_code', Number(orderCode))
        .maybeSingle()

      if (orderError || !paymentOrder) {
          console.log('[Return] attempt1 external_order_code(number) not found. err:', orderError)
        const attempt2 = await supabaseAdmin
          .from('payment_orders')
          .select('*')
          .eq('external_order_code', orderCode.toString())
          .maybeSingle()
        paymentOrder = attempt2.data as any
        if (!paymentOrder) {
          console.log('[Return] attempt2 external_order_code(string) not found')
          // Try alternative schema column name 'order_code' if present
          const attempt3 = await supabaseAdmin
            .from('payment_orders')
            .select('*')
            .eq('order_code', orderCode.toString())
            .maybeSingle()
          paymentOrder = attempt3.data as any
        }
        if (!paymentOrder) {
          console.error('Payment order not found for orderCode:', orderCode)
          return NextResponse.redirect(
            `${APP_URL}/membership?error=${encodeURIComponent('Không tìm thấy thông tin đơn hàng')}`
          )
        }
      }
      console.log('[Return] Found order id:', paymentOrder.id, 'status:', paymentOrder.status, 'plan_id:', paymentOrder.plan_id, 'tokens_to_add:', paymentOrder.tokens_to_add)

      // Nếu đã completed thì skip (đã xử lý rồi)
      if (paymentOrder.status === 'completed') {
        console.log('[Return] Order already completed, redirecting...')
        
        // Determine redirect URL based on order type
        if (!paymentOrder.plan_id && paymentOrder.tokens_to_add) {
          return NextResponse.redirect(
            `${APP_URL}/tokens/buy?success=${encodeURIComponent('Thanh toán đã được xử lý thành công!')}`
          )
        } else {
          return NextResponse.redirect(
            `${APP_URL}/membership?success=${encodeURIComponent('Thanh toán đã được xử lý thành công!')}`
          )
        }
      }

      // Sử dụng transaction function để xử lý payment (giống webhook)
      console.log('[Return] Processing payment via transaction function...')
      const { error: transactionError } = await supabaseAdmin.rpc('process_payment_completion', {
        p_order_id: paymentOrder.id,
        p_order_code: orderCode.toString()
      })

      if (transactionError) {
        console.error('[Return] Transaction error:', transactionError)
        return NextResponse.redirect(
          `${APP_URL}/membership?error=${encodeURIComponent('Có lỗi xảy ra khi xử lý thanh toán: ' + transactionError.message)}`
        )
      }

      console.log('[Return] Payment processed successfully')

      // Redirect based on order type
      if (!paymentOrder.plan_id && paymentOrder.tokens_to_add) {
        return NextResponse.redirect(
          `${APP_URL}/tokens/buy?success=${encodeURIComponent(`Thanh toán thành công! Đã cộng ${paymentOrder.tokens_to_add} tokens vào tài khoản.`)}`
        )
      } else {
        // Fetch plan info for success message
        const { data: plan } = await supabaseAdmin
          .from('membership_plans')
          .select('name, tokens_monthly, tokens_yearly')
          .eq('id', paymentOrder.plan_id)
          .single()
        
        const tokensAdded = paymentOrder.billing_cycle === 'monthly' 
          ? plan?.tokens_monthly || 0 
          : plan?.tokens_yearly || 0

        return NextResponse.redirect(
          `${APP_URL}/membership?success=${encodeURIComponent(`Thanh toán thành công! Đã cộng ${tokensAdded} tokens và kích hoạt gói ${plan?.name || ''}.`)}`
        )
      }
    } else {
      // Thanh toán thất bại
      return NextResponse.redirect(
        `${APP_URL}/membership?error=${encodeURIComponent('Thanh toán thất bại')}`
      )
    }

  } catch (error) {
    console.error('Error processing PayOS return:', error)
    return NextResponse.redirect(
      `${APP_URL}/membership?error=${encodeURIComponent('Có lỗi xảy ra khi xử lý thanh toán')}`
    )
  }
}
