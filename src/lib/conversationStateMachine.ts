'use client'

export enum ConversationState {
  GREETING = 'greeting',
  COLLECTING_INFO = 'collecting_info',
  PROVIDING_ADVICE = 'providing_advice',
  SEARCHING = 'searching',
  FOLLOW_UP = 'follow_up',
  ANALYZING_IMAGE = 'analyzing_image',
  STYLE_QUIZ = 'style_quiz',
  WARDROBE_MANAGEMENT = 'wardrobe_management',
  VIRTUAL_TRY_ON = 'virtual_try_on',
  ERROR_RECOVERY = 'error_recovery'
}

export enum UserIntent {
  GREETING = 'greeting',
  SEARCH_PRODUCTS = 'search_products',
  STYLE_ADVICE = 'style_advice',
  ANALYZE_OUTFIT = 'analyze_outfit',
  COMPARE_PRODUCTS = 'compare_products',
  UPDATE_PROFILE = 'update_profile',
  WARDROBE_HELP = 'wardrobe_help',
  VIRTUAL_TRY_ON = 'virtual_try_on',
  STYLE_QUIZ = 'style_quiz',
  UNKNOWN = 'unknown'
}

export interface ConversationContext {
  currentState: ConversationState
  previousState?: ConversationState
  userProfile: {
    preferences: Record<string, any>
    stylePersonality: string
    budget: number
    size: string
    colors: string[]
  }
  sessionData: {
    startTime: Date
    messageCount: number
    lastActivity: Date
    currentTopic: string
  }
  collectedInfo: {
    occasion?: string
    season?: string
    priceRange?: [number, number]
    style?: string
    colors?: string[]
    brands?: string[]
  }
  conversationHistory: Array<{
    state: ConversationState
    intent: UserIntent
    timestamp: Date
    data?: any
  }>
}

export class ConversationStateMachine {
  private context: ConversationContext
  private stateHandlers: Map<ConversationState, (intent: UserIntent, data?: any) => ConversationState>

  constructor() {
    this.context = this.initializeContext()
    this.stateHandlers = this.initializeStateHandlers()
  }

  private initializeContext(): ConversationContext {
    return {
      currentState: ConversationState.GREETING,
      userProfile: {
        preferences: {},
        stylePersonality: 'casual',
        budget: 0,
        size: 'M',
        colors: []
      },
      sessionData: {
        startTime: new Date(),
        messageCount: 0,
        lastActivity: new Date(),
        currentTopic: ''
      },
      collectedInfo: {},
      conversationHistory: []
    }
  }

  private initializeStateHandlers(): Map<ConversationState, (intent: UserIntent, data?: any) => ConversationState> {
    const handlers = new Map()

    // Greeting state handlers
    handlers.set(ConversationState.GREETING, (intent: UserIntent) => {
      switch (intent) {
        case UserIntent.SEARCH_PRODUCTS:
          return ConversationState.COLLECTING_INFO
        case UserIntent.STYLE_ADVICE:
          return ConversationState.COLLECTING_INFO
        case UserIntent.ANALYZE_OUTFIT:
          return ConversationState.ANALYZING_IMAGE
        case UserIntent.STYLE_QUIZ:
          return ConversationState.STYLE_QUIZ
        case UserIntent.WARDROBE_HELP:
          return ConversationState.WARDROBE_MANAGEMENT
        default:
          return ConversationState.COLLECTING_INFO
      }
    })

    // Collecting info state handlers
    handlers.set(ConversationState.COLLECTING_INFO, (intent: UserIntent, data?: any) => {
      if (this.isInfoComplete(data)) {
        return ConversationState.PROVIDING_ADVICE
      }
      return ConversationState.FOLLOW_UP
    })

    // Providing advice state handlers
    handlers.set(ConversationState.PROVIDING_ADVICE, (intent: UserIntent) => {
      switch (intent) {
        case UserIntent.SEARCH_PRODUCTS:
          return ConversationState.SEARCHING
        case UserIntent.COMPARE_PRODUCTS:
          return ConversationState.SEARCHING
        case UserIntent.VIRTUAL_TRY_ON:
          return ConversationState.VIRTUAL_TRY_ON
        default:
          return ConversationState.FOLLOW_UP
      }
    })

    // Searching state handlers
    handlers.set(ConversationState.SEARCHING, (intent: UserIntent) => {
      switch (intent) {
        case UserIntent.VIRTUAL_TRY_ON:
          return ConversationState.VIRTUAL_TRY_ON
        case UserIntent.COMPARE_PRODUCTS:
          return ConversationState.SEARCHING
        default:
          return ConversationState.FOLLOW_UP
      }
    })

    // Analyzing image state handlers
    handlers.set(ConversationState.ANALYZING_IMAGE, (intent: UserIntent) => {
      return ConversationState.PROVIDING_ADVICE
    })

    // Follow-up state handlers
    handlers.set(ConversationState.FOLLOW_UP, (intent: UserIntent) => {
      switch (intent) {
        case UserIntent.SEARCH_PRODUCTS:
          return ConversationState.SEARCHING
        case UserIntent.STYLE_ADVICE:
          return ConversationState.PROVIDING_ADVICE
        case UserIntent.ANALYZE_OUTFIT:
          return ConversationState.ANALYZING_IMAGE
        default:
          return ConversationState.COLLECTING_INFO
      }
    })

    // Error recovery state handlers
    handlers.set(ConversationState.ERROR_RECOVERY, () => {
      return ConversationState.GREETING
    })

    return handlers
  }

  private isInfoComplete(data?: any): boolean {
    if (!data) return false
    
    const requiredFields = ['occasion', 'style']
    return requiredFields.some(field => data[field])
  }

  public transition(intent: UserIntent, data?: any): ConversationState {
    const currentHandler = this.stateHandlers.get(this.context.currentState)
    if (!currentHandler) {
      console.error('No handler for state:', this.context.currentState)
      return ConversationState.ERROR_RECOVERY
    }

    const previousState = this.context.currentState
    const newState = currentHandler(intent, data)

    // Update context
    this.context.previousState = previousState
    this.context.currentState = newState
    this.context.sessionData.lastActivity = new Date()
    this.context.sessionData.messageCount++

    // Add to history
    this.context.conversationHistory.push({
      state: newState,
      intent,
      timestamp: new Date(),
      data
    })

    // Keep only last 20 entries
    if (this.context.conversationHistory.length > 20) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-20)
    }

    return newState
  }

  public getCurrentState(): ConversationState {
    return this.context.currentState
  }

  public getContext(): ConversationContext {
    return { ...this.context }
  }

  public updateCollectedInfo(info: Partial<ConversationContext['collectedInfo']>): void {
    this.context.collectedInfo = { ...this.context.collectedInfo, ...info }
  }

  public updateUserProfile(profile: Partial<ConversationContext['userProfile']>): void {
    this.context.userProfile = { ...this.context.userProfile, ...profile }
  }

  public reset(): void {
    this.context = this.initializeContext()
  }

  public getStateDescription(): string {
    switch (this.context.currentState) {
      case ConversationState.GREETING:
        return 'Chào hỏi và tìm hiểu nhu cầu'
      case ConversationState.COLLECTING_INFO:
        return 'Thu thập thông tin từ người dùng'
      case ConversationState.PROVIDING_ADVICE:
        return 'Đưa ra lời khuyên và gợi ý'
      case ConversationState.SEARCHING:
        return 'Tìm kiếm sản phẩm phù hợp'
      case ConversationState.FOLLOW_UP:
        return 'Theo dõi và hỏi thêm'
      case ConversationState.ANALYZING_IMAGE:
        return 'Phân tích ảnh trang phục'
      case ConversationState.STYLE_QUIZ:
        return 'Thực hiện trắc nghiệm phong cách'
      case ConversationState.WARDROBE_MANAGEMENT:
        return 'Quản lý tủ đồ'
      case ConversationState.VIRTUAL_TRY_ON:
        return 'Thử đồ ảo'
      case ConversationState.ERROR_RECOVERY:
        return 'Khôi phục sau lỗi'
      default:
        return 'Trạng thái không xác định'
    }
  }

  public getSuggestedActions(): string[] {
    switch (this.context.currentState) {
      case ConversationState.GREETING:
        return ['Tìm sản phẩm', 'Tư vấn phong cách', 'Phân tích outfit', 'Trắc nghiệm phong cách']
      case ConversationState.COLLECTING_INFO:
        return ['Tiếp tục', 'Bỏ qua', 'Quay lại']
      case ConversationState.PROVIDING_ADVICE:
        return ['Tìm sản phẩm', 'Thử đồ ảo', 'So sánh', 'Hỏi thêm']
      case ConversationState.SEARCHING:
        return ['Thử đồ ảo', 'So sánh', 'Mua ngay', 'Tìm khác']
      case ConversationState.FOLLOW_UP:
        return ['Tìm sản phẩm', 'Tư vấn thêm', 'Kết thúc']
      default:
        return ['Tiếp tục', 'Quay lại']
    }
  }
}

// Singleton instance
export const conversationStateMachine = new ConversationStateMachine()

// Hook for React components
export const useConversationState = () => {
  return {
    currentState: conversationStateMachine.getCurrentState(),
    context: conversationStateMachine.getContext(),
    transition: (intent: UserIntent, data?: any) => conversationStateMachine.transition(intent, data),
    updateCollectedInfo: (info: Partial<ConversationContext['collectedInfo']>) => 
      conversationStateMachine.updateCollectedInfo(info),
    updateUserProfile: (profile: Partial<ConversationContext['userProfile']>) => 
      conversationStateMachine.updateUserProfile(profile),
    reset: () => conversationStateMachine.reset(),
    getStateDescription: () => conversationStateMachine.getStateDescription(),
    getSuggestedActions: () => conversationStateMachine.getSuggestedActions()
  }
}
