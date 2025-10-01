import { UserProfile, PurchaseRecord, SearchRecord, RatingRecord, ConversationContext } from './conversationMemory'

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
import { SearchResult } from './semanticSearch'

export interface PersonalizationScore {
  overallScore: number
  styleMatch: number
  colorMatch: number
  priceMatch: number
  brandMatch: number
  occasionMatch: number
  behavioralMatch: number
  reasons: string[]
}

export interface RecommendationContext {
  userProfile: UserProfile
  conversationContext: ConversationContext
  currentQuery: string
  recentInteractions: string[]
}

class PersonalizationEngine {
  private userProfiles: Map<string, UserProfile> = new Map()
  private productFeatures: Map<string, ProductFeatures> = new Map()

  // Initialize product features
  async initializeProductFeatures(products: ProductData[]): Promise<void> {
    for (const product of products) {
      const features = this.extractProductFeatures(product)
      this.productFeatures.set(product.id.toString(), features)
    }
  }

  private extractProductFeatures(product: ProductData): ProductFeatures {
    return {
      id: product.id.toString(),
      name: product.name,
      price: product.price,
      colors: this.extractColors(product),
      styles: product.style || [],
      occasions: product.occasion || [],
      materials: this.extractMaterials(product),
      brands: this.extractBrands(product),
      priceCategory: this.categorizePrice(product.price),
      popularity: product.sold || 0,
      rating: product.rating || 0
    }
  }

  private extractColors(product: ProductData): string[] {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase()
    const colors = ['trắng', 'đen', 'xanh', 'đỏ', 'vàng', 'hồng', 'tím', 'cam', 'xám', 'nâu', 'navy', 'beige']
    return colors.filter(color => text.includes(color))
  }

  private extractMaterials(product: ProductData): string[] {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase()
    const materials = ['cotton', 'polyester', 'len', 'ni', 'da', 'jeans', 'silk', 'wool', 'cashmere']
    return materials.filter(material => text.includes(material))
  }

  private extractBrands(product: ProductData): string[] {
    // Simple brand extraction - first word of product name
    return [product.name.split(' ')[0].toLowerCase()]
  }

  private categorizePrice(price: number): 'budget' | 'mid' | 'premium' | 'luxury' {
    if (price < 300000) return 'budget'
    if (price < 800000) return 'mid'
    if (price < 1500000) return 'premium'
    return 'luxury'
  }

  // Build comprehensive user profile
  async buildUserProfile(
    userId: string,
    conversationContext: ConversationContext,
    additionalData?: Partial<UserProfile>
  ): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId)
    
    if (!profile) {
      profile = {
        id: userId,
        stylePersonality: 'casual',
        colorPreferences: [],
        brandPreferences: [],
        purchaseHistory: [],
        searchHistory: [],
        ratingHistory: [],
        ...additionalData
      }
    }

    // Analyze conversation context to update profile
    profile = await this.analyzeConversationContext(profile, conversationContext)
    
    // Analyze behavioral patterns
    profile = await this.analyzeBehavioralPatterns(profile)
    
    // Update preferences based on interactions
    profile = await this.updatePreferencesFromInteractions(profile, conversationContext)
    
    this.userProfiles.set(userId, profile)
    return profile
  }

  private async analyzeConversationContext(
    profile: UserProfile,
    context: ConversationContext
  ): Promise<UserProfile> {
    const updatedProfile = { ...profile }

    // Update color preferences
    if (context.userPreferences.colorPreferences.length > 0) {
      updatedProfile.colorPreferences = Array.from(
        new Set([...updatedProfile.colorPreferences, ...context.userPreferences.colorPreferences])
      )
    }

    // Update style preferences
    if (context.userPreferences.preferredStyles.length > 0) {
      const styleCounts = new Map<string, number>()
      context.userPreferences.preferredStyles.forEach(style => {
        styleCounts.set(style, (styleCounts.get(style) || 0) + 1)
      })
      
      // Determine dominant style personality
      const dominantStyle = Array.from(styleCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0]
      
      if (dominantStyle) {
        updatedProfile.stylePersonality = this.mapStyleToPersonality(dominantStyle)
      }
    }

    // Update brand preferences from search history
    const recentBrands = context.recentSearches
      .flatMap(search => this.extractBrandsFromQuery(search.query))
      .filter(Boolean)
    
    updatedProfile.brandPreferences = Array.from(
      new Set([...updatedProfile.brandPreferences, ...recentBrands])
    )

    return updatedProfile
  }

  private mapStyleToPersonality(style: string): UserProfile['stylePersonality'] {
    const styleMap: Record<string, UserProfile['stylePersonality']> = {
      'casual': 'casual',
      'formal': 'classic',
      'sport': 'casual',
      'vintage': 'classic',
      'modern': 'trendy',
      'classic': 'classic',
      'street': 'bold',
      'business': 'classic',
      'minimalist': 'minimalist'
    }
    return styleMap[style] || 'casual'
  }

  private extractBrandsFromQuery(query: string): string[] {
    // Simple brand extraction from query
    const brands = ['nike', 'adidas', 'uniqlo', 'zara', 'h&m', 'levis', 'calvin klein', 'tommy hilfiger']
    return brands.filter(brand => query.toLowerCase().includes(brand))
  }

  private async analyzeBehavioralPatterns(profile: UserProfile): Promise<UserProfile> {
    const updatedProfile = { ...profile }

    // Analyze purchase patterns
    if (profile.purchaseHistory.length > 0) {
      const avgPrice = profile.purchaseHistory.reduce((sum, p) => sum + p.price, 0) / profile.purchaseHistory.length
      const priceCategory = this.categorizePrice(avgPrice)
      
      // Update preferences based on purchase history
      const purchasedColors = profile.purchaseHistory
        .flatMap(p => this.extractColorsFromPurchase(p))
        .filter(Boolean)
      
      updatedProfile.colorPreferences = Array.from(
        new Set([...updatedProfile.colorPreferences, ...purchasedColors])
      )
    }

    // Analyze search patterns
    if (profile.searchHistory.length > 0) {
      const recentSearches = profile.searchHistory.slice(-10)
      const searchKeywords = recentSearches.flatMap(s => s.query.split(' '))
      
      // Find most searched terms
      const keywordCounts = new Map<string, number>()
      searchKeywords.forEach(keyword => {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1)
      })
      
      const topKeywords = Array.from(keywordCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([keyword]) => keyword)
      
      // Update preferences based on search patterns
      topKeywords.forEach(keyword => {
        if (this.isColorKeyword(keyword)) {
          updatedProfile.colorPreferences.push(keyword)
        }
        if (this.isStyleKeyword(keyword)) {
          updatedProfile.stylePersonality = this.mapStyleToPersonality(keyword)
        }
      })
    }

    return updatedProfile
  }

  private extractColorsFromPurchase(purchase: PurchaseRecord): string[] {
    // In real implementation, this would extract colors from product data
    return []
  }

  private isColorKeyword(keyword: string): boolean {
    const colors = ['trắng', 'đen', 'xanh', 'đỏ', 'vàng', 'hồng', 'tím', 'cam', 'xám', 'nâu']
    return colors.includes(keyword.toLowerCase())
  }

  private isStyleKeyword(keyword: string): boolean {
    const styles = ['casual', 'formal', 'sport', 'vintage', 'modern', 'classic', 'street']
    return styles.includes(keyword.toLowerCase())
  }

  private async updatePreferencesFromInteractions(
    profile: UserProfile,
    context: ConversationContext
  ): Promise<UserProfile> {
    const updatedProfile = { ...profile }

    // Update based on clicked products
    if (context.lastProductInteractions.length > 0) {
      const clickedProducts = context.lastProductInteractions.slice(-5)
      
      // Analyze clicked products to update preferences
      clickedProducts.forEach(productId => {
        const productFeatures = this.productFeatures.get(productId)
        if (productFeatures) {
          // Update color preferences
          updatedProfile.colorPreferences = Array.from(
            new Set([...updatedProfile.colorPreferences, ...productFeatures.colors])
          )
          
          // Update brand preferences
          updatedProfile.brandPreferences = Array.from(
            new Set([...updatedProfile.brandPreferences, ...productFeatures.brands])
          )
        }
      })
    }

    return updatedProfile
  }

  // Calculate personalization score for a product
  calculatePersonalizationScore(
    product: ProductData,
    userProfile: UserProfile,
    context: ConversationContext
  ): PersonalizationScore {
    const productFeatures = this.productFeatures.get(product.id.toString())
    if (!productFeatures) {
      return {
        overallScore: 0.5,
        styleMatch: 0.5,
        colorMatch: 0.5,
        priceMatch: 0.5,
        brandMatch: 0.5,
        occasionMatch: 0.5,
        behavioralMatch: 0.5,
        reasons: ['Không có thông tin sản phẩm']
      }
    }

    const styleMatch = this.calculateStyleMatch(productFeatures, userProfile)
    const colorMatch = this.calculateColorMatch(productFeatures, userProfile)
    const priceMatch = this.calculatePriceMatch(productFeatures, userProfile, context)
    const brandMatch = this.calculateBrandMatch(productFeatures, userProfile)
    const occasionMatch = this.calculateOccasionMatch(productFeatures, context)
    const behavioralMatch = this.calculateBehavioralMatch(productFeatures, userProfile)

    const overallScore = (
      styleMatch * 0.25 +
      colorMatch * 0.2 +
      priceMatch * 0.2 +
      brandMatch * 0.15 +
      occasionMatch * 0.1 +
      behavioralMatch * 0.1
    )

    const reasons = this.generatePersonalizationReasons(
      productFeatures,
      userProfile,
      { styleMatch, colorMatch, priceMatch, brandMatch, occasionMatch, behavioralMatch }
    )

    return {
      overallScore,
      styleMatch,
      colorMatch,
      priceMatch,
      brandMatch,
      occasionMatch,
      behavioralMatch,
      reasons
    }
  }

  private calculateStyleMatch(productFeatures: ProductFeatures, userProfile: UserProfile): number {
    const userStyle = userProfile.stylePersonality
    const productStyles = productFeatures.styles
    
    const styleCompatibility: Record<string, string[]> = {
      'casual': ['casual', 'sport', 'street'],
      'classic': ['classic', 'formal', 'business'],
      'trendy': ['modern', 'street', 'casual'],
      'minimalist': ['classic', 'modern', 'casual'],
      'bold': ['street', 'modern', 'vintage']
    }
    
    const compatibleStyles = styleCompatibility[userStyle] || []
    const hasCompatibleStyle = productStyles.some(style => 
      compatibleStyles.includes(style.toLowerCase())
    )
    
    return hasCompatibleStyle ? 0.9 : 0.3
  }

  private calculateColorMatch(productFeatures: ProductFeatures, userProfile: UserProfile): number {
    if (userProfile.colorPreferences.length === 0) return 0.5
    
    const productColors = productFeatures.colors
    const userColors = userProfile.colorPreferences
    
    const colorMatches = productColors.filter(color => 
      userColors.some(userColor => 
        color.toLowerCase().includes(userColor.toLowerCase()) ||
        userColor.toLowerCase().includes(color.toLowerCase())
      )
    )
    
    return colorMatches.length > 0 ? 0.9 : 0.2
  }

  private calculatePriceMatch(
    productFeatures: ProductFeatures,
    userProfile: UserProfile,
    context: ConversationContext
  ): number {
    const productPrice = productFeatures.price
    const userPriceRange = context.userPreferences.priceRange
    
    if (productPrice >= userPriceRange.min && productPrice <= userPriceRange.max) {
      return 0.9
    }
    
    // Check if price is close to user's typical spending
    if (userProfile.purchaseHistory.length > 0) {
      const avgPurchasePrice = userProfile.purchaseHistory.reduce((sum, p) => sum + p.price, 0) / userProfile.purchaseHistory.length
      const priceDiff = Math.abs(productPrice - avgPurchasePrice) / avgPurchasePrice
      
      if (priceDiff < 0.3) return 0.8
      if (priceDiff < 0.5) return 0.6
    }
    
    return 0.3
  }

  private calculateBrandMatch(productFeatures: ProductFeatures, userProfile: UserProfile): number {
    if (userProfile.brandPreferences.length === 0) return 0.5
    
    const productBrands = productFeatures.brands
    const userBrands = userProfile.brandPreferences
    
    const brandMatches = productBrands.filter(brand => 
      userBrands.some(userBrand => 
        brand.toLowerCase().includes(userBrand.toLowerCase()) ||
        userBrand.toLowerCase().includes(brand.toLowerCase())
      )
    )
    
    return brandMatches.length > 0 ? 0.9 : 0.3
  }

  private calculateOccasionMatch(productFeatures: ProductFeatures, context: ConversationContext): number {
    const productOccasions = productFeatures.occasions
    const userOccasions = context.userPreferences.occasionPreferences
    
    if (userOccasions.length === 0) return 0.5
    
    const occasionMatches = productOccasions.filter(occasion => 
      userOccasions.some(userOccasion => 
        occasion.toLowerCase().includes(userOccasion.toLowerCase()) ||
        userOccasion.toLowerCase().includes(occasion.toLowerCase())
      )
    )
    
    return occasionMatches.length > 0 ? 0.9 : 0.3
  }

  private calculateBehavioralMatch(productFeatures: ProductFeatures, userProfile: UserProfile): number {
    let score = 0.5
    
    // Check if user has interacted with similar products
    const similarProducts = userProfile.searchHistory
      .flatMap(search => search.clickedProducts)
      .filter(productId => {
        const features = this.productFeatures.get(productId)
        return features && this.areProductsSimilar(productFeatures, features)
      })
    
    if (similarProducts.length > 0) {
      score += 0.3
    }
    
    // Check rating history for similar products
    const ratedSimilarProducts = userProfile.ratingHistory
      .filter(rating => {
        const features = this.productFeatures.get(rating.productId)
        return features && this.areProductsSimilar(productFeatures, features)
      })
    
    if (ratedSimilarProducts.length > 0) {
      const avgRating = ratedSimilarProducts.reduce((sum, r) => sum + r.rating, 0) / ratedSimilarProducts.length
      score += (avgRating - 3) * 0.1 // Boost for high ratings, penalize for low ratings
    }
    
    return Math.min(Math.max(score, 0), 1)
  }

  private areProductsSimilar(features1: ProductFeatures, features2: ProductFeatures): boolean {
    // Check price similarity
    const priceDiff = Math.abs(features1.price - features2.price) / Math.max(features1.price, features2.price)
    if (priceDiff > 0.5) return false
    
    // Check style similarity
    const styleSimilarity = features1.styles.some(style1 => 
      features2.styles.some(style2 => style1.toLowerCase() === style2.toLowerCase())
    )
    
    // Check color similarity
    const colorSimilarity = features1.colors.some(color1 => 
      features2.colors.some(color2 => color1.toLowerCase() === color2.toLowerCase())
    )
    
    return styleSimilarity || colorSimilarity
  }

  private generatePersonalizationReasons(
    productFeatures: ProductFeatures,
    userProfile: UserProfile,
    scores: {
      styleMatch: number
      colorMatch: number
      priceMatch: number
      brandMatch: number
      occasionMatch: number
      behavioralMatch: number
    }
  ): string[] {
    const reasons: string[] = []
    
    if (scores.styleMatch > 0.7) {
      reasons.push(`Phù hợp với phong cách ${userProfile.stylePersonality}`)
    }
    
    if (scores.colorMatch > 0.7) {
      const matchingColors = productFeatures.colors.filter(color => 
        userProfile.colorPreferences.some(userColor => 
          color.toLowerCase().includes(userColor.toLowerCase())
        )
      )
      if (matchingColors.length > 0) {
        reasons.push(`Màu sắc bạn thích: ${matchingColors.join(', ')}`)
      }
    }
    
    if (scores.priceMatch > 0.7) {
      reasons.push('Phù hợp với ngân sách của bạn')
    }
    
    if (scores.brandMatch > 0.7) {
      const matchingBrands = productFeatures.brands.filter(brand => 
        userProfile.brandPreferences.some(userBrand => 
          brand.toLowerCase().includes(userBrand.toLowerCase())
        )
      )
      if (matchingBrands.length > 0) {
        reasons.push(`Thương hiệu bạn yêu thích: ${matchingBrands.join(', ')}`)
      }
    }
    
    if (scores.behavioralMatch > 0.7) {
      reasons.push('Dựa trên sản phẩm bạn đã quan tâm')
    }
    
    return reasons
  }

  // Generate personalized recommendations
  async generatePersonalizedRecommendations(
    products: ProductData[],
    userProfile: UserProfile,
    context: ConversationContext,
    limit: number = 10
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = []
    
    for (const product of products) {
      const personalizationScore = this.calculatePersonalizationScore(product, userProfile, context)
      
      if (personalizationScore.overallScore > 0.3) {
        results.push({
          product,
          relevanceScore: personalizationScore.overallScore,
          matchReasons: personalizationScore.reasons,
          semanticSimilarity: 0,
          keywordMatch: 0,
          personalizationScore: personalizationScore.overallScore
        })
      }
    }
    
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit)
  }

  // Update user profile with new interaction
  updateUserProfile(
    userId: string,
    interaction: {
      type: 'search' | 'click' | 'purchase' | 'rating'
      productId?: string
      query?: string
      rating?: number
      price?: number
    }
  ): void {
    const profile = this.userProfiles.get(userId)
    if (!profile) return

    switch (interaction.type) {
      case 'search':
        if (interaction.query) {
          profile.searchHistory.push({
            query: interaction.query,
            timestamp: new Date(),
            resultsCount: 0,
            clickedProducts: []
          })
        }
        break
        
      case 'click':
        if (interaction.productId) {
          const lastSearch = profile.searchHistory[profile.searchHistory.length - 1]
          if (lastSearch) {
            lastSearch.clickedProducts.push(interaction.productId)
          }
        }
        break
        
      case 'purchase':
        if (interaction.productId && interaction.price) {
          profile.purchaseHistory.push({
            productId: interaction.productId,
            timestamp: new Date(),
            price: interaction.price
          })
        }
        break
        
      case 'rating':
        if (interaction.productId && interaction.rating) {
          profile.ratingHistory.push({
            productId: interaction.productId,
            rating: interaction.rating,
            timestamp: new Date()
          })
        }
        break
    }

    this.userProfiles.set(userId, profile)
  }

  // Get user profile
  getUserProfile(userId: string): UserProfile | null {
    return this.userProfiles.get(userId) || null
  }
}

interface ProductFeatures {
  id: string
  name: string
  price: number
  colors: string[]
  styles: string[]
  occasions: string[]
  materials: string[]
  brands: string[]
  priceCategory: 'budget' | 'mid' | 'premium' | 'luxury'
  popularity: number
  rating: number
}

// Export singleton instance
export const personalizationEngine = new PersonalizationEngine()

// Utility functions
export const createRecommendationContext = (
  userProfile: UserProfile,
  conversationContext: ConversationContext,
  currentQuery: string
): RecommendationContext => {
  return {
    userProfile,
    conversationContext,
    currentQuery,
    recentInteractions: conversationContext.lastProductInteractions.slice(-5)
  }
}
