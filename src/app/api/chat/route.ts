import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Bạn là AI Fashion Advisor chuyên nghiệp. Nhiệm vụ của bạn:
          
          1. Tư vấn thời trang và phong cách
          2. Gợi ý cách phối đồ
          3. Đánh giá outfit
          4. Tư vấn về màu sắc, chất liệu
          5. Cập nhật xu hướng thời trang mới nhất
          
          Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp. 
          Nếu user hỏi về sản phẩm Shopee, hãy hướng dẫn họ gửi link sản phẩm để bạn có thể phân tích chi tiết.`
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })

    return NextResponse.json({
      success: true,
      response: response.choices[0].message.content
    })

  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
