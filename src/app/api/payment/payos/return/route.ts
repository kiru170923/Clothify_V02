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
    
    console.log('=== PayOS Payment Info Structure ===')
    console.log('Payment Info:', JSON.stringify(paymentInfo, null, 2))

    // Kiểm tra trạng thái thanh toán từ PayOS SDK response
    if (paymentInfo.status === 'PAID') {
      // Thanh toán thành công
      console.log('Payment successful:', paymentInfo)
      
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
      console.log(`Successfully added ${tokensToAdd} tokens for user ${paymentOrder.user_id}`)
      
      // Lấy số token hiện có của người dùng
      const { data: currentUserTokens, error: fetchTokenError } = await supabaseAdmin
        .from('user_tokens')
        .select('total_tokens')
        .eq('user_id', paymentOrder.user_id)
        .single()

      if (fetchTokenError && fetchTokenError.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching current user tokens:', fetchTokenError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?error=${encodeURIComponent('Có lỗi khi lấy thông tin tokens hiện tại')}`
        )
      }

      const currentTotalTokens = currentUserTokens ? currentUserTokens.total_tokens : 0
      const newTotalTokens = currentTotalTokens + tokensToAdd

      const { error: tokenError } = await supabaseAdmin
        .from('user_tokens')
        .upsert({
          user_id: paymentOrder.user_id,
          total_tokens: newTotalTokens,
          used_tokens: 0, // Cần xem xét lại giá trị này, có thể không reset về 0
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

      // Tạo user_memberships record
      const { error: membershipError } = await supabaseAdmin
        .from('user_memberships')
        .insert({
          user_id: paymentOrder.user_id,
          plan_id: paymentOrder.plan_id,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: paymentOrder.billing_cycle === 'monthly' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
            : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 365 days
          billing_cycle: paymentOrder.billing_cycle,
          auto_renew: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (membershipError) {
        console.error('Error creating user membership:', membershipError)
        return NextResponse.redirect(
          `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?error=${encodeURIComponent('Có lỗi khi tạo membership')}`
        )
      }

      console.log(`Successfully added ${tokensToAdd} tokens for user ${paymentOrder.user_id}`)
      console.log(`Successfully created membership for user ${paymentOrder.user_id}`)
      
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/membership?success=${encodeURIComponent(`Thanh toán thành công! Đã cộng ${tokensToAdd} tokens vào tài khoản và kích hoạt gói ${paymentOrder.membership_plans.name}.`)}`
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
