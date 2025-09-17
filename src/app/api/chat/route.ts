import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Build messages array with context
    const messages = [
      {
        role: "system",
        content: `Bạn là AI Fashion Advisor chuyên nghiệp. Nhiệm vụ của bạn:
        
        1. Tư vấn thời trang và phong cách
        2. Gợi ý cách phối đồ
        3. Đánh giá outfit
        4. Tư vấn về màu sắc, chất liệu
        5. Cập nhật xu hướng thời trang mới nhất
        
        Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp. 
        Nếu user hỏi về sản phẩm Shopee, hãy hướng dẫn họ gửi link sản phẩm để bạn có thể phân tích chi tiết.
        
        Hãy nhớ context của cuộc hội thoại trước đó để trả lời phù hợp và liên kết với các câu hỏi trước.`
      }
    ]

    // Add conversation context if provided
    if (context && Array.isArray(context)) {
      messages.push(...context)
    }

    // Add current message
    messages.push({
      role: "user",
      content: message
    })

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Use cheaper model for better performance
      messages: messages as any,
      max_tokens: 300, // Reduced tokens for optimization
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
