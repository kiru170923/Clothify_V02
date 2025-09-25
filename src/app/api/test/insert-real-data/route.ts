import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    // Clear existing data first
    await supabaseAdmin.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert real data based on your Twentyfive.vn format
    const realData = [
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/set-ao-khoac-len-5087-kem-ao-gile-len-cao-co-nhe-nhang-don-gian-p39105480.html',
        raw_markdown: '# Set áo khoác len 5087 kèm áo gile len cao cổ nhẹ nhàng đơn giản\n\n**Giá:** 395,000₫\n\n**Mô tả:** Set áo khoác len 5087 kèm áo gile len cao cổ nhẹ nhàng đơn giản',
        raw_html: '<h1>Set áo khoác len 5087</h1><p><strong>Giá:</strong> 395,000₫</p>',
        metadata: { 
          title: 'Set áo khoác len 5087 kèm áo gile len cao cổ nhẹ nhàng đơn giản', 
          description: 'Set áo khoác len 5087 kèm áo gile len cao cổ nhẹ nhàng đơn giản',
          status: 'HẾT HÀNG'
        },
        normalized: {
          title: 'Set áo khoác len 5087 kèm áo gile len cao cổ nhẹ nhàng đơn giản',
          price: 395000,
          description: 'Set áo khoác len 5087 kèm áo gile len cao cổ nhẹ nhàng đơn giản',
          colors: ['Đa dạng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20230921_rBhe9IXwMw.jpeg?v=1695289815'],
          status: 'HẾT HÀNG'
        },
        price: 395000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-6532329-p39118263.html',
        raw_markdown: '# Áo khoác len 6532-329\n\n**Giá:** 329,000₫\n\n**Mô tả:** Áo khoác len 6532-329',
        raw_html: '<h1>Áo khoác len 6532-329</h1><p><strong>Giá:</strong> 329,000₫</p>',
        metadata: { 
          title: 'Áo khoác len 6532-329', 
          description: 'Áo khoác len 6532-329',
          status: 'HẾT HÀNG'
        },
        normalized: {
          title: 'Áo khoác len 6532-329',
          price: 329000,
          description: 'Áo khoác len 6532-329',
          colors: ['Đa dạng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20250109_s3PEtZRDfy.jpeg?v=1736390557'],
          status: 'HẾT HÀNG'
        },
        price: 329000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-6471259-p39117695.html',
        raw_markdown: '# Áo khoác len 6471-259\n\n**Giá:** 259,000₫\n\n**Mô tả:** Áo khoác len 6471-259',
        raw_html: '<h1>Áo khoác len 6471-259</h1><p><strong>Giá:</strong> 259,000₫</p>',
        metadata: { 
          title: 'Áo khoác len 6471-259', 
          description: 'Áo khoác len 6471-259',
          status: 'HẾT HÀNG'
        },
        normalized: {
          title: 'Áo khoác len 6471-259',
          price: 259000,
          description: 'Áo khoác len 6471-259',
          colors: ['Đa dạng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20250109_ULQemubt1W.jpeg?v=1736389978'],
          status: 'HẾT HÀNG'
        },
        price: 259000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-cardigan-dai-tay-6432-dieu-da-nhe-nhang-289-p39116995.html',
        raw_markdown: '# Áo khoác len cardigan dài tay 6432 điệu đà nhẹ nhàng -289\n\n**Giá:** 289,000₫\n\n**Mô tả:** Áo khoác len cardigan dài tay 6432 điệu đà nhẹ nhàng',
        raw_html: '<h1>Áo khoác len cardigan dài tay 6432</h1><p><strong>Giá:</strong> 289,000₫</p>',
        metadata: { 
          title: 'Áo khoác len cardigan dài tay 6432 điệu đà nhẹ nhàng -289', 
          description: 'Áo khoác len cardigan dài tay 6432 điệu đà nhẹ nhàng',
          status: 'CÒN HÀNG'
        },
        normalized: {
          title: 'Áo khoác len cardigan dài tay 6432 điệu đà nhẹ nhàng -289',
          price: 289000,
          description: 'Áo khoác len cardigan dài tay 6432 điệu đà nhẹ nhàng',
          colors: ['Đa dạng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20250109_fRhJIdZIME.jpeg?v=1736390637'],
          status: 'CÒN HÀNG'
        },
        price: 289000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-6381269-p39116450.html',
        raw_markdown: '# Áo khoác len 6381-269\n\n**Giá:** 269,000₫\n\n**Mô tả:** Áo khoác len 6381-269',
        raw_html: '<h1>Áo khoác len 6381-269</h1><p><strong>Giá:</strong> 269,000₫</p>',
        metadata: { 
          title: 'Áo khoác len 6381-269', 
          description: 'Áo khoác len 6381-269',
          status: 'CÒN HÀNG'
        },
        normalized: {
          title: 'Áo khoác len 6381-269',
          price: 269000,
          description: 'Áo khoác len 6381-269',
          colors: ['Đa dạng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20241031_qe55MEDmVS.jpeg?v=1730369914'],
          status: 'CÒN HÀNG'
        },
        price: 269000
      }
    ]

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(realData)

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Real Twentyfive.vn data inserted successfully',
      count: realData.length
    })

  } catch (error: any) {
    console.error('Real data insert error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
