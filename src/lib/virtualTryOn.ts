'use client'

export interface VirtualTryOnResult {
  success: boolean
  resultImageUrl?: string
  originalImageUrl: string
  clothingImageUrl: string
  confidence: number
  processingTime: number
  metadata: {
    clothingType: string
    color: string
    fit: string
    style: string
  }
  error?: string
}

export interface TryOnRequest {
  personImageUrl: string
  clothingImageUrl: string
  options?: {
    preserveBackground?: boolean
    adjustLighting?: boolean
    enhanceQuality?: boolean
    style?: 'realistic' | 'artistic' | 'fashion'
  }
}

export interface TryOnHistory {
  id: string
  personImageUrl: string
  clothingImageUrl: string
  resultImageUrl: string
  timestamp: Date
  metadata: VirtualTryOnResult['metadata']
  rating?: number
  feedback?: string
}

export class VirtualTryOnEngine {
  private apiEndpoint: string
  private apiKey: string
  private history: TryOnHistory[] = []

  constructor() {
    this.apiEndpoint = process.env.NEXT_PUBLIC_KIE_AI_ENDPOINT || 'https://api.kie.ai'
    this.apiKey = process.env.NEXT_PUBLIC_KIE_AI_KEY || ''
  }

  public async tryOnClothing(request: TryOnRequest): Promise<VirtualTryOnResult> {
    const startTime = Date.now()

    try {
      // Validate inputs
      if (!request.personImageUrl || !request.clothingImageUrl) {
        throw new Error('Missing required image URLs')
      }

      // Detect clothing type and extract metadata
      const clothingMetadata = await this.analyzeClothingImage(request.clothingImageUrl)
      
      // Prepare API request
      const apiRequest = {
        person_image_url: request.personImageUrl,
        clothing_image_url: request.clothingImageUrl,
        options: {
          preserve_background: request.options?.preserveBackground ?? true,
          adjust_lighting: request.options?.adjustLighting ?? true,
          enhance_quality: request.options?.enhanceQuality ?? true,
          style: request.options?.style ?? 'realistic',
          image_size: '3:4' // Use 3:4 aspect ratio as requested
        }
      }

      // Call Kie.ai API
      const response = await fetch(`${this.apiEndpoint}/v1/try-on`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(apiRequest)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Virtual try-on failed')
      }

      const result = await response.json()
      const processingTime = Date.now() - startTime

      // Create result object
      const tryOnResult: VirtualTryOnResult = {
        success: true,
        resultImageUrl: result.result_image_url,
        originalImageUrl: request.personImageUrl,
        clothingImageUrl: request.clothingImageUrl,
        confidence: result.confidence || 0.8,
        processingTime,
        metadata: {
          clothingType: clothingMetadata.type,
          color: clothingMetadata.color,
          fit: clothingMetadata.fit,
          style: clothingMetadata.style
        }
      }

      // Save to history
      this.saveToHistory(tryOnResult)

      return tryOnResult

    } catch (error) {
      const processingTime = Date.now() - startTime
      
      return {
        success: false,
        originalImageUrl: request.personImageUrl,
        clothingImageUrl: request.clothingImageUrl,
        confidence: 0,
        processingTime,
        metadata: {
          clothingType: 'unknown',
          color: 'unknown',
          fit: 'unknown',
          style: 'unknown'
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async analyzeClothingImage(imageUrl: string): Promise<{
    type: string
    color: string
    fit: string
    style: string
  }> {
    try {
      // In a real implementation, this would use AI to analyze the clothing image
      // For now, return basic analysis based on URL patterns
      const url = imageUrl.toLowerCase()
      
      let type = 'shirt'
      if (url.includes('pants') || url.includes('jeans') || url.includes('quần')) {
        type = 'pants'
      } else if (url.includes('shoes') || url.includes('giày')) {
        type = 'shoes'
      } else if (url.includes('jacket') || url.includes('coat') || url.includes('áo khoác')) {
        type = 'jacket'
      }

      let color = 'unknown'
      const colors = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'pink', 'purple', 'brown', 'gray']
      for (const colorName of colors) {
        if (url.includes(colorName)) {
          color = colorName
          break
        }
      }

      let fit = 'regular'
      if (url.includes('slim') || url.includes('tight')) {
        fit = 'slim'
      } else if (url.includes('loose') || url.includes('baggy') || url.includes('oversized')) {
        fit = 'loose'
      }

      let style = 'casual'
      if (url.includes('formal') || url.includes('business') || url.includes('suit')) {
        style = 'formal'
      } else if (url.includes('sport') || url.includes('athletic')) {
        style = 'sporty'
      } else if (url.includes('street') || url.includes('urban')) {
        style = 'streetwear'
      }

      return { type, color, fit, style }

    } catch (error) {
      console.error('Error analyzing clothing image:', error)
      return {
        type: 'unknown',
        color: 'unknown',
        fit: 'unknown',
        style: 'unknown'
      }
    }
  }

  private saveToHistory(result: VirtualTryOnResult): void {
    if (!result.success || !result.resultImageUrl) return

    const historyEntry: TryOnHistory = {
      id: `tryon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      personImageUrl: result.originalImageUrl,
      clothingImageUrl: result.clothingImageUrl,
      resultImageUrl: result.resultImageUrl,
      timestamp: new Date(),
      metadata: result.metadata
    }

    this.history.unshift(historyEntry)
    
    // Keep only last 50 entries
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50)
    }

    // Save to localStorage
    try {
      localStorage.setItem('virtual_tryon_history', JSON.stringify(this.history))
    } catch (error) {
      console.error('Error saving try-on history:', error)
    }
  }

  public loadHistory(): TryOnHistory[] {
    try {
      const stored = localStorage.getItem('virtual_tryon_history')
      if (stored) {
        this.history = JSON.parse(stored).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }))
      }
    } catch (error) {
      console.error('Error loading try-on history:', error)
    }
    
    return this.history
  }

  public getHistory(): TryOnHistory[] {
    return [...this.history]
  }

  public clearHistory(): void {
    this.history = []
    try {
      localStorage.removeItem('virtual_tryon_history')
    } catch (error) {
      console.error('Error clearing try-on history:', error)
    }
  }

  public rateTryOn(id: string, rating: number, feedback?: string): boolean {
    const entry = this.history.find(item => item.id === id)
    if (entry) {
      entry.rating = rating
      entry.feedback = feedback
      
      // Save updated history
      try {
        localStorage.setItem('virtual_tryon_history', JSON.stringify(this.history))
        return true
      } catch (error) {
        console.error('Error saving rating:', error)
        return false
      }
    }
    return false
  }

  public getTryOnStats(): {
    total: number
    successful: number
    averageRating: number
    mostPopularClothing: string
    averageProcessingTime: number
  } {
    const total = this.history.length
    const successful = this.history.filter(entry => entry.resultImageUrl).length
    
    const ratings = this.history.filter(entry => entry.rating).map(entry => entry.rating!)
    const averageRating = ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0
    
    const clothingTypes = this.history.map(entry => entry.metadata.clothingType)
    const mostPopularClothing = this.getMostFrequent(clothingTypes)
    
    const processingTimes = this.history.map(entry => {
      // Estimate processing time based on metadata
      return 3000 // Default 3 seconds
    })
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0

    return {
      total,
      successful,
      averageRating,
      mostPopularClothing,
      averageProcessingTime
    }
  }

  private getMostFrequent(items: string[]): string {
    const frequency: Record<string, number> = {}
    
    for (const item of items) {
      frequency[item] = (frequency[item] || 0) + 1
    }
    
    let mostFrequent = ''
    let maxCount = 0
    
    for (const [item, count] of Object.entries(frequency)) {
      if (count > maxCount) {
        maxCount = count
        mostFrequent = item
      }
    }
    
    return mostFrequent
  }

  public async enhanceImage(imageUrl: string, options: {
    upscale?: boolean
    denoise?: boolean
    sharpen?: boolean
    colorCorrect?: boolean
  } = {}): Promise<string> {
    try {
      // In a real implementation, this would use an image enhancement API
      // For now, return the original URL
      return imageUrl
    } catch (error) {
      console.error('Error enhancing image:', error)
      return imageUrl
    }
  }

  public async generateOutfitVariations(baseOutfit: {
    personImageUrl: string
    clothingItems: string[]
  }): Promise<Array<{
    combination: string[]
    resultImageUrl: string
    confidence: number
  }>> {
    try {
      // In a real implementation, this would generate multiple outfit combinations
      // For now, return a single variation
      return [{
        combination: baseOutfit.clothingItems,
        resultImageUrl: baseOutfit.personImageUrl,
        confidence: 0.8
      }]
    } catch (error) {
      console.error('Error generating outfit variations:', error)
      return []
    }
  }

  public async compareOutfits(outfit1: TryOnRequest, outfit2: TryOnRequest): Promise<{
    outfit1Result: VirtualTryOnResult
    outfit2Result: VirtualTryOnResult
    comparison: {
      winner: 'outfit1' | 'outfit2' | 'tie'
      scores: {
        outfit1: number
        outfit2: number
      }
      feedback: string
    }
  }> {
    try {
      const [result1, result2] = await Promise.all([
        this.tryOnClothing(outfit1),
        this.tryOnClothing(outfit2)
      ])

      // Simple comparison logic
      const score1 = result1.confidence * (result1.success ? 1 : 0)
      const score2 = result2.confidence * (result2.success ? 1 : 0)

      let winner: 'outfit1' | 'outfit2' | 'tie'
      if (score1 > score2) winner = 'outfit1'
      else if (score2 > score1) winner = 'outfit2'
      else winner = 'tie'

      const feedback = winner === 'tie' 
        ? 'Cả hai outfit đều phù hợp'
        : `Outfit ${winner === 'outfit1' ? 'đầu tiên' : 'thứ hai'} phù hợp hơn`

      return {
        outfit1Result: result1,
        outfit2Result: result2,
        comparison: {
          winner,
          scores: {
            outfit1: score1,
            outfit2: score2
          },
          feedback
        }
      }

    } catch (error) {
      throw new Error(`Outfit comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// Singleton instance
export const virtualTryOnEngine = new VirtualTryOnEngine()

// Hook for React components
export const useVirtualTryOn = () => {
  return {
    tryOnClothing: (request: TryOnRequest) => virtualTryOnEngine.tryOnClothing(request),
    loadHistory: () => virtualTryOnEngine.loadHistory(),
    getHistory: () => virtualTryOnEngine.getHistory(),
    clearHistory: () => virtualTryOnEngine.clearHistory(),
    rateTryOn: (id: string, rating: number, feedback?: string) => 
      virtualTryOnEngine.rateTryOn(id, rating, feedback),
    getTryOnStats: () => virtualTryOnEngine.getTryOnStats(),
    enhanceImage: (imageUrl: string, options?: any) => 
      virtualTryOnEngine.enhanceImage(imageUrl, options),
    generateOutfitVariations: (baseOutfit: any) => 
      virtualTryOnEngine.generateOutfitVariations(baseOutfit),
    compareOutfits: (outfit1: TryOnRequest, outfit2: TryOnRequest) => 
      virtualTryOnEngine.compareOutfits(outfit1, outfit2)
  }
}
