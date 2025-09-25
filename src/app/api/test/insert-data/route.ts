import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    // Insert test data
    const testData = [
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/vay-di-tiec-1',
        raw_markdown: '# Váy đi tiệc đẹp\n\n**Giá:** 450,000₫\n\n**Mô tả:** Váy đi tiệc sang trọng, phù hợp cho các dịp đặc biệt',
        raw_html: '<h1>Váy đi tiệc đẹp</h1><p><strong>Giá:</strong> 450,000₫</p>',
        metadata: { title: 'Váy đi tiệc đẹp', description: 'Váy đi tiệc sang trọng' },
        normalized: {
          title: 'Váy đi tiệc đẹp',
          price: 450000,
          description: 'Váy đi tiệc sang trọng, phù hợp cho các dịp đặc biệt',
          colors: ['đen', 'đỏ'],
          sizes: ['S', 'M', 'L']
        },
        price: 450000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/vay-di-tiec-2',
        raw_markdown: '# Váy đi tiệc cao cấp\n\n**Giá:** 650,000₫\n\n**Mô tả:** Váy đi tiệc cao cấp, thiết kế tinh tế',
        raw_html: '<h1>Váy đi tiệc cao cấp</h1><p><strong>Giá:</strong> 650,000₫</p>',
        metadata: { title: 'Váy đi tiệc cao cấp', description: 'Váy đi tiệc cao cấp, thiết kế tinh tế' },
        normalized: {
          title: 'Váy đi tiệc cao cấp',
          price: 650000,
          description: 'Váy đi tiệc cao cấp, thiết kế tinh tế',
          colors: ['xanh', 'hồng'],
          sizes: ['M', 'L', 'XL']
        },
        price: 650000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-1',
        raw_markdown: '# Áo khoác len đẹp\n\n**Giá:** 350,000₫\n\n**Mô tả:** Áo khoác len ấm áp, phù hợp mùa đông',
        raw_html: '<h1>Áo khoác len đẹp</h1><p><strong>Giá:</strong> 350,000₫</p>',
        metadata: { title: 'Áo khoác len đẹp', description: 'Áo khoác len ấm áp, phù hợp mùa đông' },
        normalized: {
          title: 'Áo khoác len đẹp',
          price: 350000,
          description: 'Áo khoác len ấm áp, phù hợp mùa đông',
          colors: ['kem', 'nâu'],
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
