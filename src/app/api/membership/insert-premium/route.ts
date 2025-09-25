import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Inserting Premium membership plan...')
    
    const premiumPlan = {
      id: '4344d556-1116-466f-a8ef-318a63a2e433',
      name: 'Premium',
      description: 'Gói cao cấp cho người dùng chuyên nghiệp với nhiều tính năng độc quyền',
      price_monthly: 159000,
      price_yearly: 1526400,
      tokens_monthly: 100,
      tokens_yearly: 1200,
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
      .upsert(premiumPlan, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('❌ Error inserting Premium plan:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    console.log('✅ Premium membership plan inserted successfully')
    console.log('📊 Plan data:', data)

    return NextResponse.json({
      success: true,
      message: 'Premium membership plan inserted successfully',
      data: data[0]
    })

  } catch (error: any) {
    console.error('❌ Insert Premium plan error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
