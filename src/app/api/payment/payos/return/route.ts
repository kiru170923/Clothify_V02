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

      // Nếu đã completed thì bỏ qua xử lý tiếp
      if (paymentOrder.status !== 'completed') {
        const { error: updateOrderError } = await supabaseAdmin
          .from('payment_orders')
          .update({ 
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentOrder.id)

        if (updateOrderError) {
          console.error('Error updating payment order:', updateOrderError)
        }
      }

      // updateOrderError is scoped inside the block above; no extra logging here

      // Phân nhánh: nếu là đơn mua token (plan_id null và có tokens_to_add)
      if (!paymentOrder.plan_id && paymentOrder.tokens_to_add) {
        // Cộng tokens bằng RPC (nếu có)
        try {
          await supabaseAdmin.rpc('increment_user_tokens', { p_user_id: paymentOrder.user_id, p_tokens: paymentOrder.tokens_to_add })
        } catch (e) {
          // fallback cộng thủ công
          const { data: cur } = await supabaseAdmin.from('user_tokens').select('total_tokens').eq('user_id', paymentOrder.user_id).maybeSingle()
          const total = (cur?.total_tokens || 0) + paymentOrder.tokens_to_add
          await supabaseAdmin.from('user_tokens').upsert({ user_id: paymentOrder.user_id, total_tokens: total }, { onConflict: 'user_id' })
        }
        return NextResponse.redirect(
          `${APP_URL}/tokens/buy?success=${encodeURIComponent(`Thanh toán thành công! Đã cộng ${paymentOrder.tokens_to_add} tokens vào tài khoản.`)}`
        )
      }

      // Ngược lại: đơn membership (giữ logic cũ, nhưng fetch plan riêng)
      const { data: plan } = await supabaseAdmin.from('membership_plans').select('*').eq('id', paymentOrder.plan_id).maybeSingle()
      const tokensToAdd = paymentOrder.billing_cycle === 'monthly' ? plan?.tokens_monthly || 0 : plan?.tokens_yearly || 0
      // Cộng tokens cho user
      await supabaseAdmin.rpc('increment_user_tokens', { p_user_id: paymentOrder.user_id, p_tokens: tokensToAdd })
      
      // **FIX CHÍNH**: Tạo/update user membership plan
      const endDate = new Date()
      if (paymentOrder.billing_cycle === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1)
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1)
      }
      
      // Tắt membership cũ (nếu có)
      await supabaseAdmin
        .from('user_memberships')
        .update({ status: 'expired' })
        .eq('user_id', paymentOrder.user_id)
        .eq('status', 'active')
      
      // Tạo membership mới
      const { error: membershipError } = await supabaseAdmin
        .from('user_memberships')
        .insert({
          user_id: paymentOrder.user_id,
          plan_id: paymentOrder.plan_id,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          billing_cycle: paymentOrder.billing_cycle,
          auto_renew: false
        })
      
      if (membershipError) {
        console.error('Error creating user membership:', membershipError)
      }
      return NextResponse.redirect(
        `${APP_URL}/membership?success=${encodeURIComponent(`Thanh toán thành công! Đã cộng ${tokensToAdd} tokens và kích hoạt gói ${plan?.name || ''}.`)}`
      )
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
