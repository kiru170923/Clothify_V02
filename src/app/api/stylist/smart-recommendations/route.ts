import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'
import { enhancedUserContextEngine } from '../../../../lib/enhancedUserContext'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { occasion, season, budget, style } = body

    // Get enhanced user context
    const userContext = await enhancedUserContextEngine.buildUserContext(user.id)
    
    // Build smart filters based on user data
    const filters = buildSmartFilters(userContext, { occasion, season, budget, style })
    
    // Get personalized product recommendations
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, title, price, image, url, description_text, style, occasion, variants')
      .limit(20)

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }

    // Score and rank products based on user preferences
    const scoredProducts = products?.map(product => ({
      ...product,
      score: calculateProductScore(product, userContext, filters)
    })).sort((a, b) => b.score - a.score) || []

    // Generate personalized insights
    const insights = generatePersonalizedInsights(userContext, scoredProducts.slice(0, 5))

    return NextResponse.json({
      success: true,
      recommendations: scoredProducts.slice(0, 10),
      insights,
      userContext: {
        wardrobeCount: userContext.wardrobe.length,
        profileComplete: !!userContext.profile,
        stylePreferences: userContext.profile?.style_preferences || [],
        favoriteColors: userContext.profile?.favorite_colors || []
      }
    })

  } catch (error) {
    console.error('Error in smart recommendations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildSmartFilters(userContext: any, preferences: any) {
  const filters: any = {}

  // Style preferences from profile
  if (userContext.profile?.style_preferences) {
    filters.preferredStyles = userContext.profile.style_preferences
  }

  // Color preferences from profile
  if (userContext.profile?.favorite_colors) {
    filters.preferredColors = userContext.profile.favorite_colors
  }

  // Occasion preferences
  if (preferences.occasion) {
    filters.occasion = preferences.occasion
  } else if (userContext.profile?.occasions) {
    filters.occasion = userContext.profile.occasions
  }

  // Season preferences
  if (preferences.season) {
    filters.season = preferences.season
  }

  // Budget preferences
  if (preferences.budget) {
    filters.budget = preferences.budget
  } else if (userContext.profile?.budget_range) {
    filters.budget = userContext.profile.budget_range
  }

  // Wardrobe gaps to fill
  if (userContext.wardrobeAnalysis.gaps.length > 0) {
    filters.missingCategories = userContext.wardrobeAnalysis.gaps
  }

  return filters
}

function calculateProductScore(product: any, userContext: any, filters: any): number {
  let score = 0

  // Base score
  score += 10

  // Style matching
  if (product.style && filters.preferredStyles) {
    const styleMatch = product.style.some((style: string) => 
      filters.preferredStyles.some((pref: string) => 
        style.toLowerCase().includes(pref.toLowerCase())
      )
    )
    if (styleMatch) score += 20
  }

  // Occasion matching
  if (product.occasion && filters.occasion) {
    const occasionMatch = product.occasion.some((occ: string) => 
      filters.occasion.some((pref: string) => 
        occ.toLowerCase().includes(pref.toLowerCase())
      )
    )
    if (occasionMatch) score += 15
  }

  // Color preference matching (basic)
  if (filters.preferredColors) {
    const colorMatch = filters.preferredColors.some((color: string) => 
      product.title.toLowerCase().includes(color.toLowerCase()) ||
      product.description_text?.toLowerCase().includes(color.toLowerCase())
    )
    if (colorMatch) score += 10
  }

  // Wardrobe gap filling
  if (filters.missingCategories) {
    const gapMatch = filters.missingCategories.some((gap: string) => 
      product.title.toLowerCase().includes(gap.toLowerCase())
    )
    if (gapMatch) score += 25
  }

  // Avoid duplicates with existing wardrobe
  const isDuplicate = userContext.wardrobe.some((item: any) => 
    item.category === product.category && 
    item.color === product.color
  )
  if (isDuplicate) score -= 15

  // Price preference (basic)
  if (filters.budget) {
    const price = product.price || 0
    if (filters.budget === 'low' && price < 500000) score += 10
    else if (filters.budget === 'medium' && price >= 500000 && price < 2000000) score += 10
    else if (filters.budget === 'high' && price >= 2000000) score += 10
  }

  return Math.max(0, score)
}

function generatePersonalizedInsights(userContext: any, topProducts: any[]): string[] {
  const insights: string[] = []

  // Wardrobe analysis insights
  if (userContext.wardrobeAnalysis.totalItems > 0) {
    insights.push(`Tủ đồ hiện tại có ${userContext.wardrobeAnalysis.totalItems} món`)
    
    if (userContext.wardrobeAnalysis.strengths.length > 0) {
      insights.push(`Điểm mạnh: ${userContext.wardrobeAnalysis.strengths.join(', ')}`)
    }
    
    if (userContext.wardrobeAnalysis.gaps.length > 0) {
      insights.push(`Cần bổ sung: ${userContext.wardrobeAnalysis.gaps.join(', ')}`)
    }
  }

  // Style preference insights
  if (userContext.profile?.style_preferences) {
    insights.push(`Phong cách yêu thích: ${userContext.profile.style_preferences.join(', ')}`)
  }

  // Color preference insights
  if (userContext.profile?.favorite_colors) {
    insights.push(`Màu sắc yêu thích: ${userContext.profile.favorite_colors.join(', ')}`)
  }

  // Top product insights
  if (topProducts.length > 0) {
    const topCategories = topProducts.map(p => p.category).filter(Boolean)
    const uniqueCategories = Array.from(new Set(topCategories))
    if (uniqueCategories.length > 0) {
      insights.push(`Gợi ý hàng đầu: ${uniqueCategories.join(', ')}`)
    }
  }

  return insights
}
