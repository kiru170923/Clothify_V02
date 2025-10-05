import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, planId, billingCycle } = body

    if (!userId || !planId || !billingCycle) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log('🧪 Testing membership creation for:', { userId, planId, billingCycle })

    // 1. Tạo membership mới trực tiếp
    const endDate = new Date()
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1)
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1)
    }

    // 2. Tắt membership cũ (nếu có)
    const { error: updateError } = await supabaseAdmin
      .from('user_memberships')
      .update({ status: 'expired' })
      .eq('user_id', userId)
      .eq('status', 'active')

    console.log('Update old memberships result:', updateError)

    // 3. Tạo membership mới
    const { data: newMembership, error: insertError } = await supabaseAdmin
      .from('user_memberships')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        billing_cycle: billingCycle,
        auto_renew: false
      })
      .select()

    console.log('Insert new membership result:', { data: newMembership, error: insertError })

    if (insertError) {
      return NextResponse.json({ 
        error: 'Failed to create membership', 
        details: insertError,
        step: 'insert_membership'
      }, { status: 500 })
    }

    // 4. Verify membership was created
    const { data: verifyMembership, error: verifyError } = await supabaseAdmin
      .from('user_memberships')
      .select(`
        *,
        plan:membership_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    console.log('Verify membership result:', { data: verifyMembership, error: verifyError })

    return NextResponse.json({
      success: true,
      membership: newMembership,
      verification: verifyMembership,
      errors: {
        updateError,
        insertError,
        verifyError
      }
    })

  } catch (error) {
    console.error('Error in test membership API:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
