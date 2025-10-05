'use client'

export interface ProactiveSuggestion {
  id: string
  title: string
  description: string
  type: 'weather' | 'season' | 'occasion' | 'trend' | 'personal' | 'social'
  priority: number
  action: {
    type: 'search' | 'advice' | 'quiz' | 'wardrobe' | 'try_on'
    data: Record<string, any>
  }
  conditions: {
    weather?: string[]
    season?: string[]
    timeOfDay?: string[]
    userPreferences?: Record<string, any>
    lastActivity?: number // hours
  }
  expiresAt?: Date
}

export interface SuggestionContext {
  weather: {
    condition: string
    temperature: number
    humidity: number
  }
  season: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  userProfile: {
    preferences: Record<string, any>
    lastActivity: Date
    stylePersonality: string
    budget: number
  }
  currentDate: Date
  specialEvents: string[]
}

export class ProactiveSuggestionsEngine {
  private suggestions: ProactiveSuggestion[] = []
  private contextRules: Map<string, (context: SuggestionContext) => ProactiveSuggestion[]> = new Map()

  constructor() {
    this.initializeSuggestions()
    this.initializeContextRules()
  }

  private initializeSuggestions(): void {
    // Weather-based suggestions
    this.suggestions.push({
      id: 'rainy_day',
      title: 'Ngày mưa - Gợi ý outfit',
      description: 'Hôm nay trời mưa, bạn có muốn gợi ý outfit phù hợp không?',
      type: 'weather',
      priority: 9,
      action: {
        type: 'advice',
        data: { occasion: 'rainy_day', style: 'practical' }
      },
      conditions: {
        weather: ['rain', 'drizzle', 'storm'],
        timeOfDay: ['morning', 'afternoon']
      }
    })

    this.suggestions.push({
      id: 'hot_day',
      title: 'Ngày nóng - Trang phục thoáng mát',
      description: 'Hôm nay trời nóng, bạn có cần gợi ý trang phục thoáng mát không?',
      type: 'weather',
      priority: 8,
      action: {
        type: 'advice',
        data: { occasion: 'hot_day', style: 'breathable' }
      },
      conditions: {
        weather: ['sunny', 'hot'],
        timeOfDay: ['morning', 'afternoon']
      }
    })

    this.suggestions.push({
      id: 'cold_day',
      title: 'Ngày lạnh - Áo khoác phù hợp',
      description: 'Hôm nay trời lạnh, bạn có cần gợi ý áo khoác không?',
      type: 'weather',
      priority: 9,
      action: {
        type: 'advice',
        data: { occasion: 'cold_day', style: 'warm' }
      },
      conditions: {
        weather: ['cold', 'windy', 'cloudy'],
        timeOfDay: ['morning', 'evening']
      }
    })

    // Season-based suggestions
    this.suggestions.push({
      id: 'spring_transition',
      title: 'Mùa xuân - Chuyển đổi phong cách',
      description: 'Mùa xuân đến rồi, bạn có muốn cập nhật phong cách không?',
      type: 'season',
      priority: 7,
      action: {
        type: 'quiz',
        data: { season: 'spring', type: 'style_transition' }
      },
      conditions: {
        season: ['spring'],
        timeOfDay: ['morning', 'afternoon']
      }
    })

    this.suggestions.push({
      id: 'summer_preparation',
      title: 'Mùa hè - Chuẩn bị tủ đồ',
      description: 'Mùa hè sắp đến, bạn có muốn chuẩn bị tủ đồ không?',
      type: 'season',
      priority: 8,
      action: {
        type: 'wardrobe',
        data: { season: 'summer', action: 'prepare' }
      },
      conditions: {
        season: ['spring'],
        timeOfDay: ['morning', 'afternoon']
      }
    })

    this.suggestions.push({
      id: 'winter_essentials',
      title: 'Mùa đông - Đồ cần thiết',
      description: 'Mùa đông đến rồi, bạn có cần gợi ý đồ cần thiết không?',
      type: 'season',
      priority: 9,
      action: {
        type: 'advice',
        data: { season: 'winter', type: 'essentials' }
      },
      conditions: {
        season: ['winter'],
        timeOfDay: ['morning', 'afternoon']
      }
    })

    // Occasion-based suggestions
    this.suggestions.push({
      id: 'weekend_outfit',
      title: 'Cuối tuần - Outfit đi chơi',
      description: 'Cuối tuần này bạn có kế hoạch gì không? Tôi có thể gợi ý outfit phù hợp!',
      type: 'occasion',
      priority: 6,
      action: {
        type: 'advice',
        data: { occasion: 'weekend', style: 'casual' }
      },
      conditions: {
        timeOfDay: ['morning', 'afternoon']
      }
    })

    this.suggestions.push({
      id: 'work_outfit',
      title: 'Đầu tuần - Outfit công sở',
      description: 'Đầu tuần mới, bạn có cần gợi ý outfit công sở không?',
      type: 'occasion',
      priority: 7,
      action: {
        type: 'advice',
        data: { occasion: 'work', style: 'professional' }
      },
      conditions: {
        timeOfDay: ['morning']
      }
    })

    // Personal suggestions
    this.suggestions.push({
      id: 'style_quiz',
      title: 'Trắc nghiệm phong cách',
      description: 'Bạn có muốn làm trắc nghiệm để tìm hiểu phong cách cá nhân không?',
      type: 'personal',
      priority: 5,
      action: {
        type: 'quiz',
        data: { type: 'style_personality' }
      },
      conditions: {
        lastActivity: 24 // hours
      }
    })

    this.suggestions.push({
      id: 'wardrobe_audit',
      title: 'Kiểm tra tủ đồ',
      description: 'Bạn có muốn kiểm tra và tổ chức lại tủ đồ không?',
      type: 'personal',
      priority: 6,
      action: {
        type: 'wardrobe',
        data: { action: 'audit' }
      },
      conditions: {
        lastActivity: 48 // hours
      }
    })

    // Trend-based suggestions
    this.suggestions.push({
      id: 'trend_alert',
      title: 'Xu hướng mới',
      description: 'Có xu hướng thời trang mới, bạn có muốn xem không?',
      type: 'trend',
      priority: 4,
      action: {
        type: 'search',
        data: { type: 'trending', category: 'men' }
      },
      conditions: {
        timeOfDay: ['afternoon', 'evening']
      }
    })
  }

  private initializeContextRules(): void {
    // Rule for new users
    this.contextRules.set('new_user', (context: SuggestionContext) => {
      return [
        {
          id: 'welcome_quiz',
          title: 'Chào mừng! Trắc nghiệm phong cách',
          description: 'Hãy làm trắc nghiệm để tôi hiểu phong cách của bạn tốt hơn',
          type: 'personal',
          priority: 10,
          action: {
            type: 'quiz',
            data: { type: 'welcome', category: 'style_discovery' }
          },
          conditions: {}
        }
      ]
    })

    // Rule for returning users
    this.contextRules.set('returning_user', (context: SuggestionContext) => {
      return [
        {
          id: 'personalized_suggestion',
          title: 'Gợi ý cá nhân hóa',
          description: 'Dựa trên sở thích của bạn, tôi có một số gợi ý mới',
          type: 'personal',
          priority: 8,
          action: {
            type: 'advice',
            data: { type: 'personalized', basedOn: 'preferences' }
          },
          conditions: {}
        }
      ]
    })

    // Rule for special events
    this.contextRules.set('special_event', (context: SuggestionContext) => {
      return [
        {
          id: 'event_outfit',
          title: 'Outfit cho sự kiện đặc biệt',
          description: 'Tôi thấy có sự kiện đặc biệt, bạn có cần gợi ý outfit không?',
          type: 'occasion',
          priority: 9,
          action: {
            type: 'advice',
            data: { type: 'special_event', occasion: 'formal' }
          },
          conditions: {}
        }
      ]
    })
  }

  public generateSuggestions(context: SuggestionContext): ProactiveSuggestion[] {
    const applicableSuggestions: ProactiveSuggestion[] = []

    // Check each suggestion against context
    for (const suggestion of this.suggestions) {
      if (this.isSuggestionApplicable(suggestion, context)) {
        applicableSuggestions.push(suggestion)
      }
    }

    // Apply context-specific rules
    const contextSpecificSuggestions = this.getContextSpecificSuggestions(context)
    applicableSuggestions.push(...contextSpecificSuggestions)

    // Sort by priority and remove expired
    return applicableSuggestions
      .filter(suggestion => !suggestion.expiresAt || suggestion.expiresAt > new Date())
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5) // Return top 5 suggestions
  }

  private isSuggestionApplicable(suggestion: ProactiveSuggestion, context: SuggestionContext): boolean {
    const conditions = suggestion.conditions

    // Check weather conditions
    if (conditions.weather && !conditions.weather.includes(context.weather.condition)) {
      return false
    }

    // Check season conditions
    if (conditions.season && !conditions.season.includes(context.season)) {
      return false
    }

    // Check time of day conditions
    if (conditions.timeOfDay && !conditions.timeOfDay.includes(context.timeOfDay)) {
      return false
    }

    // Check last activity conditions
    if (conditions.lastActivity) {
      const hoursSinceLastActivity = (new Date().getTime() - context.userProfile.lastActivity.getTime()) / (1000 * 60 * 60)
      if (hoursSinceLastActivity < conditions.lastActivity) {
        return false
      }
    }

    // Check user preferences
    if (conditions.userPreferences) {
      for (const [key, value] of Object.entries(conditions.userPreferences)) {
        if (context.userProfile.preferences[key] !== value) {
          return false
        }
      }
    }

    return true
  }

  private getContextSpecificSuggestions(context: SuggestionContext): ProactiveSuggestion[] {
    const suggestions: ProactiveSuggestion[] = []

    // Check for new user (no last activity or very old)
    const hoursSinceLastActivity = (new Date().getTime() - context.userProfile.lastActivity.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastActivity > 168) { // 1 week
      const newUserSuggestions = this.contextRules.get('new_user')?.(context) || []
      suggestions.push(...newUserSuggestions)
    } else if (hoursSinceLastActivity > 24) { // 1 day
      const returningUserSuggestions = this.contextRules.get('returning_user')?.(context) || []
      suggestions.push(...returningUserSuggestions)
    }

    // Check for special events
    if (context.specialEvents.length > 0) {
      const specialEventSuggestions = this.contextRules.get('special_event')?.(context) || []
      suggestions.push(...specialEventSuggestions)
    }

    return suggestions
  }

  public generateSuggestionMessage(suggestion: ProactiveSuggestion): string {
    return suggestion.description
  }

  public generateSuggestionActions(suggestion: ProactiveSuggestion): Array<{label: string, value: string}> {
    const actions: Array<{label: string, value: string}> = []

    switch (suggestion.action.type) {
      case 'advice':
        actions.push({ label: 'Tư vấn ngay', value: `advice:${JSON.stringify(suggestion.action.data)}` })
        break
      case 'search':
        actions.push({ label: 'Tìm kiếm', value: `search:${JSON.stringify(suggestion.action.data)}` })
        break
      case 'quiz':
        actions.push({ label: 'Làm trắc nghiệm', value: `quiz:${JSON.stringify(suggestion.action.data)}` })
        break
      case 'wardrobe':
        actions.push({ label: 'Quản lý tủ đồ', value: `wardrobe:${JSON.stringify(suggestion.action.data)}` })
        break
      case 'try_on':
        actions.push({ label: 'Thử đồ ảo', value: `try_on:${JSON.stringify(suggestion.action.data)}` })
        break
    }

    actions.push({ label: 'Bỏ qua', value: 'skip' })
    return actions
  }

  public markSuggestionAsShown(suggestionId: string): void {
    // In a real implementation, this would track shown suggestions
    // to avoid showing the same suggestion repeatedly
    console.log(`Suggestion ${suggestionId} marked as shown`)
  }

  public getSuggestionStats(): {total: number, shown: number, clicked: number} {
    // In a real implementation, this would return actual stats
    return { total: this.suggestions.length, shown: 0, clicked: 0 }
  }
}

// Singleton instance
export const proactiveSuggestionsEngine = new ProactiveSuggestionsEngine()

// Hook for React components
export const useProactiveSuggestions = () => {
  return {
    generateSuggestions: (context: SuggestionContext) => proactiveSuggestionsEngine.generateSuggestions(context),
    generateSuggestionMessage: (suggestion: ProactiveSuggestion) => proactiveSuggestionsEngine.generateSuggestionMessage(suggestion),
    generateSuggestionActions: (suggestion: ProactiveSuggestion) => proactiveSuggestionsEngine.generateSuggestionActions(suggestion),
    markSuggestionAsShown: (suggestionId: string) => proactiveSuggestionsEngine.markSuggestionAsShown(suggestionId),
    getSuggestionStats: () => proactiveSuggestionsEngine.getSuggestionStats()
  }
}
