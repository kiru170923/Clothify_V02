'use client'

export interface StyleAnalysisResult {
  overallStyle: string
  confidence: number
  styleTraits: Array<{
    trait: string
    score: number
    description: string
  }>
  recommendations: Array<{
    category: string
    suggestion: string
    reason: string
  }>
  colorPalette: {
    primary: string[]
    secondary: string[]
    accent: string[]
  }
  fitPreferences: {
    top: string
    bottom: string
    overall: string
  }
  brandAffinities: Array<{
    brand: string
    affinity: number
    reason: string
  }>
}

export interface StyleProfile {
  personality: string
  lifestyle: string
  profession: string
  age: number
  budget: number
  preferences: {
    colors: string[]
    materials: string[]
    patterns: string[]
    brands: string[]
  }
  constraints: {
    dressCode?: string
    climate?: string
    bodyType?: string
  }
}

export interface OutfitAnalysis {
  occasion: string
  season: string
  formality: string
  colors: string[]
  fit: string
  style: string
  score: number
  feedback: string
  improvements: string[]
}

export class StyleAnalysisEngine {
  private stylePersonalities: Map<string, StyleAnalysisResult> = new Map()
  private colorHarmonyRules: Map<string, string[]> = new Map()
  private fitGuidelines: Map<string, Record<string, string>> = new Map()

  constructor() {
    this.initializeStylePersonalities()
    this.initializeColorHarmonyRules()
    this.initializeFitGuidelines()
  }

  private initializeStylePersonalities(): void {
    // Casual Style
    this.stylePersonalities.set('casual', {
      overallStyle: 'casual',
      confidence: 0.9,
      styleTraits: [
        { trait: 'comfort', score: 0.9, description: 'Ưu tiên sự thoải mái' },
        { trait: 'versatility', score: 0.8, description: 'Dễ phối đồ' },
        { trait: 'practicality', score: 0.7, description: 'Thực tế, dễ sử dụng' }
      ],
      recommendations: [
        { category: 'tops', suggestion: 'Áo thun, áo polo', reason: 'Thoải mái và dễ phối' },
        { category: 'bottoms', suggestion: 'Quần jeans, quần short', reason: 'Phù hợp với phong cách casual' },
        { category: 'shoes', suggestion: 'Sneakers, giày thể thao', reason: 'Thoải mái và năng động' }
      ],
      colorPalette: {
        primary: ['đen', 'trắng', 'xám', 'navy'],
        secondary: ['xanh lá', 'nâu', 'beige'],
        accent: ['đỏ', 'vàng', 'cam']
      },
      fitPreferences: {
        top: 'regular',
        bottom: 'regular',
        overall: 'comfortable'
      },
      brandAffinities: [
        { brand: 'Uniqlo', affinity: 0.8, reason: 'Đơn giản, chất lượng tốt' },
        { brand: 'H&M', affinity: 0.7, reason: 'Giá cả phải chăng' },
        { brand: 'Zara', affinity: 0.6, reason: 'Thiết kế hiện đại' }
      ]
    })

    // Formal Style
    this.stylePersonalities.set('formal', {
      overallStyle: 'formal',
      confidence: 0.9,
      styleTraits: [
        { trait: 'elegance', score: 0.9, description: 'Thanh lịch, trang trọng' },
        { trait: 'quality', score: 0.8, description: 'Chất lượng cao' },
        { trait: 'tradition', score: 0.7, description: 'Theo truyền thống' }
      ],
      recommendations: [
        { category: 'tops', suggestion: 'Áo sơ mi, áo vest', reason: 'Trang trọng và lịch sự' },
        { category: 'bottoms', suggestion: 'Quần tây, quần vest', reason: 'Phù hợp với môi trường công sở' },
        { category: 'shoes', suggestion: 'Giày tây, giày oxford', reason: 'Chuyên nghiệp và thanh lịch' }
      ],
      colorPalette: {
        primary: ['navy', 'xám đậm', 'đen'],
        secondary: ['trắng', 'xám nhạt', 'beige'],
        accent: ['đỏ đậm', 'xanh lá đậm']
      },
      fitPreferences: {
        top: 'slim',
        bottom: 'slim',
        overall: 'tailored'
      },
      brandAffinities: [
        { brand: 'Brooks Brothers', affinity: 0.9, reason: 'Truyền thống và chất lượng' },
        { brand: 'Hugo Boss', affinity: 0.8, reason: 'Thiết kế hiện đại' },
        { brand: 'Ralph Lauren', affinity: 0.7, reason: 'Phong cách cổ điển' }
      ]
    })

    // Streetwear Style
    this.stylePersonalities.set('streetwear', {
      overallStyle: 'streetwear',
      confidence: 0.9,
      styleTraits: [
        { trait: 'trendy', score: 0.9, description: 'Theo xu hướng' },
        { trait: 'bold', score: 0.8, description: 'Mạnh mẽ, nổi bật' },
        { trait: 'urban', score: 0.7, description: 'Phong cách đô thị' }
      ],
      recommendations: [
        { category: 'tops', suggestion: 'Hoodie, áo oversize', reason: 'Phong cách streetwear' },
        { category: 'bottoms', suggestion: 'Quần jogger, quần baggy', reason: 'Thoải mái và thời trang' },
        { category: 'shoes', suggestion: 'Sneakers cao cấp, boots', reason: 'Phong cách urban' }
      ],
      colorPalette: {
        primary: ['đen', 'trắng', 'xám'],
        secondary: ['đỏ', 'xanh lá', 'vàng'],
        accent: ['cam', 'tím', 'hồng']
      },
      fitPreferences: {
        top: 'oversized',
        bottom: 'loose',
        overall: 'relaxed'
      },
      brandAffinities: [
        { brand: 'Supreme', affinity: 0.9, reason: 'Thương hiệu streetwear hàng đầu' },
        { brand: 'Off-White', affinity: 0.8, reason: 'Thiết kế độc đáo' },
        { brand: 'Nike', affinity: 0.7, reason: 'Sneakers chất lượng' }
      ]
    })

    // Minimalist Style
    this.stylePersonalities.set('minimalist', {
      overallStyle: 'minimalist',
      confidence: 0.9,
      styleTraits: [
        { trait: 'simplicity', score: 0.9, description: 'Đơn giản, tối giản' },
        { trait: 'quality', score: 0.8, description: 'Chất lượng cao' },
        { trait: 'timeless', score: 0.7, description: 'Vượt thời gian' }
      ],
      recommendations: [
        { category: 'tops', suggestion: 'Áo thun đơn giản, áo sơ mi', reason: 'Thiết kế tối giản' },
        { category: 'bottoms', suggestion: 'Quần jeans đơn giản, quần tây', reason: 'Phong cách clean' },
        { category: 'shoes', suggestion: 'Sneakers đơn giản, giày tây', reason: 'Thiết kế minimal' }
      ],
      colorPalette: {
        primary: ['đen', 'trắng', 'xám'],
        secondary: ['navy', 'beige', 'nâu'],
        accent: []
      },
      fitPreferences: {
        top: 'slim',
        bottom: 'slim',
        overall: 'clean'
      },
      brandAffinities: [
        { brand: 'COS', affinity: 0.9, reason: 'Thiết kế minimal' },
        { brand: 'Everlane', affinity: 0.8, reason: 'Chất lượng và đơn giản' },
        { brand: 'Uniqlo', affinity: 0.7, reason: 'Giá cả phải chăng' }
      ]
    })
  }

  private initializeColorHarmonyRules(): void {
    // Complementary colors
    this.colorHarmonyRules.set('complementary', [
      'đỏ-xanh lá',
      'vàng-tím',
      'cam-xanh dương'
    ])

    // Analogous colors
    this.colorHarmonyRules.set('analogous', [
      'đỏ-cam-vàng',
      'xanh lá-xanh dương-tím',
      'đỏ-hồng-tím'
    ])

    // Triadic colors
    this.colorHarmonyRules.set('triadic', [
      'đỏ-vàng-xanh dương',
      'cam-xanh lá-tím'
    ])

    // Monochromatic colors
    this.colorHarmonyRules.set('monochromatic', [
      'đen-xám-trắng',
      'navy-xanh nhạt-xanh dương',
      'nâu-beige-kem'
    ])
  }

  private initializeFitGuidelines(): void {
    // Body type guidelines
    this.fitGuidelines.set('slim', {
      top: 'Slim fit để tạo đường nét cơ thể',
      bottom: 'Slim fit để tạo chiều cao',
      overall: 'Tránh oversize, ưu tiên fitted'
    })

    this.fitGuidelines.set('athletic', {
      top: 'Regular fit để thoải mái vận động',
      bottom: 'Regular fit để cân bằng',
      overall: 'Cân bằng giữa fitted và comfort'
    })

    this.fitGuidelines.set('broad', {
      top: 'Regular fit để cân bằng',
      bottom: 'Straight fit để cân bằng',
      overall: 'Tránh slim fit, ưu tiên regular'
    })
  }

  public analyzeStyleProfile(profile: StyleProfile): StyleAnalysisResult {
    // Determine primary style personality
    const primaryStyle = this.determinePrimaryStyle(profile)
    const baseResult = this.stylePersonalities.get(primaryStyle) || this.stylePersonalities.get('casual')!

    // Customize based on profile
    const customizedResult = this.customizeStyleResult(baseResult, profile)

    return customizedResult
  }

  private determinePrimaryStyle(profile: StyleProfile): string {
    let styleScore = new Map<string, number>()

    // Analyze profession
    if (profile.profession.includes('business') || profile.profession.includes('corporate')) {
      styleScore.set('formal', (styleScore.get('formal') || 0) + 3)
    }

    // Analyze lifestyle
    if (profile.lifestyle.includes('active') || profile.lifestyle.includes('sport')) {
      styleScore.set('streetwear', (styleScore.get('streetwear') || 0) + 2)
    }

    // Analyze age
    if (profile.age < 25) {
      styleScore.set('streetwear', (styleScore.get('streetwear') || 0) + 2)
    } else if (profile.age > 35) {
      styleScore.set('formal', (styleScore.get('formal') || 0) + 1)
    }

    // Analyze budget
    if (profile.budget > 5000000) {
      styleScore.set('formal', (styleScore.get('formal') || 0) + 1)
      styleScore.set('minimalist', (styleScore.get('minimalist') || 0) + 1)
    }

    // Find highest scoring style
    let bestStyle = 'casual'
    let highestScore = 0

    for (const [style, score] of Array.from(styleScore.entries())) {
      if (score > highestScore) {
        highestScore = score
        bestStyle = style
      }
    }

    return bestStyle
  }

  private customizeStyleResult(baseResult: StyleAnalysisResult, profile: StyleProfile): StyleAnalysisResult {
    const customized = { ...baseResult }

    // Customize color palette based on preferences
    if (profile.preferences.colors.length > 0) {
      customized.colorPalette.primary = profile.preferences.colors.slice(0, 3)
    }

    // Customize fit preferences based on body type
    if (profile.constraints.bodyType) {
      const fitGuidelines = this.fitGuidelines.get(profile.constraints.bodyType)
      if (fitGuidelines) {
        customized.fitPreferences = {
          top: fitGuidelines.top,
          bottom: fitGuidelines.bottom,
          overall: fitGuidelines.overall
        }
      }
    }

    // Customize brand affinities based on budget
    customized.brandAffinities = customized.brandAffinities.filter(brand => {
      // Filter brands based on budget range
      return this.isBrandAffordable(brand.brand, profile.budget)
    })

    return customized
  }

  private isBrandAffordable(brand: string, budget: number): boolean {
    const brandPriceRanges: Record<string, [number, number]> = {
      'Uniqlo': [200000, 800000],
      'H&M': [150000, 600000],
      'Zara': [300000, 1200000],
      'COS': [500000, 2000000],
      'Everlane': [400000, 1500000],
      'Brooks Brothers': [2000000, 8000000],
      'Hugo Boss': [3000000, 10000000],
      'Ralph Lauren': [2500000, 12000000],
      'Supreme': [1000000, 5000000],
      'Off-White': [3000000, 15000000],
      'Nike': [800000, 3000000]
    }

    const range = brandPriceRanges[brand]
    if (!range) return true

    return budget >= range[0] && budget <= range[1]
  }

  public analyzeOutfit(outfit: {
    top: string
    bottom: string
    shoes: string
    accessories?: string[]
  }, occasion: string, season: string): OutfitAnalysis {
    let score = 0
    const feedback: string[] = []
    const improvements: string[] = []

    // Analyze color harmony
    const colorScore = this.analyzeColorHarmony(outfit)
    score += colorScore.score
    feedback.push(colorScore.feedback)

    // Analyze fit consistency
    const fitScore = this.analyzeFitConsistency(outfit)
    score += fitScore.score
    feedback.push(fitScore.feedback)

    // Analyze occasion appropriateness
    const occasionScore = this.analyzeOccasionAppropriateness(outfit, occasion)
    score += occasionScore.score
    feedback.push(occasionScore.feedback)

    // Analyze season appropriateness
    const seasonScore = this.analyzeSeasonAppropriateness(outfit, season)
    score += seasonScore.score
    feedback.push(seasonScore.feedback)

    // Generate improvements
    if (colorScore.score < 7) {
      improvements.push('Cân nhắc phối màu hài hòa hơn')
    }
    if (fitScore.score < 7) {
      improvements.push('Điều chỉnh độ vừa vặn của trang phục')
    }
    if (occasionScore.score < 7) {
      improvements.push('Chọn trang phục phù hợp với dịp')
    }
    if (seasonScore.score < 7) {
      improvements.push('Chọn trang phục phù hợp với mùa')
    }

    return {
      occasion,
      season,
      formality: this.determineFormality(outfit),
      colors: this.extractColors(outfit),
      fit: this.determineFit(outfit),
      style: this.determineStyle(outfit),
      score: Math.min(10, Math.max(0, score)),
      feedback: feedback.join(' '),
      improvements
    }
  }

  private analyzeColorHarmony(outfit: any): {score: number, feedback: string} {
    const colors = this.extractColors(outfit)
    let score = 5 // Base score
    let feedback = ''

    // Check for color harmony
    if (colors.length <= 3) {
      score += 2
      feedback += 'Màu sắc hài hòa. '
    } else {
      score -= 1
      feedback += 'Quá nhiều màu sắc. '
    }

    // Check for neutral base
    const neutralColors = ['đen', 'trắng', 'xám', 'navy', 'nâu']
    const hasNeutral = colors.some(color => neutralColors.includes(color))
    if (hasNeutral) {
      score += 1
      feedback += 'Có màu trung tính làm nền. '
    }

    return { score, feedback }
  }

  private analyzeFitConsistency(outfit: any): {score: number, feedback: string} {
    let score = 5 // Base score
    let feedback = ''

    // Check fit consistency
    const fits = [outfit.top, outfit.bottom, outfit.shoes].map(item => this.determineFit({ [item]: item }))
    const uniqueFits = new Set(fits)

    if (uniqueFits.size === 1) {
      score += 3
      feedback += 'Độ vừa vặn nhất quán. '
    } else if (uniqueFits.size === 2) {
      score += 1
      feedback += 'Độ vừa vặn tương đối nhất quán. '
    } else {
      score -= 1
      feedback += 'Độ vừa vặn không nhất quán. '
    }

    return { score, feedback }
  }

  private analyzeOccasionAppropriateness(outfit: any, occasion: string): {score: number, feedback: string} {
    let score = 5 // Base score
    let feedback = ''

    const formality = this.determineFormality(outfit)
    const occasionFormality = this.getOccasionFormality(occasion)

    if (formality === occasionFormality) {
      score += 3
      feedback += 'Phù hợp với dịp. '
    } else if (this.isFormalityCompatible(formality, occasionFormality)) {
      score += 1
      feedback += 'Tương đối phù hợp với dịp. '
    } else {
      score -= 2
      feedback += 'Không phù hợp với dịp. '
    }

    return { score, feedback }
  }

  private analyzeSeasonAppropriateness(outfit: any, season: string): {score: number, feedback: string} {
    let score = 5 // Base score
    let feedback = ''

    // Basic season appropriateness check
    const materials = this.extractMaterials(outfit)
    const seasonMaterials = this.getSeasonMaterials(season)

    const hasAppropriateMaterial = materials.some(material => 
      seasonMaterials.includes(material)
    )

    if (hasAppropriateMaterial) {
      score += 2
      feedback += 'Chất liệu phù hợp với mùa. '
    } else {
      score -= 1
      feedback += 'Chất liệu có thể không phù hợp với mùa. '
    }

    return { score, feedback }
  }

  private determineFormality(outfit: any): string {
    // Simple formality determination based on outfit items
    if (outfit.top?.includes('vest') || outfit.top?.includes('suit')) {
      return 'formal'
    }
    if (outfit.top?.includes('shirt') && outfit.bottom?.includes('trousers')) {
      return 'semi-formal'
    }
    if (outfit.top?.includes('hoodie') || outfit.top?.includes('sweatshirt')) {
      return 'casual'
    }
    return 'casual'
  }

  private extractColors(outfit: any): string[] {
    // Simple color extraction - in real implementation, this would be more sophisticated
    const colors: string[] = []
    const colorKeywords = ['đen', 'trắng', 'xám', 'navy', 'xanh', 'đỏ', 'vàng', 'hồng', 'tím', 'nâu']
    
    const outfitText = `${outfit.top} ${outfit.bottom} ${outfit.shoes}`.toLowerCase()
    
    for (const color of colorKeywords) {
      if (outfitText.includes(color)) {
        colors.push(color)
      }
    }
    
    return colors
  }

  private determineFit(outfit: any): string {
    // Simple fit determination
    if (outfit.top?.includes('slim') || outfit.bottom?.includes('slim')) {
      return 'slim'
    }
    if (outfit.top?.includes('oversized') || outfit.bottom?.includes('baggy')) {
      return 'loose'
    }
    return 'regular'
  }

  private determineStyle(outfit: any): string {
    // Simple style determination
    if (outfit.top?.includes('hoodie') || outfit.top?.includes('sweatshirt')) {
      return 'streetwear'
    }
    if (outfit.top?.includes('shirt') && outfit.bottom?.includes('trousers')) {
      return 'formal'
    }
    return 'casual'
  }

  private extractMaterials(outfit: any): string[] {
    const materials: string[] = []
    const materialKeywords = ['cotton', 'polyester', 'wool', 'linen', 'denim', 'leather']
    
    const outfitText = `${outfit.top} ${outfit.bottom} ${outfit.shoes}`.toLowerCase()
    
    for (const material of materialKeywords) {
      if (outfitText.includes(material)) {
        materials.push(material)
      }
    }
    
    return materials
  }

  private getOccasionFormality(occasion: string): string {
    if (occasion.includes('work') || occasion.includes('business') || occasion.includes('formal')) {
      return 'formal'
    }
    if (occasion.includes('party') || occasion.includes('event')) {
      return 'semi-formal'
    }
    return 'casual'
  }

  private isFormalityCompatible(formality1: string, formality2: string): boolean {
    const compatibility: Record<string, string[]> = {
      'formal': ['formal', 'semi-formal'],
      'semi-formal': ['formal', 'semi-formal', 'casual'],
      'casual': ['semi-formal', 'casual']
    }
    
    return compatibility[formality1]?.includes(formality2) || false
  }

  private getSeasonMaterials(season: string): string[] {
    const seasonMaterials: Record<string, string[]> = {
      'spring': ['cotton', 'linen'],
      'summer': ['cotton', 'linen', 'polyester'],
      'fall': ['wool', 'cotton'],
      'winter': ['wool', 'leather', 'denim']
    }
    
    return seasonMaterials[season] || ['cotton']
  }

  public generateStyleRecommendations(profile: StyleProfile, occasion: string, season: string): Array<{
    category: string
    item: string
    reason: string
    priority: number
  }> {
    const recommendations: Array<{
      category: string
      item: string
      reason: string
      priority: number
    }> = []

    // Generate recommendations based on profile and context
    const styleResult = this.analyzeStyleProfile(profile)
    
    // Add recommendations from style analysis
    for (const rec of styleResult.recommendations) {
      recommendations.push({
        category: rec.category,
        item: rec.suggestion,
        reason: rec.reason,
        priority: 8
      })
    }

    // Add occasion-specific recommendations
    const occasionRecs = this.getOccasionRecommendations(occasion)
    recommendations.push(...occasionRecs)

    // Add season-specific recommendations
    const seasonRecs = this.getSeasonRecommendations(season)
    recommendations.push(...seasonRecs)

    // Sort by priority
    return recommendations.sort((a, b) => b.priority - a.priority)
  }

  private getOccasionRecommendations(occasion: string): Array<{
    category: string
    item: string
    reason: string
    priority: number
  }> {
    const recommendations: Array<{
      category: string
      item: string
      reason: string
      priority: number
    }> = []

    if (occasion.includes('work') || occasion.includes('business')) {
      recommendations.push({
        category: 'tops',
        item: 'Áo sơ mi trắng',
        reason: 'Phù hợp với môi trường công sở',
        priority: 9
      })
      recommendations.push({
        category: 'bottoms',
        item: 'Quần tây đen',
        reason: 'Trang trọng và chuyên nghiệp',
        priority: 9
      })
    }

    if (occasion.includes('party') || occasion.includes('event')) {
      recommendations.push({
        category: 'tops',
        item: 'Áo sơ mi có họa tiết',
        reason: 'Nổi bật và phù hợp với tiệc',
        priority: 8
      })
    }

    return recommendations
  }

  private getSeasonRecommendations(season: string): Array<{
    category: string
    item: string
    reason: string
    priority: number
  }> {
    const recommendations: Array<{
      category: string
      item: string
      reason: string
      priority: number
    }> = []

    if (season === 'summer') {
      recommendations.push({
        category: 'tops',
        item: 'Áo thun cotton',
        reason: 'Thoáng mát cho mùa hè',
        priority: 8
      })
    }

    if (season === 'winter') {
      recommendations.push({
        category: 'tops',
        item: 'Áo len ấm',
        reason: 'Giữ ấm cho mùa đông',
        priority: 9
      })
    }

    return recommendations
  }
}

// Singleton instance
export const styleAnalysisEngine = new StyleAnalysisEngine()

// Hook for React components
export const useStyleAnalysis = () => {
  return {
    analyzeStyleProfile: (profile: StyleProfile) => styleAnalysisEngine.analyzeStyleProfile(profile),
    analyzeOutfit: (outfit: any, occasion: string, season: string) => 
      styleAnalysisEngine.analyzeOutfit(outfit, occasion, season),
    generateStyleRecommendations: (profile: StyleProfile, occasion: string, season: string) => 
      styleAnalysisEngine.generateStyleRecommendations(profile, occasion, season)
  }
}
