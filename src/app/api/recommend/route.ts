import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabase'
import { initSentry } from '../../../lib/sentry'

initSentry()

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ success: false, error: 'Missing auth' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 })

    // Load user profile
    const { data: profile } = await supabaseAdmin.from('user_profiles').select('*').eq('user_id', user.id).maybeSingle()

    // Basic heuristic recommend: prefer same style_preferences and favorite_colors
    const styles = profile?.style_preferences || []
    const colors = profile?.favorite_colors || []
    const priceRange = profile?.budget_range || null

    // Build filter: we'll search normalized->>'title' ilike any style keywords OR normalized->'colors' contains color
    let query = supabaseAdmin.from('products').select('*').limit(12).order('updated_at', { ascending: false })

    if (styles.length > 0) {
      const orQ = styles.map((s:any)=>`normalized->>title.ilike.%${s}%`).join(',')
      try { query = query.or(orQ) } catch (e) { /* ignore if invalid */ }
    }

    // color filtering
    if (colors.length > 0) {
      query = query.in('normalized->>colors', colors)
    }

    // priceRange handling (simple)
    if (priceRange && typeof priceRange === 'string') {
      if (priceRange.includes('<')) {
        const n = Number(priceRange.replace(/[^0-9]/g,''))
        if (n) query = query.lte('price', n)
      }
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, items: data || [] })
  } catch (e:any) {
    console.error('Recommend error:', e)
    return NextResponse.json({ success: false, error: e.message || String(e) }, { status: 500 })
  }
}


