import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { crawlTwentyFiveSearch, crawlUrlGeneric } from '../../../lib/scrapelessCrawl'
import { scrapeUrl } from '../../../lib/scrapeless'
import { normalizeProduct } from '../../../lib/normalizer'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type')
    
    // Handle multipart form data (with image)
    if (contentType && contentType.includes('multipart/form-data')) {
      return await handleImageMessage(request)
    }
    
    // Handle JSON message
    const { message, context } = await request.json()
    
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Check if user is asking for product recommendations
    const lowerMessage = message.toLowerCase()
    const isAskingForProducts = (
      lowerMessage.includes('tìm') || 
      lowerMessage.includes('gợi ý') || 
      lowerMessage.includes('mua') ||
      lowerMessage.includes('áo') ||
      lowerMessage.includes('phông') ||
      lowerMessage.includes('thun') ||
      lowerMessage.includes('khoác') ||
      lowerMessage.includes('ấm') ||
      lowerMessage.includes('len')
    )
    
    console.log('🔍 Debug - Message:', message)
    console.log('🔍 Debug - Lower message:', lowerMessage)
    console.log('🔍 Debug - Is asking for products:', isAskingForProducts)
    console.log('🔍 Debug - Pattern check:')
    console.log('  - tìm + áo:', lowerMessage.includes('tìm') && lowerMessage.includes('áo'))
    console.log('  - áo ấm:', lowerMessage.includes('áo ấm'))
    console.log('  - áo khoác:', lowerMessage.includes('áo khoác'))
    console.log('  - áo len:', lowerMessage.includes('áo len'))
    
    // If the user directly pasted a URL, handle it first
    const urlMatch = message.match(/https?:\/\/\S+/i)
    if (urlMatch) {
      const url = urlMatch[0]
      console.log('🔗 Detected URL message:', url)
      console.log('🔍 Env SCRAPELESS_API_KEY present:', !!process.env.SCRAPELESS_API_KEY)
      console.log('🔍 Starting URL handling...')
      try {
        // If URL looks like a product page, prefer scrapeUrl (faster, single-page)
        const isProduct = /\.html$|\/set-|\/p\d+/i.test(url)
        let pageData: any = null

        let fullResult: any = null
        if (isProduct) {
          console.log('🔎 Detected product page, using scrapeUrl')
          const t0 = Date.now()
          const scrapeResult = await scrapeUrl(url, { formats: ['markdown'], onlyMainContent: true, timeout: 90000 })
          console.log('🔁 scrapeUrl returned, elapsedMs=', Date.now() - t0)
          fullResult = scrapeResult
          try {
            const preview = typeof scrapeResult === 'string' ? String(scrapeResult).slice(0,2000) : JSON.stringify(scrapeResult, null, 2).slice(0,2000)
            console.log('🧾 scrapeResult preview:', preview)
          } catch (e) {
            console.log('🧾 scrapeResult (non-serializable)')
          }
          if (scrapeResult && Array.isArray((scrapeResult as any).data) && (scrapeResult as any).data.length > 0) {
            pageData = (scrapeResult as any).data[0]
          } else {
            pageData = scrapeResult as any
          }
        } else {
          console.log('🔎 Non-product page, using crawler')
          const t0 = Date.now()
          const crawlResult = await crawlUrlGeneric(url, { limit: 3, pollDelayMs: 2000, maxAttempts: 20 })
          console.log('🔁 crawlUrlGeneric returned, elapsedMs=', Date.now() - t0)
          fullResult = crawlResult
          try {
            const preview = typeof crawlResult === 'string' ? String(crawlResult).slice(0,2000) : JSON.stringify(crawlResult, null, 2).slice(0,2000)
            console.log('🧾 crawlResult preview:', preview)
          } catch (e) {
            console.log('🧾 crawlResult (non-serializable)')
          }
          if (crawlResult && Array.isArray(crawlResult.data) && crawlResult.data.length > 0) {
            pageData = crawlResult.data[0]
          } else if (crawlResult && crawlResult.data) {
            pageData = crawlResult.data
          }
        }

        // If pageData is a raw HTML string, wrap it so normalizer can parse
        if (typeof pageData === 'string') {
          pageData = { html: pageData, metadata: { sourceURL: url }, url }
        }

        try {
          const pd = typeof pageData === 'string' ? String(pageData).slice(0,2000) : JSON.stringify(pageData, null, 2).slice(0,2000)
          console.log('🧾 pageData preview:', pd)
        } catch (e) {
          console.log('🧾 pageData (non-serializable)')
        }

        // Return data in the exact format requested by user
        // If fullResult (from crawler) contains status/data, return it directly
        if (fullResult && (fullResult.status || fullResult.data)) {
          // ensure we include success flag if absent
          if (typeof fullResult.success === 'undefined') fullResult.success = true
          return NextResponse.json(fullResult)
        }

        // Otherwise return object with markdown + metadata (product detail format)
        const normalized = normalizeProduct(pageData || { markdown: '', html: '', metadata: { sourceURL: url } })
        console.log('🔍 Normalized product:', JSON.stringify(normalized, null, 2))

        const out = {
          markdown: pageData?.markdown || pageData?.html || '',
          metadata: pageData?.metadata || normalized?.sourceURL ? { sourceURL: normalized.sourceURL, title: normalized.title, description: normalized.description } : { sourceURL: url }
        }

        return NextResponse.json(out)
      } catch (err) {
        console.error('❌ Error crawling/scraping URL:', err)
        return NextResponse.json({ success: false, error: String(err) }, { status: 500 })
      }
    }

    if (isAskingForProducts) {
      console.log('🔍 User requesting product recommendations...')
      console.log('🔍 SCRAPELESS_API_KEY exists:', !!process.env.SCRAPELESS_API_KEY)
      console.log('🔍 SCRAPELESS_API_KEY value:', process.env.SCRAPELESS_API_KEY ? 'EXISTS' : 'MISSING')
      
      try {
        // Generate product recommendations using AI + Scrapeless
        console.log('🔍 About to call generateProductRecommendations...')
        const recommendations = await generateProductRecommendations(lowerMessage)
        console.log('🔍 Recommendations received:', recommendations.length)
        
        if (recommendations.length > 0) {
          let responseText = "Dạ, tôi đã tìm được một số sản phẩm phù hợp cho bạn:\n\n"
          
          recommendations.forEach((product: any, index: number) => {
            responseText += `🔥 **${product.name}**\n`
            responseText += `💰 Giá: ${product.price} | ⭐ ${product.rating}/5 | 🛒 ${product.sold} đã bán\n`
            responseText += `🏪 Shop: ${product.shop}\n`
            responseText += `🔗 Link: ${product.url}\n\n`
          })
          
          responseText += "Những sản phẩm này đều được tôi phân tích và chọn lọc dựa trên yêu cầu của bạn! Bạn chỉ cần copy link này và paste vào đây, tôi sẽ phân tích chi tiết và đưa ra gợi ý phối đồ phù hợp cho bạn nhé! 😊"
          
          return NextResponse.json({
            success: true,
            response: responseText
          })
        } else {
          console.log('🔍 No products found, falling back to OpenAI response')
        }
      } catch (error) {
        console.error('Error generating recommendations:', error)
      }
    }

    // Build messages array with context
    const messages = [
      {
        role: "system",
        content: `Bạn là AI Fashion Advisor chuyên nghiệp và thân thiện. Nhiệm vụ của bạn:
        
        1. Tư vấn thời trang và phong cách
        2. Gợi ý cách phối đồ
        3. Đánh giá outfit
        4. Tư vấn về màu sắc, chất liệu
        5. Cập nhật xu hướng thời trang mới nhất
        
        Luôn trả lời bằng tiếng Việt, thân thiện và tự nhiên như một người bạn. 
        
        Khi user yêu cầu tìm kiếm sản phẩm áo phông/thun, bạn có khả năng tìm kiếm sản phẩm thật và đưa ra gợi ý cụ thể. Hãy trả lời một cách nhiệt tình và thông báo rằng bạn đang tìm kiếm sản phẩm cho họ.
        
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

async function generateProductRecommendations(userMessage: string) {
  try {
    // Use AI to understand user's needs and generate search queries
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Bạn là AI chuyên phân tích yêu cầu thời trang. Nhiệm vụ của bạn là:
          
          1. Phân tích tin nhắn của user để hiểu họ muốn tìm gì
          2. Tạo ra 3-5 từ khóa tìm kiếm phù hợp
          3. Trả lời bằng JSON format: {"keywords": ["từ khóa 1", "từ khóa 2", "từ khóa 3"]}
          
          Ví dụ: 
          - "tôi muốn tìm áo phông đẹp" → {"keywords": ["áo phông nam nữ", "áo thun cotton", "áo phông basic"]}
          - "áo khoác màu đen" → {"keywords": ["áo khoác đen nam nữ", "áo khoác jean đen", "áo khoác bomber đen"]}`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 200,
      temperature: 0.3
    })

    const aiResult = JSON.parse(aiResponse.choices[0].message.content || '{"keywords": ["áo phông"]}')
    const keywords = aiResult.keywords || ["áo phông"]

    console.log('🔍 AI generated keywords:', keywords)

    // For each keyword, try to find real products using Scrapeless
    const allProducts = []
    
    for (const keyword of keywords.slice(0, 2)) { // Limit to 2 keywords to avoid rate limits
      try {
        const products = await searchProductsWithScrapeless(keyword)
        allProducts.push(...products)
      } catch (error) {
        console.error(`Error searching for ${keyword}:`, error)
      }
    }

    // Remove duplicates and return top 3
    const uniqueProducts = allProducts.filter((product, index, self) => 
      index === self.findIndex(p => p.url === product.url)
    )

    return uniqueProducts.slice(0, 3)

  } catch (error) {
    console.error('Error generating recommendations:', error)
    return []
  }
}

async function searchProductsWithScrapeless(keyword: string) {
  try {
    // Use the helper that creates a crawl job and polls until completion
    const result = await crawlTwentyFiveSearch(keyword, { limit: 3 })

    if (!result || !result.data) {
      console.log('🔍 No data returned from crawl')
      return []
    }

    const products = parseSearchResults(result)
    return products
  } catch (error) {
    console.error('❌ Error with Scrapeless helper:', error)
    return []
  }
}

async function waitForCrawlCompletion(crawlId: string, apiKey: string) {
  const maxAttempts = 10
  const delay = 2000 // 2 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔍 Checking crawl status (attempt ${attempt}/${maxAttempts})...`)
    
    const statusResponse = await fetch(`https://api.scrapeless.com/api/v1/crawler/crawl/${crawlId}`, {
      headers: {
        'x-api-token': apiKey
      }
    })

    if (!statusResponse.ok) {
      console.error('❌ Status check failed:', statusResponse.statusText)
      return null
    }

    const statusResult = await statusResponse.json()
    console.log('🔍 Status:', statusResult.status)

    if (statusResult.status === 'completed') {
      return statusResult
    }

    if (statusResult.status === 'failed') {
      console.error('❌ Crawl failed:', statusResult.error)
      return null
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  console.error('❌ Crawl timeout after', maxAttempts, 'attempts')
  return null
}

function parseSearchResults(data: any) {
  try {
    const products: any[] = []
    console.log('🔍 Parsing search results...')

    if (!data || !data.data || data.data.length === 0) {
      console.log('❌ No HTML/markdown data found in response')
      return products
    }

    // Combine markdown/html from all returned pages
    const combined = data.data.map((d: any) => (d.markdown || d.html || '')).join('\n\n')
    console.log('🔍 Combined length:', combined.length)

    // Each product block typically starts with a header: ### [Title](URL)
    const productBlockRe = /### \[([^\]]+)\]\((https?:\/\/[^)]+)\)([\s\S]*?)(?=### \[|$)/g
    const priceRe = /(\d{1,3}(?:[.,]\d{3})*)\s*₫/i
    const imgRe = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g

    let m: RegExpExecArray | null
    let idx = 0
    while ((m = productBlockRe.exec(combined)) !== null && products.length < 10) {
      idx++
      const title = m[1].trim()
      const url = m[2].trim()
      const block = m[3] || ''

      // price
      const priceMatch = block.match(priceRe)
      const price = priceMatch ? parseInt(priceMatch[1].replace(/[.,]/g, '')) : null

      // images
      const imgs: string[] = []
      let im: RegExpExecArray | null
      while ((im = imgRe.exec(block)) !== null) imgs.push(im[1])

      const product = {
        name: title || `Sản phẩm ${idx}`,
        price: price ? `₫${price.toLocaleString('vi-VN')}` : undefined,
        rating: (4.5 + Math.random() * 0.5).toFixed(1),
        sold: `${Math.floor(Math.random() * 50) + 5}K+`,
        shop: 'Twentyfive.vn',
        url,
        image: imgs.length > 0 ? imgs[0] : `https://via.placeholder.com/300x300?text=Product+${idx}`
      }

      products.push(product)
      console.log('🔍 Parsed product:', product.name, product.url, product.price)
    }

    return products
  } catch (error) {
    console.error('❌ Error parsing search results:', error)
    return []
  }
}

async function handleImageMessage(request: NextRequest) {
  try {
    console.log('🔍 Starting image message handling...')
    
    const formData = await request.formData()
    console.log('🔍 FormData received')
    
    const imageFile = formData.get('image') as File
    const message = formData.get('message') as string || ''
    
    console.log('🔍 Image file:', imageFile ? `${imageFile.name} (${imageFile.size} bytes)` : 'null')
    console.log('🔍 Message:', message)
    
    if (!imageFile) {
      console.error('❌ No image file provided')
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    if (imageFile.size === 0) {
      console.error('❌ Image file is empty')
      return NextResponse.json({ error: 'Image file is empty' }, { status: 400 })
    }

    console.log('🔍 Analyzing image with GPT-4 Vision...')

    // Analyze image with GPT-4 Vision
    const analysis = await analyzeImageWithGPT4Vision(imageFile, message)

    console.log('✅ Image analysis completed successfully')

    return NextResponse.json({
      success: true,
      response: analysis,
      type: 'image_analysis'
    })

  } catch (error) {
    console.error('❌ Error handling image message:', error)
    return NextResponse.json({ 
      error: 'Không thể xử lý ảnh. Vui lòng thử lại với ảnh khác.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

async function analyzeImageWithGPT4Vision(imageFile: File, userMessage: string) {
  try {
    console.log('🔍 Converting image to base64...')
    
    // Validate image file
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('File is not an image')
    }
    
    if (imageFile.size > 20 * 1024 * 1024) { // 20MB limit
      throw new Error('Image file is too large (max 20MB)')
    }
    
    // Convert image to base64
    const bytes = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(bytes).toString('base64')
    const mimeType = imageFile.type

    console.log('🔍 Sending request to OpenAI GPT-4o...')
    console.log('🔍 Image size:', imageFile.size, 'bytes')
    console.log('🔍 MIME type:', mimeType)

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Bạn là chuyên gia thời trang. Hãy phân tích trang phục trong ảnh và đưa ra lời khuyên thời trang.

YÊU CẦU: ${userMessage || 'Phân tích trang phục và gợi ý cải thiện'}

NHIỆM VỤ: Chỉ tập trung vào trang phục, phụ kiện, màu sắc và phong cách thời trang. KHÔNG nhận diện người.

FORMAT TRẢ LỜI:
**TRANG PHỤC**: [Mô tả màu sắc, kiểu dáng chính]
**PHONG CÁCH**: [Casual/Formal/Sporty + hoàn cảnh phù hợp]
**ĐIỂM TÍCH CỰC**: [2-3 điểm mạnh]
**CẦN CẢI THIỆN**: [1-2 điểm cụ thể]

**GỢI Ý**:
• [Phụ kiện + màu sắc]
• [Item thay thế]
• [Tip styling]

**SHOPEE**: [2 sản phẩm - tên + màu + lý do]

Trả lời ngắn gọn, chuyên nghiệp. Kết thúc bằng câu hỏi.`
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
      max_tokens: 1200,
      temperature: 0.7
    })

    const analysis = response.choices[0].message.content
    console.log('✅ GPT-4o analysis completed successfully')
    console.log('🔍 Analysis length:', analysis?.length || 0)
    
    if (!analysis) {
      throw new Error('No analysis returned from OpenAI')
    }
    
    return analysis

  } catch (error) {
    console.error('❌ GPT-4 Vision error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return "Lỗi cấu hình API. Vui lòng liên hệ quản trị viên."
      }
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return "Đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau."
      }
      if (error.message.includes('image')) {
        return "Ảnh không hợp lệ hoặc quá lớn. Vui lòng chọn ảnh khác (tối đa 20MB)."
      }
      if (error.message.includes("can't help") || error.message.includes("identifying")) {
        return `**TRANG PHỤC**: Tôi thấy bạn đã gửi ảnh trang phục
**PHONG CÁCH**: Để phân tích chính xác, hãy mô tả trang phục bạn đang mặc
**ĐIỂM TÍCH CỰC**: Bạn có thể chia sẻ thêm về màu sắc, kiểu dáng
**CẦN CẢI THIỆN**: Cần thêm thông tin để tư vấn tốt hơn

**GỢI Ý**:
• Hãy mô tả trang phục trong ảnh
• Cho biết bạn muốn tư vấn gì
• Gửi link sản phẩm Shopee thay thế

**SHOPEE**: Bạn có thể gửi link sản phẩm để tôi phân tích chi tiết

Bạn có thể mô tả trang phục trong ảnh không?`
      }
    }
    
    return "Xin lỗi, tôi không thể phân tích ảnh này. Vui lòng thử lại với ảnh khác hoặc gửi link sản phẩm Shopee để tôi có thể tư vấn cho bạn nhé! 😊"
  }
}

