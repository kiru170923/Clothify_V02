import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { data: plans, error } = await supabaseAdmin
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true })

    if (error) {
      console.error('Error fetching membership plans:', error)
      return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
    }

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error in membership plans API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

