import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabaseAdmin'

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

    console.log('🔍 Debug membership for user:', user.id)

    // 1. Check if user_memberships table exists
    const { data: tableExists } = await supabaseAdmin
      .from('user_memberships')
      .select('id')
      .limit(1)

    // 2. Get all user memberships (active and inactive)
    const { data: allMemberships, error: allMembershipsError } = await supabaseAdmin
      .from('user_memberships')
      .select(`
        *,
        plan:membership_plans(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 3. Get active membership only
    const { data: activeMembership, error: activeMembershipError } = await supabaseAdmin
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

    // 4. Get recent payment orders for this user
    const { data: paymentOrders, error: paymentOrdersError } = await supabaseAdmin
      .from('payment_orders')
      .select(`
        *,
        plan:membership_plans(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // 5. Get user tokens
    const { data: userTokens, error: userTokensError } = await supabaseAdmin
      .from('user_tokens')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({
      debug: {
        userId: user.id,
        userEmail: user.email,
        tableExists: tableExists !== null,
        allMemberships: {
          data: allMemberships,
          error: allMembershipsError,
          count: allMemberships?.length || 0
        },
        activeMembership: {
          data: activeMembership,
          error: activeMembershipError
        },
        paymentOrders: {
          data: paymentOrders,
          error: paymentOrdersError,
          count: paymentOrders?.length || 0
        },
        userTokens: {
          data: userTokens,
          error: userTokensError
        }
      }
    })

  } catch (error) {
    console.error('Error in debug membership API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 })
  }
}

