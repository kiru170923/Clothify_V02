import { ConversationContext, UserProfile } from './conversationMemory'
import { SearchResult, SearchFilters } from './semanticSearch'

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

export interface AdvancedFilters extends SearchFilters {
  // ML-based filters
  bodyType?: 'slim' | 'athletic' | 'regular' | 'plus'
  skinTone?: 'light' | 'medium' | 'dark'
  personalStyle?: string[]
  
  // Behavioral filters
  popularity?: boolean
  trending?: boolean
  userRating?: number
  
  // Advanced filters
  material?: string[]
  season?: string[]
  brand?: string[]
  priceCategory?: 'budget' | 'mid' | 'premium' | 'luxury'
  
  // Contextual filters
  occasion?: string[]
  weather?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
  
  // Quality filters
  durability?: 'low' | 'medium' | 'high'
  comfort?: 'low' | 'medium' | 'high'
  style?: string[]
}

export interface RankingCriteria {
  relevance: number
  personalization: number
  popularity: number
  price: number
  quality: number
  availability: number
  trending: number
}

export interface FilteredResult {
  product: ProductData
  relevanceScore: number
  rankingScore: number
  matchReasons: string[]
  filterMatches: FilterMatch[]
  personalizedScore: number
}

export interface FilterMatch {
  filterType: string
  filterValue: string
  matchScore: number
  description: string
}

export interface RankingWeights {
  relevance: number
  personalization: number
  popularity: number
  price: number
  quality: number
  availability: number
  trending: number
}

class AdvancedFilteringEngine {
  private rankingWeights: RankingWeights = {
    relevance: 0.3,
    personalization: 0.25,
    popularity: 0.15,
    price: 0.1,
    quality: 0.1,
    availability: 0.05,
    trending: 0.05
  }

  // Apply advanced filters to products
  async applyAdvancedFilters(
    products: ProductData[],
    filters: AdvancedFilters,
    userProfile: UserProfile | null,
    context: ConversationContext | null
  ): Promise<FilteredResult[]> {
    const results: FilteredResult[] = []

    for (const product of products) {
      const filterMatches = this.evaluateFilters(product, filters, userProfile, context)
      
      // Calculate relevance score based on filter matches
      const relevanceScore = this.calculateRelevanceScore(filterMatches)
      
      // Calculate personalized score
      const personalizedScore = this.calculatePersonalizedScore(product, userProfile, context)
      
      // Calculate ranking score
      const rankingScore = this.calculateRankingScore(product, filterMatches, personalizedScore)
      
      // Generate match reasons
      const matchReasons = this.generateMatchReasons(filterMatches, personalizedScore)
      
      if (relevanceScore > 0.1) { // Minimum threshold
        results.push({
          product,
          relevanceScore,
          rankingScore,
          matchReasons,
          filterMatches,
          personalizedScore
        })
      }
    }

    // Sort by ranking score
    return results.sort((a, b) => b.rankingScore - a.rankingScore)
  }

  private evaluateFilters(
    product: ProductData,
    filters: AdvancedFilters,
    userProfile: UserProfile | null,
    context: ConversationContext | null
  ): FilterMatch[] {
    const matches: FilterMatch[] = []

    // Price filter
    if (filters.price) {
      const priceMatch = this.evaluatePriceFilter(product, filters.price)
      if (priceMatch.matchScore > 0) {
        matches.push(priceMatch)
      }
    }

    // Color filter
    if (filters.color && filters.color.length > 0) {
      const colorMatch = this.evaluateColorFilter(product, filters.color)
      if (colorMatch.matchScore > 0) {
        matches.push(colorMatch)
      }
    }

    // Size filter
    if (filters.size && filters.size.length > 0) {
      const sizeMatch = this.evaluateSizeFilter(product, filters.size)
      if (sizeMatch.matchScore > 0) {
        matches.push(sizeMatch)
      }
    }

    // Style filter
    if (filters.style && filters.style.length > 0) {
      const styleMatch = this.evaluateStyleFilter(product, filters.style)
      if (styleMatch.matchScore > 0) {
        matches.push(styleMatch)
      }
    }

    // Occasion filter
    if (filters.occasion && filters.occasion.length > 0) {
      const occasionMatch = this.evaluateOccasionFilter(product, filters.occasion)
      if (occasionMatch.matchScore > 0) {
        matches.push(occasionMatch)
      }
    }

    // Brand filter
    if (filters.brand && filters.brand.length > 0) {
      const brandMatch = this.evaluateBrandFilter(product, filters.brand)
      if (brandMatch.matchScore > 0) {
        matches.push(brandMatch)
      }
    }

    // Material filter
    if (filters.material && filters.material.length > 0) {
      const materialMatch = this.evaluateMaterialFilter(product, filters.material)
      if (materialMatch.matchScore > 0) {
        matches.push(materialMatch)
      }
    }

    // Season filter
    if (filters.season && filters.season.length > 0) {
      const seasonMatch = this.evaluateSeasonFilter(product, filters.season)
      if (seasonMatch.matchScore > 0) {
        matches.push(seasonMatch)
      }
    }

    // Body type filter
    if (filters.bodyType) {
      const bodyTypeMatch = this.evaluateBodyTypeFilter(product, filters.bodyType)
      if (bodyTypeMatch.matchScore > 0) {
        matches.push(bodyTypeMatch)
      }
    }

    // Personal style filter
    if (filters.personalStyle && filters.personalStyle.length > 0) {
      const personalStyleMatch = this.evaluatePersonalStyleFilter(product, filters.personalStyle)
      if (personalStyleMatch.matchScore > 0) {
        matches.push(personalStyleMatch)
      }
    }

    // Popularity filter
    if (filters.popularity) {
      const popularityMatch = this.evaluatePopularityFilter(product)
      if (popularityMatch.matchScore > 0) {
        matches.push(popularityMatch)
      }
    }

    // Trending filter
    if (filters.trending) {
      const trendingMatch = this.evaluateTrendingFilter(product)
      if (trendingMatch.matchScore > 0) {
        matches.push(trendingMatch)
      }
    }

    // User rating filter
    if (filters.userRating) {
      const ratingMatch = this.evaluateRatingFilter(product, filters.userRating)
      if (ratingMatch.matchScore > 0) {
        matches.push(ratingMatch)
      }
    }

    return matches
  }

  private evaluatePriceFilter(product: ProductData, priceRange: { min: number; max: number }): FilterMatch {
    const { min, max } = priceRange
    const productPrice = product.price
    
    let matchScore = 0
    let description = ''
    
    if (productPrice >= min && productPrice <= max) {
      matchScore = 1.0
      description = `Giá ${this.formatPrice(productPrice)} trong khoảng ${this.formatPrice(min)} - ${this.formatPrice(max)}`
    } else if (productPrice < min) {
      matchScore = 0.3
      description = `Giá ${this.formatPrice(productPrice)} thấp hơn ngân sách`
    } else if (productPrice > max) {
      matchScore = 0.1
      description = `Giá ${this.formatPrice(productPrice)} cao hơn ngân sách`
    }
    
    return {
      filterType: 'price',
      filterValue: `${min}-${max}`,
      matchScore,
      description
    }
  }

  private evaluateColorFilter(product: ProductData, colors: string[]): FilterMatch {
    const productColors = this.extractColors(product)
    const matchingColors = colors.filter(color => 
      productColors.some(pColor => 
        pColor.toLowerCase().includes(color.toLowerCase()) ||
        color.toLowerCase().includes(pColor.toLowerCase())
      )
    )
    
    const matchScore = matchingColors.length / colors.length
    const description = matchingColors.length > 0 
      ? `Màu ${matchingColors.join(', ')}`
      : 'Không khớp màu sắc'
    
    return {
      filterType: 'color',
      filterValue: colors.join(','),
      matchScore,
      description
    }
  }

  private evaluateSizeFilter(product: ProductData, sizes: string[]): FilterMatch {
    const productSizes = product.variants?.map(v => v.size).filter(Boolean) || []
    const matchingSizes = sizes.filter(size => 
      productSizes.some(pSize => 
        pSize?.toLowerCase().includes(size.toLowerCase()) ||
        size.toLowerCase().includes(pSize?.toLowerCase() || '')
      )
    )
    
    const matchScore = matchingSizes.length / sizes.length
    const description = matchingSizes.length > 0 
      ? `Size ${matchingSizes.join(', ')}`
      : 'Không có size phù hợp'
    
    return {
      filterType: 'size',
      filterValue: sizes.join(','),
      matchScore,
      description
    }
  }

  private evaluateStyleFilter(product: ProductData, styles: string[]): FilterMatch {
    const productStyles = product.style || []
    const matchingStyles = styles.filter(style => 
      productStyles.some(pStyle => 
        pStyle.toLowerCase().includes(style.toLowerCase()) ||
        style.toLowerCase().includes(pStyle.toLowerCase())
      )
    )
    
    const matchScore = matchingStyles.length / styles.length
    const description = matchingStyles.length > 0 
      ? `Phong cách ${matchingStyles.join(', ')}`
      : 'Không khớp phong cách'
    
    return {
      filterType: 'style',
      filterValue: styles.join(','),
      matchScore,
      description
    }
  }

  private evaluateOccasionFilter(product: ProductData, occasions: string[]): FilterMatch {
    const productOccasions = product.occasion || []
    const matchingOccasions = occasions.filter(occasion => 
      productOccasions.some(pOccasion => 
        pOccasion.toLowerCase().includes(occasion.toLowerCase()) ||
        occasion.toLowerCase().includes(pOccasion.toLowerCase())
      )
    )
    
    const matchScore = matchingOccasions.length / occasions.length
    const description = matchingOccasions.length > 0 
      ? `Dịp ${matchingOccasions.join(', ')}`
      : 'Không khớp dịp sử dụng'
    
    return {
      filterType: 'occasion',
      filterValue: occasions.join(','),
      matchScore,
      description
    }
  }

  private evaluateBrandFilter(product: ProductData, brands: string[]): FilterMatch {
    const productBrand = this.extractBrand(product)
    const matchingBrands = brands.filter(brand => 
      productBrand.toLowerCase().includes(brand.toLowerCase()) ||
      brand.toLowerCase().includes(productBrand.toLowerCase())
    )
    
    const matchScore = matchingBrands.length / brands.length
    const description = matchingBrands.length > 0 
      ? `Thương hiệu ${matchingBrands.join(', ')}`
      : 'Không khớp thương hiệu'
    
    return {
      filterType: 'brand',
      filterValue: brands.join(','),
      matchScore,
      description
    }
  }

  private evaluateMaterialFilter(product: ProductData, materials: string[]): FilterMatch {
    const productMaterials = this.extractMaterials(product)
    const matchingMaterials = materials.filter(material => 
      productMaterials.some(pMaterial => 
        pMaterial.toLowerCase().includes(material.toLowerCase()) ||
        material.toLowerCase().includes(pMaterial.toLowerCase())
      )
    )
    
    const matchScore = matchingMaterials.length / materials.length
    const description = matchingMaterials.length > 0 
      ? `Chất liệu ${matchingMaterials.join(', ')}`
      : 'Không khớp chất liệu'
    
    return {
      filterType: 'material',
      filterValue: materials.join(','),
      matchScore,
      description
    }
  }

  private evaluateSeasonFilter(product: ProductData, seasons: string[]): FilterMatch {
    const productSeasons = this.extractSeasons(product)
    const matchingSeasons = seasons.filter(season => 
      productSeasons.some(pSeason => 
        pSeason.toLowerCase().includes(season.toLowerCase()) ||
        season.toLowerCase().includes(pSeason.toLowerCase())
      )
    )
    
    const matchScore = matchingSeasons.length / seasons.length
    const description = matchingSeasons.length > 0 
      ? `Mùa ${matchingSeasons.join(', ')}`
      : 'Không khớp mùa'
    
    return {
      filterType: 'season',
      filterValue: seasons.join(','),
      matchScore,
      description
    }
  }

  private evaluateBodyTypeFilter(product: ProductData, bodyType: string): FilterMatch {
    const productFit = this.extractFit(product)
    const compatibility = this.getBodyTypeCompatibility(bodyType, productFit)
    
    return {
      filterType: 'bodyType',
      filterValue: bodyType,
      matchScore: compatibility.score,
      description: compatibility.description
    }
  }

  private evaluatePersonalStyleFilter(product: ProductData, personalStyles: string[]): FilterMatch {
    const productStyle = this.extractStyle(product)
    const matchingStyles = personalStyles.filter(style => 
      this.areStylesCompatible(style, productStyle)
    )
    
    const matchScore = matchingStyles.length / personalStyles.length
    const description = matchingStyles.length > 0 
      ? `Phong cách cá nhân ${matchingStyles.join(', ')}`
      : 'Không khớp phong cách cá nhân'
    
    return {
      filterType: 'personalStyle',
      filterValue: personalStyles.join(','),
      matchScore,
      description
    }
  }

  private evaluatePopularityFilter(product: ProductData): FilterMatch {
    const popularity = product.sold || 0
    const matchScore = Math.min(popularity / 1000, 1.0) // Normalize to 0-1
    
    return {
      filterType: 'popularity',
      filterValue: 'popular',
      matchScore,
      description: `Đã bán ${popularity} sản phẩm`
    }
  }

  private evaluateTrendingFilter(product: ProductData): FilterMatch {
    // Simple trending logic based on recent sales
    const recentSales = product.sold || 0
    const matchScore = recentSales > 100 ? 0.8 : recentSales > 50 ? 0.6 : 0.3
    
    return {
      filterType: 'trending',
      filterValue: 'trending',
      matchScore,
      description: recentSales > 100 ? 'Đang trending' : 'Khá phổ biến'
    }
  }

  private evaluateRatingFilter(product: ProductData, minRating: number): FilterMatch {
    const rating = product.rating || 0
    const matchScore = rating >= minRating ? 1.0 : rating / minRating
    
    return {
      filterType: 'userRating',
      filterValue: minRating.toString(),
      matchScore,
      description: `Đánh giá ${rating}/5`
    }
  }

  private calculateRelevanceScore(filterMatches: FilterMatch[]): number {
    if (filterMatches.length === 0) return 0
    
    const totalScore = filterMatches.reduce((sum, match) => sum + match.matchScore, 0)
    return totalScore / filterMatches.length
  }

  private calculatePersonalizedScore(
    product: ProductData,
    userProfile: UserProfile | null,
    context: ConversationContext | null
  ): number {
    if (!userProfile && !context) return 0.5
    
    let score = 0.5
    
    // Color preference
    if (userProfile?.colorPreferences.length || context?.userPreferences.colorPreferences.length) {
      const userColors = [...(userProfile?.colorPreferences || []), ...(context?.userPreferences.colorPreferences || [])]
      const productColors = this.extractColors(product)
      const colorMatch = productColors.some(color => 
        userColors.some(userColor => 
          color.toLowerCase().includes(userColor.toLowerCase()) ||
          userColor.toLowerCase().includes(color.toLowerCase())
        )
      )
      if (colorMatch) score += 0.2
    }
    
    // Style preference
    if (userProfile?.stylePersonality) {
      const productStyle = this.extractStyle(product)
      const styleMatch = this.areStylesCompatible(userProfile.stylePersonality, productStyle)
      if (styleMatch) score += 0.2
    }
    
    // Brand preference
    if (userProfile?.brandPreferences.length) {
      const productBrand = this.extractBrand(product)
      const brandMatch = userProfile.brandPreferences.some(brand => 
        productBrand.toLowerCase().includes(brand.toLowerCase()) ||
        brand.toLowerCase().includes(productBrand.toLowerCase())
      )
      if (brandMatch) score += 0.1
    }
    
    return Math.min(score, 1.0)
  }

  private calculateRankingScore(
    product: ProductData,
    filterMatches: FilterMatch[],
    personalizedScore: number
  ): number {
    const relevanceScore = this.calculateRelevanceScore(filterMatches)
    const popularityScore = Math.min((product.sold || 0) / 1000, 1.0)
    const qualityScore = (product.rating || 0) / 5
    const priceScore = this.calculatePriceScore(product.price)
    const availabilityScore = 1.0 // Assume always available
    
    return (
      relevanceScore * this.rankingWeights.relevance +
      personalizedScore * this.rankingWeights.personalization +
      popularityScore * this.rankingWeights.popularity +
      qualityScore * this.rankingWeights.quality +
      priceScore * this.rankingWeights.price +
      availabilityScore * this.rankingWeights.availability
    )
  }

  private calculatePriceScore(price: number): number {
    // Lower price = higher score (better value)
    if (price < 300000) return 1.0
    if (price < 600000) return 0.8
    if (price < 1000000) return 0.6
    if (price < 1500000) return 0.4
    return 0.2
  }

  private generateMatchReasons(filterMatches: FilterMatch[], personalizedScore: number): string[] {
    const reasons: string[] = []
    
    // Add filter match reasons
    filterMatches.forEach(match => {
      if (match.matchScore > 0.7) {
        reasons.push(match.description)
      }
    })
    
    // Add personalization reasons
    if (personalizedScore > 0.7) {
      reasons.push('Phù hợp với sở thích của bạn')
    }
    
    return reasons
  }

  // Helper methods
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

  private extractBrand(product: ProductData): string {
    return product.name.split(' ')[0].toLowerCase()
  }

  private extractFit(product: ProductData): string {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase()
    if (text.includes('slim') || text.includes('fit')) return 'slim'
    if (text.includes('regular') || text.includes('classic')) return 'regular'
    if (text.includes('loose') || text.includes('relaxed')) return 'loose'
    return 'regular'
  }

  private extractStyle(product: ProductData): string {
    const styles = product.style || []
    if (styles.length > 0) return styles[0].toLowerCase()
    
    const text = product.name.toLowerCase()
    if (text.includes('casual')) return 'casual'
    if (text.includes('formal')) return 'formal'
    if (text.includes('sport')) return 'sport'
    return 'casual'
  }

  private extractSeasons(product: ProductData): string[] {
    const text = (product.name + ' ' + (product.description || '')).toLowerCase()
    const seasons = ['xuân', 'hè', 'thu', 'đông', 'spring', 'summer', 'fall', 'winter']
    return seasons.filter(season => text.includes(season))
  }

  private getBodyTypeCompatibility(bodyType: string, productFit: string): { score: number; description: string } {
    const compatibility: Record<string, Record<string, { score: number; description: string }>> = {
      'slim': {
        'slim': { score: 1.0, description: 'Phù hợp với vóc dáng slim' },
        'regular': { score: 0.7, description: 'Có thể phù hợp với vóc dáng slim' },
        'loose': { score: 0.3, description: 'Có thể rộng với vóc dáng slim' }
      },
      'athletic': {
        'slim': { score: 0.8, description: 'Phù hợp với vóc dáng athletic' },
        'regular': { score: 1.0, description: 'Rất phù hợp với vóc dáng athletic' },
        'loose': { score: 0.6, description: 'Có thể phù hợp với vóc dáng athletic' }
      },
      'regular': {
        'slim': { score: 0.6, description: 'Có thể phù hợp với vóc dáng regular' },
        'regular': { score: 1.0, description: 'Rất phù hợp với vóc dáng regular' },
        'loose': { score: 0.8, description: 'Phù hợp với vóc dáng regular' }
      },
      'plus': {
        'slim': { score: 0.2, description: 'Có thể chật với vóc dáng plus' },
        'regular': { score: 0.6, description: 'Có thể phù hợp với vóc dáng plus' },
        'loose': { score: 1.0, description: 'Rất phù hợp với vóc dáng plus' }
      }
    }
    
    return compatibility[bodyType]?.[productFit] || { score: 0.5, description: 'Cần kiểm tra kích thước' }
  }

  private areStylesCompatible(userStyle: string, productStyle: string): boolean {
    const compatibility: Record<string, string[]> = {
      'casual': ['casual', 'sport', 'street'],
      'classic': ['classic', 'formal', 'business'],
      'trendy': ['modern', 'street', 'casual'],
      'minimalist': ['classic', 'modern', 'casual'],
      'bold': ['street', 'modern', 'vintage']
    }
    
    const compatibleStyles = compatibility[userStyle] || []
    return compatibleStyles.includes(productStyle)
  }

  private formatPrice(price: number): string {
    return `${new Intl.NumberFormat('vi-VN').format(price)}₫`
  }

  // Update ranking weights
  updateRankingWeights(weights: Partial<RankingWeights>): void {
    this.rankingWeights = { ...this.rankingWeights, ...weights }
  }

  // Get current ranking weights
  getRankingWeights(): RankingWeights {
    return { ...this.rankingWeights }
  }
}

// Export singleton instance
export const advancedFilteringEngine = new AdvancedFilteringEngine()

// Utility functions
export const createAdvancedFilters = (
  query: string,
  context: ConversationContext | null,
  userProfile: UserProfile | null
): AdvancedFilters => {
  const filters: AdvancedFilters = {}
  
  // Extract basic filters from query
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
  const styles = ['casual', 'formal', 'sport', 'vintage', 'modern', 'classic', 'street']
  const foundStyles = styles.filter(style => normalizedQuery.includes(style))
  if (foundStyles.length > 0) {
    filters.style = foundStyles
  }
  
  // Occasion extraction
  const occasions = ['đi làm', 'đi chơi', 'dự tiệc', 'thể thao', 'du lịch']
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
