import { NextRequest, NextResponse } from 'next/server'
import { createPayOSPayment, getClientIP } from '../../../../../lib/payos'
import { supabaseAdmin } from '../../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId, billingCycle, userId } = body

    if (!planId || !billingCycle || !userId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Lấy thông tin gói membership
    const { data: plan, error: planError } = await supabaseAdmin
      .from('membership_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (planError || !plan) {
      return NextResponse.json(
        { error: 'Không tìm thấy gói membership' },
        { status: 404 }
      )
    }

    // Lấy thông tin user
    const { data: user, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Không tìm thấy thông tin user' },
        { status: 404 }
      )
    }

    // Tính số tiền thanh toán
    const amount = billingCycle === 'monthly' ? plan.price_monthly : plan.price_yearly

    // Tạo order ID duy nhất
    const orderId = `MEMBERSHIP_${userId}_${Date.now()}`

    // Tạo thông tin đơn hàng (tối đa 25 ký tự theo yêu cầu PayOS)
    const orderInfo = `${plan.name} ${billingCycle === 'monthly' ? 'tháng' : 'năm'}`

    // Tạo payment với PayOS (không truyền buyer info theo documentation)
    const paymentResponse = await createPayOSPayment({
      amount,
      orderInfo,
      orderId
    })

    // PayOS SDK trả về trực tiếp payment link object
    if (!paymentResponse.checkoutUrl) {
      throw new Error('Có lỗi xảy ra khi tạo thanh toán')
    }

    // Lưu payment order vào database để track
    const { error: paymentError } = await supabaseAdmin
      .from('payment_orders')
      .insert({
        order_id: orderId,
        user_id: userId,
        plan_id: planId,
        billing_cycle: billingCycle,
        amount,
        status: 'pending',
        payment_url: paymentResponse.checkoutUrl,
        order_info: orderInfo,
        payment_method: 'payos',
        external_order_code: paymentResponse.orderCode.toString()
      })

    if (paymentError) {
      console.error('Error saving payment order:', paymentError)
      return NextResponse.json(
        { error: 'Có lỗi xảy ra khi tạo đơn thanh toán' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResponse.checkoutUrl,
      qrCode: paymentResponse.qrCode,
      orderId,
      amount,
      orderInfo,
      orderCode: paymentResponse.orderCode
    })

  } catch (error) {
    console.error('Error creating PayOS payment:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo thanh toán' },
      { status: 500 }
    )
  }
}
