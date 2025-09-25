export interface NormalizedProduct {
  title?: string
  price?: number
  priceDisplay?: string
  images?: string[]
  description?: string
  colors?: string[]
  sizes?: string[]
  stock?: string
  sku?: string
  sourceURL?: string
  raw?: {
    markdown?: string
    html?: string
  }
}

export function normalizeProduct(data: { markdown?: string; html?: string; metadata?: any; url?: string }): NormalizedProduct {
  const { markdown = '', html = '', metadata = {}, url } = data

  const combined = `${markdown}\n\n${html}`
  const result: NormalizedProduct = { raw: { markdown, html } }

  // Title
  if (metadata && metadata.title) {
    result.title = metadata.title
  } else if (markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m)
    if (titleMatch) result.title = titleMatch[1].trim()
  }

  // SKU: try metadata, title, markdown, or url
  if (metadata && metadata.sku) {
    result.sku = String(metadata.sku)
  } else if (result.title) {
    const skuMatch = result.title.match(/([A-Z]{2,}\d{2,}|SACM\d+|[A-Z0-9\-]{4,})/i)
    if (skuMatch) result.sku = skuMatch[1]
  }
  if (!result.sku && url) {
    const urlSku = url.match(/-(?:p)?(\d+)\.html$/i)
    if (urlSku) result.sku = `p${urlSku[1]}`
  }

  // Price: prefer explicit "giá" lines or currency symbols, else pick large number
  const priceByLabel = combined.match(/(?:giá|price)[:\s]*([0-9.,]{3,})/i)
  if (priceByLabel) {
    const p = priceByLabel[1].replace(/[.,]/g, '')
    result.price = parseInt(p)
    result.priceDisplay = `${result.price}`
  } else {
    const priceCurrency = combined.match(/([0-9]{1,3}(?:[.,][0-9]{3})+)[^\d\n]{0,3}(?:₫|đ|VND)?/i)
    if (priceCurrency) {
      const p = priceCurrency[1].replace(/[.,]/g, '')
      result.price = parseInt(p)
      result.priceDisplay = `${result.price}`
    } else {
      // fallback: any 4+ digit number
      const anyNum = combined.match(/\b(\d{4,})\b/)
      if (anyNum) {
        result.price = parseInt(anyNum[1])
        result.priceDisplay = `${result.price}`
      }
    }
  }

  // Images: markdown images and <img src=>
  const images: string[] = []
  const mdImgRe = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/g
  let m: RegExpExecArray | null
  while ((m = mdImgRe.exec(combined)) !== null) images.push(m[1])
  const imgTagRe = /<img[^>]+src=["']?(https?:[^"'\s>]+)["']?[^>]*>/gi
  while ((m = imgTagRe.exec(combined)) !== null) images.push(m[1])
  if (images.length) result.images = Array.from(new Set(images)).slice(0, 8)

  // Description: metadata.description or first non-heading paragraph in markdown/html
  if (metadata && metadata.description) {
    result.description = metadata.description
  } else {
    // get first paragraph from markdown
    const parts = markdown.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean)
    for (const p of parts) {
      if (!p.startsWith('#') && p.length > 30) { result.description = p; break }
    }
    if (!result.description && html) {
      const para = html.match(/<p[^>]*>([\s\S]{20,}?)<\/p>/i)
      if (para) result.description = para[1].replace(/<[^>]+>/g, '').trim()
    }
  }

  // Colors (heuristic)
  const colorKeywords = ['kem', 'hồng', 'đỏ', 'xanh', 'đen', 'trắng', 'be', 'nâu', 'xám', 'vàng', 'xanh lá']
  result.colors = colorKeywords.filter(c => combined.toLowerCase().includes(c))

  // Sizes
  const sizeMatch = combined.match(/(size|cỡ)[:\s]*([A-Z0-9\s,.-]+)/i)
  if (sizeMatch) {
    result.sizes = sizeMatch[2].split(/[ ,;\/]+/).map(s => s.trim()).filter(Boolean)
  }

  // source URL
  result.sourceURL = metadata?.sourceURL || url || metadata?.source_url

  return result
}
