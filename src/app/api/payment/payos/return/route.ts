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
        `${APP_URL}/membership?error=${encodeURIComponent('Thiáº¿u thÃ´ng tin Ä‘Æ¡n hÃ ng')}`
      )
    }

    // Láº¥y thÃ´ng tin payment tá»« PayOS
    const paymentInfo = await getPayOSPaymentInfo(parseInt(orderCode))
    
    console.log('=== PayOS Payment Info Structure ===')
    console.log('Payment Info:', JSON.stringify(paymentInfo, null, 2))

    // Kiá»ƒm tra tráº¡ng thÃ¡i thanh toÃ¡n tá»« PayOS SDK response
    if (paymentInfo.status === 'PAID') {
      // Thanh toÃ¡n thÃ nh cÃ´ng
      console.log('Payment successful:', paymentInfo)
      
      // TÃ¬m payment order tá»« orderCode (thá»­ kiá»ƒu sá»‘ trÆ°á»›c, sau Ä‘Ã³ chuá»—i)
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
            `${APP_URL}/membership?error=${encodeURIComponent('KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin Ä‘Æ¡n hÃ ng')}`
          )
        }
      }
      console.log('[Return] Found order id:', paymentOrder.id, 'status:', paymentOrder.status, 'plan_id:', paymentOrder.plan_id, 'tokens_to_add:', paymentOrder.tokens_to_add)

      // Náº¿u Ä‘Ã£ completed thÃ¬ bá» qua xá»­ lÃ½ tiáº¿p
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

      // PhÃ¢n nhÃ¡nh: náº¿u lÃ  Ä‘Æ¡n mua token (plan_id null vÃ  cÃ³ tokens_to_add)
      if (!paymentOrder.plan_id && paymentOrder.tokens_to_add) {
        // Cá»™ng tokens báº±ng RPC (náº¿u cÃ³)
        try {
          await supabaseAdmin.rpc('increment_user_tokens', { p_user_id: paymentOrder.user_id, p_tokens: paymentOrder.tokens_to_add })
        } catch (e) {
          // fallback cá»™ng thá»§ cÃ´ng
          const { data: cur } = await supabaseAdmin.from('user_tokens').select('total_tokens').eq('user_id', paymentOrder.user_id).maybeSingle()
          const total = (cur?.total_tokens || 0) + paymentOrder.tokens_to_add
          await supabaseAdmin.from('user_tokens').upsert({ user_id: paymentOrder.user_id, total_tokens: total }, { onConflict: 'user_id' })
        }
        return NextResponse.redirect(
          `${APP_URL}/tokens/buy?success=${encodeURIComponent(`Thanh toÃ¡n thÃ nh cÃ´ng! ÄÃ£ cá»™ng ${paymentOrder.tokens_to_add} tokens vÃ o tÃ i khoáº£n.`)}`
        )
      }

      // NgÆ°á»£c láº¡i: Ä‘Æ¡n membership (giá»¯ logic cÅ©, nhÆ°ng fetch plan riÃªng)
      const { data: plan } = await supabaseAdmin.from('membership_plans').select('*').eq('id', paymentOrder.plan_id).maybeSingle()
      const tokensToAdd = paymentOrder.billing_cycle === 'monthly' ? plan?.tokens_monthly || 0 : plan?.tokens_yearly || 0
      await supabaseAdmin.rpc('increment_user_tokens', { p_user_id: paymentOrder.user_id, p_tokens: tokensToAdd })
      return NextResponse.redirect(
        `${APP_URL}/membership?success=${encodeURIComponent(`Thanh toÃ¡n thÃ nh cÃ´ng! ÄÃ£ cá»™ng ${tokensToAdd} tokens vÃ  kÃ­ch hoáº¡t gÃ³i ${plan?.name || ''}.`)}`
      )
    } else {
      // Thanh toÃ¡n tháº¥t báº¡i
      return NextResponse.redirect(
        `${APP_URL}/membership?error=${encodeURIComponent('Thanh toÃ¡n tháº¥t báº¡i')}`
      )
    }

  } catch (error) {
    console.error('Error processing PayOS return:', error)
    return NextResponse.redirect(
      `${APP_URL}/membership?error=${encodeURIComponent('CÃ³ lá»—i xáº£y ra khi xá»­ lÃ½ thanh toÃ¡n')}`
    )
  }
}

