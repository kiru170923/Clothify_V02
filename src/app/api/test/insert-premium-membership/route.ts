import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    console.log('ðŸ” Inserting Premium membership plan...')

    const premiumPlan = {
      id: '4344d556-1116-466f-a8ef-318a63a2e433',
      name: 'Premium',
      description: 'GÃ³i cao cáº¥p cho ngÆ°á»i dÃ¹ng chuyÃªn nghiá»‡p vá»›i Ä‘áº§y Ä‘á»§ tÃ­nh nÄƒng',
      price_monthly: 159000, // 159,000 VND per month
      price_yearly: 1526400, // 1,526,400 VND per year (monthly * 12 * 0.8)
      tokens_monthly: 100, // 100 tokens per month
      tokens_yearly: 1200, // 1200 tokens per year
      features: [
        "100 áº£nh/thÃ¡ng",
        "Cháº¥t lÆ°á»£ng 4K", 
        "Há»— trá»£ 24/7",
        "LÆ°u trá»¯ khÃ´ng giá»›i háº¡n",
        "API access",
        "Æ¯u tiÃªn xá»­ lÃ½",
        "TÃ­nh nÄƒng nÃ¢ng cao"
      ],
      is_active: true
    }

    const { data, error } = await supabaseAdmin
      .from('membership_plans')
      .upsert(premiumPlan, { onConflict: 'id' })
      .select()

    if (error) {
      console.error('âŒ Insert premium membership error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    console.log('âœ… Premium membership plan inserted successfully')
    console.log('ðŸ“Š Data:', data)

    return NextResponse.json({ 
      success: true, 
      message: 'Premium membership plan inserted successfully',
      data: data[0]
    })

  } catch (error: any) {
    console.error('âŒ Premium membership insert error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

