'use client'

export interface AdvancedNLUResult {
  intent: string
  confidence: number
  entities: Record<string, any>
  sentiment: {
    score: number // -1 to 1
    label: 'positive' | 'negative' | 'neutral'
  }
  context: {
    urgency: 'low' | 'medium' | 'high'
    formality: 'casual' | 'formal' | 'mixed'
    topic: string
  }
  suggestions: string[]
  followUpQuestions: string[]
}

export interface EntityExtractionResult {
  products: Array<{
    name: string
    category: string
    attributes: Record<string, any>
  }>
  occasions: Array<{
    type: string
    formality: string
    time?: string
  }>
  preferences: Array<{
    type: string
    value: any
    confidence: number
  }>
  constraints: Array<{
    type: 'price' | 'size' | 'color' | 'brand' | 'material'
    value: any
    operator: 'eq' | 'lt' | 'gt' | 'between' | 'in'
  }>
}

export class AdvancedNLUEngine {
  private intentPatterns: Map<string, RegExp[]> = new Map()
  private entityPatterns: Map<string, RegExp[]> = new Map()
  private sentimentWords: Map<string, number> = new Map()

  constructor() {
    this.initializeIntentPatterns()
    this.initializeEntityPatterns()
    this.initializeSentimentWords()
  }

  private initializeIntentPatterns(): void {
    // Search intent patterns
    this.intentPatterns.set('search', [
      /tìm|mua|bán|shop|store/i,
      /áo|quần|giày|phụ kiện/i,
      /giá|price|cost/i,
      /size|kích thước/i
    ])

    // Style advice intent patterns
    this.intentPatterns.set('style_advice', [
      /tư vấn|advice|gợi ý/i,
      /phong cách|style|fashion/i,
      /mặc gì|what to wear/i,
      /outfit|trang phục/i,
      /phù hợp|suitable|match/i
    ])

    // Compare intent patterns
    this.intentPatterns.set('compare', [
      /so sánh|compare/i,
      /khác nhau|difference/i,
      /tốt hơn|better/i,
      /ưu nhược điểm|pros and cons/i
    ])

    // Virtual try-on intent patterns
    this.intentPatterns.set('virtual_try_on', [
      /thử đồ|try on|thử áo/i,
      /mặc thử|fit|vừa/i,
      /ảo|virtual|ai/i
    ])

    // Wardrobe management intent patterns
    this.intentPatterns.set('wardrobe_management', [
      /tủ đồ|wardrobe|closet/i,
      /quản lý|manage|organize/i,
      /kiểm tra|check|audit/i
    ])

    // Style quiz intent patterns
    this.intentPatterns.set('style_quiz', [
      /trắc nghiệm|quiz|test/i,
      /phong cách cá nhân|personal style/i,
      /tìm hiểu|discover/i
    ])
  }

  private initializeEntityPatterns(): void {
    // Product patterns
    this.entityPatterns.set('products', [
      /áo (sơ mi|polo|thun|khoác|len)/i,
      /quần (jeans|tây|short|thể thao)/i,
      /giày (thể thao|tây|boots|sneakers)/i,
      /phụ kiện (thắt lưng|đồng hồ|túi)/i
    ])

    // Occasion patterns
    this.entityPatterns.set('occasions', [
      /đi làm|work|office|công sở/i,
      /đi chơi|hang out|casual/i,
      /dự tiệc|party|event|formal/i,
      /thể thao|sport|gym/i,
      /du lịch|travel|vacation/i
    ])

    // Price patterns
    this.entityPatterns.set('price', [
      /(\d+)\s*(k|nghìn|thousand)/i,
      /(\d+)\s*(triệu|million)/i,
      /dưới\s*(\d+)/i,
      /trên\s*(\d+)/i,
      /từ\s*(\d+)\s*đến\s*(\d+)/i
    ])

    // Color patterns
    this.entityPatterns.set('colors', [
      /màu\s*(đen|trắng|xám|đỏ|xanh|vàng|hồng|tím|nâu)/i,
      /(đen|trắng|xám|đỏ|xanh|vàng|hồng|tím|nâu)/i
    ])

    // Size patterns
    this.entityPatterns.set('size', [
      /size\s*(xs|s|m|l|xl|xxl)/i,
      /(xs|s|m|l|xl|xxl)/i
    ])
  }

  private initializeSentimentWords(): void {
    // Positive words
    this.sentimentWords.set('đẹp', 0.8)
    this.sentimentWords.set('tốt', 0.7)
    this.sentimentWords.set('thích', 0.6)
    this.sentimentWords.set('yêu', 0.9)
    this.sentimentWords.set('tuyệt', 0.8)
    this.sentimentWords.set('perfect', 0.9)
    this.sentimentWords.set('amazing', 0.8)

    // Negative words
    this.sentimentWords.set('xấu', -0.8)
    this.sentimentWords.set('tệ', -0.7)
    this.sentimentWords.set('ghét', -0.6)
    this.sentimentWords.set('không thích', -0.5)
    this.sentimentWords.set('ugly', -0.8)
    this.sentimentWords.set('bad', -0.7)
    this.sentimentWords.set('terrible', -0.9)
  }

  public async analyzeText(text: string): Promise<AdvancedNLUResult> {
    const normalizedText = text.toLowerCase().trim()
    
    // Intent classification
    const intent = this.classifyIntent(normalizedText)
    
    // Entity extraction
    const entities = this.extractEntities(normalizedText)
    
    // Sentiment analysis
    const sentiment = this.analyzeSentiment(normalizedText)
    
    // Context analysis
    const context = this.analyzeContext(normalizedText, entities)
    
    // Generate suggestions and follow-up questions
    const suggestions = this.generateSuggestions(intent, entities, context)
    const followUpQuestions = this.generateFollowUpQuestions(intent, entities, context)

    return {
      intent: intent.name,
      confidence: intent.confidence,
      entities,
      sentiment,
      context,
      suggestions,
      followUpQuestions
    }
  }

  private classifyIntent(text: string): {name: string, confidence: number} {
    let bestIntent = { name: 'unknown', confidence: 0 }
    
    for (const [intentName, patterns] of Array.from(this.intentPatterns.entries())) {
      let matches = 0
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          matches++
        }
      }
      
      const confidence = matches / patterns.length
      if (confidence > bestIntent.confidence) {
        bestIntent = { name: intentName, confidence }
      }
    }
    
    return bestIntent
  }

  private extractEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {}
    
    // Extract products
    for (const pattern of this.entityPatterns.get('products') || []) {
      const match = text.match(pattern)
      if (match) {
        entities.products = entities.products || []
        entities.products.push({
          name: match[0],
          category: this.categorizeProduct(match[0]),
          attributes: this.extractProductAttributes(match[0])
        })
      }
    }
    
    // Extract occasions
    for (const pattern of this.entityPatterns.get('occasions') || []) {
      const match = text.match(pattern)
      if (match) {
        entities.occasions = entities.occasions || []
        entities.occasions.push({
          type: match[0],
          formality: this.determineFormality(match[0])
        })
      }
    }
    
    // Extract price
    for (const pattern of this.entityPatterns.get('price') || []) {
      const match = text.match(pattern)
      if (match) {
        entities.price = this.parsePrice(match)
      }
    }
    
    // Extract colors
    for (const pattern of this.entityPatterns.get('colors') || []) {
      const match = text.match(pattern)
      if (match) {
        entities.colors = entities.colors || []
        entities.colors.push(match[1] || match[0])
      }
    }
    
    // Extract size
    for (const pattern of this.entityPatterns.get('size') || []) {
      const match = text.match(pattern)
      if (match) {
        entities.size = match[1] || match[0]
      }
    }
    
    return entities
  }

  private categorizeProduct(productText: string): string {
    if (productText.includes('áo')) return 'shirt'
    if (productText.includes('quần')) return 'pants'
    if (productText.includes('giày')) return 'shoes'
    if (productText.includes('phụ kiện')) return 'accessories'
    return 'unknown'
  }

  private extractProductAttributes(productText: string): Record<string, any> {
    const attributes: Record<string, any> = {}
    
    // Extract material
    if (productText.includes('cotton')) attributes.material = 'cotton'
    if (productText.includes('polyester')) attributes.material = 'polyester'
    if (productText.includes('denim')) attributes.material = 'denim'
    
    // Extract style
    if (productText.includes('slim')) attributes.style = 'slim'
    if (productText.includes('regular')) attributes.style = 'regular'
    if (productText.includes('loose')) attributes.style = 'loose'
    
    return attributes
  }

  private determineFormality(occasionText: string): string {
    if (occasionText.includes('làm') || occasionText.includes('công sở')) return 'formal'
    if (occasionText.includes('tiệc') || occasionText.includes('event')) return 'formal'
    if (occasionText.includes('chơi') || occasionText.includes('casual')) return 'casual'
    if (occasionText.includes('thể thao') || occasionText.includes('sport')) return 'sporty'
    return 'casual'
  }

  private parsePrice(match: RegExpMatchArray): {min?: number, max?: number, value?: number} {
    const text = match[0]
    
    if (text.includes('dưới')) {
      const value = parseInt(match[1])
      return { max: value }
    }
    
    if (text.includes('trên')) {
      const value = parseInt(match[1])
      return { min: value }
    }
    
    if (text.includes('từ') && text.includes('đến')) {
      const min = parseInt(match[1])
      const max = parseInt(match[2])
      return { min, max }
    }
    
    const value = parseInt(match[1])
    const unit = match[2] || ''
    
    if (unit.includes('k') || unit.includes('nghìn')) {
      return { value: value * 1000 }
    }
    
    if (unit.includes('triệu')) {
      return { value: value * 1000000 }
    }
    
    return { value }
  }

  private analyzeSentiment(text: string): {score: number, label: 'positive' | 'negative' | 'neutral'} {
    let score = 0
    let wordCount = 0
    
    const words = text.split(/\s+/)
    for (const word of words) {
      const sentimentValue = this.sentimentWords.get(word)
      if (sentimentValue !== undefined) {
        score += sentimentValue
        wordCount++
      }
    }
    
    const averageScore = wordCount > 0 ? score / wordCount : 0
    
    let label: 'positive' | 'negative' | 'neutral'
    if (averageScore > 0.1) label = 'positive'
    else if (averageScore < -0.1) label = 'negative'
    else label = 'neutral'
    
    return { score: averageScore, label }
  }

  private analyzeContext(text: string, entities: Record<string, any>): {
    urgency: 'low' | 'medium' | 'high'
    formality: 'casual' | 'formal' | 'mixed'
    topic: string
  } {
    // Determine urgency
    let urgency: 'low' | 'medium' | 'high' = 'low'
    if (text.includes('gấp') || text.includes('urgent') || text.includes('asap')) {
      urgency = 'high'
    } else if (text.includes('sớm') || text.includes('soon') || text.includes('nhanh')) {
      urgency = 'medium'
    }
    
    // Determine formality
    let formality: 'casual' | 'formal' | 'mixed' = 'casual'
    if (entities.occasions) {
      const formalOccasions = entities.occasions.filter((occ: any) => occ.formality === 'formal')
      const casualOccasions = entities.occasions.filter((occ: any) => occ.formality === 'casual')
      
      if (formalOccasions.length > 0 && casualOccasions.length > 0) {
        formality = 'mixed'
      } else if (formalOccasions.length > 0) {
        formality = 'formal'
      }
    }
    
    // Determine topic
    let topic = 'general'
    if (entities.products) topic = 'products'
    if (entities.occasions) topic = 'occasions'
    if (text.includes('phong cách') || text.includes('style')) topic = 'style'
    if (text.includes('tủ đồ') || text.includes('wardrobe')) topic = 'wardrobe'
    
    return { urgency, formality, topic }
  }

  private generateSuggestions(intent: {name: string, confidence: number}, entities: Record<string, any>, context: any): string[] {
    const suggestions: string[] = []
    
    switch (intent.name) {
      case 'search':
        suggestions.push('Tìm kiếm sản phẩm phù hợp')
        if (entities.price) suggestions.push('Lọc theo giá')
        if (entities.colors) suggestions.push('Lọc theo màu sắc')
        break
        
      case 'style_advice':
        suggestions.push('Tư vấn phong cách')
        suggestions.push('Gợi ý outfit')
        break
        
      case 'virtual_try_on':
        suggestions.push('Thử đồ ảo')
        suggestions.push('Xem trước outfit')
        break
        
      case 'wardrobe_management':
        suggestions.push('Quản lý tủ đồ')
        suggestions.push('Kiểm tra tủ đồ')
        break
        
      case 'style_quiz':
        suggestions.push('Làm trắc nghiệm phong cách')
        suggestions.push('Tìm hiểu phong cách cá nhân')
        break
    }
    
    return suggestions
  }

  private generateFollowUpQuestions(intent: {name: string, confidence: number}, entities: Record<string, any>, context: any): string[] {
    const questions: string[] = []
    
    // Generate questions based on missing entities
    if (intent.name === 'search' && !entities.price) {
      questions.push('Bạn có ngân sách cụ thể nào không?')
    }
    
    if (intent.name === 'search' && !entities.occasions) {
      questions.push('Bạn sẽ mặc cho dịp gì?')
    }
    
    if (intent.name === 'style_advice' && !entities.occasions) {
      questions.push('Bạn cần tư vấn cho dịp nào?')
    }
    
    if (!entities.size) {
      questions.push('Size của bạn là gì?')
    }
    
    return questions
  }

  public extractEntitiesAdvanced(text: string): EntityExtractionResult {
    const result: EntityExtractionResult = {
      products: [],
      occasions: [],
      preferences: [],
      constraints: []
    }
    
    // Extract products with detailed attributes
    for (const pattern of this.entityPatterns.get('products') || []) {
      const match = text.match(pattern)
      if (match) {
        result.products.push({
          name: match[0],
          category: this.categorizeProduct(match[0]),
          attributes: this.extractProductAttributes(match[0])
        })
      }
    }
    
    // Extract occasions with formality
    for (const pattern of this.entityPatterns.get('occasions') || []) {
      const match = text.match(pattern)
      if (match) {
        result.occasions.push({
          type: match[0],
          formality: this.determineFormality(match[0])
        })
      }
    }
    
    // Extract preferences
    const sentiment = this.analyzeSentiment(text)
    if (sentiment.label !== 'neutral') {
      result.preferences.push({
        type: 'sentiment',
        value: sentiment.label,
        confidence: Math.abs(sentiment.score)
      })
    }
    
    // Extract constraints
    if (this.entityPatterns.get('price')) {
      for (const pattern of this.entityPatterns.get('price') || []) {
        const match = text.match(pattern)
        if (match) {
          const priceData = this.parsePrice(match)
          if (priceData.value) {
            result.constraints.push({
              type: 'price',
              value: priceData.value,
              operator: 'eq'
            })
          } else if (priceData.min && priceData.max) {
            result.constraints.push({
              type: 'price',
              value: [priceData.min, priceData.max],
              operator: 'between'
            })
          }
        }
      }
    }
    
    return result
  }
}

// Singleton instance
export const advancedNLUEngine = new AdvancedNLUEngine()

// Hook for React components
export const useAdvancedNLU = () => {
  return {
    analyzeText: (text: string) => advancedNLUEngine.analyzeText(text),
    extractEntitiesAdvanced: (text: string) => advancedNLUEngine.extractEntitiesAdvanced(text)
  }
}
