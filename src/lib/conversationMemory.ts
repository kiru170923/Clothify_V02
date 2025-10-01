// Define a minimal Message interface locally to avoid cross-component coupling
export interface Message {
  content: string
}

export interface UserPreferences {
  preferredStyles: string[]
  colorPreferences: string[]
  sizePreferences: string[]
  priceRange: { min: number; max: number }
  brandPreferences: string[]
  occasionPreferences: string[]
}

export interface SearchHistory {
  query: string
  timestamp: Date
  results: any[]
  clickedProducts: string[]
  filters: Record<string, any>
}

export interface SessionData {
  sessionId: string
  startTime: Date
  totalMessages: number
  currentIntent: string
  conversationFlow: string[]
}

export interface EmotionalState {
  sentiment: 'positive' | 'negative' | 'neutral'
  urgency: 'low' | 'medium' | 'high'
  frustration: number // 0-1
  emotionalState: 'happy' | 'frustrated' | 'curious' | 'neutral' | 'excited'
}

export interface ConversationContext {
  userPreferences: UserPreferences
  recentSearches: SearchHistory[]
  currentSession: SessionData
  emotionalState: EmotionalState
  conversationFlow: string[]
  lastProductInteractions: string[]
  userProfile?: UserProfile
}

export interface UserProfile {
  id: string
  age?: number
  bodyType?: 'slim' | 'athletic' | 'regular' | 'plus'
  height?: number
  weight?: number
  stylePersonality: 'classic' | 'casual' | 'trendy' | 'minimalist' | 'bold'
  colorPreferences: string[]
  brandPreferences: string[]
  purchaseHistory: PurchaseRecord[]
  searchHistory: SearchRecord[]
  ratingHistory: RatingRecord[]
}

export interface PurchaseRecord {
  productId: string
  timestamp: Date
  price: number
  rating?: number
  review?: string
}

export interface SearchRecord {
  query: string
  timestamp: Date
  resultsCount: number
  clickedProducts: string[]
}

export interface RatingRecord {
  productId: string
  rating: number
  timestamp: Date
  review?: string
}

class ConversationMemoryManager {
  private context: ConversationContext | null = null
  private sessionId: string = ''

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeContext()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private initializeContext(): void {
    this.context = {
      userPreferences: {
        preferredStyles: [],
        colorPreferences: [],
        sizePreferences: [],
        priceRange: { min: 0, max: 2000000 },
        brandPreferences: [],
        occasionPreferences: []
      },
      recentSearches: [],
      currentSession: {
        sessionId: this.sessionId,
        startTime: new Date(),
        totalMessages: 0,
        currentIntent: '',
        conversationFlow: []
      },
      emotionalState: {
        sentiment: 'neutral',
        urgency: 'low',
        frustration: 0,
        emotionalState: 'neutral'
      },
      conversationFlow: [],
      lastProductInteractions: []
    }
  }

  // Update context based on new message
  updateContextFromMessage(message: Message, messages: Message[]): void {
    if (!this.context) return

    // Update session data
    this.context.currentSession.totalMessages++
    this.context.currentSession.conversationFlow.push(message.content)

    // Analyze emotional state
    this.context.emotionalState = this.analyzeEmotionalState(message, messages)

    // Extract preferences from message
    this.extractPreferencesFromMessage(message)

    // Update conversation flow
    this.updateConversationFlow(message, messages)
  }

  private analyzeEmotionalState(message: Message, messages: Message[]): EmotionalState {
    const content = message.content.toLowerCase()
    
    // Sentiment analysis
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'
    const positiveWords = ['cảm ơn', 'tốt', 'hay', 'đẹp', 'thích', 'ok', 'được']
    const negativeWords = ['không', 'tệ', 'xấu', 'không thích', 'không được', 'lỗi', 'sai']
    
    if (positiveWords.some(word => content.includes(word))) {
      sentiment = 'positive'
    } else if (negativeWords.some(word => content.includes(word))) {
      sentiment = 'negative'
    }

    // Urgency detection
    let urgency: 'low' | 'medium' | 'high' = 'low'
    const urgentWords = ['gấp', 'nhanh', 'ngay', 'khẩn cấp', 'cần']
    if (urgentWords.some(word => content.includes(word))) {
      urgency = 'high'
    } else if (content.includes('?')) {
      urgency = 'medium'
    }

    // Frustration detection
    let frustration = 0
    const frustrationWords = ['tại sao', 'không hiểu', 'khó', 'phức tạp', 'rối']
    const frustrationCount = frustrationWords.filter(word => content.includes(word)).length
    frustration = Math.min(frustrationCount * 0.2, 1)

    // Determine emotional state
    let emotionalState: EmotionalState['emotionalState'] = 'neutral'
    if (sentiment === 'positive' && urgency === 'high') {
      emotionalState = 'excited'
    } else if (sentiment === 'negative' || frustration > 0.5) {
      emotionalState = 'frustrated'
    } else if (urgency === 'medium' || content.includes('?')) {
      emotionalState = 'curious'
    } else if (sentiment === 'positive') {
      emotionalState = 'happy'
    }

    return { sentiment, urgency, frustration, emotionalState }
  }

  private extractPreferencesFromMessage(message: Message): void {
    if (!this.context) return

    const content = message.content.toLowerCase()
    const preferences = this.context.userPreferences

    // Extract color preferences
    const colors = ['trắng', 'đen', 'xanh', 'đỏ', 'vàng', 'hồng', 'tím', 'cam', 'xám', 'nâu']
    colors.forEach(color => {
      if (content.includes(color) && !preferences.colorPreferences.includes(color)) {
        preferences.colorPreferences.push(color)
      }
    })

    // Extract size preferences
    const sizes = ['xs', 's', 'm', 'l', 'xl', 'xxl']
    sizes.forEach(size => {
      if (content.includes(`size ${size}`) && !preferences.sizePreferences.includes(size)) {
        preferences.sizePreferences.push(size)
      }
    })

    // Extract style preferences
    const styles = ['casual', 'formal', 'sport', 'vintage', 'modern', 'classic']
    styles.forEach(style => {
      if (content.includes(style) && !preferences.preferredStyles.includes(style)) {
        preferences.preferredStyles.push(style)
      }
    })

    // Extract price preferences
    const priceMatch = content.match(/(\d+)k|(\d+)\s*000/)
    if (priceMatch) {
      const price = parseInt(priceMatch[1] || priceMatch[2]) * 1000
      if (content.includes('dưới') || content.includes('dưới')) {
        preferences.priceRange.max = Math.min(preferences.priceRange.max, price)
      } else if (content.includes('trên') || content.includes('trên')) {
        preferences.priceRange.min = Math.max(preferences.priceRange.min, price)
      }
    }
  }

  private updateConversationFlow(message: Message, messages: Message[]): void {
    if (!this.context) return

    // Keep only last 10 messages for context
    const recentMessages = messages.slice(-10)
    this.context.conversationFlow = recentMessages.map(m => m.content)
  }

  // Get personalized response based on context
  getPersonalizedResponse(baseResponse: string): string {
    if (!this.context) return baseResponse

    const { emotionalState, userPreferences } = this.context

    // Add emotional context to response
    let personalizedResponse = baseResponse

    if (emotionalState.emotionalState === 'frustrated') {
      personalizedResponse = `Mình hiểu bạn đang gặp khó khăn. ${baseResponse} Hãy để mình hỗ trợ bạn tốt hơn nhé!`
    } else if (emotionalState.emotionalState === 'excited') {
      personalizedResponse = `Tuyệt vời! ${baseResponse} Mình cũng rất vui được giúp bạn!`
    } else if (emotionalState.emotionalState === 'curious') {
      personalizedResponse = `${baseResponse} Bạn có muốn mình giải thích thêm về điều gì không?`
    }

    // Add preference context
    if (userPreferences.colorPreferences.length > 0) {
      const colors = userPreferences.colorPreferences.slice(-2).join(', ')
      personalizedResponse += ` Mình nhớ bạn thích màu ${colors}.`
    }

    return personalizedResponse
  }

  // Get context for AI
  getContextForAI(): string {
    if (!this.context) return ''

    const { userPreferences, emotionalState, recentSearches } = this.context

    return `
Context hiện tại:
- User preferences: ${JSON.stringify(userPreferences)}
- Emotional state: ${emotionalState.emotionalState} (${emotionalState.sentiment})
- Recent searches: ${recentSearches.slice(-3).map(s => s.query).join(', ')}
- Conversation flow: ${this.context.conversationFlow.slice(-3).join(' -> ')}
    `.trim()
  }

  // Update search history
  addSearchHistory(query: string, results: any[], clickedProducts: string[] = []): void {
    if (!this.context) return

    const searchRecord: SearchHistory = {
      query,
      timestamp: new Date(),
      results,
      clickedProducts,
      filters: {}
    }

    this.context.recentSearches.push(searchRecord)
    
    // Keep only last 20 searches
    if (this.context.recentSearches.length > 20) {
      this.context.recentSearches = this.context.recentSearches.slice(-20)
    }
  }

  // Get current context
  getCurrentContext(): ConversationContext | null {
    return this.context
  }

  // Save context to localStorage
  saveContext(): void {
    if (typeof window !== 'undefined' && this.context) {
      localStorage.setItem('conversation-context', JSON.stringify(this.context))
    }
  }

  // Load context from localStorage
  loadContext(): void {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('conversation-context')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          this.context = {
            ...parsed,
            recentSearches: parsed.recentSearches?.map((s: any) => ({
              ...s,
              timestamp: new Date(s.timestamp)
            })) || [],
            currentSession: {
              ...parsed.currentSession,
              startTime: new Date(parsed.currentSession.startTime)
            }
          }
        } catch (error) {
          console.error('Error loading conversation context:', error)
          this.initializeContext()
        }
      }
    }
  }

  // Clear context
  clearContext(): void {
    this.initializeContext()
    if (typeof window !== 'undefined') {
      localStorage.removeItem('conversation-context')
    }
  }
}

// Export singleton instance
export const conversationMemory = new ConversationMemoryManager()

// Hook for React components
export const useConversationMemory = () => {
  return {
    context: conversationMemory.getCurrentContext(),
    updateContext: (message: Message, messages: Message[]) => 
      conversationMemory.updateContextFromMessage(message, messages),
    getPersonalizedResponse: (response: string) => 
      conversationMemory.getPersonalizedResponse(response),
    getContextForAI: () => conversationMemory.getContextForAI(),
    addSearchHistory: (query: string, results: any[], clickedProducts?: string[]) => 
      conversationMemory.addSearchHistory(query, results, clickedProducts),
    saveContext: () => conversationMemory.saveContext(),
    loadContext: () => conversationMemory.loadContext(),
    clearContext: () => conversationMemory.clearContext()
  }
}
