import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Missing auth' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { data, error: qErr } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (qErr && qErr.code === '42P01') {
      // table missing
      return NextResponse.json({ hasProfile: false, profile: null })
    }
    if (qErr) {
      // Any error here should NOT block onboarding redirect; treat as missing profile
      return NextResponse.json({ hasProfile: false, profile: null })
    }

    // Determine completeness
    const profile = data || null as any
    const isComplete = !!(profile && (
      profile.gender || profile.age_group || profile.size ||
      (Array.isArray(profile.style_preferences) && profile.style_preferences.length > 0) ||
      (Array.isArray(profile.occasions) && profile.occasions.length > 0)
    ))

    return NextResponse.json({ hasProfile: isComplete, profile })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: 'Missing auth' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const profile = {
      user_id: user.id,
      gender: body.gender || null,
      age_group: body.age_group || null,
      height_cm: body.height_cm ?? null,
      weight_kg: body.weight_kg ?? null,
      size: body.size || null,
      style_preferences: body.style_preferences || [],
      favorite_colors: body.favorite_colors || [],
      occasions: body.occasions || [],
      budget_range: body.budget_range || null,
      try_on_photo_url: body.try_on_photo_url || null,
      updated_at: new Date().toISOString(),
    }

    const { data, error: upErr } = await supabaseAdmin
      .from('user_profiles')
      .upsert(profile, { onConflict: 'user_id' })
      .select('*')
      .maybeSingle()

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    return NextResponse.json({ success: true, profile: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 })
  }
}



