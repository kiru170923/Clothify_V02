import { supabaseAdmin } from './supabaseAdmin'

export interface UserProfile {
  id: string
  gender?: string
  age_group?: string
  height_cm?: number
  weight_kg?: number
  size?: string
  style_preferences?: string[]
  favorite_colors?: string[]
  occasions?: string[]
  budget_range?: string
  try_on_photo_url?: string
}

export interface WardrobeItem {
  id: string
  title: string
  category: string
  color: string
  style_tags?: string[]
  occasion_tags?: string[]
  ai_notes?: string
  image_url?: string
  added_at: string
}

export interface EnhancedUserContext {
  profile: UserProfile | null
  wardrobe: WardrobeItem[]
  wardrobeAnalysis: {
    totalItems: number
    categories: Record<string, number>
    colors: Record<string, number>
    styles: Record<string, number>
    occasions: Record<string, number>
    gaps: string[]
    strengths: string[]
  }
  personalizedInsights: string[]
}

export class EnhancedUserContextEngine {
  async buildUserContext(userId: string): Promise<EnhancedUserContext> {
    try {
      // Get user profile (cached if possible)
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      // Get wardrobe items (limit to recent 20 items for performance)
      const { data: wardrobeItems } = await supabaseAdmin
        .from('user_wardrobe_items')
        .select('*')
        .eq('user_id', userId)
        .order('added_at', { ascending: false })
        .limit(20) // Limit for performance

      // Quick analysis for performance
      const wardrobeAnalysis = this.quickAnalyzeWardrobe(wardrobeItems || [])
      
      // Generate basic insights
      const personalizedInsights = this.generateBasicInsights(profile, wardrobeAnalysis)

      return {
        profile,
        wardrobe: wardrobeItems || [],
        wardrobeAnalysis,
        personalizedInsights
      }
    } catch (error) {
      console.error('Error building user context:', error)
      return {
        profile: null,
        wardrobe: [],
        wardrobeAnalysis: {
          totalItems: 0,
          categories: {},
          colors: {},
          styles: {},
          occasions: {},
          gaps: [],
          strengths: []
        },
        personalizedInsights: []
      }
    }
  }

  private quickAnalyzeWardrobe(items: WardrobeItem[]) {
    const categories: Record<string, number> = {}
    const colors: Record<string, number> = {}
    const styles: Record<string, number> = {}
    const occasions: Record<string, number> = {}

    // Quick analysis - only process first 10 items for speed
    items.slice(0, 10).forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1
      colors[item.color] = (colors[item.color] || 0) + 1
      
      if (item.style_tags) {
        item.style_tags.slice(0, 3).forEach(style => { // Limit style tags
          styles[style] = (styles[style] || 0) + 1
        })
      }
      
      if (item.occasion_tags) {
        item.occasion_tags.slice(0, 3).forEach(occasion => { // Limit occasion tags
          occasions[occasion] = (occasions[occasion] || 0) + 1
        })
      }
    })

    return {
      totalItems: items.length,
      categories,
      colors,
      styles,
      occasions,
      gaps: this.quickIdentifyGaps(categories),
      strengths: this.quickIdentifyStrengths(categories)
    }
  }

  private analyzeWardrobe(items: WardrobeItem[]) {
    const categories: Record<string, number> = {}
    const colors: Record<string, number> = {}
    const styles: Record<string, number> = {}
    const occasions: Record<string, number> = {}

    items.forEach(item => {
      // Count categories
      categories[item.category] = (categories[item.category] || 0) + 1
      
      // Count colors
      colors[item.color] = (colors[item.color] || 0) + 1
      
      // Count styles
      if (item.style_tags) {
        item.style_tags.forEach(style => {
          styles[style] = (styles[style] || 0) + 1
        })
      }
      
      // Count occasions
      if (item.occasion_tags) {
        item.occasion_tags.forEach(occasion => {
          occasions[occasion] = (occasions[occasion] || 0) + 1
        })
      }
    })

    // Identify gaps and strengths
    const gaps = this.identifyWardrobeGaps(categories, styles, occasions)
    const strengths = this.identifyWardrobeStrengths(categories, styles, occasions)

    return {
      totalItems: items.length,
      categories,
      colors,
      styles,
      occasions,
      gaps,
      strengths
    }
  }

  private quickIdentifyGaps(categories: Record<string, number>): string[] {
    const gaps: string[] = []
    
    // Check for missing essential categories
    const essentialCategories = ['áo thun', 'quần jeans', 'áo sơ mi']
    essentialCategories.forEach(category => {
      if (!categories[category] || categories[category] < 1) {
        gaps.push(`Thiếu ${category}`)
      }
    })

    return gaps.slice(0, 3) // Limit to 3 gaps
  }

  private quickIdentifyStrengths(categories: Record<string, number>): string[] {
    const strengths: string[] = []
    
    // Find most common categories
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2) // Limit to top 2
    
    topCategories.forEach(([category, count]) => {
      if (count >= 2) {
        strengths.push(`Nhiều ${category}`)
      }
    })

    return strengths.slice(0, 2) // Limit to 2 strengths
  }

  private identifyWardrobeGaps(categories: Record<string, number>, styles: Record<string, number>, occasions: Record<string, number>): string[] {
    const gaps: string[] = []
    
    // Check for missing essential categories
    const essentialCategories = ['áo thun', 'quần jeans', 'áo sơ mi', 'áo khoác']
    essentialCategories.forEach(category => {
      if (!categories[category] || categories[category] < 2) {
        gaps.push(`Thiếu ${category} cơ bản`)
      }
    })

    // Check for style diversity
    const styleCount = Object.keys(styles).length
    if (styleCount < 3) {
      gaps.push('Cần đa dạng hóa phong cách')
    }

    // Check for occasion coverage
    const essentialOccasions = ['casual', 'formal', 'work']
    essentialOccasions.forEach(occasion => {
      if (!occasions[occasion]) {
        gaps.push(`Thiếu trang phục cho ${occasion}`)
      }
    })

    return gaps
  }

  private identifyWardrobeStrengths(categories: Record<string, number>, styles: Record<string, number>, occasions: Record<string, number>): string[] {
    const strengths: string[] = []
    
    // Find most common categories
    const topCategories = Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
    
    topCategories.forEach(([category, count]) => {
      if (count >= 3) {
        strengths.push(`Có nhiều ${category} (${count} món)`)
      }
    })

    // Find style strengths
    const topStyles = Object.entries(styles)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
    
    topStyles.forEach(([style, count]) => {
      if (count >= 2) {
        strengths.push(`Phong cách ${style} mạnh (${count} món)`)
      }
    })

    return strengths
  }

  private generateBasicInsights(profile: UserProfile | null, wardrobeAnalysis: any): string[] {
    const insights: string[] = []

    if (profile) {
      if (profile.style_preferences && profile.style_preferences.length > 0) {
        insights.push(`Phong cách: ${profile.style_preferences.slice(0, 2).join(', ')}`)
      }
      
      if (profile.favorite_colors && profile.favorite_colors.length > 0) {
        insights.push(`Màu yêu thích: ${profile.favorite_colors.slice(0, 2).join(', ')}`)
      }
      
      if (profile.size) {
        insights.push(`Size: ${profile.size}`)
      }
    }

    if (wardrobeAnalysis.totalItems > 0) {
      insights.push(`Tủ đồ: ${wardrobeAnalysis.totalItems} món`)
      
      if (wardrobeAnalysis.strengths.length > 0) {
        insights.push(`Điểm mạnh: ${wardrobeAnalysis.strengths.join(', ')}`)
      }
    }

    return insights.slice(0, 4) // Limit to 4 insights
  }

  private generateInsights(profile: UserProfile | null, wardrobeAnalysis: any): string[] {
    const insights: string[] = []

    if (profile) {
      // Profile-based insights
      if (profile.style_preferences && profile.style_preferences.length > 0) {
        insights.push(`Phong cách yêu thích: ${profile.style_preferences.join(', ')}`)
      }
      
      if (profile.favorite_colors && profile.favorite_colors.length > 0) {
        insights.push(`Màu sắc yêu thích: ${profile.favorite_colors.join(', ')}`)
      }
      
      if (profile.size) {
        insights.push(`Size: ${profile.size}`)
      }
    }

    // Wardrobe-based insights
    if (wardrobeAnalysis.totalItems > 0) {
      insights.push(`Tủ đồ có ${wardrobeAnalysis.totalItems} món`)
      
      if (wardrobeAnalysis.strengths.length > 0) {
        insights.push(`Điểm mạnh: ${wardrobeAnalysis.strengths.join(', ')}`)
      }
      
      if (wardrobeAnalysis.gaps.length > 0) {
        insights.push(`Cần bổ sung: ${wardrobeAnalysis.gaps.join(', ')}`)
      }
    }

    return insights
  }

  formatContextForChatbot(context: EnhancedUserContext): string {
    let contextString = ''

    if (context.profile) {
      contextString += `THÔNG TIN NGƯỜI DÙNG:\n`
      contextString += `- Giới tính: ${context.profile.gender || 'Chưa cập nhật'}\n`
      contextString += `- Độ tuổi: ${context.profile.age_group || 'Chưa cập nhật'}\n`
      contextString += `- Chiều cao: ${context.profile.height_cm ? `${context.profile.height_cm}cm` : 'Chưa cập nhật'}\n`
      contextString += `- Cân nặng: ${context.profile.weight_kg ? `${context.profile.weight_kg}kg` : 'Chưa cập nhật'}\n`
      contextString += `- Size: ${context.profile.size || 'Chưa cập nhật'}\n`
      
      if (context.profile.style_preferences && context.profile.style_preferences.length > 0) {
        contextString += `- Phong cách yêu thích: ${context.profile.style_preferences.join(', ')}\n`
      }
      
      if (context.profile.favorite_colors && context.profile.favorite_colors.length > 0) {
        contextString += `- Màu sắc yêu thích: ${context.profile.favorite_colors.join(', ')}\n`
      }
      
      if (context.profile.occasions && context.profile.occasions.length > 0) {
        contextString += `- Dịp sử dụng: ${context.profile.occasions.join(', ')}\n`
      }
      
      contextString += '\n'
    }

    if (context.wardrobe.length > 0) {
      contextString += `TỦ ĐỒ HIỆN TẠI (${context.wardrobe.length} món):\n`
      
      // Group by category
      const categoryGroups: Record<string, WardrobeItem[]> = {}
      context.wardrobe.forEach(item => {
        if (!categoryGroups[item.category]) {
          categoryGroups[item.category] = []
        }
        categoryGroups[item.category].push(item)
      })

      Object.entries(categoryGroups).forEach(([category, items]) => {
        contextString += `- ${category}: ${items.length} món\n`
        items.slice(0, 3).forEach(item => {
          contextString += `  • ${item.title} (${item.color})\n`
        })
        if (items.length > 3) {
          contextString += `  • ... và ${items.length - 3} món khác\n`
        }
      })
      
      contextString += '\n'
    }

    if (context.personalizedInsights.length > 0) {
      contextString += `GỢI Ý CÁ NHÂN HÓA:\n`
      context.personalizedInsights.forEach(insight => {
        contextString += `- ${insight}\n`
      })
      contextString += '\n'
    }

    contextString += `HƯỚNG DẪN SỬ DỤNG:\n`
    contextString += `- Sử dụng thông tin trên để đưa ra gợi ý phù hợp với người dùng\n`
    contextString += `- Tham khảo tủ đồ hiện tại để đề xuất items bổ sung hoặc phối đồ\n`
    contextString += `- Đề cập đến size, màu sắc và phong cách yêu thích khi gợi ý\n`
    contextString += `- Đưa ra lời khuyên về cách phối đồ với items hiện có\n`

    return contextString
  }
}

export const enhancedUserContextEngine = new EnhancedUserContextEngine()
