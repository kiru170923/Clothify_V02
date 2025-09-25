import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { q, priceMin, priceMax, color, size, limit = 20, offset = 0 } = body

    console.log('🔍 Search request:', { q, priceMin, priceMax, color, size, limit, offset })

    // Use direct query instead of RPC
    let query = supabaseAdmin
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    // For now, return all data when query is provided (temporary fix)
    // TODO: Implement proper text search later

    // Add price filters
    if (priceMin != null) {
      query = query.gte('price', Number(priceMin))
    }
    if (priceMax != null) {
      query = query.lte('price', Number(priceMax))
    }

    // Add color filter
    if (color) {
      query = query.contains('normalized->colors', [color])
    }

    // Add size filter  
    if (size) {
      query = query.contains('normalized->sizes', [size])
    }

    // Add pagination
    query = query.range(Number(offset || 0), Number(offset || 0) + Number(limit || 20) - 1)

    console.log('📊 Direct query search')

    const { data, error } = await query
    
    console.log('✅ Search results:', data?.length || 0, 'products found')
    return NextResponse.json({ success: true, data, total: (data || []).length })
  } catch (error: any) {
    console.error('❌ Search error:', error)
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 })
  }
}


