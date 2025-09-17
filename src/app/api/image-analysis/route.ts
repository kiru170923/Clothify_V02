import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    
    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    console.log('🔍 Analyzing uploaded image:', imageFile.name)

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString('base64')
    const mimeType = imageFile.type

    // Analyze image with GPT-4 Vision
    const analysis = await analyzeImageWithGPT4Vision(base64Image, mimeType)

    return NextResponse.json({
      success: true,
      analysis: analysis
    })

  } catch (error) {
    console.error('Error analyzing image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function analyzeImageWithGPT4Vision(base64Image: string, mimeType: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Bạn là chuyên gia thời trang AI. Hãy phân tích ảnh này và đưa ra đánh giá chi tiết:

1. **MÔ TẢ NGƯỜI/TRANG PHỤC**:
   - Giới tính, tuổi tác (ước đoán)
   - Trang phục hiện tại (áo, quần, giày, phụ kiện)
   - Màu sắc chủ đạo
   - Phong cách thời trang

2. **ĐÁNH GIÁ PHONG CÁCH**:
   - Phong cách hiện tại (casual, formal, sporty, trendy, etc.)
   - Điểm mạnh của outfit
   - Điểm cần cải thiện

3. **GỢI Ý CẢI THIỆN**:
   - 3-5 gợi ý cụ thể để nâng cấp phong cách
   - Màu sắc nên thêm/bớt
   - Phụ kiện phù hợp
   - Kiểu dáng trang phục nên thay đổi

4. **ĐỀ XUẤT SẢN PHẨM**:
   - Nếu là ảnh quần áo: gợi ý cách phối đồ
   - Nếu là ảnh người: đề xuất trang phục phù hợp

Hãy trả lời bằng tiếng Việt, thân thiện và chi tiết.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })

    const analysis = response.choices[0].message.content
    console.log('✅ Image analysis completed')
    
    return analysis

  } catch (error) {
    console.error('❌ GPT-4 Vision error:', error)
    return "Xin lỗi, tôi không thể phân tích ảnh này. Vui lòng thử lại với ảnh khác."
  }
}
