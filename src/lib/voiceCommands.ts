'use client'

export interface VoiceCommand {
  id: string
  command: string
  description: string
  action: {
    type: 'search' | 'advice' | 'navigate' | 'control' | 'custom'
    data: Record<string, any>
  }
  keywords: string[]
  confidence: number
}

export interface VoiceRecognitionResult {
  text: string
  confidence: number
  commands: VoiceCommand[]
  intent: string
  entities: Record<string, any>
}

export interface VoiceControlState {
  isListening: boolean
  isProcessing: boolean
  lastCommand?: VoiceCommand
  error?: string
}

export class VoiceCommandsEngine {
  private commands: Map<string, VoiceCommand> = new Map()
  private recognition: any | null = null
  private isSupported: boolean = false

  constructor() {
    this.initializeCommands()
    this.initializeSpeechRecognition()
  }

  private initializeCommands(): void {
    // Search commands
    this.commands.set('search_products', {
      id: 'search_products',
      command: 'Tìm sản phẩm',
      description: 'Tìm kiếm sản phẩm thời trang',
      action: {
        type: 'search',
        data: { category: 'products' }
      },
      keywords: ['tìm', 'mua', 'shop', 'sản phẩm', 'áo', 'quần', 'giày'],
      confidence: 0.9
    })

    this.commands.set('search_by_price', {
      id: 'search_by_price',
      command: 'Tìm theo giá',
      description: 'Tìm kiếm sản phẩm theo ngân sách',
      action: {
        type: 'search',
        data: { filter: 'price' }
      },
      keywords: ['giá', 'price', 'ngân sách', 'budget', 'dưới', 'trên'],
      confidence: 0.8
    })

    this.commands.set('search_by_color', {
      id: 'search_by_color',
      command: 'Tìm theo màu',
      description: 'Tìm kiếm sản phẩm theo màu sắc',
      action: {
        type: 'search',
        data: { filter: 'color' }
      },
      keywords: ['màu', 'color', 'đen', 'trắng', 'xám', 'đỏ', 'xanh'],
      confidence: 0.8
    })

    // Advice commands
    this.commands.set('style_advice', {
      id: 'style_advice',
      command: 'Tư vấn phong cách',
      description: 'Nhận tư vấn về phong cách thời trang',
      action: {
        type: 'advice',
        data: { category: 'style' }
      },
      keywords: ['tư vấn', 'advice', 'phong cách', 'style', 'outfit', 'mặc gì'],
      confidence: 0.9
    })

    this.commands.set('outfit_suggestion', {
      id: 'outfit_suggestion',
      command: 'Gợi ý outfit',
      description: 'Nhận gợi ý về trang phục',
      action: {
        type: 'advice',
        data: { category: 'outfit' }
      },
      keywords: ['gợi ý', 'suggestion', 'outfit', 'trang phục', 'mặc'],
      confidence: 0.8
    })

    this.commands.set('occasion_advice', {
      id: 'occasion_advice',
      command: 'Tư vấn theo dịp',
      description: 'Tư vấn trang phục cho dịp cụ thể',
      action: {
        type: 'advice',
        data: { category: 'occasion' }
      },
      keywords: ['dịp', 'occasion', 'đi làm', 'đi chơi', 'dự tiệc', 'thể thao'],
      confidence: 0.8
    })

    // Navigation commands
    this.commands.set('go_to_wardrobe', {
      id: 'go_to_wardrobe',
      command: 'Mở tủ đồ',
      description: 'Điều hướng đến trang quản lý tủ đồ',
      action: {
        type: 'navigate',
        data: { page: 'wardrobe' }
      },
      keywords: ['tủ đồ', 'wardrobe', 'closet', 'quản lý', 'manage'],
      confidence: 0.9
    })

    this.commands.set('go_to_history', {
      id: 'go_to_history',
      command: 'Xem lịch sử',
      description: 'Điều hướng đến trang lịch sử',
      action: {
        type: 'navigate',
        data: { page: 'history' }
      },
      keywords: ['lịch sử', 'history', 'xem', 'previous', 'trước'],
      confidence: 0.8
    })

    this.commands.set('go_to_profile', {
      id: 'go_to_profile',
      command: 'Mở hồ sơ',
      description: 'Điều hướng đến trang hồ sơ cá nhân',
      action: {
        type: 'navigate',
        data: { page: 'profile' }
      },
      keywords: ['hồ sơ', 'profile', 'cá nhân', 'personal', 'thông tin'],
      confidence: 0.8
    })

    // Control commands
    this.commands.set('start_listening', {
      id: 'start_listening',
      command: 'Bắt đầu nghe',
      description: 'Bắt đầu nhận diện giọng nói',
      action: {
        type: 'control',
        data: { action: 'start_listening' }
      },
      keywords: ['nghe', 'listen', 'bắt đầu', 'start', 'voice'],
      confidence: 0.9
    })

    this.commands.set('stop_listening', {
      id: 'stop_listening',
      command: 'Dừng nghe',
      description: 'Dừng nhận diện giọng nói',
      action: {
        type: 'control',
        data: { action: 'stop_listening' }
      },
      keywords: ['dừng', 'stop', 'kết thúc', 'end', 'thôi'],
      confidence: 0.9
    })

    this.commands.set('clear_conversation', {
      id: 'clear_conversation',
      command: 'Xóa hội thoại',
      description: 'Xóa toàn bộ hội thoại hiện tại',
      action: {
        type: 'control',
        data: { action: 'clear_conversation' }
      },
      keywords: ['xóa', 'clear', 'delete', 'hội thoại', 'conversation'],
      confidence: 0.8
    })

    // Custom commands
    this.commands.set('virtual_try_on', {
      id: 'virtual_try_on',
      command: 'Thử đồ ảo',
      description: 'Sử dụng tính năng thử đồ ảo',
      action: {
        type: 'custom',
        data: { feature: 'virtual_try_on' }
      },
      keywords: ['thử đồ', 'try on', 'ảo', 'virtual', 'mặc thử'],
      confidence: 0.8
    })

    this.commands.set('style_quiz', {
      id: 'style_quiz',
      command: 'Làm trắc nghiệm',
      description: 'Thực hiện trắc nghiệm phong cách',
      action: {
        type: 'custom',
        data: { feature: 'style_quiz' }
      },
      keywords: ['trắc nghiệm', 'quiz', 'test', 'phong cách', 'style'],
      confidence: 0.8
    })

    this.commands.set('weather_outfit', {
      id: 'weather_outfit',
      command: 'Outfit theo thời tiết',
      description: 'Gợi ý outfit dựa trên thời tiết',
      action: {
        type: 'custom',
        data: { feature: 'weather_outfit' }
      },
      keywords: ['thời tiết', 'weather', 'mưa', 'nắng', 'lạnh', 'nóng'],
      confidence: 0.7
    })
  }

  private initializeSpeechRecognition(): void {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false
        this.recognition.interimResults = false
        this.recognition.lang = 'vi-VN'
        this.isSupported = true
      }
    }
  }

  public isVoiceSupported(): boolean {
    return this.isSupported
  }

  public async startListening(): Promise<Promise<VoiceRecognitionResult>> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported')
    }

    return new Promise((resolve, reject) => {
      this.recognition!.onresult = (event: any) => {
        const result = event.results[0]
        const text = result[0].transcript
        const confidence = result[0].confidence

        const recognitionResult = this.processVoiceInput(text, confidence)
        resolve(recognitionResult)
      }

      this.recognition!.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`))
      }

      this.recognition!.onend = () => {
        // Recognition ended
      }

      this.recognition!.start()
    })
  }

  public stopListening(): void {
    if (this.recognition) {
      this.recognition.stop()
    }
  }

  public processVoiceInput(text: string, confidence: number): VoiceRecognitionResult {
    const normalizedText = text.toLowerCase().trim()
    
    // Find matching commands
    const matchingCommands = this.findMatchingCommands(normalizedText)
    
    // Extract intent and entities
    const intent = this.extractIntent(normalizedText)
    const entities = this.extractEntities(normalizedText)

    return {
      text,
      confidence,
      commands: matchingCommands,
      intent,
      entities
    }
  }

  private findMatchingCommands(text: string): VoiceCommand[] {
    const matches: VoiceCommand[] = []

    for (const command of Array.from(this.commands.values())) {
      const keywordMatches = command.keywords.filter((keyword: string) => 
        text.includes(keyword.toLowerCase())
      ).length

      if (keywordMatches > 0) {
        const matchScore = keywordMatches / command.keywords.length
        if (matchScore >= 0.3) { // At least 30% keyword match
          matches.push({
            ...command,
            confidence: matchScore * command.confidence
          })
        }
      }
    }

    // Sort by confidence and return top matches
    return matches.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
  }

  private extractIntent(text: string): string {
    // Simple intent extraction based on keywords
    if (text.includes('tìm') || text.includes('mua') || text.includes('shop')) {
      return 'search'
    }
    if (text.includes('tư vấn') || text.includes('advice') || text.includes('gợi ý')) {
      return 'advice'
    }
    if (text.includes('đi đến') || text.includes('mở') || text.includes('xem')) {
      return 'navigate'
    }
    if (text.includes('bắt đầu') || text.includes('dừng') || text.includes('xóa')) {
      return 'control'
    }
    return 'unknown'
  }

  private extractEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {}

    // Extract price
    const priceMatch = text.match(/(\d+)\s*(k|nghìn|triệu)/i)
    if (priceMatch) {
      const value = parseInt(priceMatch[1])
      const unit = priceMatch[2].toLowerCase()
      entities.price = unit.includes('k') || unit.includes('nghìn') ? value * 1000 : value * 1000000
    }

    // Extract colors
    const colors = ['đen', 'trắng', 'xám', 'đỏ', 'xanh', 'vàng', 'hồng', 'tím', 'nâu']
    for (const color of colors) {
      if (text.includes(color)) {
        entities.colors = entities.colors || []
        entities.colors.push(color)
      }
    }

    // Extract occasions
    const occasions = ['đi làm', 'đi chơi', 'dự tiệc', 'thể thao', 'du lịch']
    for (const occasion of occasions) {
      if (text.includes(occasion)) {
        entities.occasions = entities.occasions || []
        entities.occasions.push(occasion)
      }
    }

    // Extract products
    const products = ['áo', 'quần', 'giày', 'phụ kiện', 'thắt lưng', 'đồng hồ']
    for (const product of products) {
      if (text.includes(product)) {
        entities.products = entities.products || []
        entities.products.push(product)
      }
    }

    return entities
  }

  public executeCommand(command: VoiceCommand, entities: Record<string, any> = {}): {
    success: boolean
    result?: any
    error?: string
  } {
    try {
      switch (command.action.type) {
        case 'search':
          return this.executeSearchCommand(command, entities)
        case 'advice':
          return this.executeAdviceCommand(command, entities)
        case 'navigate':
          return this.executeNavigateCommand(command, entities)
        case 'control':
          return this.executeControlCommand(command, entities)
        case 'custom':
          return this.executeCustomCommand(command, entities)
        default:
          return { success: false, error: 'Unknown command type' }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private executeSearchCommand(command: VoiceCommand, entities: Record<string, any>): {
    success: boolean
    result?: any
    error?: string
  } {
    // In a real implementation, this would trigger the search functionality
    return {
      success: true,
      result: {
        type: 'search',
        data: { ...command.action.data, ...entities }
      }
    }
  }

  private executeAdviceCommand(command: VoiceCommand, entities: Record<string, any>): {
    success: boolean
    result?: any
    error?: string
  } {
    // In a real implementation, this would trigger the advice functionality
    return {
      success: true,
      result: {
        type: 'advice',
        data: { ...command.action.data, ...entities }
      }
    }
  }

  private executeNavigateCommand(command: VoiceCommand, entities: Record<string, any>): {
    success: boolean
    result?: any
    error?: string
  } {
    // In a real implementation, this would trigger navigation
    return {
      success: true,
      result: {
        type: 'navigate',
        data: { ...command.action.data, ...entities }
      }
    }
  }

  private executeControlCommand(command: VoiceCommand, entities: Record<string, any>): {
    success: boolean
    result?: any
    error?: string
  } {
    // In a real implementation, this would trigger control actions
    return {
      success: true,
      result: {
        type: 'control',
        data: { ...command.action.data, ...entities }
      }
    }
  }

  private executeCustomCommand(command: VoiceCommand, entities: Record<string, any>): {
    success: boolean
    result?: any
    error?: string
  } {
    // In a real implementation, this would trigger custom features
    return {
      success: true,
      result: {
        type: 'custom',
        data: { ...command.action.data, ...entities }
      }
    }
  }

  public getAvailableCommands(): VoiceCommand[] {
    return Array.from(this.commands.values())
  }

  public getCommandSuggestions(): string[] {
    return [
      'Tìm áo sơ mi trắng',
      'Tư vấn phong cách công sở',
      'Gợi ý outfit đi chơi',
      'Mở tủ đồ',
      'Thử đồ ảo',
      'Làm trắc nghiệm phong cách'
    ]
  }

  public generateVoiceResponse(command: VoiceCommand, success: boolean): string {
    if (!success) {
      return 'Xin lỗi, tôi không thể thực hiện lệnh này. Bạn có thể thử lại không?'
    }

    switch (command.action.type) {
      case 'search':
        return 'Tôi sẽ tìm kiếm sản phẩm phù hợp cho bạn.'
      case 'advice':
        return 'Tôi sẽ đưa ra lời khuyên về phong cách thời trang.'
      case 'navigate':
        return 'Tôi sẽ điều hướng đến trang bạn yêu cầu.'
      case 'control':
        return 'Tôi đã thực hiện lệnh điều khiển.'
      case 'custom':
        return 'Tôi sẽ kích hoạt tính năng đặc biệt.'
      default:
        return 'Tôi đã nhận được lệnh của bạn.'
    }
  }
}

// Singleton instance
export const voiceCommandsEngine = new VoiceCommandsEngine()

// Hook for React components
export const useVoiceCommands = () => {
  return {
    isVoiceSupported: () => voiceCommandsEngine.isVoiceSupported(),
    startListening: () => voiceCommandsEngine.startListening(),
    stopListening: () => voiceCommandsEngine.stopListening(),
    processVoiceInput: (text: string, confidence: number) => 
      voiceCommandsEngine.processVoiceInput(text, confidence),
    executeCommand: (command: VoiceCommand, entities?: Record<string, any>) => 
      voiceCommandsEngine.executeCommand(command, entities),
    getAvailableCommands: () => voiceCommandsEngine.getAvailableCommands(),
    getCommandSuggestions: () => voiceCommandsEngine.getCommandSuggestions(),
    generateVoiceResponse: (command: VoiceCommand, success: boolean) => 
      voiceCommandsEngine.generateVoiceResponse(command, success)
  }
}
