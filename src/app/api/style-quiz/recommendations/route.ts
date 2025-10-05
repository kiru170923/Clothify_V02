import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { quizResult } = await request.json()
    
    if (!quizResult) {
      return NextResponse.json({ error: 'Quiz result is required' }, { status: 400 })
    }

    const { stylePersonality, colorPalette, recommendations, brandSuggestions } = quizResult

    // Build query based on quiz results
    let query = supabaseAdmin
      .from('products')
      .select('id, title, price, image, gallery, url, description_text, style, occasion, variants')
      .limit(20)

    // Extract data from quiz result
    const occasion = quizResult.occasion || quizResult.stylePersonality
    const productTypes = quizResult.productTypes || []
    const colors = quizResult.colors || []
    const budget = quizResult.budget || quizResult.priceRange
    const size = quizResult.size || ''

    // Simple filtering approach
    let hasFilters = false

    // Filter by product types first
    if (productTypes && productTypes.length > 0) {
      const typeFilters = productTypes.map((type: string) => {
        switch (type) {
          case 'shirt': return "title.ilike('%ao so mi%')"
          case 'polo': return "title.ilike('%ao polo%')"
          case 't_shirt': return "title.ilike('%ao thun%')"
          case 'jacket': return "title.ilike('%ao khoac%')"
          case 'pants': return "title.ilike('%quan tay%')"
          case 'jeans': return "title.ilike('%quan jeans%')"
          case 'shorts': return "title.ilike('%quan short%')"
          case 'shoes': return "title.ilike('%giay%')"
          default: return null
        }
      }).filter(Boolean)

      if (typeFilters.length > 0) {
        query = query.or(typeFilters.join(','))
        hasFilters = true
      }
    }

    // Fallback to occasion if no product types
    if (!hasFilters && occasion) {
      let occasionFilter = ''
      switch (occasion) {
        case 'office':
          occasionFilter = "title.ilike('%ao so mi%')"
          break
        case 'date':
          occasionFilter = "title.ilike('%ao polo%')"
          break
        case 'party':
          occasionFilter = "title.ilike('%ao vest%')"
          break
        case 'casual':
          occasionFilter = "title.ilike('%ao thun%')"
          break
        case 'sport':
          occasionFilter = "title.ilike('%ao thun%')"
          break
        case 'travel':
          occasionFilter = "title.ilike('%ao khoac%')"
          break
      }
      
      if (occasionFilter) {
        query = query.or(occasionFilter)
        hasFilters = true
      }
    }

    // If still no filters, just get any products
    if (!hasFilters) {
      console.log('No filters applied, getting random products')
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Error fetching products:', error)
      // Fallback: get any products if filtering fails
      const fallbackQuery = supabaseAdmin
        .from('products')
        .select('id, title, price, image, gallery, url, description_text, style, occasion, variants')
        .limit(20)
      
      const { data: fallbackProducts, error: fallbackError } = await fallbackQuery
      
      if (fallbackError) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
      }
      
      // Sort and prioritize products based on quiz results
      const prioritizedProducts = prioritizeProducts(fallbackProducts || [], quizResult)
      const personalizedRecommendations = generatePersonalizedRecommendations(
        prioritizedProducts, 
        quizResult
      )

      return NextResponse.json({
        success: true,
        products: prioritizedProducts.slice(0, 12),
        recommendations: personalizedRecommendations,
        total: prioritizedProducts.length,
        message: 'Đã tìm thấy sản phẩm phù hợp với nhu cầu của bạn'
      })
    }

    // Sort and prioritize products based on quiz results
    const prioritizedProducts = prioritizeProducts(products || [], quizResult)

    // If no products found, get fallback products
    if (prioritizedProducts.length === 0) {
      console.log('No products found, getting fallback products')
      const fallbackQuery = supabaseAdmin
        .from('products')
        .select('id, title, price, image, gallery, url, description_text, style, occasion, variants')
        .limit(12)
      
      const { data: fallbackProducts, error: fallbackError } = await fallbackQuery
      
      if (!fallbackError && fallbackProducts && fallbackProducts.length > 0) {
        return NextResponse.json({
          success: true,
          products: fallbackProducts,
          recommendations: generatePersonalizedRecommendations(fallbackProducts, quizResult),
          total: fallbackProducts.length,
          message: 'Đã tìm thấy sản phẩm phù hợp với nhu cầu của bạn'
        })
      }
    }

    // Generate personalized recommendations
    const personalizedRecommendations = generatePersonalizedRecommendations(
      prioritizedProducts, 
      quizResult
    )

    return NextResponse.json({
      success: true,
      products: prioritizedProducts.slice(0, 12), // Top 12 products
      recommendations: personalizedRecommendations,
      total: prioritizedProducts.length,
      message: prioritizedProducts.length > 0 ? 'Đã tìm thấy sản phẩm phù hợp với nhu cầu của bạn' : 'Chưa có sản phẩm phù hợp'
    })

  } catch (error) {
    console.error('Style quiz recommendations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function prioritizeProducts(products: any[], quizResult: any): any[] {
  return products.map(product => ({
    ...product,
    confidence: calculateConfidence(product, quizResult)
  })).sort((a, b) => b.confidence - a.confidence)
}

function generatePersonalizedRecommendations(products: any[], quizResult: any): string[] {
  const recommendations: string[] = []
  
  if (products.length > 0) {
    recommendations.push(`Dựa trên nhu cầu của bạn, tôi đã tìm thấy ${products.length} sản phẩm phù hợp.`)
    
    if (quizResult.occasion) {
      const occasionMap: Record<string, string> = {
        'office': 'công sở',
        'date': 'hẹn hò',
        'party': 'tiệc tùng',
        'casual': 'ngày thường',
        'sport': 'thể thao',
        'travel': 'du lịch'
      }
      const occasionText = occasionMap[quizResult.occasion] || quizResult.occasion
      
      recommendations.push(`Phù hợp cho dịp ${occasionText}.`)
    }
    
    if (quizResult.budget) {
      const budgetMap: Record<string, string> = {
        'budget_1': 'dưới 300k',
        'budget_2': '300k-600k',
        'budget_3': '600k-1M',
        'budget_4': '1M-2M',
        'budget_5': 'trên 2M'
      }
      const budgetText = budgetMap[quizResult.budget] || quizResult.budget
      
      recommendations.push(`Nằm trong ngân sách ${budgetText}.`)
    }
  }
  
  return recommendations
}

function calculateConfidence(product: any, quizResult: any): number {
  let confidence = 0.5 // Base confidence

  // Increase confidence based on matches
  if (matchesStyle(product, quizResult.stylePersonality)) confidence += 0.2
  if (matchesColor(product, quizResult.colorPalette)) confidence += 0.2
  if (matchesBrand(product, quizResult.brandSuggestions)) confidence += 0.1

  return Math.min(1, confidence)
}

function matchesStyle(product: any, stylePersonality: string): boolean {
  if (!stylePersonality) return false
  
  const productName = (product.title || '').toLowerCase()
  const descriptionText = (product.description_text || '').toLowerCase()
  const styleTags = (product.style || []).join(' ').toLowerCase()
  const occasionTags = (product.occasion || []).join(' ').toLowerCase()
  const searchText = `${productName} ${descriptionText} ${styleTags} ${occasionTags}`.toLowerCase()
  
  switch (stylePersonality) {
    case 'casual':
      return searchText.includes('thun') || searchText.includes('jeans') || searchText.includes('polo') || searchText.includes('short') || searchText.includes('casual')
    case 'formal':
      return searchText.includes('so mi') || searchText.includes('vest') || searchText.includes('tay') || searchText.includes('formal')
    case 'elegant':
      return searchText.includes('vest') || searchText.includes('khoac') || searchText.includes('ao dai') || searchText.includes('elegant')
    default:
      return false
  }
}

function matchesColor(product: any, colorPalette: any): boolean {
  if (!colorPalette) return false
  
  const productName = (product.title || '').toLowerCase()
  const descriptionText = (product.description_text || '').toLowerCase()
  const variants = (product.variants || [])
  const variantColors = variants.map((v: any) => v.color || '').join(' ').toLowerCase()
  const searchText = `${productName} ${descriptionText} ${variantColors}`.toLowerCase()
  
  const allColors = [
    ...(colorPalette.primary || []),
    ...(colorPalette.secondary || []),
    ...(colorPalette.accent || [])
  ]
  
  return allColors.some(color => 
    searchText.includes(color.toLowerCase())
  )
}

function matchesBrand(product: any, brandSuggestions: any[]): boolean {
  if (!brandSuggestions || brandSuggestions.length === 0) return false
  
  const productName = (product.title || '').toLowerCase()
  const descriptionText = (product.description_text || '').toLowerCase()
  const vendor = (product.vendor || '').toLowerCase()
  const searchText = `${productName} ${descriptionText} ${vendor}`.toLowerCase()
  
  return brandSuggestions.some(brand => 
    searchText.includes(brand.brand.toLowerCase())
  )
}