'use client'

import { ConversationContext } from './conversationStateMachine'

export interface FollowUpQuestion {
  id: string
  question: string
  type: 'choice' | 'text' | 'number' | 'boolean'
  options?: string[]
  required: boolean
  category: 'occasion' | 'style' | 'budget' | 'preferences' | 'size' | 'colors'
  priority: number
}

export interface FollowUpContext {
  missingInfo: string[]
  conversationFlow: string[]
  userResponses: Record<string, any>
  currentTopic: string
  urgency: 'low' | 'medium' | 'high'
}

export class SmartFollowUpSystem {
  private followUpQuestions: Map<string, FollowUpQuestion[]> = new Map()
  private contextRules: Map<string, (context: FollowUpContext) => FollowUpQuestion[]> = new Map()

  constructor() {
    this.initializeFollowUpQuestions()
    this.initializeContextRules()
  }

  private initializeFollowUpQuestions(): void {
    // Occasion questions
    this.followUpQuestions.set('occasion', [
      {
        id: 'occasion_type',
        question: 'Bạn sẽ mặc cho dịp gì?',
        type: 'choice',
        options: ['Đi làm', 'Đi chơi', 'Dự tiệc', 'Thể thao', 'Ngày thường', 'Du lịch'],
        required: true,
        category: 'occasion',
        priority: 10
      },
      {
        id: 'occasion_formality',
        question: 'Mức độ trang trọng như thế nào?',
        type: 'choice',
        options: ['Rất trang trọng', 'Trang trọng', 'Bán trang trọng', 'Thoải mái', 'Rất thoải mái'],
        required: false,
        category: 'occasion',
        priority: 8
      }
    ])

    // Style questions
    this.followUpQuestions.set('style', [
      {
        id: 'style_personality',
        question: 'Bạn thích phong cách nào?',
        type: 'choice',
        options: ['Casual', 'Smart Casual', 'Formal', 'Sporty', 'Streetwear', 'Vintage', 'Minimalist'],
        required: true,
        category: 'style',
        priority: 9
      },
      {
        id: 'style_preferences',
        question: 'Bạn có phong cách đặc biệt nào không?',
        type: 'text',
        required: false,
        category: 'style',
        priority: 6
      }
    ])

    // Budget questions
    this.followUpQuestions.set('budget', [
      {
        id: 'budget_range',
        question: 'Ngân sách của bạn là bao nhiêu?',
        type: 'choice',
        options: ['Dưới 500k', '500k - 1M', '1M - 2M', '2M - 5M', 'Trên 5M', 'Không giới hạn'],
        required: true,
        category: 'budget',
        priority: 10
      },
      {
        id: 'budget_flexibility',
        question: 'Bạn có linh hoạt về ngân sách không?',
        type: 'boolean',
        required: false,
        category: 'budget',
        priority: 5
      }
    ])

    // Size questions
    this.followUpQuestions.set('size', [
      {
        id: 'size_preference',
        question: 'Size của bạn là gì?',
        type: 'choice',
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Không chắc'],
        required: true,
        category: 'size',
        priority: 10
      },
      {
        id: 'size_fit',
        question: 'Bạn thích fit như thế nào?',
        type: 'choice',
        options: ['Slim fit', 'Regular fit', 'Loose fit', 'Oversized'],
        required: false,
        category: 'size',
        priority: 7
      }
    ])

    // Color questions
    this.followUpQuestions.set('colors', [
      {
        id: 'color_preferences',
        question: 'Bạn thích màu gì?',
        type: 'choice',
        options: ['Đen', 'Trắng', 'Xám', 'Navy', 'Xanh lá', 'Đỏ', 'Vàng', 'Hồng', 'Tím', 'Nâu'],
        required: false,
        category: 'colors',
        priority: 8
      },
      {
        id: 'color_avoid',
        question: 'Bạn muốn tránh màu nào?',
        type: 'choice',
        options: ['Đỏ', 'Vàng', 'Hồng', 'Tím', 'Xanh lá', 'Cam', 'Không có'],
        required: false,
        category: 'colors',
        priority: 5
      }
    ])

    // Preferences questions
    this.followUpQuestions.set('preferences', [
      {
        id: 'brand_preferences',
        question: 'Bạn có thương hiệu yêu thích nào không?',
        type: 'text',
        required: false,
        category: 'preferences',
        priority: 6
      },
      {
        id: 'material_preferences',
        question: 'Bạn thích chất liệu nào?',
        type: 'choice',
        options: ['Cotton', 'Polyester', 'Linen', 'Denim', 'Leather', 'Wool', 'Silk', 'Không quan tâm'],
        required: false,
        category: 'preferences',
        priority: 7
      }
    ])
  }

  private initializeContextRules(): void {
    // Rule for work occasion
    this.contextRules.set('work_occasion', (context: FollowUpContext) => {
      return [
        {
          id: 'work_formality',
          question: 'Môi trường làm việc của bạn như thế nào?',
          type: 'choice',
          options: ['Rất trang trọng', 'Trang trọng', 'Bán trang trọng', 'Thoải mái'],
          required: true,
          category: 'occasion',
          priority: 10
        },
        {
          id: 'work_dress_code',
          question: 'Có quy định về trang phục không?',
          type: 'choice',
          options: ['Có', 'Không', 'Không chắc'],
          required: false,
          category: 'occasion',
          priority: 8
        }
      ]
    })

    // Rule for party occasion
    this.contextRules.set('party_occasion', (context: FollowUpContext) => {
      return [
        {
          id: 'party_type',
          question: 'Loại tiệc gì?',
          type: 'choice',
          options: ['Tiệc sinh nhật', 'Tiệc cưới', 'Tiệc công ty', 'Tiệc tối', 'Tiệc ngoài trời'],
          required: true,
          category: 'occasion',
          priority: 10
        },
        {
          id: 'party_theme',
          question: 'Có chủ đề gì đặc biệt không?',
          type: 'text',
          required: false,
          category: 'occasion',
          priority: 6
        }
      ]
    })

    // Rule for casual occasion
    this.contextRules.set('casual_occasion', (context: FollowUpContext) => {
      return [
        {
          id: 'casual_activity',
          question: 'Bạn sẽ làm gì?',
          type: 'choice',
          options: ['Đi dạo', 'Gặp bạn bè', 'Mua sắm', 'Xem phim', 'Ăn uống', 'Khác'],
          required: true,
          category: 'occasion',
          priority: 9
        }
      ]
    })
  }

  public analyzeMissingInfo(context: FollowUpContext): string[] {
    const missing: string[] = []
    
    // Check required categories
    const requiredCategories = ['occasion', 'style', 'budget', 'size']
    
    for (const category of requiredCategories) {
      if (!this.hasInfoForCategory(category, context)) {
        missing.push(category)
      }
    }

    return missing
  }

  private hasInfoForCategory(category: string, context: FollowUpContext): boolean {
    // Check if we have info for this category
    return context.userResponses[category] !== undefined
  }

  public generateFollowUpQuestions(context: FollowUpContext): FollowUpQuestion[] {
    const missingInfo = this.analyzeMissingInfo(context)
    const questions: FollowUpQuestion[] = []

    // Get questions for missing info
    for (const category of missingInfo) {
      const categoryQuestions = this.followUpQuestions.get(category) || []
      questions.push(...categoryQuestions)
    }

    // Apply context-specific rules
    const contextSpecificQuestions = this.getContextSpecificQuestions(context)
    questions.push(...contextSpecificQuestions)

    // Sort by priority and filter by urgency
    return questions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, this.getMaxQuestionsForUrgency(context.urgency))
  }

  private getContextSpecificQuestions(context: FollowUpContext): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = []

    // Check for specific context rules
    if (context.currentTopic.includes('công sở') || context.currentTopic.includes('đi làm')) {
      const workQuestions = this.contextRules.get('work_occasion')?.(context) || []
      questions.push(...workQuestions)
    }

    if (context.currentTopic.includes('tiệc') || context.currentTopic.includes('party')) {
      const partyQuestions = this.contextRules.get('party_occasion')?.(context) || []
      questions.push(...partyQuestions)
    }

    if (context.currentTopic.includes('thoải mái') || context.currentTopic.includes('casual')) {
      const casualQuestions = this.contextRules.get('casual_occasion')?.(context) || []
      questions.push(...casualQuestions)
    }

    return questions
  }

  private getMaxQuestionsForUrgency(urgency: 'low' | 'medium' | 'high'): number {
    switch (urgency) {
      case 'high': return 3
      case 'medium': return 2
      case 'low': return 1
      default: return 2
    }
  }

  public generateFollowUpMessage(context: FollowUpContext): string {
    const missingInfo = this.analyzeMissingInfo(context)
    
    if (missingInfo.length === 0) {
      return 'Tôi đã có đủ thông tin để giúp bạn!'
    }

    const questions = this.generateFollowUpQuestions(context)
    if (questions.length === 0) {
      return 'Để tôi có thể tư vấn tốt hơn, bạn có thể cho tôi biết thêm một số thông tin không?'
    }

    const primaryQuestion = questions[0]
    let message = primaryQuestion.question

    // Add context if needed
    if (context.currentTopic) {
      message = `Để tư vấn về ${context.currentTopic}, ${message.toLowerCase()}`
    }

    return message
  }

  public generateQuickActions(context: FollowUpContext): Array<{label: string, value: string}> {
    const questions = this.generateFollowUpQuestions(context)
    const actions: Array<{label: string, value: string}> = []

    for (const question of questions.slice(0, 3)) {
      if (question.type === 'choice' && question.options) {
        for (const option of question.options.slice(0, 2)) {
          actions.push({
            label: option,
            value: `${question.id}:${option}`
          })
        }
      }
    }

    return actions
  }

  public processResponse(questionId: string, response: string, context: FollowUpContext): void {
    const [category, value] = questionId.split(':')
    context.userResponses[category] = value
    context.conversationFlow.push(`${questionId}: ${response}`)
  }

  public getCompletionPercentage(context: FollowUpContext): number {
    const requiredCategories = ['occasion', 'style', 'budget', 'size']
    const completed = requiredCategories.filter(category => 
      this.hasInfoForCategory(category, context)
    ).length

    return Math.round((completed / requiredCategories.length) * 100)
  }
}

// Singleton instance
export const smartFollowUpSystem = new SmartFollowUpSystem()

// Hook for React components
export const useSmartFollowUp = () => {
  return {
    analyzeMissingInfo: (context: FollowUpContext) => smartFollowUpSystem.analyzeMissingInfo(context),
    generateFollowUpQuestions: (context: FollowUpContext) => smartFollowUpSystem.generateFollowUpQuestions(context),
    generateFollowUpMessage: (context: FollowUpContext) => smartFollowUpSystem.generateFollowUpMessage(context),
    generateQuickActions: (context: FollowUpContext) => smartFollowUpSystem.generateQuickActions(context),
    processResponse: (questionId: string, response: string, context: FollowUpContext) => 
      smartFollowUpSystem.processResponse(questionId, response, context),
    getCompletionPercentage: (context: FollowUpContext) => smartFollowUpSystem.getCompletionPercentage(context)
  }
}
