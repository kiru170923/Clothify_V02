import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface ClothingDetectionResult {
  type: 'top' | 'bottom' | 'shoes' | 'accessory' | 'dress' | 'outerwear'
  category: string
  color: string
  style: string
  confidence: number
}

export async function detectClothingType(imageBase64: string): Promise<ClothingDetectionResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Phân tích TRANG PHỤC trong ảnh và trả về JSON với thông tin sau:
              
              QUAN TRỌNG: Phân biệt rõ ràng các loại trang phục:
              
              Loại trang phục CHÍNH XÁC:
              - "top": Áo sơ mi, áo thun, áo tank, áo len, áo hoodie, áo blouse, áo polo
              - "bottom": Quần jean, quần short, quần âu, quần jogger, quần tây, quần kaki
              - "dress": Đầm, váy dài, jumpsuit, playsuit, váy liền thân
              - "shoes": Giày sneaker, giày cao gót, sandal, boot, giày tây, giày thể thao
              - "accessory": Túi xách, ví, mũ, khăn, thắt lưng, đồng hồ, nhẫn, dây chuyền
              - "outerwear": Áo khoác, áo vest, blazer, cardigan, áo len dài tay
              
              Yêu cầu:
              1. Phân loại CHÍNH XÁC loại trang phục (không nhầm lẫn)
              2. Xác định màu sắc chính
              3. Đánh giá phong cách
              4. Độ tin cậy (0-100)
              
              Ví dụ phân loại:
              - Đôi giày sneaker → "shoes"
              - Áo thun → "top"
              - Quần jean → "bottom"
              - Túi xách → "accessory"
              
              Trả về JSON format:
              {
                "type": "loại_trang_phục_chính_xác",
                "category": "danh_mục_cụ_thể",
                "color": "màu_sắc_chính",
                "style": "phong_cách",
                "confidence": độ_tin_cậy
              }`
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1
    })

    const content = response.choices[0].message.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const result = JSON.parse(jsonMatch[0])
    
    // Validate result
    if (!result.type || !result.category || !result.color) {
      throw new Error('Invalid detection result')
    }

    return {
      type: result.type,
      category: result.category,
      color: result.color,
      style: result.style || 'casual',
      confidence: result.confidence || 85
    }

  } catch (error) {
    console.error('Clothing detection error:', error)
    
    // Fallback: return default detection
    return {
      type: 'top',
      category: 'unknown',
      color: 'unknown',
      style: 'casual',
      confidence: 50
    }
  }
}

export function getClothingIcon(type: string): string {
  const icons: Record<string, string> = {
    'top': '👕',
    'bottom': '👖',
    'dress': '👗',
    'shoes': '👟',
    'accessory': '👜',
    'outerwear': '🧥'
  }
  return icons[type] || '👕'
}

export function getClothingLabel(type: string): string {
  const labels: Record<string, string> = {
    'top': 'Áo',
    'bottom': 'Quần',
    'dress': 'Váy/Đầm',
    'shoes': 'Giày',
    'accessory': 'Phụ kiện',
    'outerwear': 'Áo khoác'
  }
  return labels[type] || 'Trang phục'
}
