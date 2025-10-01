export type IntentName = 'search' | 'style_advice' | 'compare' | 'policy' | 'update_profile' | 'greeting' | 'unknown'

export interface NluResult {
  intent: IntentName
  confidence: number // 0..1
  entities: Record<string, any>
}

// AI-powered intent classification using ChatGPT
export async function classifyIntentWithAI(text: string): Promise<NluResult> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, falling back to regex')
      return classifyIntent(text)
    }

    const openai = new (await import('openai')).default({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Bạn là một chuyên gia phân tích intent cho chatbot thời trang.

Phân tích ngữ cảnh và ý định của user, sau đó trả về JSON với format:
{
  "intent": "greeting|search|style_advice|compare|policy|update_profile|unknown",
  "confidence": 0.95,
  "entities": {
    "price": 500000,
    "color": "đỏ", 
    "size": "L",
    "occasion": "đi chơi"
  }
}

Các intent:
- "greeting": Chào hỏi đơn giản
- "search": Tìm kiếm/bán sản phẩm cụ thể (có thông tin chi tiết về sản phẩm)
- "style_advice": Tư vấn phong cách, styling, mặc gì cho dịp nào
- "compare": So sánh sản phẩm
- "policy": Chính sách, dịch vụ
- "update_profile": Cập nhật thông tin cá nhân
- "unknown": Không xác định được

NGUYÊN TẮC PHÂN BIỆT:
- Nếu user muốn TÌM HIỂU VỀ PHONG CÁCH, STYLING, MẶC GÌ CHO DỊP NÀO → style_advice
- Nếu user muốn TÌM/BÁN SẢN PHẨM CỤ THỂ → search
- Phân tích ngữ cảnh và ý định thực sự của user, không chỉ dựa vào từ khóa

Entities:
- price: số tiền
- color: màu sắc  
- size: kích thước
- occasion: dịp sử dụng

Chỉ trả về JSON, không có text khác.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    })

    const content = response.choices[0]?.message?.content?.trim()
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }

    // Parse JSON response
    const result = JSON.parse(content)
    
    // Validate result structure
    if (!result.intent || !result.confidence) {
      throw new Error('Invalid response structure')
    }

    // Base result from AI
    let ai: NluResult = {
      intent: result.intent as IntentName,
      confidence: Math.min(Math.max(result.confidence, 0), 1),
      entities: result.entities || {}
    }

    // Enrich with season/material hints if missing
    try {
      const enriched = extractSeasonAndMaterial(text)
      const occ = extractOccasion(text)
      ai.entities = { ...enriched.entities, ...occ.entities, ...ai.entities }
      // If AI marked as 'search' but user is asking seasonal advice without buy intent, nudge to style_advice
      const normalized = normalize((text || '').toLowerCase())
      const hasSeason = Boolean(enriched.entities.season)
      const hasOccasion = Boolean(occ.entities.occasion)
      const hasGarment = GARMENT_HINT_REGEX.test(normalized)
      const hasBuy = BUY_HINT_REGEX.test(normalized)
      if (ai.intent === 'search' && (hasSeason || hasOccasion) && hasGarment && !hasBuy) {
        ai = { intent: 'style_advice', confidence: Math.max(ai.confidence, 0.9), entities: ai.entities }
      }
    } catch {}

    return ai

  } catch (error) {
    console.error('AI Intent classification failed:', error)
    console.log('Falling back to regex-based classification')
    return classifyIntent(text)
  }
}

const PRICE_REGEX = /(duoi|tren|tu)\s*([0-9\.,]+)\s*(k|vn[dđ]|d)?/i
const PRICE_NUMBER_REGEX = /([0-9][0-9\.,]{0,}[0-9])\s*(k|vn[dđ]|d)?/i
const SIZE_REGEX = /\b(size|co)\s*(xxl|xl|l|m|s|xs)\b/
const GREETING_REGEX = /^(hi|hello|chao|chao ban|xin chao|ban khoe khong|ban the nao|ban oi|oi|hey|hi ban|hi ban tui|chao ban tui)$/i
const SEARCH_HINT_REGEX = /(tim|tim kiem|tim giup|co\s+.*khong|muon mua|show|can mua|duoi|tren|gia|mua|mua ban|ao|quan|giay|dep|trang phuc|outfit|san pham|goi y|can mua|muon mua|ban tim|tim cho|tim giup)/
const STYLE_REGEX = /(mac gi|nen mac|goi y|styling|phoi hop|di tiec|cong so|dao pho|hen ho|phong cach|thoi trang|outfit|co nen|nhu the nao|huong dan)/
const COMPARE_REGEX = /(so sanh|nen mua|cai nao|so sanh giua)/
const POLICY_REGEX = /(freeship|doi tra|chinh sach|bao hanh|giao hang|tra hang)/

// Additional seasonal/material and intent bias helpers
const BUY_HINT_REGEX = /(mua|gia|bao nhieu|bao nhiu|dat|link|shop|order)/
const GARMENT_HINT_REGEX = /(ao|khoac|hoodie|jacket|coat|puffer|len|ni|da|so mi|polo)/
const SEASON_HINTS = {
  winter: /(mua\s*dong|tr\s*i lanh|lanh|ret|giu\s*am|dong\s*nay)/,
  summer: /(mua\s*he|nong|oi buc|thoang\s*mat)/,
  fall: /(mua\s*thu|se\s*lanh)/,
  spring: /(mua\s*xuan)/,
}
const MATERIAL_HINTS: Record<string, RegExp> = {
  len: /\blen\b|wool|cashmere/i,
  ni: /\bn[iỉ]\b|fleece|nỉ/i,
  da: /\bda\b|leather/i,
  da_long_vu: /long\s*vu|down|puffer/i,
  da_da: /da\s*da|suede|da lon/i,
  day: /dạ\b|dạ|tweed/i,
}

// Occasion hints (normalized/no accents best effort)
const OCCASION_HINTS: Record<string, RegExp> = {
  phuot: /(di\s*phuot|phuot|trek|trekking|camping|da\s*ngoai|leo\s*nui|di\s*rung|offroad)/i,
  du_lich: /(du\s*lich|travel|tour)/i,
  di_choi: /(di\s*choi|dao\s*pho|cafe)/i,
  di_hoc: /(di\s*hoc|di\s*truong|den\s*truong|di\s*lop|lop\s*hoc|campus|school)/i,
  di_lam: /(di\s*lam|cong\s*so|office)/i,
}

function extractSeasonAndMaterial(text: string): { entities: Record<string, any> } {
  const raw = (text || '').toLowerCase()
  const normalized = normalize(raw)
  const entities: Record<string, any> = {}

  for (const [season, re] of Object.entries(SEASON_HINTS)) {
    if (re.test(normalized)) { entities.season = season; break }
  }
  const materials: string[] = []
  for (const [mat, re] of Object.entries(MATERIAL_HINTS)) {
    if (re.test(raw)) materials.push(mat)
  }
  if (materials.length) entities.material = materials
  return { entities }
}

function extractOccasion(text: string): { entities: Record<string, any> } {
  const raw = (text || '').toLowerCase()
  const normalized = normalize(raw)
  const entities: Record<string, any> = {}
  for (const [key, re] of Object.entries(OCCASION_HINTS)) {
    if (re.test(normalized)) {
      if (key === 'phuot') entities.occasion = 'đi phượt'
      else if (key === 'du_lich') entities.occasion = 'du lịch'
      else if (key === 'di_choi') entities.occasion = 'đi chơi'
      else if (key === 'di_hoc') entities.occasion = 'đi học'
      else if (key === 'di_lam') entities.occasion = 'đi làm'
      break
    }
  }
  return { entities }
}

// Lightweight Vietnamese price phrase parser (normalized, no diacritics)
function parseVietnamesePrice(text: string): number | null {
  // common units
  const hasTrieu = /\btrieu\b/.test(text)
  const hasNghin = /\bnghin\b|\bngan\b/.test(text)
  const hasK = /\bk\b/.test(text)

  // basic digits in words (1..9)
  const word2num: Record<string, number> = {
    'mot': 1, 'một': 1, 'hai': 2, 'ba': 3, 'bon': 4, 'tu': 4, 'nam': 5, 'sau': 6, 'bay': 7, 'tam': 8, 'chin': 9
  }
  // hundreds
  const hundreds = text.match(/\b(mot|hai|ba|bon|tu|nam|sau|bay|tam|chin)\s*tram\b/)
  const hundredsDigit = hundreds ? word2num[hundreds[1]] || 0 : 0
  const hasHundreds = Boolean(hundreds)

  // If pattern like "bay tram nghin" => 700000
  if (hasHundreds && hasNghin) {
    return hundredsDigit * 100000
  }
  // If pattern like "bon tram k" => 400000
  if (hasHundreds && hasK) {
    return hundredsDigit * 100000
  }
  // If pattern like "ba trieu" => 3000000
  const millions = text.match(/\b(mot|hai|ba|bon|tu|nam|sau|bay|tam|chin)\s*trieu\b/)
  if (millions) {
    const d = word2num[millions[1]] || 0
    if (d) return d * 1000000
  }
  // If only "bay tram" without unit, guess in thousands context => 700000
  if (hasHundreds && !hasTrieu) {
    return hundredsDigit * 100000
  }
  return null
}

const COLOR_KEYWORDS: Record<string, string> = {
  kem: 'kem',
  hong: 'hồng',
  do: 'đỏ',
  den: 'đen',
  trang: 'trắng',
  xanh: 'xanh',
  be: 'be',
  nau: 'nâu',
  vang: 'vàng',
  tim: 'tím',
  cam: 'cam',
  ghi: 'ghi',
  nude: 'nude',
  bac: 'bạc',
}

function normalize(input: string) {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
}

export function classifyIntent(text: string): NluResult {
  const raw = (text || '').trim()
  if (!raw) {
    return { intent: 'unknown', confidence: 0, entities: {} }
  }

  const lower = raw.toLowerCase()
  const normalized = normalize(lower)

  // greeting intent (highest priority)
  if (GREETING_REGEX.test(raw)) {
    return { intent: 'greeting', confidence: 0.95, entities: {} }
  }

  // update_profile (explicit size mention)
  const sizeMatch = normalized.match(SIZE_REGEX)
  if (sizeMatch) {
    const size = sizeMatch[2].toUpperCase()
    return { intent: 'update_profile', confidence: 0.95, entities: { size } }
  }

  // Extract seasonal/material hints early
  const entitiesHint: Record<string, any> = {}
  try {
    const extracted = extractSeasonAndMaterial(raw)
    Object.assign(entitiesHint, extracted.entities)
  } catch {}
  try {
    const occ = extractOccasion(raw)
    Object.assign(entitiesHint, occ.entities)
  } catch {}

  // Seasonal advice without buy intent → style_advice
  try {
    const hasSeason = Boolean(entitiesHint.season)
    const hasGarment = GARMENT_HINT_REGEX.test(normalized)
    const hasBuy = BUY_HINT_REGEX.test(normalized)
    if (hasSeason && hasGarment && !hasBuy) {
      return { intent: 'style_advice', confidence: 0.9, entities: entitiesHint }
    }
  } catch {}

  // search intent heuristics
  if (SEARCH_HINT_REGEX.test(normalized)) {
    const entities: Record<string, any> = { ...entitiesHint }

    const priceMatch = normalized.match(PRICE_REGEX)
    const loosePriceMatch = priceMatch ?? normalized.match(PRICE_NUMBER_REGEX)
    if (loosePriceMatch) {
      const rawValue = loosePriceMatch[2] ?? loosePriceMatch[1]
      if (rawValue) {
        const digits = rawValue.replace(/[^0-9]/g, '')
        if (digits) {
          let value = Number(digits)
          const unit = (loosePriceMatch[3] ?? '').toLowerCase()
          if (unit.includes('k')) value *= 1000
          entities.price = value
        }
      }
    } else {
      // Try parse Vietnamese price phrases like "bay tram nghin", "bon tram k", "ba trieu"
      const vi = parseVietnamesePrice(normalized)
      if (vi && Number.isFinite(vi)) entities.price = vi
    }

    for (const [keyword, display] of Object.entries(COLOR_KEYWORDS)) {
      const colorRegex = new RegExp(`\\b(?:mau\\s+)?${keyword}\\b`)
      if (colorRegex.test(normalized)) {
        entities.color = display
        break
      }
    }

    const sizeHint = normalized.match(SIZE_REGEX)
    if (sizeHint) {
      entities.size = sizeHint[2].toUpperCase()
    }

    return { intent: 'search', confidence: 0.9, entities }
  }

  if (STYLE_REGEX.test(normalized)) {
    return { intent: 'style_advice', confidence: 0.9, entities: entitiesHint }
  }

  if (COMPARE_REGEX.test(normalized)) {
    return { intent: 'compare', confidence: 0.9, entities: {} }
  }

  if (POLICY_REGEX.test(normalized)) {
    return { intent: 'policy', confidence: 0.9, entities: {} }
  }

  return { intent: 'unknown', confidence: 0.4, entities: {} }
}
