import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

interface WardrobeAnalysisRequest {
  imageUrl: string
  userDescription?: string
  userId: string
}

interface WardrobeAnalysisResult {
  title: string
  description: string
  category: string
  subcategory: string
  brand?: string
  color: string
  size?: string
  material?: string
  fitType: string
  styleTags: string[]
  occasionTags: string[]
  seasonSuitable: string[]
  aiNotes: string
  confidence: number
}

export async function POST(request: NextRequest) {
  try {
    const body: WardrobeAnalysisRequest = await request.json()
    const { imageUrl, userDescription, userId } = body

    if (!imageUrl || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Analyze image with GPT-4 Vision
    const analysisResult = await analyzeWardrobeItem(imageUrl, userDescription)
    
    if (!analysisResult) {
      return NextResponse.json({ error: 'Failed to analyze image' }, { status: 500 })
    }

    // Save to database
    const { data: savedItem, error: saveError } = await supabaseAdmin
      .from('user_wardrobe_items')
      .insert({
        user_id: userId,
        title: analysisResult.title,
        description: analysisResult.description,
        image_url: imageUrl,
        category: analysisResult.category,
        subcategory: analysisResult.subcategory,
        brand: analysisResult.brand,
        color: analysisResult.color,
        size: analysisResult.size,
        material: analysisResult.material,
        fit_type: analysisResult.fitType,
        style_tags: analysisResult.styleTags,
        occasion_tags: analysisResult.occasionTags,
        season_suitable: analysisResult.seasonSuitable,
        ai_notes: analysisResult.aiNotes,
        ai_analysis: {
          confidence: analysisResult.confidence,
          model_used: 'gpt-4o-mini',
          analysis_timestamp: new Date().toISOString()
        },
        source_type: 'ai_analysis'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving wardrobe item:', saveError)
      return NextResponse.json({ error: 'Failed to save wardrobe item' }, { status: 500 })
    }

    // Save analysis history
    await supabaseAdmin
      .from('wardrobe_analysis_history')
      .insert({
        user_id: userId,
        wardrobe_item_id: savedItem.id,
        image_url: imageUrl,
        user_description: userDescription,
        ai_analysis: analysisResult,
        ai_confidence: analysisResult.confidence,
        model_used: 'gpt-4o-mini'
      })

    return NextResponse.json({
      success: true,
      item: savedItem,
      analysis: analysisResult
    })

  } catch (error) {
    console.error('Wardrobe analysis error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function analyzeWardrobeItem(imageUrl: string, userDescription?: string): Promise<WardrobeAnalysisResult | null> {
  try {
    const prompt = `You are a fashion expert AI. Analyze this clothing item and provide detailed information.

${userDescription ? `User description: "${userDescription}"` : ''}

Please analyze the image and provide the following information in JSON format:

{
  "title": "Descriptive title of the item",
  "description": "Detailed description of the item",
  "category": "Main category (shirt, pants, jacket, shoes, etc.)",
  "subcategory": "Specific type (polo, dress_shirt, jeans, etc.)",
  "brand": "Brand name if visible, or null",
  "color": "Primary color",
  "size": "Size if visible, or null",
  "material": "Material type if identifiable, or null",
  "fitType": "slim, regular, or loose",
  "styleTags": ["casual", "formal", "sporty", "vintage", "modern", "classic"],
  "occasionTags": ["work", "casual", "party", "sport", "travel", "formal"],
  "seasonSuitable": ["spring", "summer", "fall", "winter"],
  "aiNotes": "Additional notes about the item",
  "confidence": 0.95
}

Focus on:
- Accurate categorization
- Appropriate style and occasion tags
- Realistic material and fit assessment
- Confidence score (0-1) based on image clarity

Return only valid JSON.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageUrl } }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    // Parse JSON response
    const analysis = JSON.parse(content)
    
    // Validate required fields
    if (!analysis.title || !analysis.category || !analysis.color) {
      return null
    }

    return {
      title: analysis.title,
      description: analysis.description || '',
      category: analysis.category,
      subcategory: analysis.subcategory || '',
      brand: analysis.brand || undefined,
      color: analysis.color,
      size: analysis.size || undefined,
      material: analysis.material || undefined,
      fitType: analysis.fitType || 'regular',
      styleTags: Array.isArray(analysis.styleTags) ? analysis.styleTags : [],
      occasionTags: Array.isArray(analysis.occasionTags) ? analysis.occasionTags : [],
      seasonSuitable: Array.isArray(analysis.seasonSuitable) ? analysis.seasonSuitable : [],
      aiNotes: analysis.aiNotes || '',
      confidence: typeof analysis.confidence === 'number' ? analysis.confidence : 0.8
    }

  } catch (error) {
    console.error('Error analyzing wardrobe item:', error)
    return null
  }
}
