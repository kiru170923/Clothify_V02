import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(req: NextRequest) {
  try {
    // Clear existing data first
    await supabaseAdmin.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert real data based on your Twentyfive.vn format
    const realData = [
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/set-ao-khoac-len-5087-kem-ao-gile-len-cao-co-nhe-nhang-don-gian-p39105480.html',
        raw_markdown: '# Set Ã¡o khoÃ¡c len 5087 kÃ¨m Ã¡o gile len cao cá»• nháº¹ nhÃ ng Ä‘Æ¡n giáº£n\n\n**GiÃ¡:** 395,000â‚«\n\n**MÃ´ táº£:** Set Ã¡o khoÃ¡c len 5087 kÃ¨m Ã¡o gile len cao cá»• nháº¹ nhÃ ng Ä‘Æ¡n giáº£n',
        raw_html: '<h1>Set Ã¡o khoÃ¡c len 5087</h1><p><strong>GiÃ¡:</strong> 395,000â‚«</p>',
        metadata: { 
          title: 'Set Ã¡o khoÃ¡c len 5087 kÃ¨m Ã¡o gile len cao cá»• nháº¹ nhÃ ng Ä‘Æ¡n giáº£n', 
          description: 'Set Ã¡o khoÃ¡c len 5087 kÃ¨m Ã¡o gile len cao cá»• nháº¹ nhÃ ng Ä‘Æ¡n giáº£n',
          status: 'Háº¾T HÃ€NG'
        },
        normalized: {
          title: 'Set Ã¡o khoÃ¡c len 5087 kÃ¨m Ã¡o gile len cao cá»• nháº¹ nhÃ ng Ä‘Æ¡n giáº£n',
          price: 395000,
          description: 'Set Ã¡o khoÃ¡c len 5087 kÃ¨m Ã¡o gile len cao cá»• nháº¹ nhÃ ng Ä‘Æ¡n giáº£n',
          colors: ['Äa dáº¡ng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20230921_rBhe9IXwMw.jpeg?v=1695289815'],
          status: 'Háº¾T HÃ€NG'
        },
        price: 395000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-6532329-p39118263.html',
        raw_markdown: '# Ão khoÃ¡c len 6532-329\n\n**GiÃ¡:** 329,000â‚«\n\n**MÃ´ táº£:** Ão khoÃ¡c len 6532-329',
        raw_html: '<h1>Ão khoÃ¡c len 6532-329</h1><p><strong>GiÃ¡:</strong> 329,000â‚«</p>',
        metadata: { 
          title: 'Ão khoÃ¡c len 6532-329', 
          description: 'Ão khoÃ¡c len 6532-329',
          status: 'Háº¾T HÃ€NG'
        },
        normalized: {
          title: 'Ão khoÃ¡c len 6532-329',
          price: 329000,
          description: 'Ão khoÃ¡c len 6532-329',
          colors: ['Äa dáº¡ng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20250109_s3PEtZRDfy.jpeg?v=1736390557'],
          status: 'Háº¾T HÃ€NG'
        },
        price: 329000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-6471259-p39117695.html',
        raw_markdown: '# Ão khoÃ¡c len 6471-259\n\n**GiÃ¡:** 259,000â‚«\n\n**MÃ´ táº£:** Ão khoÃ¡c len 6471-259',
        raw_html: '<h1>Ão khoÃ¡c len 6471-259</h1><p><strong>GiÃ¡:</strong> 259,000â‚«</p>',
        metadata: { 
          title: 'Ão khoÃ¡c len 6471-259', 
          description: 'Ão khoÃ¡c len 6471-259',
          status: 'Háº¾T HÃ€NG'
        },
        normalized: {
          title: 'Ão khoÃ¡c len 6471-259',
          price: 259000,
          description: 'Ão khoÃ¡c len 6471-259',
          colors: ['Äa dáº¡ng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20250109_ULQemubt1W.jpeg?v=1736389978'],
          status: 'Háº¾T HÃ€NG'
        },
        price: 259000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-cardigan-dai-tay-6432-dieu-da-nhe-nhang-289-p39116995.html',
        raw_markdown: '# Ão khoÃ¡c len cardigan dÃ i tay 6432 Ä‘iá»‡u Ä‘Ã  nháº¹ nhÃ ng -289\n\n**GiÃ¡:** 289,000â‚«\n\n**MÃ´ táº£:** Ão khoÃ¡c len cardigan dÃ i tay 6432 Ä‘iá»‡u Ä‘Ã  nháº¹ nhÃ ng',
        raw_html: '<h1>Ão khoÃ¡c len cardigan dÃ i tay 6432</h1><p><strong>GiÃ¡:</strong> 289,000â‚«</p>',
        metadata: { 
          title: 'Ão khoÃ¡c len cardigan dÃ i tay 6432 Ä‘iá»‡u Ä‘Ã  nháº¹ nhÃ ng -289', 
          description: 'Ão khoÃ¡c len cardigan dÃ i tay 6432 Ä‘iá»‡u Ä‘Ã  nháº¹ nhÃ ng',
          status: 'CÃ’N HÃ€NG'
        },
        normalized: {
          title: 'Ão khoÃ¡c len cardigan dÃ i tay 6432 Ä‘iá»‡u Ä‘Ã  nháº¹ nhÃ ng -289',
          price: 289000,
          description: 'Ão khoÃ¡c len cardigan dÃ i tay 6432 Ä‘iá»‡u Ä‘Ã  nháº¹ nhÃ ng',
          colors: ['Äa dáº¡ng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20250109_fRhJIdZIME.jpeg?v=1736390637'],
          status: 'CÃ’N HÃ€NG'
        },
        price: 289000
      },
      {
        source_site: 'twentyfive.vn',
        source_url: 'https://twentyfive.vn/ao-khoac-len-6381269-p39116450.html',
        raw_markdown: '# Ão khoÃ¡c len 6381-269\n\n**GiÃ¡:** 269,000â‚«\n\n**MÃ´ táº£:** Ão khoÃ¡c len 6381-269',
        raw_html: '<h1>Ão khoÃ¡c len 6381-269</h1><p><strong>GiÃ¡:</strong> 269,000â‚«</p>',
        metadata: { 
          title: 'Ão khoÃ¡c len 6381-269', 
          description: 'Ão khoÃ¡c len 6381-269',
          status: 'CÃ’N HÃ€NG'
        },
        normalized: {
          title: 'Ão khoÃ¡c len 6381-269',
          price: 269000,
          description: 'Ão khoÃ¡c len 6381-269',
          colors: ['Äa dáº¡ng'],
          sizes: ['S', 'M', 'L'],
          images: ['https://pos.nvncdn.com/b153ea-53436/ps/20241031_qe55MEDmVS.jpeg?v=1730369914'],
          status: 'CÃ’N HÃ€NG'
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

