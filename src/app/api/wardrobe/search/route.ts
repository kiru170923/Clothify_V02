import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      query = '', 
      category = null, 
      styleTags = null, 
      occasionTags = null,
      limit = 20 
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
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

    // Search wardrobe items using the database function
    const { data: items, error } = await supabaseAdmin
      .rpc('search_user_wardrobe', {
        p_user_id: userId,
        p_query: query,
        p_category: category,
        p_style_tags: styleTags,
        p_occasion_tags: occasionTags,
        p_limit: limit
      })

    if (error) {
      console.error('Error searching wardrobe:', error)
      return NextResponse.json({ error: 'Failed to search wardrobe' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      items: items || [],
      count: items?.length || 0
    })

  } catch (error) {
    console.error('Wardrobe search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const query = searchParams.get('query') || ''
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
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

    // Parse style and occasion tags from query params
    const styleTags = searchParams.get('styleTags')?.split(',').filter(Boolean) || null
    const occasionTags = searchParams.get('occasionTags')?.split(',').filter(Boolean) || null

    // Search wardrobe items
    const { data: items, error } = await supabaseAdmin
      .rpc('search_user_wardrobe', {
        p_user_id: userId,
        p_query: query,
        p_category: category,
        p_style_tags: styleTags,
        p_occasion_tags: occasionTags,
        p_limit: limit
      })

    if (error) {
      console.error('Error searching wardrobe:', error)
      return NextResponse.json({ error: 'Failed to search wardrobe' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      items: items || [],
      count: items?.length || 0
    })

  } catch (error) {
    console.error('Wardrobe search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
