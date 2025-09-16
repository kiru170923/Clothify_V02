import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Scrapeless API configuration
const SCRAPELESS_API_KEY = process.env.SCRAPELESS_API_KEY
const SCRAPELESS_BASE_URL = 'https://api.scrapeless.com/api/v1'

// Simple in-memory cache
const productCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { url } = await request.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Validate Shopee URL
    if (!url.includes('shopee.vn') && !url.includes('shopee.com')) {
      return NextResponse.json({ error: 'Invalid Shopee URL' }, { status: 400 })
    }

    console.log('🚀 Starting product analysis...')

    // Check cache first
    const cached = productCache.get(url)
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      console.log('🚀 Using cached data for:', url)
      return NextResponse.json({
        success: true,
        product: cached.data,
        cached: true,
        processingTime: Date.now() - startTime
      })
    }

    // Scrape product data using Scrapeless (with timeout)
    const scrapingStartTime = Date.now()
    let productData = await scrapeShopeeProduct(url)
    const scrapingTime = Date.now() - scrapingStartTime
    console.log(`⏱️ Scraping completed in ${scrapingTime}ms`)
    
    // If scraping fails, create mock data for demo
    if (!productData) {
      console.log('Scrapeless failed, using mock data for demo')
      productData = createMockProductData(url)
      
      // Cache mock data too
      productCache.set(url, { data: productData, timestamp: Date.now() })
    }

    // Get AI fashion advice (with timeout)
    const aiStartTime = Date.now()
    const fashionAdvice = await getFashionAdvice(productData)
    const aiTime = Date.now() - aiStartTime
    console.log(`⏱️ AI advice completed in ${aiTime}ms`)

    const totalTime = Date.now() - startTime
    console.log(`✅ Total processing time: ${totalTime}ms`)

    // Cache the result
    productCache.set(url, { data: productData, timestamp: Date.now() })

    return NextResponse.json({
      success: true,
      product: productData,
      advice: fashionAdvice,
      performance: {
        scrapingTime,
        aiTime,
        totalTime
      },
      cached: false
    })

  } catch (error) {
    console.error('Error analyzing Shopee product:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function scrapeShopeeProduct(url: string) {
  try {
    console.log('🔍 Scraping Shopee URL:', url)
    console.log('🔑 Scrapeless API Key:', SCRAPELESS_API_KEY ? 'EXISTS' : 'MISSING')

    if (!SCRAPELESS_API_KEY) {
      console.error('❌ Scrapeless API Key is missing!')
      return null
    }

    // Step 1: Create scraping task with timeout
    console.log('📤 Creating Scrapeless task...')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

    const taskResponse = await fetch(`${SCRAPELESS_BASE_URL}/scraper/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': SCRAPELESS_API_KEY || ''
      },
      body: JSON.stringify({
        actor: "scraper.shopee",
        input: {
          action: "shopee.product",
          url: url
        }
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!taskResponse.ok) {
      const errorText = await taskResponse.text()
      console.error('❌ Task creation failed:', taskResponse.status, errorText)
      throw new Error(`Scrapeless task creation failed: ${taskResponse.status} - ${errorText}`)
    }

    const taskData = await taskResponse.json()
    console.log('📋 Task created:', taskData)

    // Check if we got immediate result (status 200) or need to poll (status 201)
    if (taskResponse.status === 200) {
      // Immediate result
      console.log('✅ Got immediate result!')
      return processScrapelessData(taskData)
    } else if (taskResponse.status === 201) {
      // Need to poll for result
      const taskId = taskData.taskId
      console.log('⏳ Polling for result, taskId:', taskId)

      return await pollForResult(taskId)
    } else {
      throw new Error(`Unexpected response status: ${taskResponse.status}`)
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Scrapeless request timeout (25s)')
    } else {
      console.error('❌ Scrapeless scraping error:', error)
    }
    return null
  }
}

async function pollForResult(taskId: string, maxAttempts: number = 8): Promise<any> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}...`)

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout per request

      const resultResponse = await fetch(`${SCRAPELESS_BASE_URL}/scraper/result/${taskId}`, {
        method: 'GET',
        headers: {
          'x-api-token': SCRAPELESS_API_KEY || ''
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!resultResponse.ok) {
        console.error(`❌ Polling failed: ${resultResponse.status}`)
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        continue
      }

      const resultData = await resultResponse.json()
      console.log(`📊 Polling result (attempt ${attempt}):`, resultData)

      // Check if task is completed
      if (resultData.success === true && resultData.state === 'completed') {
        console.log('✅ Task completed!')
        return processScrapelessData(resultData)
      } else if (resultData.success === false || resultData.state === 'failed') {
        console.error('❌ Task failed:', resultData.status || resultData.error)
        return null
      } else {
        // Still processing, wait and try again
        console.log(`⏳ Task still processing (${resultData.state || resultData.status}), waiting...`)
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error(`❌ Polling timeout (attempt ${attempt})`)
      } else {
        console.error(`❌ Polling error (attempt ${attempt}):`, error)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  console.error('❌ Max polling attempts reached')
  return null
}

function processScrapelessData(data: any) {
  console.log('🔍 Processing Scrapeless data:', JSON.stringify(data, null, 2))
  
  // Check if response has base64 encoded data (from webhook format)
  let productData = data.data || data.result || data
  
  if (data.response && data.response.data && data.response.encoding === 'base64') {
    console.log('🔍 Found base64 encoded response, decoding...')
    try {
      const decodedData = Buffer.from(data.response.data, 'base64').toString('utf-8')
      productData = JSON.parse(decodedData)
      console.log('✅ Successfully decoded base64 data')
    } catch (error) {
      console.error('❌ Failed to decode base64 data:', error)
      return null
    }
  }
  
  if (!productData) {
    console.log('❌ No product data found in response')
    return null
  }

  // Debug: Log the actual structure
  console.log('🔍 Product data keys:', Object.keys(productData))
  
  // The actual Shopee data is nested deeper
  const shopeeData = productData.data || productData
  console.log('🔍 Shopee data keys:', Object.keys(shopeeData))
  console.log('🔍 Shopee data structure:', {
    hasItem: !!shopeeData.item,
    hasShop: !!shopeeData.shop_detailed,
    hasReview: !!shopeeData.product_review,
    hasAttributes: !!shopeeData.product_attributes,
    hasDescription: !!shopeeData.product_description
  })

  // Extract from the actual Shopee API response structure
  const item = shopeeData.item || {}
  const shop = shopeeData.shop_detailed || {}
  const productReview = shopeeData.product_review || {}
  const productAttributes = shopeeData.product_attributes || {}
  const productDescription = shopeeData.product_description || {}

  // Debug: Log extracted data
  console.log('🔍 Extracted data:', {
    item: item,
    shop: shop,
    productReview: productReview,
    productAttributes: productAttributes,
    productDescription: productDescription
  })

  // Extract product name from description
  const productName = productDescription.paragraph_list?.[0]?.text || 
                     item.title || 
                     item.name || 
                     'Sản phẩm Shopee'

  // Extract price information (convert from micro-dong to dong)
  const priceMicro = item.price || item.price_min || 0
  const price = Math.floor(priceMicro / 100000) // Convert micro-dong to dong
  const originalPriceMicro = item.price_before_discount || item.price_max_before_discount || 0
  const originalPrice = Math.floor(originalPriceMicro / 100000)
  const discount = item.show_discount || item.raw_discount || ''

  // Extract rating and reviews
  const rating = productReview.rating_star || item.item_rating?.rating_star || 0
  const reviewCount = productReview.total_rating_count || productReview.rating_count?.[0] || 0

  // Extract sold count
  const sold = productReview.historical_sold || productReview.global_sold || item.sold || 0

  // Extract description
  const description = productDescription.paragraph_list?.slice(0, 3).map((p: any) => p.text).join(' ') || 
                     item.description?.substring(0, 200) || ''

  // Extract images from product_images or item.image
  const productImages = shopeeData.product_images || []
  const itemImage = item.image || ''
  const images = []
  
  // Debug: Log image data
  console.log('🔍 Image debug:', {
    itemImage: itemImage,
    productImages: productImages,
    productImagesLength: productImages.length
  })
  
  // Add main item image
  if (itemImage) {
    images.push(`https://down-zl-sg.img.susercontent.com/${itemImage}`)
    console.log('✅ Added main image:', `https://down-zl-sg.img.susercontent.com/${itemImage}`)
  }
  
  // Add product images
  if (productImages.length > 0) {
    productImages.forEach((img: any, index: number) => {
      console.log(`🔍 Product image ${index}:`, img)
      if (img.image) {
        images.push(`https://down-zl-sg.img.susercontent.com/${img.image}`)
        console.log(`✅ Added product image ${index}:`, `https://down-zl-sg.img.susercontent.com/${img.image}`)
      }
    })
  }
  
  console.log('🔍 Final images array:', images)

  // Extract brand
  const brand = item.brand || 
                productAttributes.attrs?.find((attr: any) => attr.name === 'Brand')?.value ||
                shop.name ||
                'Unknown Brand'

  // Extract category
  const category = productAttributes.categories?.[0]?.display_name ||
                  productAttributes.categories?.[productAttributes.categories.length - 1]?.display_name ||
                  item.categories?.[0]?.display_name ||
                  'Unknown Category'

  // Clean and format the product data
  const cleanedProduct = {
    name: cleanText(productName),
    price: cleanPrice(price),
    originalPrice: cleanPrice(originalPrice),
    discount: cleanText(discount),
    rating: Math.round((parseFloat(rating) || 0) * 100) / 100, // Round to 2 decimal places
    reviewCount: `${reviewCount} đánh giá`,
    sold: `${sold} đã bán`,
    description: cleanText(description),
    images: images,
    brand: cleanText(brand),
    category: cleanText(category)
  }

  console.log('✅ Cleaned product data:', cleanedProduct)
  return cleanedProduct
}

function cleanText(text: any): string {
  if (!text) return ''
  if (Array.isArray(text)) return text.join(' ').trim()
  return String(text).trim()
}

function cleanPrice(price: any): string {
  if (!price) return ''
  
  // Convert to number and format as Vietnamese currency
  const numPrice = parseInt(String(price).replace(/\D/g, ''))
  if (isNaN(numPrice)) return ''
  
  // Format with Vietnamese currency symbol
  return `₫${numPrice.toLocaleString('vi-VN')}`
}

function createMockProductData(url: string) {
  // Extract product ID from URL for demo
  const productId = url.split('/').pop() || 'demo-product'
  
  return {
    name: `Áo thun nam nữ chất liệu cotton cao cấp - Sản phẩm demo ${productId}`,
    price: '₫89.000',
    originalPrice: '₫150.000',
    discount: '41%',
    rating: 4.8,
    reviewCount: '2.5K đánh giá',
    sold: '15K đã bán',
    description: 'Áo thun chất liệu cotton 100% mềm mại, thoáng mát, phù hợp cho mọi hoạt động hàng ngày. Thiết kế đơn giản, dễ phối đồ.',
    images: [
      'https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=Product+Image+1',
      'https://via.placeholder.com/300x300/7C3AED/FFFFFF?text=Product+Image+2',
      'https://via.placeholder.com/300x300/EC4899/FFFFFF?text=Product+Image+3'
    ],
    brand: 'Demo Brand',
    category: 'Áo thun'
  }
}

async function getFashionAdvice(productData: any) {
  try {
    console.log('Generating fashion advice for:', productData.name)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Bạn là chuyên gia thời trang Việt Nam với 10 năm kinh nghiệm. Nhiệm vụ của bạn:

1. **Phân tích sản phẩm**: Đánh giá chất lượng, giá cả, phong cách
2. **Tư vấn phối đồ**: Gợi ý cách mix & match phù hợp
3. **Đánh giá xu hướng**: Cập nhật trend thời trang hiện tại
4. **Lời khuyên cá nhân**: Phù hợp với người Việt Nam

Luôn trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp. Sử dụng emoji để làm cho câu trả lời sinh động hơn.`
        },
        {
          role: "user",
          content: `Hãy phân tích và tư vấn cho sản phẩm này:

📦 **Thông tin sản phẩm:**
- Tên: ${productData.name}
- Giá: ${productData.price} ${productData.originalPrice ? `(giá gốc: ${productData.originalPrice})` : ''}
- Đánh giá: ${productData.rating}/5 ⭐ (${productData.reviewCount})
- Đã bán: ${productData.sold}
- Thương hiệu: ${productData.brand || 'Không rõ'}
- Danh mục: ${productData.category || 'Không rõ'}
- Mô tả: ${productData.description || 'Không có mô tả'}

Hãy đưa ra lời khuyên chi tiết về phong cách, cách phối đồ và đánh giá tổng thể.`
        }
      ],
      max_tokens: 600, // Reduced from 800
      temperature: 0.7
    })

    clearTimeout(timeoutId)

    const advice = response.choices[0].message.content
    console.log('Generated fashion advice:', advice)
    return advice

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ OpenAI API timeout (10s)')
    } else {
      console.error('OpenAI API error:', error)
    }
    
    return `🎯 **Phân tích sản phẩm**: ${productData.name}

💡 **Gợi ý phối đồ**:
- Kết hợp với quần jean hoặc chân váy
- Giày sneaker hoặc giày cao gót tùy phong cách
- Phụ kiện đơn giản để tạo điểm nhấn

⭐ **Đánh giá**: Sản phẩm có vẻ phù hợp cho phong cách casual hàng ngày.

🔥 **Lưu ý**: Hãy kiểm tra chất liệu và kích thước trước khi mua!`
  }
}
