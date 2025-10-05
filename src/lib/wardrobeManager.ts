'use client'

export interface WardrobeItem {
  id: string
  name: string
  category: 'top' | 'bottom' | 'shoes' | 'accessories' | 'outerwear'
  subcategory: string
  brand?: string
  color: string
  size: string
  material: string
  style: string
  imageUrl: string
  purchaseDate?: Date
  price?: number
  tags: string[]
  wearCount: number
  lastWorn?: Date
  rating: number
  notes?: string
  isFavorite: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Outfit {
  id: string
  name: string
  items: string[] // Array of wardrobe item IDs
  occasion: string
  season: string
  style: string
  imageUrl?: string
  rating: number
  wearCount: number
  lastWorn?: Date
  tags: string[]
  notes?: string
  isFavorite: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WardrobeStats {
  totalItems: number
  itemsByCategory: Record<string, number>
  itemsByColor: Record<string, number>
  itemsByStyle: Record<string, number>
  mostWornItems: WardrobeItem[]
  leastWornItems: WardrobeItem[]
  averageRating: number
  totalValue: number
  lastAddedItems: WardrobeItem[]
  wearFrequency: {
    daily: number
    weekly: number
    monthly: number
    rarely: number
  }
}

export interface WardrobeRecommendation {
  type: 'outfit' | 'purchase' | 'donation' | 'care'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  action?: {
    type: string
    data: any
  }
  items?: WardrobeItem[]
}

export class WardrobeManager {
  private items: Map<string, WardrobeItem> = new Map()
  private outfits: Map<string, Outfit> = new Map()
  private storageKey = 'wardrobe_items'
  private outfitsKey = 'wardrobe_outfits'

  constructor() {
    this.loadFromStorage()
  }

  // Item Management
  public addItem(item: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt' | 'wearCount' | 'lastWorn'>): WardrobeItem {
    const newItem: WardrobeItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wearCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.items.set(newItem.id, newItem)
    this.saveToStorage()
    return newItem
  }

  public updateItem(id: string, updates: Partial<WardrobeItem>): WardrobeItem | null {
    const item = this.items.get(id)
    if (!item) return null

    const updatedItem = {
      ...item,
      ...updates,
      updatedAt: new Date()
    }

    this.items.set(id, updatedItem)
    this.saveToStorage()
    return updatedItem
  }

  public deleteItem(id: string): boolean {
    const deleted = this.items.delete(id)
    if (deleted) {
      // Remove from outfits
      for (const outfit of Array.from(this.outfits.values())) {
        if (outfit.items.includes(id)) {
          outfit.items = outfit.items.filter((itemId: string) => itemId !== id)
        }
      }
      this.saveToStorage()
    }
    return deleted
  }

  public getItem(id: string): WardrobeItem | null {
    return this.items.get(id) || null
  }

  public getAllItems(): WardrobeItem[] {
    return Array.from(this.items.values())
  }

  public getItemsByCategory(category: WardrobeItem['category']): WardrobeItem[] {
    return Array.from(this.items.values()).filter(item => item.category === category)
  }

  public getItemsByColor(color: string): WardrobeItem[] {
    return Array.from(this.items.values()).filter(item => 
      item.color.toLowerCase().includes(color.toLowerCase())
    )
  }

  public getItemsByStyle(style: string): WardrobeItem[] {
    return Array.from(this.items.values()).filter(item => 
      item.style.toLowerCase().includes(style.toLowerCase())
    )
  }

  public searchItems(query: string): WardrobeItem[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.items.values()).filter(item =>
      item.name.toLowerCase().includes(lowerQuery) ||
      item.brand?.toLowerCase().includes(lowerQuery) ||
      item.color.toLowerCase().includes(lowerQuery) ||
      item.style.toLowerCase().includes(lowerQuery) ||
      item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  public wearItem(id: string): boolean {
    const item = this.items.get(id)
    if (!item) return false

    item.wearCount++
    item.lastWorn = new Date()
    item.updatedAt = new Date()

    this.items.set(id, item)
    this.saveToStorage()
    return true
  }

  // Outfit Management
  public createOutfit(outfit: Omit<Outfit, 'id' | 'createdAt' | 'updatedAt' | 'wearCount' | 'lastWorn'>): Outfit {
    const newOutfit: Outfit = {
      ...outfit,
      id: `outfit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wearCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.outfits.set(newOutfit.id, newOutfit)
    this.saveToStorage()
    return newOutfit
  }

  public updateOutfit(id: string, updates: Partial<Outfit>): Outfit | null {
    const outfit = this.outfits.get(id)
    if (!outfit) return null

    const updatedOutfit = {
      ...outfit,
      ...updates,
      updatedAt: new Date()
    }

    this.outfits.set(id, updatedOutfit)
    this.saveToStorage()
    return updatedOutfit
  }

  public deleteOutfit(id: string): boolean {
    const deleted = this.outfits.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  public getOutfit(id: string): Outfit | null {
    return this.outfits.get(id) || null
  }

  public getAllOutfits(): Outfit[] {
    return Array.from(this.outfits.values())
  }

  public wearOutfit(id: string): boolean {
    const outfit = this.outfits.get(id)
    if (!outfit) return false

    outfit.wearCount++
    outfit.lastWorn = new Date()
    outfit.updatedAt = new Date()

    // Update wear count for individual items
    for (const itemId of outfit.items) {
      this.wearItem(itemId)
    }

    this.outfits.set(id, outfit)
    this.saveToStorage()
    return true
  }

  public generateOutfitSuggestions(occasion: string, season: string, style?: string): Outfit[] {
    const suggestions: Outfit[] = []
    const allItems = this.getAllItems()
    
    // Filter items by season and style
    let filteredItems = allItems.filter(item => {
      // Basic season filtering (in real implementation, this would be more sophisticated)
      return true // For now, include all items
    })

    if (style) {
      filteredItems = filteredItems.filter(item => 
        item.style.toLowerCase().includes(style.toLowerCase())
      )
    }

    // Group by category
    const itemsByCategory = {
      top: filteredItems.filter(item => item.category === 'top'),
      bottom: filteredItems.filter(item => item.category === 'bottom'),
      shoes: filteredItems.filter(item => item.category === 'shoes'),
      accessories: filteredItems.filter(item => item.category === 'accessories'),
      outerwear: filteredItems.filter(item => item.category === 'outerwear')
    }

    // Generate combinations
    for (const top of itemsByCategory.top.slice(0, 3)) {
      for (const bottom of itemsByCategory.bottom.slice(0, 3)) {
        for (const shoes of itemsByCategory.shoes.slice(0, 2)) {
          const outfitItems = [top.id, bottom.id, shoes.id]
          
          // Add accessories if available
          if (itemsByCategory.accessories.length > 0) {
            outfitItems.push(itemsByCategory.accessories[0].id)
          }

          const suggestion: Outfit = {
            id: `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: `Outfit ${occasion}`,
            items: outfitItems,
            occasion,
            season,
            style: style || 'mixed',
            rating: this.calculateOutfitScore(outfitItems),
            wearCount: 0,
            tags: [occasion, season],
            isFavorite: false,
            createdAt: new Date(),
            updatedAt: new Date()
          }

          suggestions.push(suggestion)
        }
      }
    }

    return suggestions.sort((a, b) => b.rating - a.rating).slice(0, 10)
  }

  private calculateOutfitScore(itemIds: string[]): number {
    let score = 0
    let itemCount = 0

    for (const itemId of itemIds) {
      const item = this.items.get(itemId)
      if (item) {
        score += item.rating
        itemCount++
      }
    }

    return itemCount > 0 ? score / itemCount : 0
  }

  // Statistics
  public getWardrobeStats(): WardrobeStats {
    const allItems = this.getAllItems()
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Items by category
    const itemsByCategory: Record<string, number> = {}
    for (const item of allItems) {
      itemsByCategory[item.category] = (itemsByCategory[item.category] || 0) + 1
    }

    // Items by color
    const itemsByColor: Record<string, number> = {}
    for (const item of allItems) {
      itemsByColor[item.color] = (itemsByColor[item.color] || 0) + 1
    }

    // Items by style
    const itemsByStyle: Record<string, number> = {}
    for (const item of allItems) {
      itemsByStyle[item.style] = (itemsByStyle[item.style] || 0) + 1
    }

    // Most and least worn items
    const mostWornItems = [...allItems]
      .sort((a, b) => b.wearCount - a.wearCount)
      .slice(0, 5)

    const leastWornItems = [...allItems]
      .filter(item => item.wearCount > 0)
      .sort((a, b) => a.wearCount - b.wearCount)
      .slice(0, 5)

    // Average rating
    const averageRating = allItems.length > 0
      ? allItems.reduce((sum, item) => sum + item.rating, 0) / allItems.length
      : 0

    // Total value
    const totalValue = allItems.reduce((sum, item) => sum + (item.price || 0), 0)

    // Last added items
    const lastAddedItems = [...allItems]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)

    // Wear frequency
    const wearFrequency = {
      daily: allItems.filter(item => item.lastWorn && item.lastWorn >= oneDayAgo).length,
      weekly: allItems.filter(item => item.lastWorn && item.lastWorn >= oneWeekAgo).length,
      monthly: allItems.filter(item => item.lastWorn && item.lastWorn >= oneMonthAgo).length,
      rarely: allItems.filter(item => !item.lastWorn || item.lastWorn < oneMonthAgo).length
    }

    return {
      totalItems: allItems.length,
      itemsByCategory,
      itemsByColor,
      itemsByStyle,
      mostWornItems,
      leastWornItems,
      averageRating,
      totalValue,
      lastAddedItems,
      wearFrequency
    }
  }

  // Recommendations
  public generateRecommendations(): WardrobeRecommendation[] {
    const recommendations: WardrobeRecommendation[] = []
    const stats = this.getWardrobeStats()

    // Outfit recommendations
    if (stats.totalItems >= 3) {
      recommendations.push({
        type: 'outfit',
        title: 'Tạo outfit mới',
        description: 'Bạn có đủ trang phục để tạo nhiều outfit khác nhau',
        priority: 'medium',
        action: {
          type: 'create_outfit',
          data: { occasion: 'casual', season: 'all' }
        }
      })
    }

    // Purchase recommendations
    const missingCategories = Object.keys(stats.itemsByCategory).filter(category => 
      stats.itemsByCategory[category] < 2
    )

    if (missingCategories.length > 0) {
      recommendations.push({
        type: 'purchase',
        title: 'Bổ sung tủ đồ',
        description: `Bạn có thể cân nhắc mua thêm ${missingCategories.join(', ')}`,
        priority: 'low',
        action: {
          type: 'suggest_purchase',
          data: { categories: missingCategories }
        }
      })
    }

    // Donation recommendations
    const unusedItems = stats.leastWornItems.filter(item => item.wearCount === 0)
    if (unusedItems.length > 0) {
      recommendations.push({
        type: 'donation',
        title: 'Tặng trang phục không dùng',
        description: `Bạn có ${unusedItems.length} trang phục chưa từng mặc`,
        priority: 'low',
        items: unusedItems,
        action: {
          type: 'suggest_donation',
          data: { items: unusedItems.map(item => item.id) }
        }
      })
    }

    // Care recommendations
    const oldItems = stats.lastAddedItems.filter(item => {
      const daysSinceAdded = (new Date().getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceAdded > 365 && item.wearCount > 10
    })

    if (oldItems.length > 0) {
      recommendations.push({
        type: 'care',
        title: 'Chăm sóc trang phục',
        description: `Bạn có ${oldItems.length} trang phục cần được chăm sóc`,
        priority: 'medium',
        items: oldItems,
        action: {
          type: 'suggest_care',
          data: { items: oldItems.map(item => item.id) }
        }
      })
    }

    return recommendations
  }

  // Storage Management
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.items.entries())))
      localStorage.setItem(this.outfitsKey, JSON.stringify(Array.from(this.outfits.entries())))
    } catch (error) {
      console.error('Error saving wardrobe to storage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const itemsData = localStorage.getItem(this.storageKey)
      if (itemsData) {
        const itemsArray = JSON.parse(itemsData)
        this.items = new Map(itemsArray.map(([id, item]: [string, any]) => [
          id,
          {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
            lastWorn: item.lastWorn ? new Date(item.lastWorn) : undefined
          }
        ]))
      }

      const outfitsData = localStorage.getItem(this.outfitsKey)
      if (outfitsData) {
        const outfitsArray = JSON.parse(outfitsData)
        this.outfits = new Map(outfitsArray.map(([id, outfit]: [string, any]) => [
          id,
          {
            ...outfit,
            createdAt: new Date(outfit.createdAt),
            updatedAt: new Date(outfit.updatedAt),
            lastWorn: outfit.lastWorn ? new Date(outfit.lastWorn) : undefined
          }
        ]))
      }
    } catch (error) {
      console.error('Error loading wardrobe from storage:', error)
    }
  }

  public exportWardrobe(): string {
    const data = {
      items: Array.from(this.items.entries()),
      outfits: Array.from(this.outfits.entries()),
      exportedAt: new Date().toISOString()
    }
    return JSON.stringify(data, null, 2)
  }

  public importWardrobe(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.items) {
        this.items = new Map(data.items.map(([id, item]: [string, any]) => [
          id,
          {
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt),
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
            lastWorn: item.lastWorn ? new Date(item.lastWorn) : undefined
          }
        ]))
      }

      if (data.outfits) {
        this.outfits = new Map(data.outfits.map(([id, outfit]: [string, any]) => [
          id,
          {
            ...outfit,
            createdAt: new Date(outfit.createdAt),
            updatedAt: new Date(outfit.updatedAt),
            lastWorn: outfit.lastWorn ? new Date(outfit.lastWorn) : undefined
          }
        ]))
      }

      this.saveToStorage()
      return true
    } catch (error) {
      console.error('Error importing wardrobe:', error)
      return false
    }
  }

  public clearWardrobe(): void {
    this.items.clear()
    this.outfits.clear()
    this.saveToStorage()
  }
}

// Singleton instance
export const wardrobeManager = new WardrobeManager()

// Hook for React components
export const useWardrobeManager = () => {
  return {
    // Item management
    addItem: (item: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt' | 'wearCount' | 'lastWorn'>) => 
      wardrobeManager.addItem(item),
    updateItem: (id: string, updates: Partial<WardrobeItem>) => 
      wardrobeManager.updateItem(id, updates),
    deleteItem: (id: string) => wardrobeManager.deleteItem(id),
    getItem: (id: string) => wardrobeManager.getItem(id),
    getAllItems: () => wardrobeManager.getAllItems(),
    getItemsByCategory: (category: WardrobeItem['category']) => 
      wardrobeManager.getItemsByCategory(category),
    getItemsByColor: (color: string) => wardrobeManager.getItemsByColor(color),
    getItemsByStyle: (style: string) => wardrobeManager.getItemsByStyle(style),
    searchItems: (query: string) => wardrobeManager.searchItems(query),
    wearItem: (id: string) => wardrobeManager.wearItem(id),

    // Outfit management
    createOutfit: (outfit: Omit<Outfit, 'id' | 'createdAt' | 'updatedAt' | 'wearCount' | 'lastWorn'>) => 
      wardrobeManager.createOutfit(outfit),
    updateOutfit: (id: string, updates: Partial<Outfit>) => 
      wardrobeManager.updateOutfit(id, updates),
    deleteOutfit: (id: string) => wardrobeManager.deleteOutfit(id),
    getOutfit: (id: string) => wardrobeManager.getOutfit(id),
    getAllOutfits: () => wardrobeManager.getAllOutfits(),
    wearOutfit: (id: string) => wardrobeManager.wearOutfit(id),
    generateOutfitSuggestions: (occasion: string, season: string, style?: string) => 
      wardrobeManager.generateOutfitSuggestions(occasion, season, style),

    // Statistics and recommendations
    getWardrobeStats: () => wardrobeManager.getWardrobeStats(),
    generateRecommendations: () => wardrobeManager.generateRecommendations(),

    // Storage management
    exportWardrobe: () => wardrobeManager.exportWardrobe(),
    importWardrobe: (jsonData: string) => wardrobeManager.importWardrobe(jsonData),
    clearWardrobe: () => wardrobeManager.clearWardrobe()
  }
}
