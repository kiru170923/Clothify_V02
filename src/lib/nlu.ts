export type IntentName = 'search' | 'style_advice' | 'compare' | 'policy' | 'update_profile' | 'unknown'

export interface NluResult {
  intent: IntentName
  confidence: number // 0..1
  entities: Record<string, any>
}

const PRICE_REGEX = /(dưới|trên|từ)\s*([0-9\.\,]+)\s*(k|vnđ|vnd|đ)?/i
const PRICE_NUMBER_REGEX = /([0-9][0-9\.,]{0,}[0-9])\s*(k|vnđ|vnd|đ)?/i
const SIZE_REGEX = /\b(size|cỡ)\s*(xs|s|m|l|xl|xxl)\b/i

export function classifyIntent(text: string): NluResult {
  const t = (text || '').toLowerCase().trim()

  // update_profile (explicit size)
  if (SIZE_REGEX.test(t) || /mặc size|size\s*[xsml]/i.test(t)) {
    return { intent: 'update_profile', confidence: 0.95, entities: { size: (t.match(SIZE_REGEX) || [])[2] } }
  }

  // search intent heuristics
  if (/tìm|tìm kiếm|có .* không|muốn mua|show|cần mua|dưới|trên|giá|mua/.test(t)) {
    const entities: any = {}
    const p = t.match(PRICE_REGEX) || t.match(PRICE_NUMBER_REGEX)
    if (p) {
      const raw = p[2].replace(/[^0-9]/g, '')
      let n = Number(raw)
      if (p[3] && /k/i.test(p[3])) n = n * 1000
      entities.price = n
    }
    // color heuristics
    const colors = ['kem','hồng','đỏ','xanh','đen','trắng','be','brown','blue','pink']
    for (const c of colors) if (t.includes(c)) { entities.color = c; break }
    return { intent: 'search', confidence: 0.9, entities }
  }

  // style advice
  if (/mặc gì|nên mặc|gợi ý|styling|phù hợp|đi tiệc|công sở|dạo phố|hẹn hò/.test(t)) {
    return { intent: 'style_advice', confidence: 0.9, entities: {} }
  }

  // compare
  if (/so sánh|nên mua|cái nào|so sánh giữa/.test(t)) {
    return { intent: 'compare', confidence: 0.9, entities: {} }
  }

  // policy/questions
  if (/freeship|đổi trả|chính sách|bảo hành|giao hàng|trả hàng/.test(t)) {
    return { intent: 'policy', confidence: 0.9, entities: {} }
  }

  return { intent: 'unknown', confidence: 0.4, entities: {} }
}


