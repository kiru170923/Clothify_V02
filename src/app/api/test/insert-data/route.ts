import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    // Insert test data
    const testData = [
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/vay-di-tiec-1',
        raw_markdown: '# VÃ¡y Ä‘i tiá»‡c Ä‘áº¹p\n\n**GiÃ¡:** 450,000â‚«\n\n**MÃ´ táº£:** VÃ¡y Ä‘i tiá»‡c sang trá»ng, phÃ¹ há»£p cho cÃ¡c dá»‹p Ä‘áº·c biá»‡t',
        raw_html: '<h1>VÃ¡y Ä‘i tiá»‡c Ä‘áº¹p</h1><p><strong>GiÃ¡:</strong> 450,000â‚«</p>',
        metadata: { title: 'VÃ¡y Ä‘i tiá»‡c Ä‘áº¹p', description: 'VÃ¡y Ä‘i tiá»‡c sang trá»ng' },
        normalized: {
          title: 'VÃ¡y Ä‘i tiá»‡c Ä‘áº¹p',
          price: 450000,
          description: 'VÃ¡y Ä‘i tiá»‡c sang trá»ng, phÃ¹ há»£p cho cÃ¡c dá»‹p Ä‘áº·c biá»‡t',
          colors: ['Ä‘en', 'Ä‘á»'],
          sizes: ['S', 'M', 'L']
        },
        price: 450000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/vay-di-tiec-2',
        raw_markdown: '# VÃ¡y Ä‘i tiá»‡c cao cáº¥p\n\n**GiÃ¡:** 650,000â‚«\n\n**MÃ´ táº£:** VÃ¡y Ä‘i tiá»‡c cao cáº¥p, thiáº¿t káº¿ tinh táº¿',
        raw_html: '<h1>VÃ¡y Ä‘i tiá»‡c cao cáº¥p</h1><p><strong>GiÃ¡:</strong> 650,000â‚«</p>',
        metadata: { title: 'VÃ¡y Ä‘i tiá»‡c cao cáº¥p', description: 'VÃ¡y Ä‘i tiá»‡c cao cáº¥p, thiáº¿t káº¿ tinh táº¿' },
        normalized: {
          title: 'VÃ¡y Ä‘i tiá»‡c cao cáº¥p',
          price: 650000,
          description: 'VÃ¡y Ä‘i tiá»‡c cao cáº¥p, thiáº¿t káº¿ tinh táº¿',
          colors: ['xanh', 'há»“ng'],
          sizes: ['M', 'L', 'XL']
        },
        price: 650000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-1',
        raw_markdown: '# Ão khoÃ¡c len Ä‘áº¹p\n\n**GiÃ¡:** 350,000â‚«\n\n**MÃ´ táº£:** Ão khoÃ¡c len áº¥m Ã¡p, phÃ¹ há»£p mÃ¹a Ä‘Ã´ng',
        raw_html: '<h1>Ão khoÃ¡c len Ä‘áº¹p</h1><p><strong>GiÃ¡:</strong> 350,000â‚«</p>',
        metadata: { title: 'Ão khoÃ¡c len Ä‘áº¹p', description: 'Ão khoÃ¡c len áº¥m Ã¡p, phÃ¹ há»£p mÃ¹a Ä‘Ã´ng' },
        normalized: {
          title: 'Ão khoÃ¡c len Ä‘áº¹p',
          price: 350000,
          description: 'Ão khoÃ¡c len áº¥m Ã¡p, phÃ¹ há»£p mÃ¹a Ä‘Ã´ng',
          colors: ['kem', 'nÃ¢u'],
          sizes: ['S', 'M', 'L']
        },
        price: 350000
      }
    ]

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(testData)

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Test data inserted successfully',
      count: 3
    })

  } catch (error: any) {
    console.error('Test data insert error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

