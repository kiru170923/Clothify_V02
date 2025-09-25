import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Inserting Premium membership plan...')

    const premiumPlan = {
      id: '4344d556-1116-466f-a8ef-318a63a2e433',
      name: 'Premium',
      description: 'Gói cao cấp cho người dùng chuyên nghiệp với đầy đủ tính năng',
      price_monthly: 159000, // 159,000 VND per month
      price_yearly: 1526400, // 1,526,400 VND per year (monthly * 12 * 0.8)
      tokens_monthly: 100, // 100 tokens per month
      tokens_yearly: 1200, // 1200 tokens per year
      features: [
        "100 ảnh/tháng",
        "Chất lượng 4K", 
        "Hỗ trợ 24/7",
        "Lưu trữ không giới hạn",
        "API access",
        "Ưu tiên xử lý",
        "Tính năng nâng cao"
      ],
      is_active: true
    }

    const { data, error } = await supabaseAdmin
      .from('membership_plans')
      .upsert(premiumPlan, { onConflict: 'id' })
      .select()

    if (error) {
      console.error('❌ Insert premium membership error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    console.log('✅ Premium membership plan inserted successfully')
    console.log('📊 Data:', data)

    return NextResponse.json({ 
      success: true, 
      message: 'Premium membership plan inserted successfully',
      data: data[0]
    })

  } catch (error: any) {
    console.error('❌ Premium membership insert error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
