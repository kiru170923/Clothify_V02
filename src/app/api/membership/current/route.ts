import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('🔍 Getting membership for user:', user.id)

    // Get user's current active membership with plan details
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('user_memberships')
      .select(`
        *,
        plan:membership_plans(*)
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (membershipError && membershipError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching user membership:', membershipError)
      
      // If it's a foreign key relationship error, return null membership (Free plan)
      if (membershipError.code === 'PGRST200') {
        console.log('⚠️ Foreign key relationship error, returning null membership (Free plan)')
        return NextResponse.json({
          membership: null,
          isNewUser: true
        })
      }
      
      return NextResponse.json({ error: 'Failed to fetch membership' }, { status: 500 })
    }

    // If no active membership found, return null (user is on free plan)
    if (!membership) {
      return NextResponse.json({ 
        membership: null,
        isNewUser: false
      })
    }

    return NextResponse.json({ 
      membership,
      isNewUser: false
    })

  } catch (error) {
    console.error('Error in membership current API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
