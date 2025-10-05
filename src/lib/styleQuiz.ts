'use client'

export interface QuizQuestion {
  id: string
  question: string
  type: 'single' | 'multiple' | 'scale' | 'image'
  options: Array<{
    id: string
    text: string
    imageUrl?: string
    value: any
    allowCustom?: boolean
  }>
  category: 'occasion' | 'product_type' | 'budget' | 'color' | 'size' | 'preferences'
  weight: number
}

export interface QuizAnswer {
  questionId: string
  answerIds: string[]
  value: any
  timestamp: Date
}

export interface QuizResult {
  stylePersonality: string
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
  brandSuggestions: Array<{
    brand: string
    affinity: number
    reason: string
  }>
  outfitSuggestions: Array<{
    name: string
    description: string
    items: string[]
    occasion: string
  }>
  // Additional fields for API compatibility
  occasion?: string
  productTypes?: string[]
  budget?: string
  colors?: string[]
  size?: string
  preferences?: string[]
}

export interface QuizSession {
  id: string
  answers: QuizAnswer[]
  currentQuestionIndex: number
  isCompleted: boolean
  result?: QuizResult
  startedAt: Date
  completedAt?: Date
}

export class StyleQuizEngine {
  private questions: QuizQuestion[] = []
  private currentSession: QuizSession | null = null
  private storageKey = 'style_quiz_session'

  constructor() {
    this.initializeQuestions()
    this.loadSession()
  }

  private initializeQuestions(): void {
    this.questions = [
      // Current Need Questions - Focus on immediate needs
      {
        id: 'current_need_1',
        question: 'Bạn đang cần trang phục cho dịp nào?',
        type: 'single',
        options: [
          { id: 'office', text: 'Đi làm công sở', value: 'office' },
          { id: 'date', text: 'Hẹn hò, gặp mặt', value: 'date' },
          { id: 'party', text: 'Tiệc tùng, sự kiện', value: 'party' },
          { id: 'casual', text: 'Đi chơi thường ngày', value: 'casual' },
          { id: 'sport', text: 'Tập thể thao, gym', value: 'sport' },
          { id: 'travel', text: 'Du lịch, công tác', value: 'travel' },
          { id: 'other', text: 'Khác (mô tả chi tiết)', value: 'other', allowCustom: true }
        ],
        category: 'occasion',
        weight: 5
      },
      {
        id: 'current_need_2',
        question: 'Bạn muốn mua loại trang phục nào?',
        type: 'multiple',
        options: [
          { id: 'shirt', text: 'Áo sơ mi', value: 'shirt' },
          { id: 'polo', text: 'Áo polo', value: 'polo' },
          { id: 't_shirt', text: 'Áo thun', value: 't_shirt' },
          { id: 'jacket', text: 'Áo khoác', value: 'jacket' },
          { id: 'pants', text: 'Quần tây', value: 'pants' },
          { id: 'jeans', text: 'Quần jeans', value: 'jeans' },
          { id: 'shorts', text: 'Quần short', value: 'shorts' },
          { id: 'shoes', text: 'Giày dép', value: 'shoes' },
          { id: 'other', text: 'Khác (mô tả chi tiết)', value: 'other', allowCustom: true }
        ],
        category: 'product_type',
        weight: 4
      },

      {
        id: 'current_need_3',
        question: 'Ngân sách bạn có thể chi trả?',
        type: 'single',
        options: [
          { id: 'budget_1', text: 'Dưới 300k', value: 'budget_1' },
          { id: 'budget_2', text: '300k - 600k', value: 'budget_2' },
          { id: 'budget_3', text: '600k - 1M', value: 'budget_3' },
          { id: 'budget_4', text: '1M - 2M', value: 'budget_4' },
          { id: 'budget_5', text: 'Trên 2M', value: 'budget_5' },
          { id: 'other', text: 'Khác (nhập số cụ thể)', value: 'other', allowCustom: true }
        ],
        category: 'budget',
        weight: 4
      },
      {
        id: 'current_need_4',
        question: 'Bạn thích màu sắc nào?',
        type: 'multiple',
        options: [
          { id: 'black', text: 'Đen', value: 'black' },
          { id: 'white', text: 'Trắng', value: 'white' },
          { id: 'navy', text: 'Navy', value: 'navy' },
          { id: 'gray', text: 'Xám', value: 'gray' },
          { id: 'brown', text: 'Nâu', value: 'brown' },
          { id: 'blue', text: 'Xanh dương', value: 'blue' },
          { id: 'green', text: 'Xanh lá', value: 'green' },
          { id: 'red', text: 'Đỏ', value: 'red' },
          { id: 'other', text: 'Khác (mô tả chi tiết)', value: 'other', allowCustom: true }
        ],
        category: 'color',
        weight: 3
      },

      {
        id: 'current_need_5',
        question: 'Size bạn thường mặc?',
        type: 'single',
        options: [
          { id: 'xs', text: 'XS', value: 'xs' },
          { id: 's', text: 'S', value: 's' },
          { id: 'm', text: 'M', value: 'm' },
          { id: 'l', text: 'L', value: 'l' },
          { id: 'xl', text: 'XL', value: 'xl' },
          { id: 'xxl', text: 'XXL', value: 'xxl' },
          { id: 'other', text: 'Khác (mô tả chi tiết)', value: 'other', allowCustom: true }
        ],
        category: 'size',
        weight: 3
      },
      {
        id: 'current_need_6',
        question: 'Bạn có yêu cầu đặc biệt nào không?',
        type: 'multiple',
        options: [
          { id: 'comfort', text: 'Ưu tiên thoải mái', value: 'comfort' },
          { id: 'style', text: 'Ưu tiên phong cách', value: 'style' },
          { id: 'quality', text: 'Ưu tiên chất lượng', value: 'quality' },
          { id: 'price', text: 'Ưu tiên giá cả', value: 'price' },
          { id: 'brand', text: 'Ưu tiên thương hiệu', value: 'brand' },
          { id: 'none', text: 'Không có yêu cầu đặc biệt', value: 'none' },
          { id: 'other', text: 'Khác (mô tả chi tiết)', value: 'other', allowCustom: true }
        ],
        category: 'preferences',
        weight: 2
      },

    ]
  }

  public startQuiz(): QuizSession {
    const session: QuizSession = {
      id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      answers: [],
      currentQuestionIndex: 0,
      isCompleted: false,
      startedAt: new Date()
    }

    this.currentSession = session
    this.saveSession()
    return session
  }

  public getCurrentQuestion(): QuizQuestion | null {
    if (!this.currentSession) return null
    return this.questions[this.currentSession.currentQuestionIndex] || null
  }

  public answerQuestion(questionId: string, answerIds: string[], value?: any): boolean {
    if (!this.currentSession) return false

    const answer: QuizAnswer = {
      questionId,
      answerIds,
      value: value || answerIds,
      timestamp: new Date()
    }

    this.currentSession.answers.push(answer)
    this.currentSession.currentQuestionIndex++

    if (this.currentSession.currentQuestionIndex >= this.questions.length) {
      this.currentSession.isCompleted = true
      this.currentSession.completedAt = new Date()
      this.currentSession.result = this.calculateResult()
    }

    this.saveSession()
    return true
  }

  public getProgress(): { current: number; total: number; percentage: number } {
    if (!this.currentSession) {
      return { current: 0, total: this.questions.length, percentage: 0 }
    }

    const current = this.currentSession.currentQuestionIndex
    const total = this.questions.length
    const percentage = Math.round((current / total) * 100)

    return { current, total, percentage }
  }

  public isCompleted(): boolean {
    return this.currentSession?.isCompleted || false
  }

  public getResult(): QuizResult | null {
    return this.currentSession?.result || null
  }

  public resetQuiz(): void {
    this.currentSession = null
    this.saveSession()
  }

  private calculateResult(): QuizResult {
    if (!this.currentSession) {
      throw new Error('No active quiz session')
    }

    const answers = this.currentSession.answers
    const result: any = {
      occasion: '',
      productTypes: [],
      budget: '',
      colors: [],
      size: '',
      preferences: []
    }

    // Extract answers by category
    for (const answer of answers) {
      const question = this.questions.find(q => q.id === answer.questionId)
      if (!question) continue

      const answerValue = answer.value

      switch (question.category) {
        case 'occasion':
          result.occasion = answerValue
          break
        case 'product_type':
          result.productTypes = Array.isArray(answerValue) ? answerValue : [answerValue]
          break
        case 'budget':
          result.budget = answerValue
          break
        case 'color':
          result.colors = Array.isArray(answerValue) ? answerValue : [answerValue]
          break
        case 'size':
          result.size = answerValue
          break
        case 'preferences':
          result.preferences = Array.isArray(answerValue) ? answerValue : [answerValue]
          break
      }
    }

    // Generate style personality based on occasion
    const stylePersonality = this.determineStyleFromOccasion(result.occasion)
    const confidence = 0.85 // High confidence for current needs

    // Generate style traits based on preferences
    const styleTraits = this.generateTraitsFromPreferences(result.preferences)

    // Generate recommendations based on current needs
    const recommendations = this.generateRecommendationsFromNeeds(result)

    // Generate color palette from selected colors
    const colorPalette = this.generateColorPaletteFromSelection(result.colors)

    // Generate brand suggestions based on budget and preferences
    const brandSuggestions = this.generateBrandSuggestionsFromBudget(result.budget, result.preferences)

    // Generate outfit suggestions based on occasion and product types
    const outfitSuggestions = this.generateOutfitSuggestionsFromNeeds(result)

    return {
      stylePersonality,
      confidence,
      styleTraits,
      recommendations,
      colorPalette,
      brandSuggestions,
      outfitSuggestions,
      // Include raw data for API
      occasion: result.occasion,
      productTypes: result.productTypes,
      budget: result.budget,
      colors: result.colors,
      size: result.size,
      preferences: result.preferences
    }
  }

  private determineStyleFromOccasion(occasion: string): string {
    switch (occasion) {
      case 'office':
        return 'formal'
      case 'date':
        return 'smart-casual'
      case 'party':
        return 'elegant'
      case 'casual':
        return 'casual'
      case 'sport':
        return 'sporty'
      case 'travel':
        return 'comfortable'
      default:
        return 'casual'
    }
  }

  private generateTraitsFromPreferences(preferences: string[]): Array<{
    trait: string
    score: number
    description: string
  }> {
    const traits: Array<{
      trait: string
      score: number
      description: string
    }> = []

    preferences.forEach(pref => {
      switch (pref) {
        case 'comfort':
          traits.push({
            trait: 'Thoải mái',
            score: 0.9,
            description: 'Bạn ưu tiên sự thoải mái trong trang phục'
          })
          break
        case 'style':
          traits.push({
            trait: 'Phong cách',
            score: 0.8,
            description: 'Bạn quan tâm đến phong cách thời trang'
          })
          break
        case 'quality':
          traits.push({
            trait: 'Chất lượng',
            score: 0.8,
            description: 'Bạn ưu tiên chất lượng sản phẩm'
          })
          break
        case 'price':
          traits.push({
            trait: 'Giá cả',
            score: 0.7,
            description: 'Bạn quan tâm đến giá cả hợp lý'
          })
          break
        case 'brand':
          traits.push({
            trait: 'Thương hiệu',
            score: 0.6,
            description: 'Bạn quan tâm đến thương hiệu'
          })
          break
      }
    })

    return traits
  }

  private generateRecommendationsFromNeeds(result: any): Array<{
    category: string
    suggestion: string
    reason: string
  }> {
    const recommendations: Array<{
      category: string
      suggestion: string
      reason: string
    }> = []

    // Recommendations based on occasion
    switch (result.occasion) {
      case 'office':
        recommendations.push({
          category: 'Áo sơ mi',
          suggestion: 'Áo sơ mi trắng, xanh navy',
          reason: 'Phù hợp với môi trường công sở'
        })
        break
      case 'date':
        recommendations.push({
          category: 'Áo polo',
          suggestion: 'Áo polo màu tối, quần jeans',
          reason: 'Tạo vẻ ngoài lịch lãm và tự tin'
        })
        break
      case 'party':
        recommendations.push({
          category: 'Áo vest',
          suggestion: 'Áo vest đen, áo sơ mi trắng',
          reason: 'Phù hợp với các sự kiện trang trọng'
        })
        break
    }

    // Recommendations based on product types
    result.productTypes.forEach((type: string) => {
      switch (type) {
        case 'shirt':
          recommendations.push({
            category: 'Áo sơ mi',
            suggestion: 'Áo sơ mi cotton, dễ giặt',
            reason: 'Thoải mái và phù hợp nhiều dịp'
          })
          break
        case 'jeans':
          recommendations.push({
            category: 'Quần jeans',
            suggestion: 'Quần jeans slim fit',
            reason: 'Dễ phối đồ và không lỗi thời'
          })
          break
      }
    })

    return recommendations
  }

  private generateColorPaletteFromSelection(colors: string[]): {
    primary: string[]
    secondary: string[]
    accent: string[]
  } {
    return {
      primary: colors.slice(0, 3),
      secondary: colors.slice(3, 5),
      accent: colors.slice(5, 7)
    }
  }

  private generateBrandSuggestionsFromBudget(budget: string, preferences: string[]): Array<{
    brand: string
    affinity: number
    reason: string
  }> {
    const suggestions: Array<{
      brand: string
      affinity: number
      reason: string
    }> = []

    switch (budget) {
      case 'budget_1':
        suggestions.push({
          brand: 'Uniqlo',
          affinity: 0.9,
          reason: 'Giá cả phải chăng, chất lượng tốt'
        })
        break
      case 'budget_2':
        suggestions.push({
          brand: 'H&M',
          affinity: 0.8,
          reason: 'Đa dạng mẫu mã, giá hợp lý'
        })
        break
      case 'budget_3':
        suggestions.push({
          brand: 'Zara',
          affinity: 0.8,
          reason: 'Thiết kế hiện đại, chất lượng tốt'
        })
        break
      case 'budget_4':
        suggestions.push({
          brand: 'COS',
          affinity: 0.9,
          reason: 'Thiết kế tối giản, chất lượng cao'
        })
        break
      case 'budget_5':
        suggestions.push({
          brand: 'Hugo Boss',
          affinity: 0.9,
          reason: 'Thương hiệu cao cấp, thiết kế sang trọng'
        })
        break
    }

    return suggestions
  }

  private generateOutfitSuggestionsFromNeeds(result: any): Array<{
    name: string
    description: string
    items: string[]
    occasion: string
  }> {
    const suggestions: Array<{
      name: string
      description: string
      items: string[]
      occasion: string
    }> = []

    // Generate outfit suggestions based on occasion and product types
    switch (result.occasion) {
      case 'office':
        suggestions.push({
          name: 'Outfit Công sở',
          description: 'Trang trọng cho môi trường làm việc',
          items: ['Áo sơ mi', 'Quần tây', 'Giày tây'],
          occasion: 'Công sở'
        })
        break
      case 'date':
        suggestions.push({
          name: 'Outfit Hẹn hò',
          description: 'Lịch lãm và tự tin',
          items: ['Áo polo', 'Quần jeans', 'Giày sneakers'],
          occasion: 'Hẹn hò'
        })
        break
      case 'casual':
        suggestions.push({
          name: 'Outfit Casual',
          description: 'Thoải mái cho ngày thường',
          items: ['Áo thun', 'Quần jeans', 'Sneakers'],
          occasion: 'Ngày thường'
        })
        break
    }

    return suggestions
  }


  private saveSession(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return
    }
    
    if (this.currentSession) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.currentSession))
      } catch (error) {
        console.error('Error saving quiz session:', error)
      }
    } else {
      try {
        localStorage.removeItem(this.storageKey)
      } catch (error) {
        console.error('Error removing quiz session:', error)
      }
    }
  }

  private loadSession(): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        const sessionData = JSON.parse(stored)
        this.currentSession = {
          ...sessionData,
          startedAt: new Date(sessionData.startedAt),
          completedAt: sessionData.completedAt ? new Date(sessionData.completedAt) : undefined,
          answers: sessionData.answers.map((answer: any) => ({
            ...answer,
            timestamp: new Date(answer.timestamp)
          }))
        }
      }
    } catch (error) {
      console.error('Error loading quiz session:', error)
    }
  }

  public getAllQuestions(): QuizQuestion[] {
    return [...this.questions]
  }

  public getQuestionById(id: string): QuizQuestion | null {
    return this.questions.find(q => q.id === id) || null
  }

  public getQuestionsByCategory(category: string): QuizQuestion[] {
    return this.questions.filter(q => q.category === category)
  }

  public exportQuizData(): string {
    const data = {
      questions: this.questions,
      session: this.currentSession,
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }
}

// Singleton instance
export const styleQuizEngine = new StyleQuizEngine()

// Hook for React components
export const useStyleQuiz = () => {
  return {
    startQuiz: () => styleQuizEngine.startQuiz(),
    getCurrentQuestion: () => styleQuizEngine.getCurrentQuestion(),
    answerQuestion: (questionId: string, answerIds: string[], value?: any) => 
      styleQuizEngine.answerQuestion(questionId, answerIds, value),
    getProgress: () => styleQuizEngine.getProgress(),
    isCompleted: () => styleQuizEngine.isCompleted(),
    getResult: () => styleQuizEngine.getResult(),
    resetQuiz: () => styleQuizEngine.resetQuiz(),
    getAllQuestions: () => styleQuizEngine.getAllQuestions(),
    getQuestionById: (id: string) => styleQuizEngine.getQuestionById(id),
    getQuestionsByCategory: (category: string) => styleQuizEngine.getQuestionsByCategory(category),
    exportQuizData: () => styleQuizEngine.exportQuizData()
  }
}
