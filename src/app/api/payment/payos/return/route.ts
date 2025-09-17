import { NextRequest, NextResponse } from 'next/server'
import { getPayOSPaymentInfo } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderCode = searchParams.get('orderCode')
    const status = searchParams.get('status')

    if (!orderCode) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?error=${encodeURIComponent('Thiếu thông tin đơn hàng')}`
      )
    }

    // Lấy thông tin payment từ PayOS
    const paymentInfo = await getPayOSPaymentInfo(parseInt(orderCode))

    if (paymentInfo.code !== '00') {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?error=${encodeURIComponent('Không thể xác thực thanh toán')}`
      )
    }

    // Kiểm tra trạng thái thanh toán
    if (paymentInfo.data.code === '00') {
      // Thanh toán thành công
      console.log('Payment successful:', paymentInfo.data)
      
      // Tìm payment order từ orderCode
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
        .eq('external_order_code', orderCode.toString())
        .single()

      if (orderError || !paymentOrder) {
        console.error('Payment order not found:', orderError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?error=${encodeURIComponent('Không tìm thấy thông tin đơn hàng')}`
        )
      }

      // Cập nhật trạng thái payment order
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

      // Tính số tokens cần cộng
      const tokensToAdd = paymentOrder.billing_cycle === 'monthly' 
        ? paymentOrder.membership_plans.tokens_monthly 
        : paymentOrder.membership_plans.tokens_yearly

      // Cộng tokens cho user (sử dụng schema hiện tại)
      const { error: tokenError } = await supabaseAdmin
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

      if (tokenError) {
        console.error('Error updating user tokens:', tokenError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?error=${encodeURIComponent('Có lỗi khi cập nhật tokens')}`
        )
      }

      console.log(`Successfully added ${tokensToAdd} tokens for user ${paymentOrder.user_id}`)
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?success=${encodeURIComponent(`Thanh toán thành công! Đã cộng ${tokensToAdd} tokens vào tài khoản.`)}`
      )
    } else {
      // Thanh toán thất bại
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?error=${encodeURIComponent('Thanh toán thất bại')}`
      )
    }

  } catch (error) {
    console.error('Error processing PayOS return:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?error=${encodeURIComponent('Có lỗi xảy ra khi xử lý thanh toán')}`
    )
  }
}
