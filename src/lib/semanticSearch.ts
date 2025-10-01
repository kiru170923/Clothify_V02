import { ConversationContext, UserProfile, PurchaseRecord } from './conversationMemory'

// Define ProductData interface locally to avoid circular imports
interface ProductData {
  id: number
  name: string
  price: number
  description?: string
  images: string[]
  productUrl?: string
  style?: string[]
  occasion?: string[]
  matchWith?: string[]
  whyRecommend?: string
  variants?: Variant[]
  originalPrice?: number
  discount?: string
  rating?: number
  reviewCount?: number
  sold?: number
}

interface Variant {
  sku?: string
  color?: string
  size?: string
  price?: number
}

export interface SearchFilters {
  // Basic filters
  price?: { min: number; max: number }
  color?: string[]
  size?: string[]
  brand?: string[]
  
  // Advanced filters
  style?: string[]
  occasion?: string[]
  season?: string[]
  material?: string[]
  
  // ML-based filters
  bodyType?: 'slim' | 'athletic' | 'regular' | 'plus'
  skinTone?: 'light' | 'medium' | 'dark'
  personalStyle?: string[]
  
  // Behavioral filters
  popularity?: boolean
  trending?: boolean
  userRating?: number
}

export interface SearchResult {
  product: ProductData
  relevanceScore: number
  matchReasons: string[]
  semanticSimilarity: number
  keywordMatch: number
  personalizationScore: number
}

export interface SearchStrategy {
  semanticFilters: SearchFilters
  keywordFilters: SearchFilters
  trendingFilters: SearchFilters
  collaborativeFilters: SearchFilters
}

class SemanticSearchEngine {
  private productEmbeddings: Map<string, number[]> = new Map()
  private queryEmbeddings: Map<string, number[]> = new Map()

  // Initialize embeddings (in real app, this would be loaded from vector DB)
  async initializeEmbeddings(): Promise<void> {
    // This would typically load from a vector database like Pinecone, Weaviate, etc.
    console.log('Initializing semantic search embeddings...')
  }

  // Generate embeddings for text (simplified version)
  private async generateEmbedding(text: string): Promise<number[]> {
    // In real implementation, this would call OpenAI Embeddings API or similar
    // For now, we'll create a simple hash-based embedding
    const words = text.toLowerCase().split(/\s+/)
    const embedding = new Array(384).fill(0) // Standard embedding dimension
    
    words.forEach(word => {
      const hash = this.simpleHash(word)
      const index = hash % embedding.length
      embedding[index] += 1
    })
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map(val => val / magnitude)
  }

  private simpleHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  // Calculate cosine similarity between two embeddings
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  // Semantic search with vector similarity
  async semanticSearch(
    query: string, 
    products: ProductData[], 
    filters: SearchFilters,
    limit: number = 20
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query)
    const results: SearchResult[] = []

    for (const product of products) {
      // Skip if doesn't match basic filters
      if (!this.matchesBasicFilters(product, filters)) continue

      // Generate product embedding
      const productText = this.createProductText(product)
      const productEmbedding = await this.generateEmbedding(productText)
      
      // Calculate semantic similarity
      const semanticSimilarity = this.cosineSimilarity(queryEmbedding, productEmbedding)
      
      // Calculate keyword match
      const keywordMatch = this.calculateKeywordMatch(query, product)
      
      // Calculate personalization score (would use user profile in real implementation)
      const personalizationScore = this.calculatePersonalizationScore(product, filters)
      
      // Calculate relevance score
      const relevanceScore = this.calculateRelevanceScore(
        semanticSimilarity,
        keywordMatch,
        personalizationScore
      )

      if (relevanceScore > 0.1) { // Threshold for relevance
        results.push({
          product,
          relevanceScore,
          matchReasons: this.generateMatchReasons(query, product, semanticSimilarity, keywordMatch),
          semanticSimilarity,
          keywordMatch,
          personalizationScore
        })
      }
    }

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    return results.slice(0, limit)
  }

  private createProductText(product: ProductData): string {
    const parts = [
      product.name,
      product.description || '',
      product.style?.join(' ') || '',
      product.occasion?.join(' ') || '',
      product.matchWith?.join(' ') || '',
      product.whyRecommend || ''
    ]
    
    return parts.filter(Boolean).join(' ')
  }

  private calculateKeywordMatch(query: string, product: ProductData): number {
    const queryWords = query.toLowerCase().split(/\s+/)
    const productText = this.createProductText(product).toLowerCase()
    
    let matches = 0
    queryWords.forEach(word => {
      if (productText.includes(word)) {
        matches++
      }
    })
    
    return matches / queryWords.length
  }

  private calculatePersonalizationScore(product: ProductData, filters: SearchFilters): number {
    let score = 0.5 // Base score
    
    // Color preference
    if (filters.color && filters.color.length > 0) {
      const productColors = this.extractColors(product.name + ' ' + (product.description || ''))
      const colorMatch = filters.color.some(color => 
        productColors.some(pColor => pColor.includes(color) || color.includes(pColor))
      )
      if (colorMatch) score += 0.2
    }
    
    // Style preference
    if (filters.style && filters.style.length > 0) {
      const styleMatch = filters.style.some(style => 
        product.style?.includes(style) || 
        product.name.toLowerCase().includes(style) ||
        (product.description || '').toLowerCase().includes(style)
      )
      if (styleMatch) score += 0.2
    }
    
    // Occasion preference
    if (filters.occasion && filters.occasion.length > 0) {
      const occasionMatch = filters.occasion.some(occasion => 
        product.occasion?.includes(occasion) ||
        product.name.toLowerCase().includes(occasion)
      )
      if (occasionMatch) score += 0.1
    }
    
    return Math.min(score, 1.0)
  }

  private extractColors(text: string): string[] {
    const colors = ['trắng', 'đen', 'xanh', 'đỏ', 'vàng', 'hồng', 'tím', 'cam', 'xám', 'nâu', 'navy', 'beige']
    return colors.filter(color => text.toLowerCase().includes(color))
  }

  private calculateRelevanceScore(
    semanticSimilarity: number,
    keywordMatch: number,
    personalizationScore: number
  ): number {
    // Weighted combination
    return (
      semanticSimilarity * 0.4 +
      keywordMatch * 0.3 +
      personalizationScore * 0.3
    )
  }

  private generateMatchReasons(
    query: string,
    product: ProductData,
    semanticSimilarity: number,
    keywordMatch: number
  ): string[] {
    const reasons: string[] = []
    
    if (semanticSimilarity > 0.7) {
      reasons.push('Phù hợp về ý nghĩa')
    }
    
    if (keywordMatch > 0.5) {
      reasons.push('Khớp từ khóa')
    }
    
    if (product.style && product.style.length > 0) {
      reasons.push(`Phong cách: ${product.style.join(', ')}`)
    }
    
    if (product.occasion && product.occasion.length > 0) {
      reasons.push(`Dịp: ${product.occasion.join(', ')}`)
    }
    
    return reasons
  }

  private matchesBasicFilters(product: ProductData, filters: SearchFilters): boolean {
    // Price filter
    if (filters.price) {
      const { min, max } = filters.price
      if (product.price < min || product.price > max) {
        return false
      }
    }
    
    // Size filter
    if (filters.size && filters.size.length > 0) {
      const productSizes = product.variants?.map((v: any) => v.size).filter(Boolean) || []
      const hasMatchingSize = filters.size.some(size => 
        productSizes.some((pSize: any) => pSize?.toLowerCase().includes(size.toLowerCase()))
      )
      if (!hasMatchingSize) return false
    }
    
    // Brand filter
    if (filters.brand && filters.brand.length > 0) {
      const productBrand = product.name.split(' ')[0] // Simple brand extraction
      const hasMatchingBrand = filters.brand.some(brand => 
        productBrand.toLowerCase().includes(brand.toLowerCase())
      )
      if (!hasMatchingBrand) return false
    }
    
    return true
  }

  // Advanced search with multiple strategies
  async advancedSearch(
    query: string,
    products: ProductData[],
    userProfile: UserProfile | null,
    context: ConversationContext | null,
    limit: number = 20
  ): Promise<SearchResult[]> {
    // Generate search strategy
    const strategy = await this.generateSearchStrategy(query, userProfile, context)
    
    // Multi-stage search
    const [semanticResults, keywordResults, collaborativeResults, trendingResults] = await Promise.all([
      this.semanticSearch(query, products, strategy.semanticFilters, limit),
      this.keywordSearch(query, products, strategy.keywordFilters, limit),
      this.collaborativeFiltering(products, userProfile, limit),
      this.trendingProducts(products, strategy.trendingFilters, limit)
    ])
    
    // Fuse and rank results
    return this.fuseAndRankResults(
      [semanticResults, keywordResults, collaborativeResults, trendingResults],
      userProfile,
      context,
      limit
    )
  }

  private async generateSearchStrategy(
    query: string,
    userProfile: UserProfile | null,
    context: ConversationContext | null
  ): Promise<SearchStrategy> {
    const baseFilters: SearchFilters = {}
    
    // Add user preferences
    if (context?.userPreferences) {
      baseFilters.color = context.userPreferences.colorPreferences
      baseFilters.price = context.userPreferences.priceRange
      baseFilters.style = context.userPreferences.preferredStyles
      baseFilters.occasion = context.userPreferences.occasionPreferences
    }
    
    // Add user profile preferences
    if (userProfile) {
      baseFilters.color = [...(baseFilters.color || []), ...userProfile.colorPreferences]
      baseFilters.brand = userProfile.brandPreferences
      baseFilters.personalStyle = [userProfile.stylePersonality]
    }
    
    return {
      semanticFilters: { ...baseFilters },
      keywordFilters: { ...baseFilters },
      trendingFilters: { ...baseFilters, trending: true },
      collaborativeFilters: { ...baseFilters, popularity: true }
    }
  }

  private async keywordSearch(
    query: string,
    products: ProductData[],
    filters: SearchFilters,
    limit: number
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    const queryWords = query.toLowerCase().split(/\s+/)
    
    for (const product of products) {
      if (!this.matchesBasicFilters(product, filters)) continue
      
      const productText = this.createProductText(product).toLowerCase()
      const keywordMatch = this.calculateKeywordMatch(query, product)
      
      if (keywordMatch > 0.1) {
        results.push({
          product,
          relevanceScore: keywordMatch,
          matchReasons: ['Khớp từ khóa'],
          semanticSimilarity: 0,
          keywordMatch,
          personalizationScore: 0.5
        })
      }
    }
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, limit)
  }

  private async collaborativeFiltering(
    products: ProductData[],
    userProfile: UserProfile | null,
    limit: number
  ): Promise<SearchResult[]> {
    if (!userProfile) return []
    
    const results: SearchResult[] = []
    
    // Find products similar to user's purchase history
    for (const purchase of userProfile.purchaseHistory) {
      const similarProducts = products.filter(p => 
        p.id.toString() !== purchase.productId &&
        this.calculateProductSimilarity(p, purchase)
      )
      
      similarProducts.forEach(product => {
        results.push({
          product,
          relevanceScore: 0.8,
          matchReasons: ['Sản phẩm tương tự đã mua'],
          semanticSimilarity: 0,
          keywordMatch: 0,
          personalizationScore: 0.9
        })
      })
    }
    
    return results.slice(0, limit)
  }

  private calculateProductSimilarity(product: ProductData, purchase: PurchaseRecord): boolean {
    // Simple similarity based on price range and style
    const priceDiff = Math.abs(product.price - purchase.price) / purchase.price
    return priceDiff < 0.5 // Within 50% price range
  }

  private async trendingProducts(
    products: ProductData[],
    filters: SearchFilters,
    limit: number
  ): Promise<SearchResult[]> {
    // Sort by some trending metric (in real app, this would be based on sales data)
    const trendingProducts = products
      .filter(p => this.matchesBasicFilters(p, filters))
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, limit)
    
    return trendingProducts.map(product => ({
      product,
      relevanceScore: 0.7,
      matchReasons: ['Đang trending'],
      semanticSimilarity: 0,
      keywordMatch: 0,
      personalizationScore: 0.6
    }))
  }

  private fuseAndRankResults(
    resultSets: SearchResult[][],
    userProfile: UserProfile | null,
    context: ConversationContext | null,
    limit: number
  ): SearchResult[] {
    const productScores = new Map<string, SearchResult>()
    
    // Combine results from different strategies
    resultSets.forEach(results => {
      results.forEach(result => {
        const existing = productScores.get(result.product.id.toString())
        if (existing) {
          // Boost score for multiple matches
          existing.relevanceScore = Math.min(existing.relevanceScore + 0.1, 1.0)
          existing.matchReasons.push(...result.matchReasons)
        } else {
          productScores.set(result.product.id.toString(), result)
        }
      })
    })
    
    // Convert to array and sort
    const finalResults = Array.from(productScores.values())
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    return finalResults.slice(0, limit)
  }
}

// Export singleton instance
export const semanticSearchEngine = new SemanticSearchEngine()

// Utility functions
export const createSearchFilters = (
  query: string,
  context: ConversationContext | null,
  userProfile: UserProfile | null
): SearchFilters => {
  const filters: SearchFilters = {}
  
  // Extract filters from query
  const normalizedQuery = query.toLowerCase()
  
  // Price extraction
  const priceMatch = normalizedQuery.match(/(\d+)k|dưới\s*(\d+)k|trên\s*(\d+)k/)
  if (priceMatch) {
    const price = parseInt(priceMatch[1] || priceMatch[2] || priceMatch[3]) * 1000
    if (normalizedQuery.includes('dưới')) {
      filters.price = { min: 0, max: price }
    } else if (normalizedQuery.includes('trên')) {
      filters.price = { min: price, max: 2000000 }
    } else {
      filters.price = { min: price * 0.8, max: price * 1.2 }
    }
  }
  
  // Color extraction
  const colors = ['trắng', 'đen', 'xanh', 'đỏ', 'vàng', 'hồng', 'tím', 'cam', 'xám', 'nâu', 'navy']
  const foundColors = colors.filter(color => normalizedQuery.includes(color))
  if (foundColors.length > 0) {
    filters.color = foundColors
  }
  
  // Size extraction
  const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl']
  const foundSizes = sizes.filter(size => normalizedQuery.includes(`size ${size}`))
  if (foundSizes.length > 0) {
    filters.size = foundSizes
  }
  
  // Style extraction
  const styles = ['casual', 'formal', 'sport', 'vintage', 'modern', 'classic', 'street', 'business']
  const foundStyles = styles.filter(style => normalizedQuery.includes(style))
  if (foundStyles.length > 0) {
    filters.style = foundStyles
  }
  
  // Occasion extraction
  const occasions = ['đi làm', 'đi chơi', 'dự tiệc', 'thể thao', 'du lịch', 'hẹn hò']
  const foundOccasions = occasions.filter(occasion => normalizedQuery.includes(occasion))
  if (foundOccasions.length > 0) {
    filters.occasion = foundOccasions
  }
  
  // Add context preferences
  if (context?.userPreferences) {
    filters.color = [...(filters.color || []), ...context.userPreferences.colorPreferences]
    filters.style = [...(filters.style || []), ...context.userPreferences.preferredStyles]
    filters.occasion = [...(filters.occasion || []), ...context.userPreferences.occasionPreferences]
    if (!filters.price) {
      filters.price = context.userPreferences.priceRange
    }
  }
  
  // Add user profile preferences
  if (userProfile) {
    filters.color = [...(filters.color || []), ...userProfile.colorPreferences]
    filters.brand = userProfile.brandPreferences
    filters.personalStyle = [userProfile.stylePersonality]
  }
  
  return filters
}
